"use client";

import { Box, Chip, Grid, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import {
  MdGroup,
  MdSchool,
  MdFamilyRestroom,
  MdWorkspacePremium,
  MdSubscriptions,
  MdPayments,
} from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
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

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
        {txt.welcomeAdmin}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {txt.welcome} 👋
      </Typography>

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard label={txt.users} value={counts.users} icon={<MdGroup size={24} />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard label={txt.students} value={counts.students} icon={<MdSchool size={24} />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard label={txt.parents} value={counts.parents} icon={<MdFamilyRestroom size={24} />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard label={txt.plans} value={counts.plans} icon={<MdWorkspacePremium size={24} />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard label={txt.subscriptions} value={counts.subscriptions} icon={<MdSubscriptions size={24} />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            label={txt.revenue}
            value={`£${Number(data?.revenue || 0).toLocaleString()}`}
            icon={<MdPayments size={24} />}
            color="success.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard
            title={txt.subscriptionsByStatus}
            empty={byStatus.length === 0}
            emptyLabel={txt.noData}
          >
            <Stack spacing={1.25}>
              {byStatus.map((s) => (
                <Stack
                  key={s.status}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Chip size="small" label={s.status} />
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
          <SectionCard
            title={txt.recentCertificates}
            empty={recentCerts.length === 0}
            emptyLabel={txt.noData}
          >
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
