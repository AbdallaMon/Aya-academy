// Public projection for the singleton payment template.
export const paymentTemplateSelect = {
  id: true,
  configJson: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
};

export function toPaymentTemplate(row) {
  if (!row) return row;
  return row;
}
