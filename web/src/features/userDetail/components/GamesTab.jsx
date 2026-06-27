"use client";

// GamesTab — admin view of ONE student's assigned games: list + assign + remove.
// Self-contained: fetches games/student/:id/assignments and owns its assign
// dialog + refetch. Gated by GAME.ASSIGN (canAssign).

import {
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { MdAdd } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useConfirm } from "../../../shared/components/index.js";
import {
  GAMES_URL,
  ASSIGNMENT_STATUS_COLOR,
  formatDate,
} from "../config/constant.js";
import AssignGameDialog from "./AssignGameDialog.jsx";

export default function GamesTab({ studentId, studentName, txt, canAssign }) {
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const assignDialog = useOpen();

  const { data, isLoading, triggerRefetch } = useRequest({
    url: `${GAMES_URL}/student/${studentId}/assignments`,
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  const assignments = Array.isArray(data) ? data : [];
  const assignedGameIds = assignments.map((a) => a.gameId);

  const removeReq = useRequest({
    url: GAMES_URL,
    method: "delete",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => triggerRefetch(),
  });

  async function onRemove(a) {
    const ok = await confirm({ title: txt.removeGameConfirm, intent: "danger" });
    if (!ok) return;
    removeReq.fetchData(`${a.gameId}/assignments/${studentId}`);
  }

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
            {txt.assignedGamesTitle}
          </Typography>
          {canAssign && (
            <Button
              variant="contained"
              size="small"
              startIcon={<MdAdd />}
              onClick={assignDialog.open}
            >
              {txt.assignGame}
            </Button>
          )}
        </Stack>

        {assignments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isLoading ? "…" : txt.noAssignedGamesAdmin}
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{txt.game}</TableCell>
                <TableCell>{txt.status}</TableCell>
                <TableCell>{txt.dueAt}</TableCell>
                {canAssign && <TableCell align="right" />}
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {a.game
                      ? lng === "en"
                        ? a.game.titleEn
                        : a.game.titleAr
                      : `#${a.gameId}`}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={ASSIGNMENT_STATUS_COLOR[a.status] || "default"}
                      label={txt[`assignment${a.status}`] || a.status}
                    />
                  </TableCell>
                  <TableCell>{a.dueAt ? formatDate(a.dueAt, lng) : "—"}</TableCell>
                  {canAssign && (
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        onClick={() => onRemove(a)}
                        disabled={removeReq.isLoading}
                      >
                        {txt.removeGame}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AssignGameDialog
        open={assignDialog.isOpen}
        onClose={assignDialog.close}
        studentId={studentId}
        studentName={studentName}
        assignedGameIds={assignedGameIds}
        txt={txt}
        onSuccess={triggerRefetch}
      />
    </Card>
  );
}
