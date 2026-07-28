import { messagesNames, paymentTemplateMessagesCodes } from "@ayah/shared";
import { ok } from "../../../shared/http/response.js";
import { paymentTemplateUsecase } from "./paymentTemplate.usecase.js";

class PaymentTemplateController {
  async get(req, res) {
    const template = await paymentTemplateUsecase.get(req.auth);
    return ok(res, template);
  }

  async update(req, res) {
    const template = await paymentTemplateUsecase.update({
      ...req.body,
      authUser: req.auth,
    });
    return ok(
      res,
      template,
      paymentTemplateMessagesCodes.PAYMENT_TEMPLATE_UPDATED,
      messagesNames.paymentTemplateMessages,
    );
  }
}

export const paymentTemplateController = new PaymentTemplateController();
export { PaymentTemplateController };
