import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../../shared/http/response.js";
import { idParam } from "../../../shared/http/params.js";
import { certificateTemplateUsecase } from "./certificateTemplate.usecase.js";

class CertificateTemplateController {
  async list(req, res) {
    const { page, limit } = req.query;
    const result = await certificateTemplateUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const template = await certificateTemplateUsecase.getById(
      idParam(req.params.id),
    );
    return ok(res, template);
  }

  // PUBLIC (no auth): the active GAME template's render payload, for the
  // anonymous free-game certificate. Returns null when none is configured.
  async getActiveGamePublic(_req, res) {
    const template = await certificateTemplateUsecase.getActiveGameTemplatePublic();
    return ok(res, template);
  }

  async create(req, res) {
    const template = await certificateTemplateUsecase.create({
      ...req.body,
      authUser: req.auth,
    });
    return created(res, template, generalMessagesCodes.CREATED);
  }

  async update(req, res) {
    const template = await certificateTemplateUsecase.update({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, template, generalMessagesCodes.UPDATED);
  }

  async activate(req, res) {
    const template = await certificateTemplateUsecase.activate({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, template, generalMessagesCodes.UPDATED);
  }

  async remove(req, res) {
    const template = await certificateTemplateUsecase.remove({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, template, generalMessagesCodes.DELETED);
  }
}

export const certificateTemplateController = new CertificateTemplateController();
export { CertificateTemplateController };
