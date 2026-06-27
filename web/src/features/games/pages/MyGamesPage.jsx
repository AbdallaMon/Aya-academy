"use client";

// MyGamesPage — the student's "ألعابي". Shows the games their teacher ASSIGNED
// to them (GET /games/my/assignments) PLUS the single public free game (GET
// /games/my/free) so it sits naturally alongside the rest. Never the whole
// catalog. Inactive games are hidden so a child never taps a dead card.

import { useMemo } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import GameCard from "../components/GameCard.jsx";

export default function MyGamesPage() {
  const { t } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};

  const { data, isLoading } = useRequest({
    url: "games/my/assignments",
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  // The single free game is always available to the student — best-effort.
  const { data: freeGame } = useRequest({
    url: "games/my/free",
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  const assignments = useMemo(
    () => (Array.isArray(data) ? data : []).filter((a) => a.game && a.game.isActive),
    [data],
  );

  // Cards = the free game (first, "free" badge) + assigned games (assignment
  // badge). Deduped if the free game happens to also be assigned.
  const cards = useMemo(() => {
    const list = assignments.map((a) => ({
      key: `a-${a.id}`,
      game: a.game,
      assignment: a,
    }));
    if (freeGame && freeGame.isActive) {
      const alreadyAssigned = assignments.some((a) => a.gameId === freeGame.id);
      if (!alreadyAssigned) {
        list.unshift({ key: `free-${freeGame.id}`, game: freeGame, assignment: null });
      }
    }
    return list;
  }, [assignments, freeGame]);

  const loading = isLoading && cards.length === 0;

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

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8, gap: 2 }}>
          <CircularProgress />
          <Typography color="text.secondary">{gd.loading}</Typography>
        </Box>
      ) : cards.length === 0 ? (
        <Typography
          color="text.secondary"
          sx={{ textAlign: "center", py: 8, fontSize: 18 }}
        >
          {gd.noAssignedGames}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
            gap: 3,
          }}
        >
          {cards.map((c) => (
            <GameCard
              key={c.key}
              game={c.game}
              basePath="/dashboard/games"
              assignment={c.assignment}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
