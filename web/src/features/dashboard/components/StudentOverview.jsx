"use client";

// Student (child) dashboard. Mobile-first, playful, low cognitive load:
//   1. Hero  — avatar + greeting + points / level / rank
//   2. "What do I do now?" — the single most prominent next-activity CTA
//   3. My games — big, tappable game tiles
//   4. Competition — elevated leaderboard podium (highlights the child)
//   5. My achievements — badges + certificates grouped together
// All strings come from the dashboard i18n config (ar/en); RTL-safe.

import { Box, Grid, Skeleton, useTheme } from "@mui/material";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useTranslation } from "../../../i18n/client.js";
import { useDashboardText } from "../config/dashboardText.js";
import LeaderboardWidget from "./LeaderboardWidget.jsx";
import SectionTitle from "./studentOverview/SectionTitle.jsx";
import StudentHero from "./studentOverview/StudentHero.jsx";
import NextActivityCard from "./studentOverview/NextActivityCard.jsx";
import MyGamesSection from "./studentOverview/MyGamesSection.jsx";
import BadgesCard from "./studentOverview/BadgesCard.jsx";
import CertificatesCard from "./studentOverview/CertificatesCard.jsx";

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
      <StudentHero
        txt={txt}
        lng={lng}
        profile={profile}
        activeSubscription={data?.activeSubscription}
        rank={data?.rank}
      />

      {/* ── 2. What do I do now? (the single clear next step) ────── */}
      <NextActivityCard txt={txt} lng={lng} nextGame={nextGame} />

      {/* ── 3. My games — big tap targets ───────────────────────── */}
      <MyGamesSection txt={txt} lng={lng} games={games} />

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
          <BadgesCard
            txt={txt}
            lng={lng}
            theme={theme}
            badges={badges}
            subActive={subActive}
            lock={lock}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CertificatesCard txt={txt} lng={lng} theme={theme} certificates={certificates} />
        </Grid>
      </Grid>
    </Box>
  );
}
