"use client";

// Student (child) dashboard. Mobile-first, playful, low cognitive load:
//   1. Hero  — avatar + greeting + points / level / rank
//   2. "What do I do now?" — the single most prominent next-activity CTA
//   3. My games — big, tappable game tiles
//   4. Competition — elevated leaderboard podium (highlights the child)
//   5. My achievements — badges + certificates grouped together
// All strings come from the dashboard i18n config (ar/en); RTL-safe.

import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  MdStar,
  MdEmojiEvents,
  MdMilitaryTech,
  MdPlayArrow,
  MdArrowForward,
  MdWorkspacePremium,
} from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { useDashboardText } from "../config/dashboardText.js";
import { localizedField } from "../../notifications/config/notificationsText.js";
import { iconColor } from "@/shared/ui/iconColor.js";
import { heroGradient, HeroStatPill } from "@/shared/ui/hero.jsx";
import LeaderboardWidget from "./LeaderboardWidget.jsx";

// Section heading: a colored pill + emoji + title. Bigger & friendlier than the
// admin SectionCard header so it reads well for a child.
function SectionTitle({ emoji, title, action }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={1}
      sx={{ mb: 1.5, mt: 1 }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
        <Box aria-hidden sx={{ fontSize: 24 }}>{emoji}</Box>
        <Typography variant="h6" fontWeight={900} noWrap sx={{ color: "text.primary" }}>
          {title}
        </Typography>
      </Stack>
      {action}
    </Stack>
  );
}

const GAME_TONES = ["primary", "secondary", "success", "info"];

// Raw DB statuses (NOT_STARTED / ASSIGNED / IN_PROGRESS / COMPLETED) are jargon
// to a 5–12-year-old — map them to a friendly, localized label instead.
const GAME_STATUS_KEY = {
  COMPLETED: "statusCompleted",
  IN_PROGRESS: "statusInProgress",
};
function gameStatusLabel(txt, status) {
  return txt[GAME_STATUS_KEY[status] || "statusNew"];
}

// A badge icon is only safe to print if it's an actual emoji; an icon-NAME or
// URL string would render as raw garbage, so we fall back to a default medal.
const isEmojiIcon = (s) =>
  typeof s === "string" && /\p{Extended_Pictographic}/u.test(s);

export default function StudentOverview() {
  const txt = useDashboardText();
  const theme = useTheme();
  const { t, lng } = useTranslation();
  const { user } = useAuth();
  // Inactive students don't see the leaderboard or their badges (gentle, no
  // billing nag — the actionable renew message goes to the parent).
  const subActive = user?.hasActiveSubscription !== false;
  const lock = t("subscriptionLock", { returnObjects: true }) || {};

  const { data, isLoading } = useRequest({
    url: "dashboard/student",
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  // Before the first response, never flash "0 points / all done / no games" —
  // show a skeleton instead (the empty/zero state is demotivating for a child).
  if (isLoading && !data) {
    return (
      <Box>
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: 5, mb: 2 }} />
        <Skeleton variant="rounded" height={96} sx={{ borderRadius: 4, mb: 2.5 }} />
        <Skeleton variant="text" width={140} height={32} sx={{ mb: 1 }} />
        <Grid container spacing={1.5}>
          {[0, 1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={88} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const profile = data?.profile;
  const badges = data?.badges || [];
  const certificates = data?.certificates || [];
  const games = data?.assignedGames || [];
  // The "what do I do now?" target: first playable game that isn't completed.
  const nextGame =
    games.find((g) => g.game?.slug && g.status !== "COMPLETED") ||
    games.find((g) => g.game?.slug);

  return (
    <Box>
      {/* ── 1. Playful hero ─────────────────────────────────────── */}
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
              {data?.activeSubscription && (
                <Chip
                  icon={<MdStar />}
                  label={
                    data.activeSubscription.remainingHours != null
                      ? `${data.activeSubscription.remainingHours} ${txt.remainingHours}`
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
                value={data?.rank != null ? `#${data.rank}` : "—"}
                label={txt.rank}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ── 2. What do I do now? (the single clear next step) ────── */}
      {nextGame ? (
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
      ) : (
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
      )}

      {/* ── 3. My games — big tap targets ───────────────────────── */}
      <SectionTitle
        emoji="🕹️"
        title={txt.myGames}
        action={
          <Button
            size="small"
            component={Link}
            href={localePath(lng, "/dashboard/games")}
            endIcon={
              <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                <MdArrowForward />
              </Box>
            }
            sx={{ fontWeight: 800 }}
          >
            {txt.games}
          </Button>
        }
      />
      {games.length === 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {txt.noGamesYet}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          {games.slice(0, 6).map((g, i) => {
            const tone = GAME_TONES[i % GAME_TONES.length];
            const done = g.status === "COMPLETED";
            const playable = !!g.game?.slug;
            const content = (
              <Card
                sx={{
                  height: "100%",
                  cursor: playable ? "pointer" : "default",
                  border: "none",
                  background: (t) =>
                    `linear-gradient(150deg, ${alpha(t.palette[tone].main, 0.18)}, ${alpha(
                      t.palette[tone].main,
                      0.06,
                    )})`,
                  transition: "transform .2s ease, box-shadow .2s ease",
                  "&:hover": playable
                    ? { transform: "translateY(-4px)", boxShadow: 6 }
                    : undefined,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        fontSize: 24,
                        bgcolor: (t) => alpha(t.palette[tone].main, 0.25),
                        color: `${tone}.main`,
                      }}
                    >
                      {done ? "✅" : "🎯"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ color: "text.primary" }}>
                        {localizedField(g.game, "title", lng)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        <Box component="span" aria-hidden>{done ? "🎉" : "▶"}</Box>{" "}
                        {gameStatusLabel(txt, g.status)}
                      </Typography>
                    </Box>
                    {playable && (
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: `${tone}.main`,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        <MdPlayArrow size={24} />
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
            return (
              <Grid key={g.id} size={{ xs: 12, sm: 6, md: 4 }}>
                {playable ? (
                  <Box
                    component={Link}
                    href={localePath(lng, `/dashboard/games/${g.game.slug}`)}
                    sx={{ textDecoration: "none", display: "block", height: "100%" }}
                  >
                    {content}
                  </Box>
                ) : (
                  content
                )}
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── 4. Competition — elevated leaderboard (hidden when inactive) ── */}
      {subActive && (
        <>
          <SectionTitle emoji="🏆" title={txt.competition} />
          <Box sx={{ mb: 1.5 }}>
            <LeaderboardWidget highlightId={user?.id} title={txt.weeklyChampions} />
          </Box>
        </>
      )}

      {/* ── 5. My achievements — badges + certificates together ─── */}
      <SectionTitle emoji="🌟" title={txt.myAchievements} />
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                <MdMilitaryTech color={iconColor(theme, "secondary")} size={22} />
                <Typography variant="subtitle1" fontWeight={800}>
                  {txt.myBadges}
                </Typography>
              </Stack>
              {!subActive ? (
                <Stack direction="row" alignItems="center" gap={1} sx={{ py: 1 }}>
                  <Box aria-hidden sx={{ fontSize: 22 }}>🔒</Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={700}>
                    {lock.studentTitle}
                  </Typography>
                </Stack>
              ) : badges.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                  {txt.noBadgesYet}
                </Typography>
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {badges.map((b, i) => {
                    const tone = ["secondary", "primary", "warning", "success"][i % 4];
                    return (
                      <Tooltip key={b.id} title={localizedField(b, "name", lng)}>
                        <Stack alignItems="center" sx={{ width: 76 }}>
                          <Avatar
                            sx={{
                              bgcolor: (t) => alpha(t.palette[tone].main, 0.18),
                              color: `${tone}.main`,
                              width: 56,
                              height: 56,
                              fontSize: 28,
                            }}
                          >
                            {isEmojiIcon(b.icon) ? b.icon : <MdMilitaryTech size={28} />}
                          </Avatar>
                          <Typography
                            variant="caption"
                            align="center"
                            noWrap
                            sx={{ width: "100%", mt: 0.5, fontWeight: 700 }}
                          >
                            {localizedField(b, "name", lng)}
                          </Typography>
                        </Stack>
                      </Tooltip>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Stack direction="row" alignItems="center" gap={1}>
                  <MdWorkspacePremium color={iconColor(theme, "secondary")} size={22} />
                  <Typography variant="subtitle1" fontWeight={800}>
                    {txt.certificates}
                  </Typography>
                </Stack>
                <Button
                  size="small"
                  component={Link}
                  href={localePath(lng, "/dashboard/certificates")}
                  endIcon={
                    <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                      <MdArrowForward />
                    </Box>
                  }
                >
                  {txt.viewDetails}
                </Button>
              </Stack>
              {certificates.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                  {txt.noCertsYet}
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {certificates.map((c) => (
                    <Stack
                      key={c.id}
                      direction="row"
                      alignItems="center"
                      gap={1.25}
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: (t) => alpha(t.palette.warning.main, 0.08),
                      }}
                    >
                      <MdEmojiEvents color={iconColor(theme, "secondary")} size={22} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={800} noWrap sx={{ color: "text.primary" }}>
                          {localizedField(c, "title", lng)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(c.issuedAt).toLocaleDateString(
                            lng === "ar" ? "ar-EG" : "en-US",
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
