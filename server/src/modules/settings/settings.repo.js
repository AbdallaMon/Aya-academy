// ===========================================================================
// settings.repo — Prisma I/O only on the singleton AppSetting row.
// (Reference idiom: single object args with optional `client`.)
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { appSettingSelect, toAppSetting } from "./settings.dto.js";

class SettingsRepo {
  /** The single global settings row (or null when none exists yet). */
  async getSingleton({ client } = {}) {
    const row = await (client ?? prisma).appSetting.findFirst({
      orderBy: { id: "asc" },
      select: appSettingSelect,
    });
    return toAppSetting(row);
  }

  async create({ data, client } = {}) {
    const row = await (client ?? prisma).appSetting.create({
      data,
      select: appSettingSelect,
    });
    return toAppSetting(row);
  }

  async update({ id, data, client } = {}) {
    const row = await (client ?? prisma).appSetting.update({
      where: { id },
      data,
      select: appSettingSelect,
    });
    return toAppSetting(row);
  }
}

export const settingsRepo = new SettingsRepo();
export { SettingsRepo };
