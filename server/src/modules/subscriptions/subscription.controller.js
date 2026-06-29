import { generalMessagesCodes, messagesNames } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam, optionalIntQuery } from "../../shared/http/params.js";
import { subscriptionUsecase } from "./subscription.usecase.js";
import { subscriptionMessagesCodes } from "./subscription.messages.js";

class SubscriptionController {
  async list(req, res) {
    const { page, limit, studentId, status } = req.query;
    const result = await subscriptionUsecase.list({
      authUser: req.auth,
      page,
      limit,
      studentId: optionalIntQuery(studentId),
      status,
    });
    return ok(res, result);
  }

  async expiring(req, res) {
    const { page, limit, days } = req.query;
    const result = await subscriptionUsecase.listExpiring({
      authUser: req.auth,
      page,
      limit,
      days: optionalIntQuery(days),
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const subscription = await subscriptionUsecase.getById({
      authUser: req.auth,
      id: idParam(req.params.id),
    });
    return ok(res, subscription);
  }

  async create(req, res) {
    const subscription = await subscriptionUsecase.create({
      ...req.body,
      authUser: req.auth,
    });
    return created(res, subscription, generalMessagesCodes.CREATED);
  }

  async update(req, res) {
    const subscription = await subscriptionUsecase.update({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, subscription, generalMessagesCodes.UPDATED);
  }

  async remove(req, res) {
    const subscription = await subscriptionUsecase.remove({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, subscription, generalMessagesCodes.DELETED);
  }

  async request(req, res) {
    const subscription = await subscriptionUsecase.request({
      ...req.body,
      authUser: req.auth,
    });
    return created(res, subscription, generalMessagesCodes.CREATED);
  }

  async approve(req, res) {
    const subscription = await subscriptionUsecase.approve({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, subscription, generalMessagesCodes.UPDATED);
  }

  async reject(req, res) {
    const subscription = await subscriptionUsecase.reject({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, subscription, generalMessagesCodes.UPDATED);
  }

  async cancel(req, res) {
    const subscription = await subscriptionUsecase.cancel({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, subscription, generalMessagesCodes.UPDATED);
  }

  async renew(req, res) {
    const subscription = await subscriptionUsecase.renew({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return created(
      res,
      subscription,
      subscriptionMessagesCodes.SUBSCRIPTION_RENEWED,
      messagesNames.subscriptionMessages,
    );
  }

  async changePlan(req, res) {
    const subscription = await subscriptionUsecase.changePlan({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(
      res,
      subscription,
      subscriptionMessagesCodes.PLAN_CHANGED,
      messagesNames.subscriptionMessages,
    );
  }

  async applyCoupon(req, res) {
    const subscription = await subscriptionUsecase.applyCoupon({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(
      res,
      subscription,
      subscriptionMessagesCodes.PLAN_CHANGED,
      messagesNames.subscriptionMessages,
    );
  }

  async activate(req, res) {
    const subscription = await subscriptionUsecase.activate({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(
      res,
      subscription,
      subscriptionMessagesCodes.SUBSCRIPTION_ACTIVATED,
      messagesNames.subscriptionMessages,
    );
  }
}

export const subscriptionController = new SubscriptionController();
export { SubscriptionController };
