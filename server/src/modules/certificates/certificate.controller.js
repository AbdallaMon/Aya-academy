import { created, ok } from "../../shared/http/response.js";
import { idParam, optionalIntQuery } from "../../shared/http/params.js";
import { certificateUsecase } from "./certificate.usecase.js";

class CertificateController {
  async list(req, res) {
    const { page, limit } = req.query;
    const result = await certificateUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters: {
        studentId: optionalIntQuery(req.query.studentId),
        type: req.query.type,
      },
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const cert = await certificateUsecase.getById({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, cert);
  }

  async create(req, res) {
    const cert = await certificateUsecase.createManual({
      ...req.body,
      authUser: req.auth,
    });
    return created(res, cert);
  }
}

export const certificateController = new CertificateController();
export { CertificateController };
