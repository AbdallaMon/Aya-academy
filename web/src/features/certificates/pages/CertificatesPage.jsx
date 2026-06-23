"use client";

import { useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { MdAdd, MdPrint } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { DataTable, FormDialog } from "../../../shared/components/index.js";
import { CERTIFICATES_URL } from "../config/constant.js";
import { buildCertificateColumns } from "../config/certificatesColumns.js";
import { useCertificatesText } from "../config/certificatesText.js";
import CertificateCard from "../components/CertificateCard.jsx";
import CreateCertificateDialog from "../components/CreateCertificateDialog.jsx";

// Print only the certificate (id="certificate-print"), nicely, on a white A4
// landscape page. Injected once near the view dialog so window.print() outputs
// just the certificate with its colors preserved.
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #certificate-print, #certificate-print * { visibility: visible !important; }
  #certificate-print {
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
  @page { size: A4 landscape; margin: 12mm; }
}
`;

export default function CertificatesPage() {
  const txt = useCertificatesText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.CERTIFICATE.LIST);
  const canCreate = hasPermission(PERMISSIONS.CERTIFICATE.CREATE);

  const viewDialog = useOpen();
  const createDialog = useOpen();
  const [selected, setSelected] = useState(null);

  const {
    data,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    filters,
    setFilters,
    triggerRefetch,
  } = useRequest({
    url: CERTIFICATES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
  });

  const onView = (row) => {
    setSelected(row);
    viewDialog.open();
  };

  const columns = useMemo(
    () => buildCertificateColumns({ txt, lng, onView }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng],
  );

  if (!canList) return null;

  return (
    <>
      <style>{PRINT_CSS}</style>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 3 }}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {txt.pageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {txt.pageDescription}
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<MdAdd />} onClick={createDialog.open}>
            {txt.create}
          </Button>
        )}
      </Stack>

      <DataTable
        initialRows={data || []}
        columns={columns}
        total={total}
        page={page}
        rowsPerPage={pageSize}
        setPage={setPage}
        setRowsPerPage={setPageSize}
        loading={isLoading}
        filters={filters}
        setFilters={setFilters}
      />

      {/* View + print */}
      <FormDialog
        open={viewDialog.isOpen}
        onClose={viewDialog.close}
        title={txt.pageTitle}
        maxWidth="md"
        showCloseIcon
        actions={
          <Button
            variant="contained"
            startIcon={<MdPrint />}
            onClick={() => window.print()}
          >
            {txt.print}
          </Button>
        }
      >
        <CertificateCard certificate={selected} printable />
      </FormDialog>

      {/* Admin create */}
      {canCreate && (
        <CreateCertificateDialog
          open={createDialog.isOpen}
          onClose={createDialog.close}
          onSuccess={triggerRefetch}
        />
      )}
    </>
  );
}
