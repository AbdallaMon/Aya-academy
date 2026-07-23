"use client";

import { useState } from "react";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import {
  AsyncUserAutocomplete,
  FormDialog,
} from "../../../shared/components/index.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { USERS_URL, PARENT_RELATIONS_LIST } from "../config/constant.js";

/**
 * Admin-only: link an existing PARENT account to a STUDENT.
 * POST users/:studentId/parents/:parentId  { relation }
 */
export default function LinkParentDialog({ open, onClose, student, txt, onSuccess }) {
  const [parentId, setParentId] = useState("");
  const [selectedParent, setSelectedParent] = useState(null);
  const [relation, setRelation] = useState("GUARDIAN");
  const [previousOpen, setPreviousOpen] = useState(open);

  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open) {
      setParentId("");
      setSelectedParent(null);
      setRelation("GUARDIAN");
    }
  }

  const mut = useMultiRequest({
    url: USERS_URL,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

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

        <AsyncUserAutocomplete
          role="PARENT"
          label={txt.selectParent}
          value={selectedParent}
          onChange={(parent) => {
            setSelectedParent(parent);
            setParentId(parent ? String(parent.id) : "");
          }}
          required
        />

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
