"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdDelete } from "react-icons/md";
import { FormDialog, useConfirm } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useTranslation } from "../../../i18n/client.js";

/**
 * GameAssignDialog — assign/unassign students for ONE game.
 *
 * Mounts per-game (parent renders keyed by game.id and only when a game is
 * selected) so the request hooks bind to the right `games/${game.id}/...` urls.
 */
export default function GameAssignDialog({ open, onClose, game, txt }) {
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const gameId = game?.id;

  const [selectedIds, setSelectedIds] = useState([]);
  const [dueAt, setDueAt] = useState("");

  // Students (role STUDENT) — fetched on open.
  const studentsReq = useRequest({
    url: "users",
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, role: "STUDENT" },
  });

  // Current assignments for this game — fetched on open + after mutations.
  const assignmentsReq = useRequest({
    url: `games/${gameId}/assignments`,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });

  const mut = useMultiRequest({
    url: `games/${gameId}`,
    onSuccess: () => {
      assignmentsReq.fetchData();
    },
  });

  // Reset the form the moment the dialog opens — done during render via the
  // "store previous prop" pattern (React-recommended) so we don't call setState
  // inside an effect (which triggers cascading renders / the lint rule).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedIds([]);
      setDueAt("");
    }
  }

  // Fetch students + current assignments whenever the dialog opens.
  useEffect(() => {
    if (open && gameId) {
      studentsReq.fetchData();
      assignmentsReq.fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gameId]);

  const students = (studentsReq.data || []).filter((u) => u.role === "STUDENT");
  const assignments = Array.isArray(assignmentsReq.data)
    ? assignmentsReq.data
    : [];

  const assignedIds = useMemo(
    () => new Set(assignments.map((a) => a.studentId)),
    [assignments],
  );
  const unassigned = useMemo(
    () => students.filter((s) => !assignedIds.has(s.id)),
    [students, assignedIds],
  );

  function toggle(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function assign() {
    if (selectedIds.length === 0) return;
    await mut.postRequest("assign", {
      studentIds: selectedIds.map((id) => Number(id)),
      dueAt: dueAt || undefined,
    });
    setSelectedIds([]);
    setDueAt("");
  }

  async function unassign(studentId) {
    const ok = await confirm({ title: txt.unassignConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(`assignments/${studentId}`);
  }

  const loading =
    studentsReq.isLoading ||
    assignmentsReq.isLoading ||
    mut.isPostRequestLoading ||
    mut.isDeleteRequestLoading;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`${txt.assignTitle} — ${lng === "en" ? game?.titleEn : game?.titleAr}`}
      maxWidth="sm"
      actions={null}
      showCloseIcon
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {/* Currently assigned */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            {txt.assignedStudents}
          </Typography>
          {assignmentsReq.isLoading ? (
            <Stack alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={22} />
            </Stack>
          ) : assignments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {txt.noAssigned}
            </Typography>
          ) : (
            <List dense disablePadding>
              {assignments.map((a) => (
                <ListItem
                  key={a.id ?? a.studentId}
                  disableGutters
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      size="small"
                      aria-label={txt.unassign}
                      disabled={loading}
                      onClick={() => unassign(a.studentId)}
                    >
                      <MdDelete />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={a.student?.name || `#${a.studentId}`}
                    secondary={a.student?.nickname || undefined}
                  />
                  {a.status && (
                    <Chip
                      size="small"
                      label={a.status}
                      sx={{ mr: 6 }}
                      variant="outlined"
                    />
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider />

        {/* Add students */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            {txt.addStudents}
          </Typography>
          {studentsReq.isLoading ? (
            <Stack alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={22} />
            </Stack>
          ) : unassigned.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {txt.noStudentsLeft}
            </Typography>
          ) : (
            <List
              dense
              disablePadding
              sx={{ maxHeight: 220, overflowY: "auto" }}
            >
              {unassigned.map((s) => (
                <ListItem key={s.id} disableGutters disablePadding>
                  <ListItemButton onClick={() => toggle(s.id)} dense>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge="start"
                        checked={selectedIds.includes(s.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={s.name}
                      secondary={s.nickname || undefined}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <TextField
          type="date"
          label={txt.dueAt}
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

        <Button
          variant="contained"
          onClick={assign}
          disabled={loading || selectedIds.length === 0}
          startIcon={
            mut.isPostRequestLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {txt.assignButton}
          {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
        </Button>
      </Stack>
    </FormDialog>
  );
}
