"use client";

// One champion column on the top-5 podium. Shows medal, avatar (photo or
// initial), name, the relevant points metric, badge count, the level control,
// and a colored pedestal whose height reflects the rank.

import { Avatar, Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { buildFileUrl } from "../../../shared/lib/fileUrl.js";
import StudentLevelControl from "./StudentLevelControl.jsx";

const RANK_COLORS = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉", 4: "🎖️", 5: "🎖️" };
const HEIGHTS = { 1: 96, 2: 76, 3: 60, 4: 48, 5: 44 };

export default function PodiumChampion({ row, range, txt, canSetLevel, onRefetch }) {
  const rank = row.rank;
  const isFirst = rank === 1;
  const ringColor = RANK_COLORS[rank] || "#1ABC9C";
  const primary = range === "week" ? row.weeklyPoints ?? 0 : row.points ?? 0;
  const name = row.nickname || row.name;
  const avatarUrl = buildFileUrl(row.avatar);

  return (
    <Stack
      alignItems="center"
      sx={{
        flex: "1 0 auto",
        minWidth: { xs: 110, sm: 128 },
        justifyContent: "flex-end",
      }}
    >
      <Box sx={{ fontSize: isFirst ? 32 : 24, lineHeight: 1 }}>{MEDALS[rank]}</Box>
      <Avatar
        src={avatarUrl || undefined}
        sx={{
          width: isFirst ? 74 : 58,
          height: isFirst ? 74 : 58,
          mt: 0.5,
          fontSize: isFirst ? 28 : 22,
          fontWeight: 900,
          bgcolor: alpha(ringColor, 0.22),
          color: "#5a4500",
          border: `3px solid ${ringColor}`,
          boxShadow: `0 6px 18px ${alpha(ringColor, 0.5)}`,
        }}
      >
        {String(name || "?").charAt(0).toUpperCase()}
      </Avatar>
      <Typography
        variant="body2"
        fontWeight={900}
        noWrap
        sx={{ maxWidth: "100%", mt: 0.75, color: "text.primary" }}
      >
        {name}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800 }}>
        ⭐ {primary} {txt.points} • 🎖️ {row.badgeCount ?? 0}
      </Typography>
      <Box sx={{ mt: 0.75, maxWidth: "100%" }}>
        <StudentLevelControl
          studentId={row.studentId}
          level={row.studentLevel}
          canEdit={canSetLevel}
          txt={txt}
          onSaved={onRefetch}
        />
      </Box>
      {/* Pedestal — height encodes the rank. */}
      <Box
        sx={{
          mt: 1,
          width: "92%",
          height: HEIGHTS[rank] ?? 44,
          borderRadius: "14px 14px 0 0",
          background: `linear-gradient(180deg, ${alpha(ringColor, 0.95)}, ${alpha(
            ringColor,
            0.4,
          )})`,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          pt: 0.5,
          color: "#5a4500",
          fontWeight: 900,
          fontSize: 20,
          boxShadow: `inset 0 0 0 1px ${alpha(ringColor, 0.5)}`,
        }}
      >
        {rank}
      </Box>
    </Stack>
  );
}
