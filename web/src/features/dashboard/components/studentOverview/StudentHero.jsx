"use client";

import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MdStar } from "react-icons/md";
import { heroGradient, HeroStatPill } from "@/shared/ui/hero.jsx";
import { formatDurationMinutes } from "@/shared/lib/money.js";

// Playful hero: avatar + greeting + points / level / rank pills.
export default function StudentHero({ txt, lng, profile, activeSubscription, rank }) {
  return (
    <Card
      sx={{
        borderRadius: 5,
        mb: 2,
        border: "none",
        color: "#fff",
        background: (t) => heroGradient(t),
        boxShadow: (t) => `0 14px 36px ${alpha(t.palette.primary.main, 0.4)}`,
        position: "relative",
        overflow: "hidden",
        "&::after": {
          content: '""',
          position: "absolute",
          top: -60,
          insetInlineEnd: -40,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
        },
        "&::before": {
          content: '"🌙"',
          position: "absolute",
          fontSize: 28,
          opacity: 0.5,
          top: 18,
          insetInlineEnd: 28,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" gap={2}>
          <Avatar
            aria-hidden
            sx={{
              width: 84,
              height: 84,
              bgcolor: "rgba(255,255,255,0.18)",
              fontSize: 44,
              border: "3px solid rgba(255,255,255,0.5)",
            }}
          >
            🦉
          </Avatar>
          <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "start" } }}>
            <Typography variant="h4" fontWeight={900}>
              {txt.welcome}{lng === "en" ? "," : "،"} {profile?.nickname || profile?.name}{" "}
              <Box component="span" aria-hidden>🌟</Box>
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.92, color: "#fff" }}>
              {txt.welcomeStudentSub}
            </Typography>
            {activeSubscription && (
              <Chip
                icon={<MdStar />}
                label={
                  activeSubscription.remainingMinutes != null
                    ? formatDurationMinutes(
                        activeSubscription.remainingMinutes,
                        lng,
                      )
                    : txt.activeSubscription
                }
                sx={{
                  mt: 1,
                  fontWeight: 800,
                  bgcolor: "rgba(255,255,255,0.22)",
                  color: "#fff",
                  "& .MuiChip-icon": { color: "#fff" },
                }}
              />
            )}
          </Box>
          <Stack
            direction="row"
            gap={1.25}
            sx={{ flexWrap: "wrap", justifyContent: "center" }}
          >
            <HeroStatPill value={profile?.points ?? 0} label={txt.points2} />
            <HeroStatPill value={profile?.level ?? 1} label={txt.level} />
            <HeroStatPill
              value={rank != null ? `#${rank}` : "—"}
              label={txt.rank}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
