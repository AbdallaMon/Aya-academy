import { USER_ROLES, messagesNames } from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import { conflict, notFound } from "../../shared/errors/AppError.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { certificateTemplateRepo } from "./certificateTemplate.repo.js";
import { certificateMessagesCodes } from "./certificateTemplate.messages.js";

function isUniqueViolation(err) {
  return err?.code === "P2002";
}

class CertificateTemplateUsecase {
  /** Admins see all templates; everyone else only active ones. */
  buildListWhere(authUser) {
    if (authUser.role === USER_ROLES.ADMIN) return {};
    return { isActive: true };
  }

  async list(authUser, { page, limit }) {
    const { skip, take, page: p, limit: l } = paginate({ page, limit });
    const where = this.buildListWhere(authUser);
    const { items, total } = await certificateTemplateRepo.list(where, skip, take);
    return paginatedResult(items, total, p, l);
  }

  async getById(id) {
    const template = await certificateTemplateRepo.getById(id);
    if (!template) {
      throw notFound(certificateMessagesCodes.TEMPLATE_NOT_FOUND);
    }
    return template;
  }

  async create(_authUser, input) {
    const data = {
      key: input.key,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      headingAr: input.headingAr,
      headingEn: input.headingEn,
      introAr: input.introAr,
      introEn: input.introEn,
      bodyAr: input.bodyAr,
      bodyEn: input.bodyEn,
      congratsAr: input.congratsAr,
      congratsEn: input.congratsEn,
      thanksAr: input.thanksAr,
      thanksEn: input.thanksEn,
      signatureName: input.signatureName,
      signatureTitleAr: input.signatureTitleAr,
      signatureTitleEn: input.signatureTitleEn,
      themeJson: input.themeJson ?? undefined,
      isActive: input.isActive ?? true,
      isDefault: input.isDefault ?? false,
    };

    try {
      // Promoting a new default must demote all others — atomically.
      if (data.isDefault) {
        return await prisma.$transaction(async (tx) => {
          await certificateTemplateRepo.unsetDefaults(null, tx);
          return certificateTemplateRepo.create(data, tx);
        });
      }
      return await certificateTemplateRepo.create(data);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict(
          certificateMessagesCodes.TEMPLATE_KEY_EXISTS,
          messagesNames.certificateMessages,
        );
      }
      throw err;
    }
  }

  async update(_authUser, id, input) {
    const existing = await certificateTemplateRepo.getById(id);
    if (!existing) {
      throw notFound(certificateMessagesCodes.TEMPLATE_NOT_FOUND);
    }

    const data = {
      key: input.key,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      headingAr: input.headingAr,
      headingEn: input.headingEn,
      introAr: input.introAr,
      introEn: input.introEn,
      bodyAr: input.bodyAr,
      bodyEn: input.bodyEn,
      congratsAr: input.congratsAr,
      congratsEn: input.congratsEn,
      thanksAr: input.thanksAr,
      thanksEn: input.thanksEn,
      signatureName: input.signatureName,
      signatureTitleAr: input.signatureTitleAr,
      signatureTitleEn: input.signatureTitleEn,
      themeJson: input.themeJson ?? undefined,
      isActive: input.isActive,
      isDefault: input.isDefault,
    };

    try {
      if (data.isDefault === true) {
        return await prisma.$transaction(async (tx) => {
          await certificateTemplateRepo.unsetDefaults(id, tx);
          return certificateTemplateRepo.update(id, data, tx);
        });
      }
      return await certificateTemplateRepo.update(id, data);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict(
          certificateMessagesCodes.TEMPLATE_KEY_EXISTS,
          messagesNames.certificateMessages,
        );
      }
      throw err;
    }
  }

  async remove(_authUser, id) {
    const existing = await certificateTemplateRepo.getById(id);
    if (!existing) {
      throw notFound(certificateMessagesCodes.TEMPLATE_NOT_FOUND);
    }
    return certificateTemplateRepo.remove(id);
  }
}

export const certificateTemplateUsecase = new CertificateTemplateUsecase();
