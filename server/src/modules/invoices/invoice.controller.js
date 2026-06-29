import { messagesNames } from "@aya/shared";
import { ok, created } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { invoiceUsecase } from "./invoice.usecase.js";
import { invoiceMessagesCodes } from "./invoice.messages.js";

class InvoiceController {
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await invoiceUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters,
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const invoice = await invoiceUsecase.getById({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, invoice);
  }

  async getBySubscription(req, res) {
    const invoice = await invoiceUsecase.getBySubscription({
      subscriptionId: idParam(req.params.subscriptionId),
      authUser: req.auth,
    });
    return ok(res, invoice);
  }

  async generate(req, res) {
    // generate(authUser, subscriptionId) is frozen (consumed cross-module).
    const { invoice, regenerated } = await invoiceUsecase.generate(
      req.auth,
      idParam(req.params.subscriptionId),
    );
    const code = regenerated
      ? invoiceMessagesCodes.INVOICE_REGENERATED
      : invoiceMessagesCodes.INVOICE_GENERATED;
    return created(res, invoice, code, messagesNames.invoiceMessages);
  }

  async update(req, res) {
    // update(authUser, id, input) is frozen (consumed cross-module).
    const invoice = await invoiceUsecase.update(
      req.auth,
      idParam(req.params.id),
      req.body,
    );
    return ok(
      res,
      invoice,
      invoiceMessagesCodes.INVOICE_UPDATED,
      messagesNames.invoiceMessages,
    );
  }

  async send(req, res) {
    const invoice = await invoiceUsecase.send({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(
      res,
      invoice,
      invoiceMessagesCodes.INVOICE_SENT,
      messagesNames.invoiceMessages,
    );
  }
}

export const invoiceController = new InvoiceController();
export { InvoiceController };
