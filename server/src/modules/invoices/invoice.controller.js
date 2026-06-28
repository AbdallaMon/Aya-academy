import { messagesNames } from "@aya/shared";
import { ok, created } from "../../shared/http/response.js";
import { idParam, authUser } from "../../shared/http/params.js";
import { invoiceUsecase } from "./invoice.usecase.js";
import { invoiceMessagesCodes } from "./invoice.messages.js";

class InvoiceController {
  list = async (req, res) => {
    const result = await invoiceUsecase.list(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const invoice = await invoiceUsecase.getById(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, invoice);
  };

  getBySubscription = async (req, res) => {
    const invoice = await invoiceUsecase.getBySubscription(
      authUser(req),
      idParam(req.params.subscriptionId),
    );
    return ok(res, invoice);
  };

  generate = async (req, res) => {
    const { invoice, regenerated } = await invoiceUsecase.generate(
      authUser(req),
      idParam(req.params.subscriptionId),
    );
    const code = regenerated
      ? invoiceMessagesCodes.INVOICE_REGENERATED
      : invoiceMessagesCodes.INVOICE_GENERATED;
    return created(res, invoice, code, messagesNames.invoiceMessages);
  };

  update = async (req, res) => {
    const invoice = await invoiceUsecase.update(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(
      res,
      invoice,
      invoiceMessagesCodes.INVOICE_UPDATED,
      messagesNames.invoiceMessages,
    );
  };

  send = async (req, res) => {
    const invoice = await invoiceUsecase.send(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, invoice, invoiceMessagesCodes.INVOICE_SENT, messagesNames.invoiceMessages);
  };
}

export const invoiceController = new InvoiceController();
