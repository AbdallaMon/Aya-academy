"use client";

import { useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { MdAdd, MdClose, MdPrint, MdDownload, MdPictureAsPdf } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { DataTable } from "../../../shared/components/index.js";
import { CERTIFICATES_URL } from "../config/constant.js";
import { buildCertificateColumns } from "../config/certificatesColumns.js";
import { useCertificatesText } from "../config/certificatesText.js";
import CertificateCard from "../components/CertificateCard.jsx";
import CreateCertificateDialog from "../components/CreateCertificateDialog.jsx";

// Resolve a certificate's page orientation from its (template + own) themeJson.
function parseTheme(themeJson) {
  if (!themeJson) return {};
  if (typeof themeJson === "object") return themeJson;
  try {
    return JSON.parse(themeJson) || {};
  } catch {
    return {};
  }
}
function orientationOf(cert) {
  const theme = {
    ...parseTheme(cert?.template?.themeJson),
    ...parseTheme(cert?.themeJson),
  };
  return theme.orientation === "portrait" ? "portrait" : "landscape";
}

export default function CertificatesPage() {
  const txt = useCertificatesText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.CERTIFICATE.LIST);
  const canCreate = hasPermission(PERMISSIONS.CERTIFICATE.CREATE);

  const viewDialog = useOpen();
  const createDialog = useOpen();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(null); // "print" | "pdf" | "png" | null
  const certViewRef = useRef(null);

  // Capture the rendered certificate node and run a print/download. Rasterizing
  // the live node (html-to-image) is WYSIWYG and orientation-correct, so it
  // sidesteps @media-print reflow on landscape certificates.
  const runExport = async (kind) => {
    const node = certViewRef.current?.querySelector("[data-certificate-root]");
    if (!node || busy) return;
    setBusy(kind);
    try {
      const lib = await import("../lib/exportCertificate.js");
      const orientation = orientationOf(selected);
      const base = `certificate-${selected?.id ?? ""}`;
      if (kind === "print") {
        await lib.printCertificateNode(node, { orientation, title: txt.pageTitle });
      } else if (kind === "pdf") {
        await lib.downloadCertificatePdf(node, `${base}.pdf`, { orientation });
      } else {
        await lib.downloadCertificatePng(node, `${base}.png`);
      }
    } catch {
      /* capture/popup failed — leave the drawer open to retry */
    } finally {
      setBusy(null);
    }
  };

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

      {/* View + print — full-screen drawer for a roomy certificate preview */}
      <Drawer
        anchor="bottom"
        open={viewDialog.isOpen}
        onClose={viewDialog.close}
        slotProps={{ paper: { sx: { height: "100%" } } }}
      >
        <Stack sx={{ height: "100%" }}>
          {/* Header bar: title · print · close */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{ px: { xs: 2, md: 3 }, py: 1.5, flexShrink: 0 }}
          >
            <Typography variant="h5" fontWeight={700}>
              {txt.pageTitle}
            </Typography>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<MdDownload />}
                disabled={!!busy}
                onClick={() => runExport("png")}
              >
                {txt.downloadImage}
              </Button>
              <Button
                variant="outlined"
                startIcon={<MdPictureAsPdf />}
                disabled={!!busy}
                onClick={() => runExport("pdf")}
              >
                {txt.downloadPdf}
              </Button>
              <Button
                variant="contained"
                startIcon={<MdPrint />}
                disabled={!!busy}
                onClick={() => runExport("print")}
              >
                {txt.print}
              </Button>
              <IconButton onClick={viewDialog.close} aria-label={txt.close}>
                <MdClose />
              </IconButton>
            </Stack>
          </Stack>
          <Divider />

          {/* Scrollable, centered certificate */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              p: { xs: 2, md: 4 },
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              bgcolor: "action.hover",
            }}
          >
            <Box ref={certViewRef} sx={{ width: "100%", maxWidth: 1100 }}>
              {selected && <CertificateCard certificate={selected} printable />}
            </Box>
          </Box>
        </Stack>
      </Drawer>

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
