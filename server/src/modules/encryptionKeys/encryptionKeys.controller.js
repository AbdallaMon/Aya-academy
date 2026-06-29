// encryptionKeys.controller — thin: reads validated input, calls the usecase,
// responds via helpers. No business logic.

import { ok, created } from "../../shared/http/response.js";
import { backupMessagesCodes, generalMessagesCodes, messagesNames } from "@aya/shared";
import { idParam } from "../../shared/http/params.js";
import { encryptionKeysUsecase } from "./encryptionKeys.usecase.js";

const TK = messagesNames.backupMessages;

class EncryptionKeysController {
  async generate(req, res) {
    const data = await encryptionKeysUsecase.generate();
    return ok(res, data, backupMessagesCodes.ENCRYPTION_KEY_GENERATED, TK);
  }

  async list(req, res) {
    const data = await encryptionKeysUsecase.list();
    return ok(res, data, generalMessagesCodes.OK, TK);
  }

  async save(req, res) {
    const data = await encryptionKeysUsecase.save({ input: req.body, authUser: req.auth });
    return created(res, data, backupMessagesCodes.ENCRYPTION_KEY_SAVED, TK);
  }

  async setPrimary(req, res) {
    const data = await encryptionKeysUsecase.setPrimary({ id: idParam(req.params.id), authUser: req.auth });
    return ok(res, data, backupMessagesCodes.ENCRYPTION_KEY_PRIMARY_SET, TK);
  }

  async remove(req, res) {
    const data = await encryptionKeysUsecase.remove({ id: idParam(req.params.id), authUser: req.auth });
    return ok(res, data, backupMessagesCodes.ENCRYPTION_KEY_DELETED, TK);
  }
}

export const encryptionKeysController = new EncryptionKeysController();
export { EncryptionKeysController };
