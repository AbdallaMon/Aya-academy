"use client";

/**
 * QuranProgressView — read-only Quran memorisation progress widget.
 *
 * Props:
 *   studentId  — number | string  (required)
 *   compact    — boolean (default false)
 *               true  → only overall bar + current surah/ayah line
 *               false → overall bar + touched juz cards + upcoming lesson plan
 *
 * Gating: caller must ensure QURAN_PERMISSIONS.PROGRESS_VIEW before rendering.
 * This component does NOT re-check the permission itself so it can be composed
 * freely; the parent wrapper is the gate.
 */

import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { QURAN_PROGRESS_URL } from "../config/constant.js";
import { SESSIONS_URL } from "../../sessions/config/constant.js";
import { useQuranProgressText } from "../config/quranProgressText.js";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Pick the localized name from a record that has nameAr / nameEn. */
function localName(record, lng) {
  if (!record) return "";
  return lng === "en"
    ? record.nameEn || record.nameAr || ""
    : record.nameAr || record.nameEn || "";
}

/** Status → color token for MUI Chip */
function segmentColor(status) {
  if (status === "COMPLETED") return "success";
  if (status === "IN_PROGRESS") return "warning";
  return "default";
}

// ── sub-components ────────────────────────────────────────────────────────────

function OverallBar({ overall, txt }) {
  const percent = overall?.percent ?? 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {txt.overallTitle}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {overall?.completed ?? 0} / {overall?.total ?? 0} {txt.segments}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={percent >= 100 ? "success" : "primary"}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
        {percent.toFixed(1)}%
      </Typography>
    </Box>
  );
}

function CurrentLine({ current, lng, txt }) {
  if (!current) return null;
  const surahName = localName(current.surah, lng);
  return (
    <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ mt: 0.5 }}>
      {txt.current}: {surahName} — {txt.ayah} {current.currentAyah}
    </Typography>
  );
}

function JuzCard({ juz, lng, txt }) {
  const juzLabel = localName(juz, lng);
  const segments = (juz.segments || []).slice().sort((a, b) => a.order - b.order);

  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: "12px !important" }}>
        {/* Juz header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
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
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {juz.completed ?? 0} / {juz.total ?? 0} {txt.segments}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(juz.percent ?? 0).toFixed(0)}%
          </Typography>
        </Stack>

        {/* Current surah/ayah for this juz */}
        {juz.current && (
          <CurrentLine current={juz.current} lng={lng} txt={txt} />
        )}

        {/* Segment chips */}
        {segments.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {segments.map((seg) => {
                const surahLabel = localName(seg.surah, lng);
                const label = `${surahLabel} ${seg.fromAyah}–${seg.toAyah}`;
                const color = segmentColor(seg.status);
                return (
                  <Chip
                    key={`${seg.surah?.number ?? 0}-${seg.fromAyah}`}
                    label={label}
                    color={color}
                    size="small"
                    variant={seg.status === "COMPLETED" ? "filled" : "outlined"}
                  />
                );
              })}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingPlanSection({ studentId, lng, txt }) {
  const { data: sessionsData } = useRequest({
    url: SESSIONS_URL,
    method: "get",
    isPaginated: false,
    autoFetch: true,
    syncToUrl: false,
    initialParams: { studentId, status: "SCHEDULED" },
  });

  // sessionsData may be an array or a paginated envelope { data: [] }
  const sessions = Array.isArray(sessionsData)
    ? sessionsData
    : sessionsData?.data ?? [];

  // First item is soonest (ordered by startsAt asc from backend)
  const upcoming = sessions[0] ?? null;

  if (!upcoming) return null;

  const assignments = upcoming.assignments || [];
  const homework = upcoming.homework;

  if (assignments.length === 0 && !homework) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {txt.upcomingPlan}
      </Typography>

      {assignments.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: homework ? 1 : 0 }}>
          {assignments.map((asgn, idx) => {
            const surahLabel = localName(asgn.surah, lng);
            const rangeLabel =
              asgn.fromAyah != null && asgn.toAyah != null
                ? `${surahLabel} ${asgn.fromAyah}–${asgn.toAyah}`
                : surahLabel
                  ? `${surahLabel} (${txt.wholeSurah})`
                  : txt.wholeSurah;
            const kindColor = asgn.kind === "MEMORIZE" ? "primary" : "secondary";
            const kindLabel = asgn.kind === "MEMORIZE" ? txt.memorize : txt.review;
            return (
              <Chip
                key={idx}
                label={`${kindLabel}: ${rangeLabel}`}
                color={kindColor}
                size="small"
                variant="outlined"
              />
            );
          })}
        </Stack>
      )}

      {homework && (
        <Typography variant="body2" color="text.secondary">
          <Box component="span" fontWeight={600}>
            {txt.homework}:{" "}
          </Box>
          {homework}
        </Typography>
      )}
    </Box>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function QuranProgressView({ studentId, compact = false }) {
  const { lng } = useTranslation();
  const txt = useQuranProgressText();

  const { data: progress, isLoading } = useRequest({
    url: `${QURAN_PROGRESS_URL}/${studentId}`,
    method: "get",
    autoFetch: Boolean(studentId),
    syncToUrl: false,
  });

  if (isLoading && !progress) {
    return (
      <Stack alignItems="center" sx={{ py: 3 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  const overall = progress?.overall;
  const allJuz = progress?.juz || [];
  const touchedJuz = allJuz.filter((j) => (j.touched ?? 0) > 0);

  // No progress at all
  if (!progress || allJuz.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        {txt.noProgress}
      </Typography>
    );
  }

  // Compact mode: overall bar + first current line only
  if (compact) {
    // Find the first juz that has a current pointer
    const firstCurrent = touchedJuz.find((j) => j.current)?.current ?? null;
    return (
      <Box>
        <OverallBar overall={overall} txt={txt} />
        {firstCurrent && <CurrentLine current={firstCurrent} lng={lng} txt={txt} />}
      </Box>
    );
  }

  // Full mode
  return (
    <Box>
      <OverallBar overall={overall} txt={txt} />

      {touchedJuz.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {txt.noProgress}
        </Typography>
      ) : (
        <Box sx={{ mt: 1 }}>
          {touchedJuz.map((juz) => (
            <JuzCard key={juz.id} juz={juz} lng={lng} txt={txt} />
          ))}
        </Box>
      )}

      <UpcomingPlanSection studentId={studentId} lng={lng} txt={txt} />
    </Box>
  );
}
