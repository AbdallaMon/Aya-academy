"use client";

// Top-of-the-week leaderboard widget. Gated by POINT.VIEW_LEADERBOARD; renders
// nothing when the user lacks the permission. Uses points/leaderboard?range=week
// and shows the top ~5, with a link to the full /dashboard/leaderboard view.

import Link from "next/link";
import {
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { MdEmojiEvents } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { useDashboardText } from "../config/dashboardText.js";
import SectionCard from "./SectionCard.jsx";

const RANK_COLORS = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

export default function LeaderboardWidget() {
  const txt = useDashboardText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.POINT.VIEW_LEADERBOARD);

  const { data } = useRequest({
    url: "points/leaderboard?range=week",
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  if (!canView) return null;

  const rows = (Array.isArray(data) ? data : []).slice(0, 5);

  return (
    <SectionCard
      title={txt.leaderboardNav}
      empty={rows.length === 0}
      emptyLabel={txt.noData}
      action={
        <Button size="small" component={Link} href={localePath(lng, "/dashboard/leaderboard")}>
          {txt.leaderboardNav}
        </Button>
      }
    >
      <List dense disablePadding>
        {rows.map((row) => (
          <ListItem key={row.studentId} disableGutters>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 13,
                  fontWeight: 800,
                  bgcolor: RANK_COLORS[row.rank] || "action.selected",
                  color: row.rank <= 3 ? "#1E293B" : "text.primary",
                }}
              >
                {row.rank}
              </Avatar>
              <ListItemText
                primary={row.nickname || row.name}
                secondary={`${row.weeklyPoints ?? 0} ${txt.points} • ${row.badgeCount ?? 0} ${txt.badges}`}
              />
              <MdEmojiEvents color="#F6C453" />
            </Stack>
          </ListItem>
        ))}
      </List>
    </SectionCard>
  );
}
