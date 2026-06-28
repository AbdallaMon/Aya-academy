import { prisma } from "@aya/db/prisma.client.js";
import { appSettingSelect, toAppSetting } from "./settings.dto.js";

class SettingsRepo {
  /** The single global settings row (or null when none exists yet). */
  async getSingleton() {
    const row = await prisma.appSetting.findFirst({
      orderBy: { id: "asc" },
      select: appSettingSelect,
    });
    return toAppSetting(row);
  }

  async create(data) {
    const row = await prisma.appSetting.create({
      data,
      select: appSettingSelect,
    });
    return toAppSetting(row);
  }

  async update(id, data) {
    const row = await prisma.appSetting.update({
      where: { id },
      data,
      select: appSettingSelect,
    });
    return toAppSetting(row);
  }
}

export const settingsRepo = new SettingsRepo();
