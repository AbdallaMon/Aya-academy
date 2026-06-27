"use client";

// ADMIN / PARENT read-only details view for a single quiz.
//
// Meta (title, questions, pass %, gift) comes from GET /quizzes/:id. The per-child
// results (status / score / certificate) are NOT on that endpoint — but the LIST
// row already carries `attempts` (each with student + certificate + score/passed)
// plus participants/completed counts for admin/parent. So we fetch GET /quizzes
// with a high limit and find this quiz by id to read its `attempts`.

import { useMemo } from "react";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { MdCardGiftcard } from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { LoadingOverlay } from "../../../shared/components/index.js";
import { QUIZZES_URL } from "../../quizzes/config/constant.js";
import CertificateDownloadButton from "../../certificates/components/CertificateDownloadButton.jsx";
import { useQuizTakeText } from "../config/quizTakeText.js";

export default function QuizDetailsAdmin({ quizId, quiz, metaLoading }) {
  const txt = useQuizTakeText();

  // Pull the list once (high limit) to find this quiz's per-child attempts.
  const { data: listRows, isLoading: listLoading } = useRequest({
    url: QUIZZES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: true,
    syncToUrl: false,
    initialParams: { limit: 200 },
  });

  const row = useMemo(
    () => (Array.isArray(listRows) ? listRows.find((r) => String(r.id) === String(quizId)) : null),
    [listRows, quizId],
  );

  // One row per participating child: latest attempt (if any) + its certificate.
  const childRows = useMemo(() => {
    const attempts = row?.attempts || [];
    const byStudent = new Map();
    // attempts are latest-first → first seen per student is the latest.
    attempts.forEach((a) => {
      const sid = a.student?.id ?? a.studentId;
      if (sid == null) return;
      if (!byStudent.has(sid)) {
        byStudent.set(sid, {
          studentId: sid,
          name: a.student?.nickname || a.student?.name || txt.dash,
          score: a,
          certificateId: a.certificate?.id ?? null,
        });
      }
    });
    return Array.from(byStudent.values());
  }, [row, txt.dash]);

  const participantsCount = row?.participantsCount ?? quiz?.participants?.length ?? 0;
  const completedCount = row?.completedCount ?? childRows.length;

  const questionsCount = quiz?.items?.length ?? row?._count?.items ?? 0;
  const isLoading = metaLoading || listLoading;

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay isLoading={isLoading} type="box" />

      {/* Meta */}
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={900}>
          {quiz?.title || txt.detailsTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {txt.detailsHint}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        <Chip label={`${txt.questions}: ${questionsCount}`} />
        {quiz?.passThreshold != null && (
          <Chip variant="outlined" label={`${txt.passThreshold}: ${quiz.passThreshold}%`} />
        )}
        {quiz?.giftName && (
          <Chip icon={<MdCardGiftcard />} color="secondary" variant="outlined" label={quiz.giftName} />
        )}
        <Chip
          color="primary"
          variant="outlined"
          label={`${txt.completedSummary} ${completedCount} ${txt.outOf} ${participantsCount} ${txt.childrenCount}`}
        />
      </Stack>

      {/* Per-child results */}
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
        {txt.childrenResults}
      </Typography>

      {childRows.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">{txt.noParticipants}</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{txt.child}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{txt.statusCol}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{txt.scoreCol}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  {txt.certificateCol}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {childRows.map((c) => {
                const s = c.score;
                const attempted = !!s;
                const passed = !!s?.passed;
                return (
                  <TableRow hover key={c.studentId}>
                    <TableCell>
                      <Typography fontWeight={700}>{c.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={passed ? "success" : attempted ? "warning" : "default"}
                        label={
                          passed ? txt.passedChip : attempted ? txt.done : txt.notYet
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {attempted
                        ? `${s.correctCount ?? 0} / ${s.totalQuestions ?? 0}`
                        : txt.dash}
                    </TableCell>
                    <TableCell align="center">
                      {c.certificateId ? (
                        <CertificateDownloadButton certificateId={c.certificateId} />
                      ) : (
                        txt.dash
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
