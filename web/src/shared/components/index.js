// Central re-export for the shared UI foundation. Import from here:
//   import { DataTable, FormDialog, RHFTextField, PageHeader } from "@/shared/components";

// ── Forms ────────────────────────────────────────────────────────────────────
export { default as RHFTextField } from "./forms/rhf/RHFTextField.jsx";
export { default as RHFTextArea } from "./forms/rhf/RHFTextArea.jsx";
export { default as RHFSelect } from "./forms/rhf/RHFSelect.jsx";
export { default as RHFSwitch } from "./forms/rhf/RHFSwitch.jsx";
export { default as RHFPhoneField } from "./forms/rhf/RHFPhoneField.jsx";
export { default as AsyncUserAutocomplete } from "./forms/AsyncUserAutocomplete.jsx";
export { applyApiErrorsToForm } from "./forms/rhf/applyApiErrorsToForm.js";
export { default as PasswordField } from "./forms/PasswordField.jsx";
export { default as CouponControl } from "./CouponControl.jsx";

// ── Tables ───────────────────────────────────────────────────────────────────
export { DataTable, default as DataTableDefault } from "./tables/DataTable.jsx";
export { default as FilterBar } from "./tables/FilterBar.jsx";
export { default as RowActionsMenu } from "./tables/RowActionsMenu.jsx";
export { default as IdCell } from "./tables/IdCell.jsx";

// ── Dialogs ──────────────────────────────────────────────────────────────────
export { FormDialog, FormModal } from "./dialogs/FormDialog.jsx";
export { default as ConfirmDialog } from "./dialogs/ConfirmDialog.jsx";
export { useConfirm } from "../../providers/ConfirmProvider.jsx";

// ── Layout ───────────────────────────────────────────────────────────────────
export { default as PageHeader } from "./layout/PageHeader.jsx";

// ── Display ──────────────────────────────────────────────────────────────────
export { default as EmptyState } from "./display/EmptyState.jsx";
export { default as PhotoUpload } from "./PhotoUpload.jsx";
export { default as ColorPicker } from "./ColorPicker.jsx";

// ── Feedback ─────────────────────────────────────────────────────────────────
export { default as LoadingOverlay } from "./feedback/LoadingOverlay.jsx";

// ── Subscription ──────────────────────────────────────────────────────────────
export { default as SubscriptionLockedState } from "./SubscriptionLockedState.jsx";
