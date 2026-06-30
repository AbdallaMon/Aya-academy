import { DEFAULT_APP_SETTINGS } from "@aya/shared";
import { settingsRepo } from "./settings.repo.js";

class SettingsUsecase {
  /**
   * Read the global settings, auto-creating the default row the first time it's
   * requested. The settings row is a singleton — there is only ever one row.
   *
   * Positional `authUser` — also called cross-module (invoices / subscriptions /
   * plans / auth via getEffective). Signature frozen.
   */
  async get(authUser) {
    let settings = await settingsRepo.getSingleton();
    if (!settings) {
      settings = await settingsRepo.create({
        data: {
          hourlyRate: DEFAULT_APP_SETTINGS.hourlyRate,
          currency: DEFAULT_APP_SETTINGS.currency,
          updatedById: authUser?.id ?? null,
        },
      });
    }
    return settings;
  }

  /** Update the global settings (admin only — gated at the route). */
  async update({ authUser, hourlyRate, currency }) {
    const data = { updatedById: authUser?.id ?? null };
    if (hourlyRate !== undefined) data.hourlyRate = hourlyRate;
    if (currency !== undefined) data.currency = currency;

    const existing = await settingsRepo.getSingleton();
    if (!existing) {
      return settingsRepo.create({
        data: {
          hourlyRate: hourlyRate ?? DEFAULT_APP_SETTINGS.hourlyRate,
          currency: currency ?? DEFAULT_APP_SETTINGS.currency,
          updatedById: authUser?.id ?? null,
        },
      });
    }
    return settingsRepo.update({ id: existing.id, data });
  }

  /** Convenience for other modules: the effective settings (never null). */
  async getEffective() {
    return this.get(null);
  }
}

export const settingsUsecase = new SettingsUsecase();
export { SettingsUsecase };
