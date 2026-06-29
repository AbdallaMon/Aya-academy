"use client";

import { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { MdEmojiEvents } from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { useAuth } from "../../../hooks/useAuth.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { EmptyState, SubscriptionLockedState } from "../../../shared/components/index.js";
import { useLeaderboardText } from "../config/leaderboardText.js";

const RANK_COLORS = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

/** Full leaderboard with a week | all-time toggle. */
export default function LeaderboardPage() {
  const txt = useLeaderboardText();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.POINT.VIEW_LEADERBOARD);
  const blocked = user?.role === USER_ROLES.STUDENT && user?.hasActiveSubscription === false;
  const [range, setRange] = useState("week");

  // Non-paginated GET: query params must live in the URL. Changing `url`
  // recreates fetchData and retriggers the auto-fetch effect.
  const { data, isLoading } = useRequest({
    url: `points/leaderboard?range=${range}`,
    method: "get",
    autoFetch: canView && !blocked,
    syncToUrl: false,
  });

  const rows = Array.isArray(data) ? data : [];

  if (!canView) return null;
  if (blocked) return <SubscriptionLockedState variant="student" />;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 3 }}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {txt.pageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {txt.pageDescription}
          </Typography>
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={range}
          onChange={(_e, v) => v && setRange(v)}
          color="primary"
        >
          <ToggleButton value="week">{txt.week}</ToggleButton>
          <ToggleButton value="all">{txt.all}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {!isLoading && rows.length === 0 ? (
        <EmptyState
          title={txt.empty}
          body={txt.emptyBody}
          icon={<MdEmojiEvents size={48} color="#F59E0B" />}
        />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={80}>{txt.rank}</TableCell>
                <TableCell>{txt.name}</TableCell>
                <TableCell align="right">{txt.weeklyPoints}</TableCell>
                <TableCell align="right">{txt.totalPoints}</TableCell>
                <TableCell align="right">{txt.badges}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontWeight: 800,
                        fontSize: 14,
                        bgcolor: RANK_COLORS[row.rank] || "action.selected",
                        color: row.rank <= 3 ? "#1E293B" : "text.primary",
                      }}
                    >
                      {row.rank}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700}>{row.nickname || row.name}</Typography>
                  </TableCell>
                  <TableCell align="right">{row.weeklyPoints ?? 0}</TableCell>
                  <TableCell align="right">{row.points ?? 0}</TableCell>
                  <TableCell align="right">
                    <Chip size="small" variant="outlined" label={row.badgeCount ?? 0} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
