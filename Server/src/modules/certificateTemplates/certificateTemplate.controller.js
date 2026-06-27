import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam, authUser } from "../../shared/http/params.js";
import { certificateTemplateUsecase } from "./certificateTemplate.usecase.js";

class CertificateTemplateController {
  list = async (req, res) => {
    const result = await certificateTemplateUsecase.list(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const template = await certificateTemplateUsecase.getById(
      idParam(req.params.id),
    );
    return ok(res, template);
  };

  // PUBLIC (no auth): the active GAME template's render payload, for the
  // anonymous free-game certificate. Returns null when none is configured.
  getActiveGamePublic = async (_req, res) => {
    const template = await certificateTemplateUsecase.getActiveGameTemplatePublic();
    return ok(res, template);
  };

  create = async (req, res) => {
    const template = await certificateTemplateUsecase.create(
      authUser(req),
      req.body,
    );
    return created(res, template, generalMessagesCodes.CREATED);
  };

  update = async (req, res) => {
    const template = await certificateTemplateUsecase.update(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, template, generalMessagesCodes.UPDATED);
  };

  remove = async (req, res) => {
    const template = await certificateTemplateUsecase.remove(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, template, generalMessagesCodes.DELETED);
  };
}

export const certificateTemplateController = new CertificateTemplateController();
