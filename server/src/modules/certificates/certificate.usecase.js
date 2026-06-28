import {
  CERTIFICATE_TEMPLATE_KEYS,
  CERTIFICATE_TYPES,
  USER_ROLES,
  messagesNames,
} from "@aya/shared";
import { badRequest, forbidden, notFound } from "../../shared/errors/AppError.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { userRepo } from "../users/user.repo.js";
import { certificateTemplateUsecase } from "../certificateTemplates/certificateTemplate.usecase.js";
import { certificateRepo } from "./certificate.repo.js";
import { certificateMessagesCodes } from "./certificate.messages.js";

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

  async buildListWhere(authUser, { studentId, type }) {
    const where = {};
    if (type) where.type = type;

    if (authUser.role === USER_ROLES.ADMIN) {
      if (studentId) where.studentId = studentId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const ids = await userRepo.getStudentIdsForParent(authUser.id);
      where.studentId =
        studentId && ids.includes(studentId) ? studentId : { in: ids };
    } else {
      where.studentId = authUser.id;
    }
    return where;
  }

  async list(authUser, params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = await this.buildListWhere(authUser, params);
    const { items, total } = await certificateRepo.list(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }

  async getById(authUser, id) {
    const cert = await certificateRepo.getById(id);
    if (!cert) throw notFound(certificateMessagesCodes.CERTIFICATE_NOT_FOUND);
    await this.assertCanAccess(authUser, cert.studentId);
    return cert;
  }

  /**
   * Admin manually issues a CUSTOM certificate for a STUDENT (not tied to any
   * game/quiz attempt). Route already gated by CERTIFICATE.CREATE (admin-only).
   */
  async createManual(authUser, input) {
    const student = await userRepo.getPublicById(input.studentId);
    if (!student || student.role !== USER_ROLES.STUDENT) {
      throw badRequest(
        certificateMessagesCodes.CERTIFICATE_STUDENT_NOT_FOUND,
        messagesNames.certificateMessages,
      );
    }

    return certificateRepo.create({
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
      createdById: authUser.id,
    });
  }

  // ── reusable services (importable by games / quizzes) ──────────
  /**
   * Issue a GAME certificate for a completed game attempt.
   *
   * Preferred path: every game certificate is generated from the single shared,
   * admin-editable GAME template. The game's title becomes the dynamic {reason}
   * and the template supplies all fixed copy + style.
   *
   * Legacy fallback (when no GAME template is configured): render the per-game
   * embedded look keyed off the game `slug` (`templateKey` + `themeJson`).
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
    },
    tx,
  ) {
    const gameTemplate = await certificateTemplateUsecase.getActiveGameTemplate(tx);
    if (gameTemplate) {
      return certificateRepo.create(
        {
          type: CERTIFICATE_TYPES.GAME,
          studentId,
          studentName,
          gameAttemptId,
          templateId: gameTemplate.id,
          // The game's title is the dynamic purpose ({reason}) on the template.
          reasonAr: titleAr ?? undefined,
          reasonEn: titleEn ?? undefined,
        },
        tx,
      );
    }

    return certificateRepo.create(
      {
        type: CERTIFICATE_TYPES.GAME,
        studentId,
        studentName,
        gameAttemptId,
        titleAr,
        titleEn,
        bodyAr: bodyAr ?? undefined,
        bodyEn: bodyEn ?? undefined,
        templateKey: templateKey ?? undefined,
        themeJson: themeJson ?? undefined,
      },
      tx,
    );
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
    },
    tx,
  ) {
    const examTemplate = await certificateTemplateUsecase.getActiveExamTemplate(tx);
    if (examTemplate) {
      return certificateRepo.create(
        {
          type: CERTIFICATE_TYPES.QUIZ,
          studentId,
          studentName,
          quizAttemptId,
          templateId: examTemplate.id,
          // The quiz's title is the dynamic purpose ({reason}) on the template.
          reasonAr: titleAr ?? undefined,
          reasonEn: titleEn ?? undefined,
        },
        tx,
      );
    }

    return certificateRepo.create(
      {
        type: CERTIFICATE_TYPES.QUIZ,
        studentId,
        studentName,
        quizAttemptId,
        titleAr,
        titleEn,
        bodyAr: bodyAr ?? undefined,
        bodyEn: bodyEn ?? undefined,
        templateKey: templateKey ?? CERTIFICATE_TEMPLATE_KEYS.EXAM,
        themeJson: themeJson ?? undefined,
      },
      tx,
    );
  }
}

export const certificateUsecase = new CertificateUsecase();
