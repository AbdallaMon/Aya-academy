"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdDelete } from "react-icons/md";
import {
  AsyncUserAutocomplete,
  FormDialog,
  useConfirm,
} from "../../../shared/components/index.js";
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

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [dueAt, setDueAt] = useState("");

  // Students (role STUDENT) — fetched on open.
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
      setSelectedStudents([]);
      setDueAt("");
    }
  }

  // Fetch students + current assignments whenever the dialog opens.
  useEffect(() => {
    if (open && gameId) {
      assignmentsReq.fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gameId]);

  const assignments = useMemo(
    () => (Array.isArray(assignmentsReq.data) ? assignmentsReq.data : []),
    [assignmentsReq.data],
  );

  const assignedIds = useMemo(
    () => new Set(assignments.map((a) => a.studentId)),
    [assignments],
  );
  async function assign() {
    if (selectedStudents.length === 0) return;
    await mut.postRequest("assign", {
      studentIds: selectedStudents.map((student) => Number(student.id)),
      dueAt: dueAt || undefined,
    });
    setSelectedStudents([]);
    setDueAt("");
  }

  async function unassign(studentId) {
    const ok = await confirm({ title: txt.unassignConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(`assignments/${studentId}`);
  }

  const loading =
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
          <AsyncUserAutocomplete
            multiple
            role="STUDENT"
            label={txt.addStudents}
            value={selectedStudents}
            onChange={setSelectedStudents}
            excludeIds={[...assignedIds]}
          />
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
          disabled={loading || selectedStudents.length === 0}
          startIcon={
            mut.isPostRequestLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {txt.assignButton}
          {selectedStudents.length > 0 ? ` (${selectedStudents.length})` : ""}
        </Button>
      </Stack>
    </FormDialog>
  );
}
