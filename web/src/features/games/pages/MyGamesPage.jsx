"use client";

// MyGamesPage — the student's "ألعابي" section inside the dashboard. Lists the
// games available to the signed-in student (GET /games, auth) and plays them
// INSIDE the dashboard shell (cards link to /dashboard/games/:slug). Falls back
// to the dev list when the API is unreachable so it's demoable without a DB.

import { useMemo, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { DEV_GAMES_LIST } from "../devData.js";
import GameCard from "../components/GameCard.jsx";

export default function MyGamesPage() {
  const { t } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const [fallback, setFallback] = useState(null);

  const { data, isLoading } = useRequest({
    url: "games",
    method: "get",
    // Paginated so the limit is actually sent as a query param (the plain `get`
    // helper ignores params). Kids see ALL their active games on one playful grid.
    isPaginated: true,
    initialParams: { limit: 100 },
    autoFetch: true,
    syncToUrl: false,
    onError: () => setFallback(DEV_GAMES_LIST),
  });

  // The student's own assignments — best-effort, so a failure never breaks the
  // list. Used to badge games a teacher has assigned to this student.
  const { data: assignData } = useRequest({
    url: "games/my/assignments",
    method: "get",
    autoFetch: true,
    syncToUrl: false,
    onError: () => {},
  });
  const assignmentBySlug = useMemo(() => {
    const list = Array.isArray(assignData) ? assignData : [];
    const map = {};
    for (const a of list) if (a.game?.slug) map[a.game.slug] = a;
    return map;
  }, [assignData]);

  // API may return an array or { items: [...] }. API always wins over fallback.
  const apiGames = Array.isArray(data) ? data : data?.items;
  const games = apiGames ?? fallback ?? [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          {gd.myGamesTitle}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {gd.myGamesSubtitle}
        </Typography>
      </Box>

      {isLoading && games.length === 0 ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8, gap: 2 }}>
          <CircularProgress />
          <Typography color="text.secondary">{gd.loading}</Typography>
        </Box>
      ) : games.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 8, fontSize: 18 }}>
          {gd.noGames}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
            gap: 3,
          }}
        >
          {games.map((game) => (
            <GameCard
              key={game.slug ?? game.id}
              game={game}
              basePath="/dashboard/games"
              assignment={assignmentBySlug[game.slug]}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
