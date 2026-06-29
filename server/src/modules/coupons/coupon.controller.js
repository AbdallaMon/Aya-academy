import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { couponUsecase } from "./coupon.usecase.js";

class CouponController {
  list = async (req, res) => {
    const result = await couponUsecase.list({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      isActive: req.query.isActive,
      status: req.query.status,
      source: req.query.source,
      planId: req.query.planId,
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const coupon = await couponUsecase.getById(idParam(req.params.id));
    return ok(res, coupon);
  };

  create = async (req, res) => {
    const coupon = await couponUsecase.create(req.body);
    return created(res, coupon, generalMessagesCodes.CREATED);
  };

  update = async (req, res) => {
    const coupon = await couponUsecase.update(idParam(req.params.id), req.body);
    return ok(res, coupon, generalMessagesCodes.UPDATED);
  };

  remove = async (req, res) => {
    const coupon = await couponUsecase.remove(idParam(req.params.id));
    return ok(res, coupon, generalMessagesCodes.DELETED);
  };

  validate = async (req, res) => {
    const result = await couponUsecase.validateCoupon(req.body);
    return ok(res, result);
  };
}

export const couponController = new CouponController();
