import { created, ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { certificateUsecase } from "./certificate.usecase.js";

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

function optionalIntQuery(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

class CertificateController {
  list = async (req, res) => {
    const result = await certificateUsecase.list(req.auth, {
      page: req.query.page,
      limit: req.query.limit,
      studentId: optionalIntQuery(req.query.studentId),
      type: req.query.type,
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const cert = await certificateUsecase.getById(
      req.auth,
      idParam(req.params.id),
    );
    return ok(res, cert);
  };

  create = async (req, res) => {
    const cert = await certificateUsecase.createManual(req.auth, req.body);
    return created(res, cert);
  };
}

export const certificateController = new CertificateController();
