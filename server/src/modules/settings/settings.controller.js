import { ok } from "../../shared/http/response.js";
import { authUser } from "../../shared/http/params.js";
import { messagesNames } from "@aya/shared";
import { settingsUsecase } from "./settings.usecase.js";
import { settingsMessagesCodes } from "./settings.messages.js";

class SettingsController {
  get = async (req, res) => {
    const settings = await settingsUsecase.get(authUser(req));
    return ok(res, settings);
  };

  update = async (req, res) => {
    const settings = await settingsUsecase.update(authUser(req), req.body);
    return ok(
      res,
      settings,
      settingsMessagesCodes.SETTINGS_UPDATED,
      messagesNames.settingsMessages,
    );
  };
}

export const settingsController = new SettingsController();
