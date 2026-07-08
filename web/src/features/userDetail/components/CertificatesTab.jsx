"use client";

// CertificatesTab — admin view of ONE student's certificates: the SAME table as
// the certificates page (filtered to this student) + a "grant certificate"
// action (student preselected) + a roomy preview drawer. Reuses the certificates
// feature's columns, card and create dialog so it stays in sync with that page.

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { MdAdd, MdClose } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { DataTable } from "../../../shared/components/index.js";
import { CERTIFICATES_URL } from "../config/constant.js";
import { buildCertificatesTabColumns } from "../config/certificatesTabColumns.js";
import { useCertificatesText } from "../../certificates/config/certificatesText.js";
import CertificateCard from "../../certificates/components/CertificateCard.jsx";
import CreateCertificateDialog from "../../certificates/components/CreateCertificateDialog.jsx";

export default function CertificatesTab({ studentId, studentName, txt, canCreate }) {
  const certTxt = useCertificatesText();
  const { lng } = useTranslation();
  const createDialog = useOpen();
  const viewDialog = useOpen();
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
    autoFetch: true,
    syncToUrl: false,
    initialParams: { studentId: Number(studentId), limit: 20 },
  });

  const onView = (row) => {
    setSelected(row);
    viewDialog.open();
  };

  const columns = useMemo(
    () => buildCertificatesTabColumns({ txt: certTxt, lng, onView }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [certTxt, lng],
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" fontWeight={800}>
            {txt.certificatesTitle}
          </Typography>
          {canCreate && (
            <Button
              variant="contained"
              size="small"
              startIcon={<MdAdd />}
              onClick={createDialog.open}
            >
              {txt.grantCertificate}
            </Button>
          )}
        </Stack>

        {(data || []).length === 0 && !isLoading ? (
          <Typography variant="body2" color="text.secondary">
            {txt.noCertificates}
          </Typography>
        ) : (
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
            noContainer
          />
        )}
      </CardContent>

      {/* Roomy preview drawer (read-only) */}
      <Drawer
        anchor="bottom"
        open={viewDialog.isOpen}
        onClose={viewDialog.close}
        slotProps={{ paper: { sx: { height: "100%" } } }}
      >
        <Stack sx={{ height: "100%" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: { xs: 2, md: 3 }, py: 1.5 }}
          >
            <Typography variant="h5" fontWeight={700}>
              {certTxt.pageTitle}
            </Typography>
            <IconButton onClick={viewDialog.close} aria-label={txt.close}>
              <MdClose />
            </IconButton>
          </Stack>
          <Divider />
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
            <Box sx={{ width: "100%", maxWidth: 1100 }}>
              {selected && <CertificateCard certificate={selected} printable />}
            </Box>
          </Box>
        </Stack>
      </Drawer>

      {canCreate && (
        <CreateCertificateDialog
          open={createDialog.isOpen}
          onClose={createDialog.close}
          onSuccess={triggerRefetch}
          lockedStudentId={Number(studentId)}
          lockedStudentName={studentName}
        />
      )}
    </Card>
  );
}
