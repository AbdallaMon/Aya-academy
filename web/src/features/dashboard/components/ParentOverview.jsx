"use client";

import Link from "next/link";
import {
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
  Typography,
} from "@mui/material";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { useDashboardText } from "../config/dashboardText.js";
import { localizedField } from "../../notifications/config/notificationsText.js";
import SectionCard from "./SectionCard.jsx";
import LeaderboardWidget from "./LeaderboardWidget.jsx";

export default function ParentOverview() {
  const txt = useDashboardText();
  const { lng } = useTranslation();

  const { data } = useRequest({
    url: "dashboard/parent",
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  const children = data?.children || [];
  const upcoming = data?.upcomingLessons || [];
  const recentCerts = data?.recentCertificates || [];
  const recentReports = data?.recentReports || [];

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
        {txt.welcomeParent}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {txt.welcome} 👋
      </Typography>

      <Grid container spacing={2} sx={{ mb: 1 }}>
        {children.map((child) => (
          <Grid key={child.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: "100%",
                transition: "box-shadow .25s ease, transform .25s ease",
                "&:hover": { transform: "translateY(-3px)", boxShadow: 6 },
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700}>
                    {child.nickname || child.name}
                  </Typography>
                  <Chip
                    size="small"
                    color={child.activeSubscription ? "success" : "default"}
                    label={
                      child.activeSubscription
                        ? txt.activeSubscription
                        : txt.noActiveSubscription
                    }
                  />
                </Stack>
                <Stack direction="row" gap={3} sx={{ mt: 1.5 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={800} color="primary.main">
                      {child.points ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {txt.points2}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={800} color="secondary.main">
                      {child.level ?? 1}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {txt.level}
                    </Typography>
                  </Box>
                  {child.activeSubscription?.remainingHours != null && (
                    <Box>
                      <Typography variant="h5" fontWeight={800} color="success.main">
                        {child.activeSubscription.remainingHours}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {txt.remainingHours}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {children.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary">
              {txt.noData}
            </Typography>
          </Grid>
        )}
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
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
                  <ListItemText
                    primary={l.title}
                    secondary={new Date(l.startsAt).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title={txt.recentCertificates} empty={recentCerts.length === 0} emptyLabel={txt.noData}>
            <List dense disablePadding>
              {recentCerts.map((c) => (
                <ListItem key={c.id} disableGutters>
                  <ListItemText
                    primary={localizedField(c, "title", lng)}
                    secondary={`${c.studentName} • ${new Date(c.issuedAt).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title={txt.recentReports} empty={recentReports.length === 0} emptyLabel={txt.noData}>
            <List dense disablePadding>
              {recentReports.map((r) => (
                <ListItem key={r.id} disableGutters>
                  <ListItemText
                    primary={r.title}
                    secondary={r.reportDate ? new Date(r.reportDate).toLocaleDateString() : ""}
                  />
                </ListItem>
              ))}
            </List>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <LeaderboardWidget />
        </Grid>
      </Grid>
    </Box>
  );
}
