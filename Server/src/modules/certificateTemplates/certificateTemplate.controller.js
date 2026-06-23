import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { certificateTemplateUsecase } from "./certificateTemplate.usecase.js";

function authUser(req) {
  return req.auth;
}

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

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
