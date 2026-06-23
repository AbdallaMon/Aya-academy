"use client";

import { useEffect, useState } from "react";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { USERS_URL, PARENT_RELATIONS_LIST } from "../config/constant.js";

/**
 * Admin-only: link an existing PARENT account to a STUDENT.
 * POST users/:studentId/parents/:parentId  { relation }
 */
export default function LinkParentDialog({ open, onClose, student, txt, onSuccess }) {
  const [parentId, setParentId] = useState("");
  const [relation, setRelation] = useState("GUARDIAN");

  const parentsReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, role: "PARENT" },
  });

  const mut = useMultiRequest({
    url: USERS_URL,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  useEffect(() => {
    if (open) {
      parentsReq.fetchData();
      setParentId("");
      setRelation("GUARDIAN");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parents = (parentsReq.data || []).filter((u) => u.role === "PARENT");

  const relationLabels = {
    FATHER: txt.father,
    MOTHER: txt.mother,
    GUARDIAN: txt.guardian,
    OTHER: txt.other,
  };

  async function submit() {
    if (!student?.id || !parentId) return;
    await mut.postRequest(`${student.id}/parents/${parentId}`, { relation });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.linkParentTitle}
      subtitle={student?.name}
      maxWidth="xs"
      loading={mut.isPostRequestLoading}
      submitText={txt.link}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {txt.linkHint}
        </Typography>

        <TextField
          select
          label={txt.selectParent}
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          fullWidth
          required
          helperText={parents.length === 0 ? txt.noParents : undefined}
        >
          {parents.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} {p.email ? `— ${p.email}` : ""}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label={txt.relation}
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          fullWidth
        >
          {PARENT_RELATIONS_LIST.map((r) => (
            <MenuItem key={r} value={r}>
              {relationLabels[r]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </FormDialog>
  );
}
