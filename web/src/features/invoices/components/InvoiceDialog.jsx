"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { MdAutorenew, MdEdit, MdFileDownload, MdReceiptLong, MdPaid, MdSend, MdCheckCircle } from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { FormDialog, useConfirm } from "../../../shared/components/index.js";
import { useInvoicesText } from "../config/invoicesText.js";
import {
  INVOICES_URL,
  invoiceGeneratePath,
  invoiceSubscriptionPath,
  invoiceSendPath,
} from "../config/constant.js";
import InvoiceDocument from "./InvoiceDocument.jsx";
import InvoiceEditForm from "./InvoiceEditForm.jsx";
import { downloadInvoicePdf } from "../lib/exportInvoice.js";

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
  const [pdfBusy, setPdfBusy] = useState(false);

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
    if (invoice) {
      const sure = await confirm({
        title: txt.regenerateConfirm,
        intent: "warning",
      });
      if (!sure) return;
    }
    await mut.postRequest(invoiceGeneratePath(subscriptionId), {});
    refresh();
  }

  async function requestPayment() {
    if (!invoice) return;
    const sure = await confirm({
      title: txt.requestPaymentConfirm,
      intent: "info",
    });
    if (!sure) return;
    await mut.postRequest(invoiceSendPath(invoice.id), {});
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

  async function downloadPdf() {
    const node = document.getElementById("invoice-print");
    if (!node) return;
    setPdfBusy(true);
    try {
      await downloadInvoicePdf(node, `${invoice?.invoiceNumber || "invoice"}.pdf`);
    } finally {
      setPdfBusy(false);
    }
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
              variant={invoice.sentAt ? "outlined" : "contained"}
              color="info"
              startIcon={invoice.sentAt ? <MdCheckCircle /> : <MdSend />}
              onClick={requestPayment}
              disabled={busy}
            >
              {invoice.sentAt ? txt.resendPayment : txt.requestPayment}
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
            startIcon={pdfBusy ? <CircularProgress size={16} color="inherit" /> : <MdFileDownload />}
            onClick={downloadPdf}
            disabled={busy || pdfBusy}
          >
            {txt.downloadPdf}
          </Button>
        </>
      )}
    </Stack>
  );

  return (
    <>
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
        <InvoiceEditForm
          open={editDialog.isOpen}
          onClose={editDialog.close}
          invoice={invoice}
          txt={txt}
          onSaved={refresh}
        />
      )}
    </>
  );
}
