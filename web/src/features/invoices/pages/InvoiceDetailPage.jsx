"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Paper, Stack } from "@mui/material";
import { MdFileDownload } from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { EmptyState, PageHeader } from "../../../shared/components/index.js";
import { useInvoicesText } from "../config/invoicesText.js";
import { INVOICES_URL } from "../config/constant.js";
import InvoiceDocument from "../components/InvoiceDocument.jsx";
import { downloadInvoicePdf } from "../lib/exportInvoice.js";

/**
 * Dedicated, shareable invoice page (deep-linked from the "payment requested"
 * notification → /dashboard/invoices/:id). Read-only: it renders the printable
 * invoice document plus a permanent Download-PDF button. The backend hides an
 * unsent invoice from non-admins (404), so a parent only reaches this page once
 * the teacher has requested payment.
 *
 * Props: invoiceId.
 */
export default function InvoiceDetailPage({ invoiceId }) {
  const txt = useInvoicesText();
  const [pdfBusy, setPdfBusy] = useState(false);

  const inv = useRequest({
    url: INVOICES_URL,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });

  useEffect(() => {
    if (invoiceId) inv.fetchData(String(invoiceId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const invoice = inv.data || null;

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

  if (inv.isLoading && !invoice) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!invoice) {
    return (
      <EmptyState
        title={txt.noInvoice}
        icon={<Box sx={{ fontSize: 48 }}>🧾</Box>}
      />
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${txt.invoiceFor} ${invoice.invoiceNumber || ""}`.trim()}
        renderExtraComponent={() => (
          <Button
            variant="contained"
            startIcon={
              pdfBusy ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <MdFileDownload />
              )
            }
            onClick={downloadPdf}
            disabled={pdfBusy}
          >
            {txt.downloadPdf}
          </Button>
        )}
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 3 },
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          maxWidth: 900,
          mx: "auto",
        }}
      >
        <InvoiceDocument invoice={invoice} printable />
      </Paper>
    </Box>
  );
}
