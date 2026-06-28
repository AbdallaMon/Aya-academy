import {
  AUTO_CERTIFICATE_TEMPLATE_TYPES,
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

/** Auto-applied types (GAME / EXAM) allow at most one ACTIVE template each. */
function isAutoType(type) {
  return AUTO_CERTIFICATE_TEMPLATE_TYPES.includes(type);
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

  /** The active GAME template (auto-applied to game certificates). */
  getActiveGameTemplate(tx) {
    return certificateTemplateRepo.getActiveGameTemplate(tx);
  }

  /** The active EXAM template (auto-applied to quiz/exam certificates). */
  getActiveExamTemplate(tx) {
    return certificateTemplateRepo.getActiveExamTemplate(tx);
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
      // Promoting a new default — or activating an auto-applied (GAME/EXAM)
      // template — must demote the existing one(s) atomically: only one default,
      // and only one active template per auto-applied type.
      const stealsActiveSlot = isAutoType(data.type) && data.isActive;
      if (data.isDefault || stealsActiveSlot) {
        return await prisma.$transaction(async (tx) => {
          if (data.isDefault) await certificateTemplateRepo.unsetDefaults(null, tx);
          if (stealsActiveSlot)
            await certificateTemplateRepo.deactivateOthersOfType(data.type, null, tx);
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
      // Resolve the effective type (PATCH may omit it — keep the stored one).
      const effectiveType = data.type ?? existing.type;
      const stealsActiveSlot = isAutoType(effectiveType) && data.isActive === true;
      if (data.isDefault === true || stealsActiveSlot) {
        return await prisma.$transaction(async (tx) => {
          if (data.isDefault === true) await certificateTemplateRepo.unsetDefaults(id, tx);
          if (stealsActiveSlot)
            await certificateTemplateRepo.deactivateOthersOfType(effectiveType, id, tx);
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

  /**
   * Mark a template as the active ("in-use") one. For auto-applied types
   * (GAME / EXAM) this atomically deactivates the other templates of the same
   * type, so exactly one is in use. For GENERAL it just flips isActive on.
   */
  async activate(_authUser, id) {
    const existing = await certificateTemplateRepo.getById(id);
    if (!existing) {
      throw notFound(certificateMessagesCodes.TEMPLATE_NOT_FOUND);
    }
    if (!isAutoType(existing.type)) {
      return certificateTemplateRepo.update(id, { isActive: true });
    }
    return prisma.$transaction(async (tx) => {
      await certificateTemplateRepo.deactivateOthersOfType(existing.type, id, tx);
      return certificateTemplateRepo.update(id, { isActive: true }, tx);
    });
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
