"use client";

// Competition / leaderboard card. Gated by POINT.VIEW_LEADERBOARD; renders
// nothing when the user lacks the permission. Uses points/leaderboard?range=week
// and shows a top-3 podium + the next few ranks, with a link to the full
// /dashboard/leaderboard view. Mobile-first and RTL-safe.
//
// Props:
//   highlightId  — studentId to highlight as "you" (the logged-in child).
//   title        — card heading (defaults to the leaderboard nav label).
//   range        — "week" | "all" (default "week").
//   limit        — total rows to render (default 5).

import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MdEmojiEvents, MdArrowForward } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { iconColor } from "@/shared/ui/iconColor.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { useDashboardText } from "../config/dashboardText.js";

const RANK_COLORS = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };
// Visual height order for the podium: 2nd | 1st | 3rd.
const PODIUM_ORDER = [2, 1, 3];

function PodiumColumn({ row, txt, highlight }) {
  const rank = row.rank;
  const isFirst = rank === 1;
  const ringColor = RANK_COLORS[rank];
  return (
    <Stack
      alignItems="center"
      sx={{ flex: 1, minWidth: 0, justifyContent: "flex-end" }}
    >
      <Box sx={{ fontSize: isFirst ? 26 : 20, lineHeight: 1, mb: 0.25 }}>
        {MEDALS[rank]}
      </Box>
      <Avatar
        sx={{
          width: isFirst ? 56 : 46,
          height: isFirst ? 56 : 46,
          fontSize: isFirst ? 22 : 18,
          fontWeight: 900,
          bgcolor: alpha(ringColor, 0.25),
          color: "#5a4500",
          border: `3px solid ${ringColor}`,
        }}
      >
        {String(row.nickname || row.name || "?").charAt(0).toUpperCase()}
      </Avatar>
      <Typography
        variant="caption"
        fontWeight={800}
        noWrap
        sx={{ maxWidth: "100%", mt: 0.5, color: "text.primary" }}
      >
        {highlight ? txt.you : row.nickname || row.name}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
        {(row.weeklyPoints ?? row.points ?? 0)} {txt.points3}
      </Typography>
      {/* Pedestal */}
      <Box
        sx={{
          mt: 0.75,
          width: "86%",
          height: isFirst ? 54 : rank === 2 ? 40 : 30,
          borderRadius: "10px 10px 0 0",
          background: `linear-gradient(180deg, ${alpha(ringColor, 0.9)}, ${alpha(ringColor, 0.45)})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#5a4500",
          fontWeight: 900,
          fontSize: 16,
          boxShadow: `inset 0 0 0 1px ${alpha(ringColor, 0.5)}`,
        }}
      >
        {rank}
      </Box>
    </Stack>
  );
}

function RankRow({ row, txt, highlight }) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{
        px: 1,
        py: 0.75,
        borderRadius: 2,
        bgcolor: (t) =>
          highlight ? alpha(t.palette.secondary.main, 0.22) : "transparent",
        border: (t) =>
          highlight ? `1px solid ${alpha(t.palette.secondary.main, 0.6)}` : "1px solid transparent",
      }}
    >
      <Avatar
        sx={{
          width: 30,
          height: 30,
          fontSize: 13,
          fontWeight: 800,
          bgcolor: "action.selected",
          color: "text.primary",
        }}
      >
        {row.rank}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={800} noWrap sx={{ color: "text.primary" }}>
          {highlight ? `${row.nickname || row.name} (${txt.you})` : row.nickname || row.name}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {(row.weeklyPoints ?? row.points ?? 0)} {txt.points3} • {row.badgeCount ?? 0} {txt.badgesShort}
        </Typography>
      </Box>
      <MdEmojiEvents color={iconColor(theme, "secondary")} size={18} />
    </Stack>
  );
}

export default function LeaderboardWidget({
  highlightId = null,
  title,
  range = "week",
  limit = 5,
}) {
  const txt = useDashboardText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.POINT.VIEW_LEADERBOARD);

  const { data } = useRequest({
    url: `points/leaderboard?range=${range}`,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  if (!canView) return null;

  const rows = (Array.isArray(data) ? data : []).slice(0, limit);
  const podium = rows.filter((r) => r.rank <= 3);
  const rest = rows.filter((r) => r.rank > 3);
  const isHighlighted = (r) => highlightId != null && r.studentId === highlightId;

  // Podium needs to be reordered 2-1-3 for the classic stage look.
  const podiumByRank = new Map(podium.map((r) => [r.rank, r]));
  const orderedPodium = PODIUM_ORDER.map((rk) => podiumByRank.get(rk)).filter(Boolean);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "none",
        background: (t) =>
          `linear-gradient(160deg, ${alpha(t.palette.secondary.main, 0.16)} 0%, ${alpha(
            t.palette.primary.main,
            0.1,
          )} 100%)`,
        boxShadow: (t) => `0 10px 28px ${alpha(t.palette.secondary.main, 0.25)}`,
      }}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
            <Box sx={{ fontSize: 22 }}>🏆</Box>
            <Typography variant="subtitle1" fontWeight={900} noWrap sx={{ color: "text.primary" }}>
              {title || txt.weeklyChampions}
            </Typography>
          </Stack>
          <Button
            size="small"
            component={Link}
            href={localePath(lng, "/dashboard/leaderboard")}
            endIcon={
              <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                <MdArrowForward />
              </Box>
            }
            sx={{ flexShrink: 0, fontWeight: 800 }}
          >
            {txt.seeFullBoard}
          </Button>
        </Stack>

        {rows.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 120,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {txt.noData}
            </Typography>
          </Box>
        ) : (
          <>
            {/* You-are-here banner */}
            {highlightId != null && (() => {
              const me = rows.find((r) => r.studentId === highlightId);
              return me ? (
                <Chip
                  color="secondary"
                  icon={<MdEmojiEvents />}
                  label={`${txt.yourRank}: #${me.rank}`}
                  sx={{ alignSelf: "flex-start", mb: 1.5, fontWeight: 800 }}
                />
              ) : null;
            })()}

            {orderedPodium.length > 0 && (
              <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ mb: rest.length ? 1.5 : 0 }}>
                {orderedPodium.map((row) => (
                  <PodiumColumn
                    key={row.studentId}
                    row={row}
                    txt={txt}
                    highlight={isHighlighted(row)}
                  />
                ))}
              </Stack>
            )}

            {rest.length > 0 && (
              <Stack spacing={0.5}>
                {rest.map((row) => (
                  <RankRow
                    key={row.studentId}
                    row={row}
                    txt={txt}
                    highlight={isHighlighted(row)}
                  />
                ))}
              </Stack>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
