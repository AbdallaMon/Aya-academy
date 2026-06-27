import { DEFAULT_APP_SETTINGS } from "@aya/shared";
import { settingsRepo } from "./settings.repo.js";

class SettingsUsecase {
  /**
   * Read the global settings, auto-creating the default row the first time it's
   * requested. The settings row is a singleton — there is only ever one row.
   */
  async get(authUser) {
    let settings = await settingsRepo.getSingleton();
    if (!settings) {
      settings = await settingsRepo.create({
        hourlyRate: DEFAULT_APP_SETTINGS.hourlyRate,
        currency: DEFAULT_APP_SETTINGS.currency,
        updatedById: authUser?.id ?? null,
      });
    }
    return settings;
  }

  /** Update the global settings (admin only — gated at the route). */
  async update(authUser, input) {
    const data = { updatedById: authUser?.id ?? null };
    if (input.hourlyRate !== undefined) data.hourlyRate = input.hourlyRate;
    if (input.currency !== undefined) data.currency = input.currency;

    const existing = await settingsRepo.getSingleton();
    if (!existing) {
      return settingsRepo.create({
        hourlyRate: input.hourlyRate ?? DEFAULT_APP_SETTINGS.hourlyRate,
        currency: input.currency ?? DEFAULT_APP_SETTINGS.currency,
        updatedById: authUser?.id ?? null,
      });
    }
    return settingsRepo.update(existing.id, data);
  }

  /** Convenience for other modules: the effective settings (never null). */
  async getEffective() {
    return this.get(null);
  }
}

export const settingsUsecase = new SettingsUsecase();
