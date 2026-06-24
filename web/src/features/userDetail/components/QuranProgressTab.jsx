"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdEditNote } from "react-icons/md";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  QURAN_JUZ_URL,
  QURAN_PROGRESS_URL,
} from "../../quran/config/constant.js";

// ── Segment status constants ───────────────────────────────────────────────
const STATUS_NULL = "null"; // represents null (not started)
const STATUS_IN_PROGRESS = "IN_PROGRESS";
const STATUS_COMPLETED = "COMPLETED";

/**
 * QuranProgressTab — admin view for a student's Quran memorisation progress.
 *
 * Shows overall percent + per-juz summary cards. A "تحديث تقدم القرآن" button
 * opens an editor dialog: pick a juz, update each segment's status and
 * (when in-progress) the current ayah, then PUT to the backend.
 *
 * Props:
 *   studentId  — number | string, the viewed student's ID
 *   txt        — the useUserDetailText() object (ar/en)
 *   canManage  — boolean from hasPermission(QURAN_PERMISSIONS.PROGRESS_MANAGE)
 */
export default function QuranProgressTab({ studentId, txt, canManage }) {
  const { lng } = useTranslation();

  // ── Load student progress ──────────────────────────────────────────────
  const {
    data: progress,
    isLoading: progressLoading,
    triggerRefetch: refetchProgress,
  } = useRequest({
    url: `${QURAN_PROGRESS_URL}/${studentId}`,
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  // ── Editor dialog state ────────────────────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false);

  function openEditor() {
    setEditorOpen(true);
  }
  function closeEditor() {
    setEditorOpen(false);
  }

  return (
    <Box>
      {/* ── Action bar ─────────────────────────────────────────────────── */}
      {canManage && (
        <Stack direction="row" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<MdEditNote />}
            onClick={openEditor}
          >
            {txt.quranUpdateProgress}
          </Button>
        </Stack>
      )}

      {/* ── Overall summary ────────────────────────────────────────────── */}
      {progressLoading && !progress ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <ProgressSummary progress={progress} txt={txt} lng={lng} />
      )}

      {/* ── Editor dialog ──────────────────────────────────────────────── */}
      <QuranEditorDialog
        open={editorOpen}
        onClose={closeEditor}
        studentId={studentId}
        progress={progress}
        txt={txt}
        lng={lng}
        onSuccess={() => {
          refetchProgress();
        }}
      />
    </Box>
  );
}

// ── Progress summary (overall + per-juz cards) ────────────────────────────

function ProgressSummary({ progress, txt, lng }) {
  if (!progress) {
    return (
      <Typography variant="body2" color="text.secondary">
        {txt.quranNoProgress}
      </Typography>
    );
  }

  const overall = progress.overall;
  const juzList = progress.juz || [];

  return (
    <Box>
      {/* Overall bar */}
      {overall != null && (
        <Card variant="outlined" sx={{ mb: 2.5 }}>
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {txt.quranOverall}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {overall.completed ?? 0} / {overall.total ?? 0}{" "}
                {txt.quranSegments}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={overall.percent ?? 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {(overall.percent ?? 0).toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Per-juz cards */}
      <Grid container spacing={2}>
        {juzList.map((juz) => (
          <Grid key={juz.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <JuzCard juz={juz} txt={txt} lng={lng} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function JuzCard({ juz, txt, lng }) {
  const juzLabel =
    lng === "en" ? juz.nameEn || juz.nameAr : juz.nameAr || juz.nameEn;

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 0.75 }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            {juzLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {juz.number}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={juz.percent ?? 0}
          color={juz.percent >= 100 ? "success" : "primary"}
          sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
        />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {juz.completed ?? 0} / {juz.total ?? 0} {txt.quranSegments}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(juz.percent ?? 0).toFixed(0)}%
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Editor dialog ─────────────────────────────────────────────────────────

function QuranEditorDialog({
  open,
  onClose,
  studentId,
  progress,
  txt,
  lng,
  onSuccess,
}) {
  // ── Load all juz definitions ───────────────────────────────────────────
  const {
    data: allJuz,
    isLoading: juzLoading,
    fetchData: fetchJuz,
  } = useRequest({
    url: QURAN_JUZ_URL,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });

  // ── Selected juz ──────────────────────────────────────────────────────
  const [selectedJuzId, setSelectedJuzId] = useState("");

  // ── Per-segment edits: { [segmentId]: { status, currentAyah } } ───────
  const [edits, setEdits] = useState({});

  // Load juz list when dialog opens; reset selection.
  useEffect(() => {
    if (open) {
      setSelectedJuzId("");
      setEdits({});
      fetchJuz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // When juz selection changes, seed edits from student's current progress
  const handleJuzChange = useCallback(
    (juzId) => {
      setSelectedJuzId(juzId);
      if (!juzId) {
        setEdits({});
        return;
      }
      // Find this juz's progress snapshot (if any)
      const juzProgress = progress?.juz?.find((j) => String(j.id) === String(juzId));
      // Find segment definitions from the allJuz response
      const juzDef = (allJuz || []).find((j) => String(j.id) === String(juzId));
      const segments = juzDef?.segments || [];

      const seed = {};
      segments.forEach((seg) => {
        const progSeg = juzProgress?.segments?.find(
          (ps) => String(ps.id) === String(seg.id),
        );
        seed[seg.id] = {
          status: progSeg?.status ?? STATUS_NULL,
          currentAyah: progSeg?.currentAyah ?? "",
        };
      });
      setEdits(seed);
    },
    [allJuz, progress],
  );

  // ── PUT mutation ──────────────────────────────────────────────────────
  const saveReq = useRequest({
    url: QURAN_PROGRESS_URL,
    method: "put",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
  });

  function buildItems() {
    return Object.entries(edits).map(([segmentId, val]) => {
      const item = {
        segmentId: Number(segmentId),
        status: val.status === STATUS_NULL ? null : val.status,
      };
      if (val.status === STATUS_IN_PROGRESS && val.currentAyah !== "") {
        item.currentAyah = Number(val.currentAyah) || null;
      }
      return item;
    });
  }

  function handleSave() {
    if (!selectedJuzId) return;
    const items = buildItems();
    // slug: `${studentId}/juz/${juzId}` → url becomes QURAN_PROGRESS_URL/studentId/juz/juzId
    saveReq.fetchData(`${studentId}/juz/${selectedJuzId}`, { items });
  }

  // Derive the selected juz's segment definitions
  const selectedJuzDef = (allJuz || []).find(
    (j) => String(j.id) === String(selectedJuzId),
  );
  const segments = selectedJuzDef?.segments || [];

  function updateSegment(segmentId, field, value) {
    setEdits((prev) => ({
      ...prev,
      [segmentId]: { ...prev[segmentId], [field]: value },
    }));
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.quranEditorTitle}
      maxWidth="md"
      loading={saveReq.isLoading}
      submitText={txt.save}
      cancelText={txt.close}
      onSubmit={handleSave}
    >
      <Stack spacing={3} sx={{ pt: 1 }}>
        {/* Juz selector */}
        <FormControl fullWidth>
          <InputLabel id="juz-select-label">{txt.quranSelectJuz}</InputLabel>
          <Select
            labelId="juz-select-label"
            value={selectedJuzId}
            label={txt.quranSelectJuz}
            onChange={(e) => handleJuzChange(e.target.value)}
            disabled={juzLoading}
          >
            {juzLoading && (
              <MenuItem value="" disabled>
                <CircularProgress size={16} />
              </MenuItem>
            )}
            {(allJuz || []).map((j) => (
              <MenuItem key={j.id} value={j.id}>
                {j.number}. {lng === "en" ? j.nameEn || j.nameAr : j.nameAr || j.nameEn}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{txt.quranSelectJuzHint}</FormHelperText>
        </FormControl>

        {/* Segment checklist */}
        {selectedJuzId && segments.length > 0 && (
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              {txt.quranSegments} ({segments.length})
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={2}>
              {segments
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((seg) => {
                  const segEdit = edits[seg.id] || {
                    status: STATUS_NULL,
                    currentAyah: "",
                  };
                  const surahLabel =
                    lng === "en"
                      ? seg.surah?.nameEn || seg.surah?.nameAr
                      : seg.surah?.nameAr || seg.surah?.nameEn;
                  const segLabel = `${surahLabel} (${txt.quranAyah} ${seg.fromAyah}–${seg.toAyah})`;

                  return (
                    <Card
                      key={seg.id}
                      variant="outlined"
                      sx={{ p: 1.5, bgcolor: "background.default" }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        {/* Label */}
                        <Grid size={{ xs: 12, sm: 5 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {segLabel}
                          </Typography>
                        </Grid>

                        {/* Status tri-state */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel id={`seg-status-${seg.id}`}>
                              {txt.quranStatus}
                            </InputLabel>
                            <Select
                              labelId={`seg-status-${seg.id}`}
                              label={txt.quranStatus}
                              value={segEdit.status}
                              onChange={(e) =>
                                updateSegment(seg.id, "status", e.target.value)
                              }
                            >
                              <MenuItem value={STATUS_NULL}>
                                {txt.quranNotStarted}
                              </MenuItem>
                              <MenuItem value={STATUS_IN_PROGRESS}>
                                {txt.quranInProgress}
                              </MenuItem>
                              <MenuItem value={STATUS_COMPLETED}>
                                {txt.quranCompleted}
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Current ayah — only enabled when IN_PROGRESS */}
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label={txt.quranCurrentAyah}
                            value={segEdit.currentAyah}
                            disabled={segEdit.status !== STATUS_IN_PROGRESS}
                            onChange={(e) =>
                              updateSegment(seg.id, "currentAyah", e.target.value)
                            }
                            inputProps={{
                              min: seg.fromAyah,
                              max: seg.toAyah,
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
            </Stack>
          </Box>
        )}

        {/* Placeholder when no juz selected yet */}
        {!selectedJuzId && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
            {txt.quranSelectJuzHint}
          </Typography>
        )}
      </Stack>
    </FormDialog>
  );
}
