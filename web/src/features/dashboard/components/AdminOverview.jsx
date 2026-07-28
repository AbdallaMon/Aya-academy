"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  MdSchool,
  MdFamilyRestroom,
  MdWorkspacePremium,
  MdSubscriptions,
  MdPayments,
  MdVerified,
  MdSportsEsports,
  MdQuiz,
  MdAccessTimeFilled,
  MdArrowForward,
} from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { useDashboardText } from "../config/dashboardText.js";
import { localizedField } from "../../notifications/config/notificationsText.js";
import StatCard from "./StatCard.jsx";
import SectionCard from "./SectionCard.jsx";
import LeaderboardWidget from "./LeaderboardWidget.jsx";

export default function AdminOverview() {
  const txt = useDashboardText();
  const { lng } = useTranslation();

  const { data } = useRequest({
    url: "dashboard/admin",
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  const counts = data?.counts || {};
  const byStatus = data?.subscriptionsByStatus || [];
  const recentCerts = data?.recentCertificates || [];

  const quickActions = [
    { label: txt.students, href: "/dashboard/students" },
    { label: txt.plans, href: "/dashboard/plans" },
    { label: txt.subscriptions, href: "/dashboard/subscriptions" },
    { label: txt.games, href: "/dashboard/games" },
  ];

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
            {txt.welcomeAdmin}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {txt.welcomeAdminSub} 👋
          </Typography>
        </Box>
        {counts.expiringSoon > 0 && (
          <Chip
            icon={<MdAccessTimeFilled />}
            color="warning"
            variant="outlined"
            label={`${counts.expiringSoon} ${txt.expiringSoon}`}
            sx={{ fontWeight: 700 }}
          />
        )}
      </Stack>

      {/* primary KPIs */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={txt.students} value={counts.students ?? 0} icon={<MdSchool size={24} />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={txt.parents} value={counts.parents ?? 0} icon={<MdFamilyRestroom size={24} />} color="secondary.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={txt.activeSubscriptions} value={counts.activeSubscriptions ?? 0} icon={<MdSubscriptions size={24} />} color="info.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label={txt.revenue}
            value={`£${Number(data?.revenue || 0).toLocaleString()}`}
            icon={<MdPayments size={24} />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* secondary KPIs */}
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={txt.plans} value={counts.plans ?? 0} icon={<MdWorkspacePremium size={24} />} color="secondary.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={txt.totalCertificates} value={counts.totalCertificates ?? 0} icon={<MdVerified size={24} />} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={txt.gamesLabel} value={counts.games ?? 0} icon={<MdSportsEsports size={24} />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={txt.quizzesLabel} value={counts.quizzes ?? 0} icon={<MdQuiz size={24} />} color="info.main" />
        </Grid>
      </Grid>

      {/* quick actions */}
      <Box
        sx={{
          mt: 2.5,
          p: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        }}
      >
        <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 1.5 }}>
          {txt.quickActions}
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1.25}>
          {quickActions.map((a) => (
            <Button
              key={a.href}
              component={Link}
              href={localePath(lng, a.href)}
              variant="outlined"
              size="small"
              endIcon={
                <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                  <MdArrowForward />
                </Box>
              }
              sx={{ fontWeight: 700 }}
            >
              {a.label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* insights row */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title={txt.subscriptionsByStatus} empty={byStatus.length === 0} emptyLabel={txt.noData}>
            <Stack spacing={1.25}>
              {byStatus.map((s) => (
                <Stack key={s.status} direction="row" alignItems="center" justifyContent="space-between">
                  <Chip size="small" label={txt.subscriptionStatuses[s.status] || s.status} />
                  <Typography variant="body2" fontWeight={700}>
                    {s.count}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <LeaderboardWidget />
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
      </Grid>
    </Box>
  );
}
