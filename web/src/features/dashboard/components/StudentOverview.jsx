"use client";

import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MdStar, MdEmojiEvents, MdMilitaryTech } from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { useDashboardText } from "../config/dashboardText.js";
import { localizedField } from "../../notifications/config/notificationsText.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { QURAN_PERMISSIONS } from "@aya/shared";
import SectionCard from "./SectionCard.jsx";
import LeaderboardWidget from "./LeaderboardWidget.jsx";
import QuranProgressView from "../../quran/components/QuranProgressView.jsx";

export default function StudentOverview() {
  const txt = useDashboardText();
  const { lng } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canViewProgress = hasPermission(QURAN_PERMISSIONS.PROGRESS_VIEW);

  const { data } = useRequest({
    url: "dashboard/student",
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  const profile = data?.profile;
  const badges = data?.badges || [];
  const certificates = data?.certificates || [];
  const games = data?.assignedGames || [];
  const upcoming = data?.upcomingLessons || [];

  return (
    <Box>
      {/* Hero profile card */}
      <Card
        sx={{
          borderRadius: 4,
          mb: 3,
          border: "none",
          color: "#fff",
          background: (theme) =>
            `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
          boxShadow: (theme) =>
            `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            top: -60,
            insetInlineEnd: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
          },
        }}
      >
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" gap={2}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "secondary.main", fontSize: 32 }}>
              {String(profile?.nickname || profile?.name || "?").charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "start" } }}>
              <Typography variant="h4" fontWeight={800}>
                {txt.welcome}, {profile?.nickname || profile?.name} 🌟
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {txt.welcomeStudent}
              </Typography>
            </Box>
            <Stack direction="row" gap={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" fontWeight={800}>
                  {profile?.points ?? 0}
                </Typography>
                <Typography variant="caption">{txt.points2}</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" fontWeight={800}>
                  {profile?.level ?? 1}
                </Typography>
                <Typography variant="caption">{txt.level}</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" fontWeight={800}>
                  #{data?.rank ?? "-"}
                </Typography>
                <Typography variant="caption">{txt.rank}</Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {data?.activeSubscription && (
        <Chip
          color="success"
          icon={<MdStar />}
          label={`${txt.activeSubscription}${
            data.activeSubscription.remainingHours != null
              ? ` • ${data.activeSubscription.remainingHours} ${txt.remainingHours}`
              : ""
          }`}
          sx={{ mb: 3 }}
        />
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title={txt.assignedGames}
            empty={games.length === 0}
            emptyLabel={txt.noData}
            action={
              <Button size="small" component={Link} href={localePath(lng, "/dashboard/games")}>
                {txt.myGames}
              </Button>
            }
          >
            <List dense disablePadding>
              {games.map((g) => (
                <ListItem
                  key={g.id}
                  disableGutters
                  secondaryAction={
                    g.game?.slug ? (
                      <Button size="small" variant="contained" component={Link} href={localePath(lng, `/dashboard/games/${g.game.slug}`)}>
                        ▶
                      </Button>
                    ) : null
                  }
                >
                  <ListItemText
                    primary={localizedField(g.game, "title", lng)}
                    secondary={g.status}
                  />
                </ListItem>
              ))}
            </List>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title={txt.upcomingLessons} empty={upcoming.length === 0} emptyLabel={txt.noData}>
            <List dense disablePadding>
              {upcoming.map((l) => (
                <ListItem
                  key={l.id}
                  disableGutters
                  secondaryAction={
                    l.meetingLink ? (
                      <Button size="small" component={Link} href={l.meetingLink} target="_blank">
                        {txt.joinLesson}
                      </Button>
                    ) : null
                  }
                >
                  <ListItemText primary={l.title} secondary={new Date(l.startsAt).toLocaleString()} />
                </ListItem>
              ))}
            </List>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title={txt.myBadges}
            empty={badges.length === 0}
            emptyLabel={txt.noData}
          >
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
              {badges.map((b) => (
                <Tooltip key={b.id} title={localizedField(b, "name", lng)}>
                  <Stack alignItems="center" sx={{ width: 72 }}>
                    <Avatar sx={{ bgcolor: "secondary.main", width: 48, height: 48 }}>
                      <MdMilitaryTech size={26} />
                    </Avatar>
                    <Typography variant="caption" align="center" noWrap sx={{ width: "100%" }}>
                      {localizedField(b, "name", lng)}
                    </Typography>
                  </Stack>
                </Tooltip>
              ))}
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title={txt.certificates}
            empty={certificates.length === 0}
            emptyLabel={txt.noData}
            action={
              <Button size="small" component={Link} href={localePath(lng, "/dashboard/certificates")}>
                {txt.certificates}
              </Button>
            }
          >
            <List dense disablePadding>
              {certificates.map((c) => (
                <ListItem key={c.id} disableGutters>
                  <ListItemText
                    primary={
                      <Stack direction="row" gap={1} alignItems="center">
                        <MdEmojiEvents color="#F6C453" />
                        {localizedField(c, "title", lng)}
                      </Stack>
                    }
                    secondary={new Date(c.issuedAt).toLocaleDateString()}
                  />
                </ListItem>
              ))}
            </List>
          </SectionCard>
        </Grid>

        {canViewProgress && user?.id && (
          <Grid size={{ xs: 12 }}>
            <SectionCard title={txt.quranProgress} emptyLabel={txt.noData}>
              <QuranProgressView studentId={user.id} />
            </SectionCard>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <LeaderboardWidget />
        </Grid>
      </Grid>
    </Box>
  );
}
