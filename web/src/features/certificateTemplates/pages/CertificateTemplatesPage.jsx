"use client";

import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { PERMISSIONS } from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  DataTable,
  PageHeader,
  useConfirm,
} from "../../../shared/components/index.js";
import { CERTIFICATE_TEMPLATES_URL } from "../config/constant.js";
import { useCertificateTemplatesText } from "../config/certificateTemplatesText.js";
import { buildCertificateTemplatesColumns } from "../config/certificateTemplatesColumns.js";
import { buildCertificateTemplatesFilters } from "../config/certificateTemplatesFilters.js";
import TemplateFormDialog from "../components/TemplateFormDialog.jsx";

/** Admin management surface for certificate templates. */
export default function CertificateTemplatesPage() {
  const txt = useCertificateTemplatesText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();

  // A single permission governs the whole templates surface.
  const canManage = hasPermission(PERMISSIONS.CERTIFICATE.MANAGE_TEMPLATES);

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
    url: CERTIFICATE_TEMPLATES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canManage,
  });

  const form = useOpen();
  const [selected, setSelected] = useState(null);

  const mut = useMultiRequest({
    url: CERTIFICATE_TEMPLATES_URL,
    onSuccess: () => triggerRefetch(),
  });

  function onCreate() {
    setSelected(null);
    form.open();
  }
  function onEdit(row) {
    setSelected(row);
    form.open();
  }
  async function onDelete(row) {
    const ok = await confirm({ title: txt.deleteConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(String(row.id));
  }
  // Make a GAME/EXAM template the active ("in-use") one (deactivates its peers).
  async function onActivate(row) {
    await mut.postRequest(`${row.id}/activate`, {});
  }

  async function submit(payload, isEditing) {
    if (isEditing) await mut.patchRequest(String(selected.id), payload);
    else await mut.postRequest(null, payload);
    form.close();
  }

  const columns = useMemo(
    () =>
      buildCertificateTemplatesColumns({
        txt,
        lng,
        actions: { onEdit, onDelete, onActivate },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng],
  );

  const filterConfig = useMemo(
    () => buildCertificateTemplatesFilters({ txt }),
    [txt],
  );

  if (!canManage) return null;

  return (
    <Box>
      <PageHeader
        title={txt.pageTitle}
        description={txt.pageDescription}
        createLabel={txt.create}
        onCreate={onCreate}
      />

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
        filterConfig={filterConfig}
        noContainer
      />

      <TemplateFormDialog
        open={form.isOpen}
        onClose={form.close}
        template={selected}
        txt={txt}
        loading={mut.isPostRequestLoading || mut.isPatchRequestLoading}
        onSubmit={submit}
      />
    </Box>
  );
}
