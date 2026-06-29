"use client";

// A single non-podium leaderboard entry (rank 6+), rendered as a soft colored
// card: rank badge, avatar, name, points + badges, and the level control.

import { Avatar, Box, Card, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { buildFileUrl } from "../../../shared/lib/fileUrl.js";
import StudentLevelControl from "./StudentLevelControl.jsx";

export default function LeaderboardRow({ row, range, txt, canSetLevel, onRefetch }) {
  const primary = range === "week" ? row.weeklyPoints ?? 0 : row.points ?? 0;
  const name = row.nickname || row.name;
  const avatarUrl = buildFileUrl(row.avatar);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: 1.25,
        background: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)}, ${alpha(
            t.palette.secondary.main,
            0.06,
          )})`,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 15,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.14),
            color: "primary.main",
          }}
        >
          {row.rank}
        </Box>
        <Avatar
          src={avatarUrl || undefined}
          sx={{
            width: 42,
            height: 42,
            fontWeight: 800,
            bgcolor: (t) => alpha(t.palette.secondary.main, 0.2),
            color: "text.primary",
          }}
        >
          {String(name || "?").charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={800} noWrap sx={{ color: "text.primary" }}>
            {name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
            ⭐ {primary} {txt.points} • 🎖️ {row.badgeCount ?? 0} {txt.badgesShort}
          </Typography>
        </Box>
        <StudentLevelControl
          studentId={row.studentId}
          level={row.studentLevel}
          canEdit={canSetLevel}
          txt={txt}
          onSaved={onRefetch}
        />
      </Stack>
    </Card>
  );
}
