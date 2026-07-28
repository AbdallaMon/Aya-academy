import {
  CERTIFICATE_TEMPLATE_KEYS,
  CERTIFICATE_TYPES,
  NOTIFICATION_TYPES,
  USER_ROLES,
  certificateMessagesCodes,
  messagesNames,
} from "@ayah/shared";
import { badRequest, forbidden, notFound } from "../../../shared/errors/AppError.js";
import { userRepo } from "../../users/user.repo.js";
import { badgeUsecase } from "../../gamification/badges/badge.usecase.js";
import { notificationUsecase } from "../../notifications/notification.usecase.js";
import { certificateTemplateUsecase } from "../certificateTemplates/certificateTemplate.usecase.js";
import { certificateRepo } from "./certificate.repo.js";

class CertificateUsecase {
  /** Throws unless `authUser` may access certificates of the given student. */
  async assertCanAccess(authUser, studentId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.role === USER_ROLES.STUDENT) {
      if (authUser.id === studentId) return;
    } else if (authUser.role === USER_ROLES.PARENT) {
      if (await userRepo.isStudentOfParent(authUser.id, studentId)) return;
    }
    throw forbidden(certificateMessagesCodes.CANNOT_ACCESS_CERTIFICATE);
  }

  async list({ page, limit, filters = {}, authUser }) {
    // Where-building now lives in the repo (reference convention).
    return certificateRepo.listScoped({ authUser, filters, page, limit });
  }

  async getById({ id, authUser }) {
    const cert = await certificateRepo.getById({ id });
    if (!cert) throw notFound(certificateMessagesCodes.CERTIFICATE_NOT_FOUND);
    await this.assertCanAccess(authUser, cert.studentId);
    return cert;
  }

  /**
   * Admin manually issues a CUSTOM certificate for a STUDENT (not tied to any
   * game/quiz attempt). Route already gated by CERTIFICATE.CREATE (admin-only).
   */
  async createManual({ authUser, ...input }) {
    const student = await userRepo.getPublicById(input.studentId);
    if (!student || student.role !== USER_ROLES.STUDENT) {
      throw badRequest(
        certificateMessagesCodes.CERTIFICATE_STUDENT_NOT_FOUND,
        messagesNames.certificateMessages,
      );
    }

    // Optional badge the admin chose to grant alongside this certificate.
    // Validate up-front so an invalid pick fails the request (rather than the
    // award silently no-opping after the certificate is created).
    let badgeId;
    if (input.badgeId) {
      const badge = await badgeUsecase.getById(input.badgeId).catch(() => null);
      if (!badge) {
        throw badRequest(
          certificateMessagesCodes.CERTIFICATE_BADGE_NOT_FOUND,
          messagesNames.certificateMessages,
        );
      }
      badgeId = badge.id;
    }

    const cert = await certificateRepo.create({
      data: {
        type: CERTIFICATE_TYPES.MANUAL,
        studentId: student.id,
        studentName: input.studentName ?? student.name,
        gameAttemptId: null,
        quizAttemptId: null,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        bodyAr: input.bodyAr,
        bodyEn: input.bodyEn,
        templateKey: input.templateKey,
        templateId: input.templateId ?? undefined,
        reasonAr: input.reasonAr ?? undefined,
        reasonEn: input.reasonEn ?? undefined,
        photoId: input.photoId ?? undefined,
        themeJson: input.themeJson ?? undefined,
        badgeId: badgeId ?? undefined,
        createdById: authUser.id,
      },
    });

    // Grant the badge to the student, linked to this certificate (best-effort:
    // idempotent, no-ops if the student already owns it).
    if (badgeId) {
      try {
        await badgeUsecase.awardToStudent({
          studentId: student.id,
          badgeId,
          awardedById: authUser.id,
          certificateId: cert.id,
        });
      } catch {
        // swallow — badge award is best-effort, certificate already issued
      }
    }

    await this.notifyParentsOfCertificate(cert);
    return cert;
  }

  /**
   * Notify the student's parent(s) that a new certificate was issued.
   * Best-effort: never throws, so it can't break certificate issuance.
   */
  async notifyParentsOfCertificate(cert) {
    try {
      const parentIds = await userRepo.getParentIdsForStudent(cert.studentId);
      if (!parentIds.length) return;
      const name = cert.studentName;
      await notificationUsecase.createManyForUsers(parentIds, {
        type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
        titleAr: `حصل ${name} على شهادة جديدة 🎓`,
        titleEn: `${name} earned a new certificate 🎓`,
        bodyAr: cert.reasonAr || cert.titleAr || undefined,
        bodyEn: cert.reasonEn || cert.titleEn || undefined,
        link: `/dashboard/certificates/${cert.id}`,
        dataJson: { certificateId: cert.id },
      });
    } catch {
      // swallow — parent notification is best-effort
    }
  }

  // ── reusable services (importable by games / quizzes) ──────────
  /**
   * The student's existing GAME certificate for a game (or null) — internal
   * lookup (no auth) so the games module can avoid re-issuing on a replay.
   *
   * Positional args — also called cross-module (games).
   */
  findEarnedForGame(studentId, gameId) {
    return certificateRepo.findForGame({ studentId, gameId });
  }

  /**
   * Issue a GAME certificate for a completed game attempt.
   *
   * Preferred path: every game certificate is generated from the single shared,
   * admin-editable GAME template. The game's title becomes the dynamic {reason}
   * and the template supplies all fixed copy + style.
   *
   * Legacy fallback (when no GAME template is configured): render the per-game
   * embedded look keyed off the game `slug` (`templateKey` + `themeJson`).
   *
   * Object arg + `tx` — also called cross-module (games).
   */
  async issueForGameAttempt(
    {
      studentId,
      studentName,
      gameAttemptId,
      titleAr,
      titleEn,
      bodyAr,
      bodyEn,
      templateKey,
      themeJson,
      badgeId,
    },
    tx,
  ) {
    const gameTemplate = await certificateTemplateUsecase.getActiveGameTemplate(tx);
    if (gameTemplate) {
      return certificateRepo.create({
        data: {
          type: CERTIFICATE_TYPES.GAME,
          studentId,
          studentName,
          gameAttemptId,
          templateId: gameTemplate.id,
          // The game's title is the dynamic purpose ({reason}) on the template.
          reasonAr: titleAr ?? undefined,
          reasonEn: titleEn ?? undefined,
          badgeId: badgeId ?? undefined,
        },
        client: tx,
      });
    }

    return certificateRepo.create({
      data: {
        type: CERTIFICATE_TYPES.GAME,
        studentId,
        studentName,
        gameAttemptId,
        titleAr,
        titleEn,
        // Always record the purpose so the certificate is self-describing even
        // without a template (e.g. "completing the game <title>").
        reasonAr: titleAr ?? undefined,
        reasonEn: titleEn ?? undefined,
        bodyAr: bodyAr ?? undefined,
        bodyEn: bodyEn ?? undefined,
        templateKey: templateKey ?? undefined,
        themeJson: themeJson ?? undefined,
        badgeId: badgeId ?? undefined,
      },
      client: tx,
    });
  }

  /**
   * Issue a QUIZ (exam-pass) certificate for a completed quiz attempt.
   *
   * Preferred path: every quiz certificate is generated from the active,
   * admin-editable EXAM template. The quiz's title becomes the dynamic {reason}
   * and the template supplies all fixed copy + style.
   *
   * Legacy fallback (when no EXAM template is active): render the built-in
   * unified exam look keyed off `CERTIFICATE_TEMPLATE_KEYS.EXAM`.
   *
   * Object arg + `tx` — also called cross-module (quizzes).
   */
  async issueForQuizAttempt(
    {
      studentId,
      studentName,
      quizAttemptId,
      titleAr,
      titleEn,
      bodyAr,
      bodyEn,
      templateKey,
      themeJson,
      badgeId,
    },
    tx,
  ) {
    const examTemplate = await certificateTemplateUsecase.getActiveExamTemplate(tx);
    if (examTemplate) {
      return certificateRepo.create({
        data: {
          type: CERTIFICATE_TYPES.QUIZ,
          studentId,
          studentName,
          quizAttemptId,
          templateId: examTemplate.id,
          // The quiz's title is the dynamic purpose ({reason}) on the template.
          reasonAr: titleAr ?? undefined,
          reasonEn: titleEn ?? undefined,
          badgeId: badgeId ?? undefined,
        },
        client: tx,
      });
    }

    return certificateRepo.create({
      data: {
        type: CERTIFICATE_TYPES.QUIZ,
        studentId,
        studentName,
        quizAttemptId,
        titleAr,
        titleEn,
        // Always record the purpose so the certificate is self-describing.
        reasonAr: titleAr ?? undefined,
        reasonEn: titleEn ?? undefined,
        bodyAr: bodyAr ?? undefined,
        bodyEn: bodyEn ?? undefined,
        templateKey: templateKey ?? CERTIFICATE_TEMPLATE_KEYS.EXAM,
        themeJson: themeJson ?? undefined,
        badgeId: badgeId ?? undefined,
      },
      client: tx,
    });
  }
}

export const certificateUsecase = new CertificateUsecase();
export { CertificateUsecase };
