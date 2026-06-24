import { ok } from "../../shared/http/response.js";
import { messagesNames } from "@aya/shared";
import { paymentTemplateUsecase } from "./paymentTemplate.usecase.js";
import { paymentTemplateMessagesCodes } from "./paymentTemplate.messages.js";

function authUser(req) {
  return req.auth;
}

class PaymentTemplateController {
  get = async (req, res) => {
    const template = await paymentTemplateUsecase.get(authUser(req));
    return ok(res, template);
  };

  update = async (req, res) => {
    const template = await paymentTemplateUsecase.update(
      authUser(req),
      req.body.configJson,
    );
    return ok(
      res,
      template,
      paymentTemplateMessagesCodes.PAYMENT_TEMPLATE_UPDATED,
      messagesNames.paymentTemplateMessages,
    );
  };
}

export const paymentTemplateController = new PaymentTemplateController();
