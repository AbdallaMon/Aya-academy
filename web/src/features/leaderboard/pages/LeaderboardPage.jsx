"use client";

import { useState } from "react";
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MdEmojiEvents } from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { useAuth } from "../../../hooks/useAuth.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { EmptyState, SubscriptionLockedState } from "../../../shared/components/index.js";
import { useLeaderboardText } from "../config/leaderboardText.js";
import PodiumChampion from "../components/PodiumChampion.jsx";
import LeaderboardRow from "../components/LeaderboardRow.jsx";

// Stage display order per champion count (by rank): tallest in the centre, the
// runners-up fanning out to the sides — the classic podium look, extended to 5.
const STAGE_ORDER = {
  1: [1],
  2: [1, 2],
  3: [2, 1, 3],
  4: [4, 2, 1, 3],
  5: [4, 2, 1, 3, 5],
};

/** Kid-friendly champions board with a week | all-time toggle. */
export default function LeaderboardPage() {
  const txt = useLeaderboardText();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.POINT.VIEW_LEADERBOARD);
  // Admins (USER.SET_LEVEL) can reassign a child's level straight from the board.
  const canSetLevel = hasPermission(PERMISSIONS.USER.SET_LEVEL);
  const blocked =
    user?.role === USER_ROLES.STUDENT && user?.hasActiveSubscription === false;
  const [range, setRange] = useState("week");

  // Non-paginated GET: query params live in the URL. Changing `url` recreates
  // fetchData and retriggers the auto-fetch.
  const { data, isLoading, triggerRefetch } = useRequest({
    url: `points/leaderboard?range=${range}`,
    method: "get",
    autoFetch: canView && !blocked,
    syncToUrl: false,
  });

  const rows = Array.isArray(data) ? data : [];
  const champions = rows.slice(0, 5);
  const rest = rows.slice(5);
  const byRank = new Map(champions.map((r) => [r.rank, r]));
  const orderedChampions = (
    STAGE_ORDER[champions.length] || champions.map((r) => r.rank)
  )
    .map((rk) => byRank.get(rk))
    .filter(Boolean);

  if (!canView) return null;
  if (blocked) return <SubscriptionLockedState variant="student" />;

  return (
    <Box>
      {/* Playful gradient header */}
      <Box
        sx={{
          borderRadius: 4,
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          background: (t) =>
            `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.18)}, ${alpha(
              t.palette.secondary.main,
              0.18,
            )})`,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={900}>
              {txt.pageTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary" fontWeight={600}>
              {txt.pageDescription}
            </Typography>
          </Box>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={range}
            onChange={(_e, v) => v && setRange(v)}
            color="primary"
            sx={{ bgcolor: "background.paper", borderRadius: 999 }}
          >
            <ToggleButton value="week" sx={{ borderRadius: 999, fontWeight: 800, px: 2 }}>
              {txt.week}
            </ToggleButton>
            <ToggleButton value="all" sx={{ borderRadius: 999, fontWeight: 800, px: 2 }}>
              {txt.all}
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {!isLoading && rows.length === 0 ? (
        <EmptyState
          title={txt.empty}
          body={txt.emptyBody}
          icon={<MdEmojiEvents size={48} color="#F59E0B" />}
        />
      ) : (
        <>
          {orderedChampions.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>
                {txt.championsTitle}
              </Typography>
              <Box sx={{ overflowX: "auto", pb: 1 }}>
                <Stack
                  direction="row"
                  alignItems="flex-end"
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{ minWidth: "min-content", px: 0.5 }}
                >
                  {orderedChampions.map((row) => (
                    <PodiumChampion
                      key={row.studentId}
                      row={row}
                      range={range}
                      txt={txt}
                      canSetLevel={canSetLevel}
                      onRefetch={triggerRefetch}
                    />
                  ))}
                </Stack>
              </Box>
            </Box>
          )}

          {rest.length > 0 && (
            <Stack spacing={1.25}>
              {rest.map((row) => (
                <LeaderboardRow
                  key={row.studentId}
                  row={row}
                  range={range}
                  txt={txt}
                  canSetLevel={canSetLevel}
                  onRefetch={triggerRefetch}
                />
              ))}
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
