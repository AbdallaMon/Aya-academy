import {
  BILLING_PERIODS,
  NOTIFICATION_TYPES,
  PARENT_RELATIONS,
  SUBSCRIPTION_STATUSES,
  USER_ROLES,
  authMessagesCodes,
  messagesNames,
  planMessagesCodes,
} from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import { AppError, badRequest, notFound } from "../../shared/errors/AppError.js";
import { comparePassword, hashPassword } from "../../infra/security/hash.js";
import { userRepo } from "../users/user.repo.js";
import { planRepo } from "../plans/plan.repo.js";
import { couponRepo } from "../coupons/coupon.repo.js";
import { settingsUsecase } from "../settings/settings.usecase.js";
import { paymentTemplateUsecase } from "../paymentTemplates/paymentTemplate.usecase.js";
import { subscriptionRepo } from "../subscriptions/subscription.repo.js";
import { subscriptionUsecase } from "../subscriptions/subscription.usecase.js";
import { invoiceUsecase } from "../invoices/invoice.usecase.js";
import { notificationUsecase } from "../notifications/notification.usecase.js";
import { authRepo } from "./auth.repo.js";

class AuthUsecase {
  /** Public self-registration — always creates a PARENT account. */
  async register({ name, email, password, phone, locale }) {
    const existing = await authRepo.findByEmail(email);
    if (existing) {
      throw new AppError({
        statusCode: 409,
        code: authMessagesCodes.EMAIL_ALREADY_EXISTS,
        message: authMessagesCodes.EMAIL_ALREADY_EXISTS,
        translationKey: messagesNames.authMessages,
      });
    }
    const passwordHash = await hashPassword(password);
    return authRepo.createUser({
      name,
      email,
      passwordHash,
      phone,
      locale: locale ?? "ar",
      role: USER_ROLES.PARENT,
    });
  }

  /**
   * Public family enrollment. Creates a PARENT + N STUDENT children, links them,
   * and for each child a PENDING subscription + UNPAID invoice — all atomically.
   * Pricing (incl. coupon) is recomputed server-side. Admins are notified.
   */
  async enrollFamily({ parent, children }) {
    // 1. Reject duplicate emails within the payload (children + parent).
    const seen = new Set();
    for (const child of children) {
      const key = child.email.trim().toLowerCase();
      if (seen.has(key) || key === parent.email.trim().toLowerCase()) {
        throw badRequest(
          authMessagesCodes.CHILD_EMAIL_DUPLICATE,
          messagesNames.authMessages,
        );
      }
      seen.add(key);
    }

    // 2. Reject already-registered emails (parent first, then each child).
    if (await authRepo.findByEmail(parent.email)) {
      throw new AppError({
        statusCode: 409,
        code: authMessagesCodes.EMAIL_ALREADY_EXISTS,
        message: authMessagesCodes.EMAIL_ALREADY_EXISTS,
        translationKey: messagesNames.authMessages,
      });
    }
    for (const child of children) {
      if (await userRepo.findByEmail(child.email)) {
        throw new AppError({
          statusCode: 409,
          code: authMessagesCodes.CHILD_EMAIL_EXISTS,
          message: authMessagesCodes.CHILD_EMAIL_EXISTS,
          translationKey: messagesNames.authMessages,
        });
      }
    }

    // 3. Load global settings + payment template once.
    const settings = await settingsUsecase.getEffective();
    const template = await paymentTemplateUsecase.get(null);
    const hourlyRate = Number(settings.hourlyRate);
    const now = new Date();

    // 4. Price each child authoritatively (also validates the coupon).
    const priced = [];
    for (const child of children) {
      const plan = await planRepo.getByIdWithCoupons(child.planId);
      if (!plan || !plan.isActive) {
        throw notFound(planMessagesCodes.PLAN_NOT_FOUND);
      }
      const billingPeriod = child.billingPeriod ?? BILLING_PERIODS.MONTHLY;
      let pricing;
      try {
        pricing = await subscriptionUsecase.computePricing(
          plan,
          billingPeriod,
          child.couponCode,
          hourlyRate,
        );
      } catch {
        throw badRequest(
          authMessagesCodes.COUPON_INVALID_FOR_PLAN,
          messagesNames.authMessages,
        );
      }
      const hours =
        billingPeriod === BILLING_PERIODS.YEARLY ? plan.hours * 12 : plan.hours;
      const startDate = now;
      const endDate = subscriptionUsecase.computeEndDate(startDate, billingPeriod);
      priced.push({ child, plan, billingPeriod, hours, startDate, endDate, ...pricing });
    }

    // 5. Pre-hash passwords outside the tx (keeps the tx short).
    const parentHash = await hashPassword(parent.password);
    const childHashes = await Promise.all(
      children.map((c) => hashPassword(c.password)),
    );

    // 6. Atomic write: parent + children + links + subscriptions + invoices.
    const result = await prisma.$transaction(async (tx) => {
      const parentUser = await userRepo.createUser(
        {
          name: parent.name,
          email: parent.email,
          passwordHash: parentHash,
          role: USER_ROLES.PARENT,
          phone: parent.phone,
          locale: parent.locale ?? "ar",
        },
        tx,
      );

      const createdChildren = [];
      for (let i = 0; i < priced.length; i += 1) {
        const p = priced[i];
        const studentUser = await userRepo.createUser(
          {
            name: p.child.name,
            email: p.child.email,
            passwordHash: childHashes[i],
            role: USER_ROLES.STUDENT,
            nickname: p.child.nickname,
            birthDate: p.child.birthDate,
            locale: parent.locale ?? "ar",
            createdById: parentUser.id,
          },
          tx,
        );
        await userRepo.linkParentStudent(
          parentUser.id,
          studentUser.id,
          PARENT_RELATIONS.GUARDIAN,
          tx,
        );

        const subData = {
          status: SUBSCRIPTION_STATUSES.PENDING,
          billingPeriod: p.billingPeriod,
          startDate: p.startDate,
          endDate: p.endDate,
          totalHours: p.hours,
          remainingHours: p.hours,
          priceCharged: p.priceCharged,
          currency: settings.currency,
          student: { connect: { id: studentUser.id } },
          plan: { connect: { id: p.plan.id } },
          createdBy: { connect: { id: parentUser.id } },
        };
        if (p.couponId) subData.coupon = { connect: { id: p.couponId } };

        const subscription = await subscriptionRepo.createSubscription(subData, tx);
        if (p.couponId) {
          await couponRepo.incrementCouponRedemption(p.couponId, tx);
        }

        const invoice = await invoiceUsecase.generateForSubscription(subscription, {
          template,
          settings,
          plan: p.plan,
          createdById: parentUser.id,
          tx,
        });

        createdChildren.push({
          studentId: studentUser.id,
          subscriptionId: subscription.id,
          invoiceId: invoice?.id ?? null,
        });
      }

      return { parentId: parentUser.id, children: createdChildren };
    });

    // 7. Notify admins (the teacher) — best-effort, must not fail the request.
    try {
      const adminIds = await userRepo.findAdminIds();
      if (adminIds.length) {
        await notificationUsecase.createManyForUsers(adminIds, {
          type: NOTIFICATION_TYPES.SUBSCRIPTION_CREATED,
          titleAr: `طلب تسجيل جديد: ${children.length} طالب بانتظار المراجعة`,
          titleEn: `New enrollment: ${children.length} student(s) pending review`,
          link: "/dashboard/subscriptions",
        });
      }
    } catch {
      // swallow — notification is best-effort
    }

    return result;
  }

  async login({ email, password }) {
    const user = await authRepo.findByEmail(email);
    if (!user) {
      throw new AppError({
        statusCode: 401,
        code: authMessagesCodes.INVALID_CREDENTIALS,
        message: authMessagesCodes.INVALID_CREDENTIALS,
        translationKey: messagesNames.authMessages,
      });
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError({
        statusCode: 401,
        code: authMessagesCodes.INVALID_CREDENTIALS,
        message: authMessagesCodes.INVALID_CREDENTIALS,
        translationKey: messagesNames.authMessages,
      });
    }
    if (!user.isActive) {
      throw new AppError({
        statusCode: 403,
        code: authMessagesCodes.ACCOUNT_INACTIVE,
        message: authMessagesCodes.ACCOUNT_INACTIVE,
        translationKey: messagesNames.authMessages,
        redirectTo: "/login",
        redirectText: authMessagesCodes.BACK_TO_LOGIN,
      });
    }
    await authRepo.updateLastLogin(user.id);
    return user;
  }

  getById(id) {
    return authRepo.findPublicById(id);
  }
}

export const authUsecase = new AuthUsecase();
