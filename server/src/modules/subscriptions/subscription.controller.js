import { generalMessagesCodes, messagesNames } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { subscriptionMessagesCodes } from "./subscription.messages.js";
import { idParam, optionalIntQuery, authUser } from "../../shared/http/params.js";
import { subscriptionUsecase } from "./subscription.usecase.js";

class SubscriptionController {
  list = async (req, res) => {
    const result = await subscriptionUsecase.list(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
      studentId: optionalIntQuery(req.query.studentId),
      status: req.query.status,
    });
    return ok(res, result);
  };

  expiring = async (req, res) => {
    const result = await subscriptionUsecase.listExpiring(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
      days: optionalIntQuery(req.query.days),
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const subscription = await subscriptionUsecase.getById(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, subscription);
  };

  create = async (req, res) => {
    const subscription = await subscriptionUsecase.create(
      authUser(req),
      req.body,
    );
    return created(res, subscription, generalMessagesCodes.CREATED);
  };

  update = async (req, res) => {
    const subscription = await subscriptionUsecase.update(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, subscription, generalMessagesCodes.UPDATED);
  };

  remove = async (req, res) => {
    const subscription = await subscriptionUsecase.remove(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, subscription, generalMessagesCodes.DELETED);
  };

  request = async (req, res) => {
    const subscription = await subscriptionUsecase.request(
      authUser(req),
      req.body,
    );
    return created(res, subscription, generalMessagesCodes.CREATED);
  };

  approve = async (req, res) => {
    const subscription = await subscriptionUsecase.approve(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, subscription, generalMessagesCodes.UPDATED);
  };

  reject = async (req, res) => {
    const subscription = await subscriptionUsecase.reject(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, subscription, generalMessagesCodes.UPDATED);
  };

  cancel = async (req, res) => {
    const subscription = await subscriptionUsecase.cancel(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, subscription, generalMessagesCodes.UPDATED);
  };

  renew = async (req, res) => {
    const subscription = await subscriptionUsecase.renew(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return created(
      res,
      subscription,
      subscriptionMessagesCodes.SUBSCRIPTION_RENEWED,
      messagesNames.subscriptionMessages,
    );
  };
}

export const subscriptionController = new SubscriptionController();
