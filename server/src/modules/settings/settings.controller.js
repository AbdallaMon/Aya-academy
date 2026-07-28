import { messagesNames, settingsMessagesCodes } from "@ayah/shared";
import { ok } from "../../shared/http/response.js";
import { settingsUsecase } from "./settings.usecase.js";

class SettingsController {
  async get(req, res) {
    const settings = await settingsUsecase.get(req.auth);
    return ok(res, settings);
  }

  async update(req, res) {
    const settings = await settingsUsecase.update({
      ...req.body,
      authUser: req.auth,
    });
    return ok(
      res,
      settings,
      settingsMessagesCodes.SETTINGS_UPDATED,
      messagesNames.settingsMessages,
    );
  }
}

export const settingsController = new SettingsController();
export { SettingsController };
