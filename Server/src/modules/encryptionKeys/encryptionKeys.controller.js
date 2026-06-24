// encryptionKeys.controller — thin: reads validated input, calls the usecase,
// responds via helpers. No business logic.

import { ok, created } from "../../shared/http/response.js";
import { backupMessagesCodes, generalMessagesCodes, messagesNames } from "@aya/shared";
import { encryptionKeysUsecase } from "./encryptionKeys.usecase.js";

const TK = messagesNames.backupMessages;

class EncryptionKeysController {
  generate = async (req, res) => {
    const data = await encryptionKeysUsecase.generate();
    return ok(res, data, backupMessagesCodes.ENCRYPTION_KEY_GENERATED, TK);
  };

  list = async (req, res) => {
    const data = await encryptionKeysUsecase.list();
    return ok(res, data, generalMessagesCodes.OK, TK);
  };

  save = async (req, res) => {
    const data = await encryptionKeysUsecase.save({ input: req.body, authUser: req.auth });
    return created(res, data, backupMessagesCodes.ENCRYPTION_KEY_SAVED, TK);
  };

  setPrimary = async (req, res) => {
    const data = await encryptionKeysUsecase.setPrimary({ id: req.params.id, authUser: req.auth });
    return ok(res, data, backupMessagesCodes.ENCRYPTION_KEY_PRIMARY_SET, TK);
  };

  remove = async (req, res) => {
    const data = await encryptionKeysUsecase.remove({ id: req.params.id, authUser: req.auth });
    return ok(res, data, backupMessagesCodes.ENCRYPTION_KEY_DELETED, TK);
  };
}

export const encryptionKeysController = new EncryptionKeysController();
