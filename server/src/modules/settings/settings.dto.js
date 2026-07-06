// Public projection for the singleton app-settings row. Decimal → Number so the
// client gets a plain number, not a Prisma Decimal.
export const appSettingSelect = {
  id: true,
  hourlyRate: true,
  currency: true,
  whiteboardRetentionDays: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
};

export function toAppSetting(row) {
  if (!row) return row;
  return {
    ...row,
    hourlyRate: row.hourlyRate == null ? null : Number(row.hourlyRate),
  };
}
