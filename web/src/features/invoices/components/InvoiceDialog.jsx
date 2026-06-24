"use client";

import { useEffect } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { MdAutorenew, MdEdit, MdPrint, MdReceiptLong, MdPaid } from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { FormDialog, useConfirm } from "../../../shared/components/index.js";
import { useInvoicesText } from "../config/invoicesText.js";
import {
  INVOICES_URL,
  invoiceGeneratePath,
  invoiceSubscriptionPath,
} from "../config/constant.js";
import InvoiceDocument from "./InvoiceDocument.jsx";
import InvoiceEditForm from "./InvoiceEditForm.jsx";

// Print only the invoice (id="invoice-print") on a clean A4 page.
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #invoice-print, #invoice-print * { visibility: visible !important; }
  #invoice-print {
    position: absolute !important;
    inset: 0 !important;
    margin: 0 auto !important;
    width: 100% !important;
    max-width: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page { size: A4 portrait; margin: 12mm; }
}
`;

/**
 * View + manage the demand invoice for one subscription.
 * Props: open, onClose, subscriptionId, canGenerate, canEdit, onChanged.
 */
export default function InvoiceDialog({
  open,
  onClose,
  subscriptionId,
  canGenerate = false,
  canEdit = false,
  onChanged,
}) {
  const txt = useInvoicesText();
  const confirm = useConfirm();
  const editDialog = useOpen();

  const inv = useRequest({
    url: INVOICES_URL,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });

  const mut = useMultiRequest({ url: INVOICES_URL });

  const invoice = inv.data || null;

  useEffect(() => {
    if (open && subscriptionId) {
      inv.fetchData(invoiceSubscriptionPath(subscriptionId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscriptionId]);

  function refresh() {
    inv.fetchData(invoiceSubscriptionPath(subscriptionId));
    onChanged?.();
  }

  async function generate() {
    await mut.postRequest(invoiceGeneratePath(subscriptionId), {});
    refresh();
  }

  async function saveEdit(payload) {
    if (!invoice) return;
    await mut.patchRequest(String(invoice.id), payload);
    editDialog.close();
    refresh();
  }

  async function markPaid() {
    if (!invoice) return;
    const sure = await confirm({ title: txt.markPaidConfirm, intent: "success" });
    if (!sure) return;
    const activate = await confirm({ title: txt.activateConfirm, intent: "info" });
    await mut.patchRequest(String(invoice.id), {
      status: "PAID",
      activateSubscription: Boolean(activate),
    });
    refresh();
  }

  const busy =
    mut.isPostRequestLoading || mut.isPatchRequestLoading || inv.isLoading;

  const actions = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {!invoice && canGenerate && (
        <Button
          variant="contained"
          startIcon={<MdReceiptLong />}
          onClick={generate}
          disabled={busy}
        >
          {txt.generate}
        </Button>
      )}
      {invoice && (
        <>
          {canGenerate && (
            <Button
              variant="outlined"
              startIcon={<MdAutorenew />}
              onClick={generate}
              disabled={busy}
            >
              {txt.regenerate}
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<MdEdit />}
              onClick={editDialog.open}
              disabled={busy}
            >
              {txt.edit}
            </Button>
          )}
          {canEdit && invoice.status !== "PAID" && (
            <Button
              variant="contained"
              color="success"
              startIcon={<MdPaid />}
              onClick={markPaid}
              disabled={busy}
            >
              {txt.markPaid}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<MdPrint />}
            onClick={() => window.print()}
            disabled={busy}
          >
            {txt.print}
          </Button>
        </>
      )}
    </Stack>
  );

  return (
    <>
      <style>{PRINT_CSS}</style>

      <FormDialog
        open={open}
        onClose={onClose}
        title={txt.invoiceFor}
        maxWidth="md"
        showCloseIcon
        actions={actions}
      >
        {inv.isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : invoice ? (
          <InvoiceDocument invoice={invoice} printable />
        ) : (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            {txt.noInvoice}
          </Typography>
        )}
      </FormDialog>

      {canEdit && invoice && (
        <FormDialog
          open={editDialog.isOpen}
          onClose={editDialog.close}
          title={txt.editTitle}
          maxWidth="md"
          loading={mut.isPatchRequestLoading}
          submitText={txt.save}
          cancelText={txt.cancel}
          onSubmit={() => document.getElementById("invoice-edit-form")?.requestSubmit()}
        >
          <InvoiceEditForm
            id="invoice-edit-form"
            invoice={invoice}
            txt={txt}
            onSubmit={saveEdit}
          />
        </FormDialog>
      )}
    </>
  );
}
