import {
  CERTIFICATE_TEMPLATE_TYPES,
  USER_ROLES,
  messagesNames,
} from "@aya/shared";
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

  /** The single active GAME template (auto-applied to game certificates). */
  getActiveGameTemplate(tx) {
    return certificateTemplateRepo.getActiveGameTemplate(tx);
  }

  /**
   * Public (no-auth) render payload for the single active GAME template — lets
   * the anonymous free-game certificate match the admin-designed look. Returns
   * null when no GAME template is configured. Exposes ONLY render fields (copy +
   * style), never admin/internal flags (key, names, isDefault…).
   */
  async getActiveGameTemplatePublic() {
    const tpl = await certificateTemplateRepo.getActiveGameTemplate();
    if (!tpl) return null;
    return {
      headingAr: tpl.headingAr,
      headingEn: tpl.headingEn,
      introAr: tpl.introAr,
      introEn: tpl.introEn,
      bodyAr: tpl.bodyAr,
      bodyEn: tpl.bodyEn,
      congratsAr: tpl.congratsAr,
      congratsEn: tpl.congratsEn,
      thanksAr: tpl.thanksAr,
      thanksEn: tpl.thanksEn,
      signatureName: tpl.signatureName,
      signatureTitleAr: tpl.signatureTitleAr,
      signatureTitleEn: tpl.signatureTitleEn,
      themeJson: tpl.themeJson,
    };
  }

  async create(_authUser, input) {
    const data = {
      key: input.key,
      type: input.type ?? CERTIFICATE_TEMPLATE_TYPES.GENERAL,
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
      // Promoting a new default — or a new GAME template — must demote the
      // existing one(s) atomically (only one default / one GAME template).
      const isGame = data.type === CERTIFICATE_TEMPLATE_TYPES.GAME;
      if (data.isDefault || isGame) {
        return await prisma.$transaction(async (tx) => {
          if (data.isDefault) await certificateTemplateRepo.unsetDefaults(null, tx);
          if (isGame) await certificateTemplateRepo.demoteOtherGameTemplates(null, tx);
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
      type: input.type,
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
      const isGame = data.type === CERTIFICATE_TEMPLATE_TYPES.GAME;
      if (data.isDefault === true || isGame) {
        return await prisma.$transaction(async (tx) => {
          if (data.isDefault === true) await certificateTemplateRepo.unsetDefaults(id, tx);
          if (isGame) await certificateTemplateRepo.demoteOtherGameTemplates(id, tx);
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
