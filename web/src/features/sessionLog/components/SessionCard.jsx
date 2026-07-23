"use client";

// Parent-facing, read-only session card — a compact summary of one logged
// session. No detail page exists for sessions, so this is a plain (non-tappable)
// card.

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { MdAccessTime, MdEventNote, MdPerson, MdStar } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { formatSessionDate, studentLabel } from "../config/constant.js";
import { formatDurationMinutes } from "../../../shared/lib/money.js";

export default function SessionCard({ session, txt }) {
  const { lng } = useTranslation();

  const subjects = Array.isArray(session.subjectsJson) ? session.subjectsJson : [];
  const present = session.attendance === "PRESENT";

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", borderRadius: 3, display: "flex", flexDirection: "column" }}
    >
      <CardContent sx={{ p: 2.5, flex: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            }}
          >
            <MdEventNote size={24} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.25 }}>
              {studentLabel(session.student)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatSessionDate(session.sessionDate, lng)}
            </Typography>
          </Box>
          <Chip
            size="small"
            color={present ? "success" : "error"}
            label={present ? txt.PRESENT : txt.ABSENT}
          />
        </Stack>

        {subjects.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.75 }}>
            {subjects.map((s) => (
              <Chip key={s} size="small" variant="outlined" label={txt[s] || s} />
            ))}
          </Stack>
        )}

        <Divider sx={{ my: 1.75 }} />

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <MdAccessTime size={16} />
            <Typography variant="body2">
              {formatDurationMinutes(session.durationMinutes, lng)}
            </Typography>
          </Stack>
          {session.rating && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdStar size={16} />
              <Typography variant="body2">{txt[session.rating] || session.rating}</Typography>
            </Stack>
          )}
          {session.teacher?.name && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdPerson size={16} />
              <Typography variant="body2" color="text.secondary">
                {session.teacher.name}
              </Typography>
            </Stack>
          )}
        </Stack>

        {session.report && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1.5,
              whiteSpace: "pre-line",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {session.report}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
