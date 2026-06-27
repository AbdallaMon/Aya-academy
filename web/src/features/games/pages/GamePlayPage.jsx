"use client";

// GamePlayPage — loads a single game by slug and renders <GamePlayer>.
// Handles loading / error / not-found states. Used in TWO contexts:
//   - variant="marketing" → the public free trial game (full-bleed playful bg)
//   - variant="dashboard"  → a student's game inside the dashboard shell
// `backHref` is a locale-agnostic app path (prefixed with /{lng} at render).

import Link from "next/link";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { useGame } from "../hooks/useGame.js";
import GamePlayer from "../engine/GamePlayer.jsx";
import { DEFAULT_THEME } from "../engine/helpers.js";

// Marketing-only intro + funnel copy. Makes the public free-game landing clear
// and inviting (what is this? what do I get?) instead of dropping straight into
// the game with no context.
const MARKETING_COPY = {
  ar: {
    title: "ألعاب تفاعلية يمكنك تجربتها الآن 🎮",
    subtitle:
      "جرّب لعبة من أكاديمية آية مجانًا — وبعد التجربة سجّل واحصل على حصة تجريبية مجانية.",
    cta: "سجّل واحصل على حصة مجانية",
    rateTitle: "لقد لعبت كثيرًا اليوم! 🎉",
    rateBody: "عُد بعد حوالي {min} دقيقة لتجربة اللعبة من جديد 😊",
    rateCta: "سجّل الآن والعب بلا حدود",
  },
  en: {
    title: "Interactive games you can try right now 🎮",
    subtitle:
      "Try a game from Aya Academy for free — then sign up and get a free trial session.",
    cta: "Sign up and get a free session",
    rateTitle: "You've played a lot today! 🎉",
    rateBody: "Come back in about {min} minutes to play again 😊",
    rateCta: "Sign up now and play without limits",
  },
};

export default function GamePlayPage({ slug, free = false, backHref = "/", variant = "marketing" }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const isDashboard = variant === "dashboard";
  // Dashboard plays ANY active game (auth endpoint). Marketing plays the single
  // admin-chosen free game (free=true) or a specific public slug.
  const { game, isLoading, error, rateLimited } = useGame({
    slug,
    auth: isDashboard,
    free,
  });

  const theme = { ...DEFAULT_THEME, ...(game?.configJson?.theme || {}) };
  const isMarketing = !isDashboard;
  const mk = MARKETING_COPY[lng === "en" ? "en" : "ar"];
  const backLabel = isDashboard ? gd.backToGames : gd.backHome;
  const waitMinutes =
    rateLimited?.retryAfterMinutes ||
    (rateLimited?.retryAfterSeconds
      ? Math.ceil(rateLimited.retryAfterSeconds / 60)
      : 15);

  return (
    <Box
      sx={{
        minHeight: isDashboard ? "auto" : "calc(100vh - 76px)",
        // In the dashboard, cancel the shell's content padding so the game
        // container itself has no outer padding around the card. (The card is
        // unchanged — only the surrounding container loses its margin/padding.)
        mx: isDashboard ? { xs: -2, sm: -2.5, md: -3.5 } : 0,
        py: { xs: 1.5, md: isDashboard ? 2 : 4 },
        px: { xs: isDashboard ? 0.5 : 0, sm: 1.5 },
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        background:
          "radial-gradient(1200px 600px at 0% 0%, #ffe3f1 0%, transparent 55%)," +
          "radial-gradient(1200px 600px at 100% 100%, #dbe8ff 0%, transparent 55%)," +
          `linear-gradient(160deg, ${theme.bg || "#fde9f3"}, #eaf2ff)`,
      }}
    >
      <Box
        sx={{
          width: 460,
          maxWidth: "100%",
          display: "flex",
          justifyContent: "flex-start",
          px: { xs: 2, sm: 0 },
        }}
      >
        <Link href={localePath(lng, backHref)} style={{ textDecoration: "none" }}>
          <Typography sx={{ color: "#7c4dff", fontWeight: 800, fontSize: 14 }}>
            {backLabel}
          </Typography>
        </Link>
      </Box>

      {isMarketing && !rateLimited && (
        <Stack spacing={1} sx={{ textAlign: "center", maxWidth: 720, px: 2, mb: 1 }}>
          <Typography
            component="h1"
            sx={{ color: "#3a1d6e", fontWeight: 900, fontSize: { xs: 22, md: 28 }, lineHeight: 1.3 }}
          >
            {mk.title}
          </Typography>
          <Typography sx={{ color: "#473f6b", fontWeight: 700, fontSize: { xs: 14, md: 16 } }}>
            {mk.subtitle}
          </Typography>
        </Stack>
      )}

      {rateLimited ? (
        <Stack
          spacing={2}
          sx={{
            textAlign: "center",
            alignItems: "center",
            maxWidth: 460,
            width: "100%",
            background: "#fff",
            border: "2px dashed #cdbcff",
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            mt: 2,
          }}
        >
          <Box sx={{ fontSize: 64, lineHeight: 1 }}>⏳</Box>
          <Typography sx={{ color: "#3a1d6e", fontWeight: 900, fontSize: { xs: 20, md: 24 } }}>
            {mk.rateTitle}
          </Typography>
          <Typography sx={{ color: "#473f6b", fontWeight: 700, fontSize: { xs: 15, md: 17 } }}>
            {mk.rateBody.replace("{min}", String(waitMinutes))}
          </Typography>
          <Button
            component={Link}
            href={localePath(lng, "/register")}
            variant="contained"
            size="large"
            sx={{
              mt: 1,
              borderRadius: 999,
              px: 4,
              fontWeight: 800,
              backgroundColor: "#7c4dff",
              "&:hover": { backgroundColor: "#6a3df0" },
            }}
          >
            {mk.rateCta}
          </Button>
        </Stack>
      ) : isLoading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 10, gap: 2 }}>
          <CircularProgress />
          <Typography sx={{ color: "#6b6790" }}>{gd.loading}</Typography>
        </Box>
      ) : error && !game ? (
        <Typography sx={{ textAlign: "center", color: "#6b6790", py: 10, fontSize: 18 }}>
          {gd.errorLoading}
        </Typography>
      ) : !game || !game.questions ? (
        <Typography sx={{ textAlign: "center", color: "#6b6790", py: 10, fontSize: 18 }}>
          {gd.notFound}
        </Typography>
      ) : (
        <GamePlayer key={game.slug} game={game} demo={isMarketing} />
      )}

      {isMarketing && !rateLimited && (
        <Button
          component={Link}
          href={localePath(lng, "/register")}
          variant="contained"
          size="large"
          sx={{
            mt: 1,
            borderRadius: 999,
            px: 4,
            fontWeight: 800,
            backgroundColor: "#7c4dff",
            "&:hover": { backgroundColor: "#6a3df0" },
          }}
        >
          {mk.cta}
        </Button>
      )}
    </Box>
  );
}
