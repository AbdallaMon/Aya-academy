"use client";

import {
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { MdCheckCircle, MdReceiptLong } from "react-icons/md";
import { useOpen } from "../../../hooks/useOpen.js";
import { formatMoney } from "../../../shared/lib/money.js";
import InvoiceDialog from "../../invoices/components/InvoiceDialog.jsx";
import { INVOICE_STATUS_COLOR } from "../config/constant.js";

function Row({ label, children }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

/**
 * Read-only invoice summary card. The full view/download experience is the
 * shared InvoiceDialog — we only reuse it here, never rebuild it.
 *
 * Props: subscriptionId, invoice (or null), txt, canGenerate, canEdit, onChanged.
 */
export default function InvoiceCard({
  subscriptionId,
  invoice,
  txt,
  canGenerate = false,
  canEdit = false,
  onChanged,
}) {
  const dialog = useOpen();

  return (
    <>
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              {txt.invoiceCardTitle}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<MdReceiptLong />}
              onClick={dialog.open}
            >
              {txt.viewInvoice}
            </Button>
          </Stack>

          {invoice ? (
            <Stack spacing={1.25}>
              <Row label={txt.invoiceStatus}>
                <Chip
                  size="small"
                  color={INVOICE_STATUS_COLOR[invoice.status] || "default"}
                  label={txt[invoice.status] || invoice.status}
                />
              </Row>
              <Row label={txt.invoiceTotal}>
                <Typography variant="body2" fontWeight={700}>
                  {formatMoney(invoice.total, invoice.currency)}
                </Typography>
              </Row>
              <Row label={txt.sent}>
                {invoice.sentAt ? (
                  <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    icon={<MdCheckCircle />}
                    label={`${txt.sent} · ${new Date(invoice.sentAt).toLocaleDateString()}`}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {txt.notSent}
                  </Typography>
                )}
              </Row>
            </Stack>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 2, textAlign: "center" }}
            >
              {txt.noInvoice}
            </Typography>
          )}
        </CardContent>
      </Card>

      <InvoiceDialog
        open={dialog.isOpen}
        onClose={dialog.close}
        subscriptionId={subscriptionId}
        canGenerate={canGenerate}
        canEdit={canEdit}
        onChanged={onChanged}
      />
    </>
  );
}
