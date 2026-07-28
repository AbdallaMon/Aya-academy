import { generalMessagesCodes } from "@ayah/shared";
import { created, ok } from "../../../shared/http/response.js";
import { idParam } from "../../../shared/http/params.js";
import { couponUsecase } from "./coupon.usecase.js";

class CouponController {
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await couponUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const coupon = await couponUsecase.getById(idParam(req.params.id));
    return ok(res, coupon);
  }

  async create(req, res) {
    const coupon = await couponUsecase.create({ ...req.body, authUser: req.auth });
    return created(res, coupon, generalMessagesCodes.CREATED);
  }

  async update(req, res) {
    const coupon = await couponUsecase.update({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, coupon, generalMessagesCodes.UPDATED);
  }

  async remove(req, res) {
    const coupon = await couponUsecase.remove({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, coupon, generalMessagesCodes.DELETED);
  }

  async validate(req, res) {
    const result = await couponUsecase.validateCoupon({ ...req.body });
    return ok(res, result);
  }
}

export const couponController = new CouponController();
export { CouponController };
