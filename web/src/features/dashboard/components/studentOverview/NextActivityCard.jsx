"use client";

import Link from "next/link";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MdPlayArrow } from "react-icons/md";
import { localePath } from "@/i18n/routing.js";
import { localizedField } from "../../../notifications/config/notificationsText.js";

// "What do I do now?" — the single clear next step. Either the first playable
// unfinished game, or an "all done → browse games" fallback.
export default function NextActivityCard({ txt, lng, nextGame }) {
  if (nextGame) {
    return (
      <Card
        sx={{
          mb: 2.5,
          border: "none",
          overflow: "hidden",
          position: "relative",
          background: (t) =>
            `linear-gradient(120deg, ${t.palette.secondary.main} 0%, ${t.palette.secondary.light} 100%)`,
          boxShadow: (t) => `0 12px 30px ${alpha(t.palette.secondary.main, 0.4)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems="center"
            gap={2}
            sx={{ color: "#25313F" }}
          >
            <Box
              aria-hidden
              sx={{
                fontSize: 40,
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              🎮
            </Box>
            <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "start" }, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={900}>
                {txt.nextActivity}
              </Typography>
              <Typography variant="body2" sx={{ color: "#3a2d00", fontWeight: 700 }} noWrap>
                {localizedField(nextGame.game, "title", lng)}
              </Typography>
            </Box>
            <Button
              component={Link}
              href={localePath(lng, `/dashboard/games/${nextGame.game.slug}`)}
              variant="contained"
              size="large"
              startIcon={<MdPlayArrow size={24} />}
              sx={{
                fontWeight: 900,
                fontSize: 18,
                px: 3,
                py: 1.25,
                bgcolor: "#25313F",
                color: "#fff",
                "&:hover": { bgcolor: "#0f1722" },
                flexShrink: 0,
              }}
            >
              {txt.playNow}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        mb: 2.5,
        border: "none",
        background: (t) =>
          `linear-gradient(120deg, ${alpha(t.palette.success.main, 0.18)}, ${alpha(
            t.palette.primary.main,
            0.12,
          )})`,
      }}
    >
      <CardContent sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 0.5 }}>
          {txt.allDoneTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {txt.allDoneSub}
        </Typography>
        <Button
          component={Link}
          href={localePath(lng, "/dashboard/games")}
          variant="contained"
          startIcon={<MdPlayArrow />}
          sx={{ fontWeight: 800 }}
        >
          {txt.browseGames}
        </Button>
      </CardContent>
    </Card>
  );
}
