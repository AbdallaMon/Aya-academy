import { created, ok } from "../../shared/http/response.js";
import { idParam, optionalIntQuery } from "../../shared/http/params.js";
import { certificateUsecase } from "./certificate.usecase.js";

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
