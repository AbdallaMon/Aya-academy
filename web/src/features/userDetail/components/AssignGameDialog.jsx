"use client";

// AssignGameDialog — assign an existing game to ONE preselected student. Offers
// only active games the student doesn't already have, then POST games/:id/assign
// with { studentIds:[studentId], dueAt? }.

import { useEffect, useMemo, useState } from "react";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { GAMES_URL } from "../config/constant.js";

export default function AssignGameDialog({
  open,
  onClose,
  studentId,
  studentName,
  assignedGameIds = [],
  txt,
  onSuccess,
}) {
  const { lng } = useTranslation();
  const [gameId, setGameId] = useState("");
  const [dueAt, setDueAt] = useState("");

  // Reset the form when the dialog opens — done during render (store-previous
  // prop) so we never call setState inside an effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setGameId("");
      setDueAt("");
    }
  }

  const gamesReq = useRequest({
    url: GAMES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100 },
  });

  const assignReq = useRequest({
    url: GAMES_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
  });

  useEffect(() => {
    if (open) gamesReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Offer only active games this student doesn't already have.
  const games = useMemo(() => {
    const list = Array.isArray(gamesReq.data)
      ? gamesReq.data
      : gamesReq.data?.items || [];
    const taken = new Set(assignedGameIds);
    return list.filter((g) => g.isActive && !taken.has(g.id));
  }, [gamesReq.data, assignedGameIds]);

  function submit() {
    if (!gameId) return;
    assignReq.fetchData(`${gameId}/assign`, {
      studentIds: [Number(studentId)],
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.assignGame}
      subtitle={studentName}
      maxWidth="xs"
      loading={assignReq.isLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {games.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {txt.noGameToAssign}
          </Typography>
        ) : (
          <>
            <TextField
              select
              label={txt.selectGame}
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              fullWidth
            >
              {games.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {lng === "en" ? g.titleEn : g.titleAr}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              label={txt.dueAt}
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </>
        )}
      </Stack>
    </FormDialog>
  );
}
