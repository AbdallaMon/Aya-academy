'use client';

import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  MdChildCare,
  MdStar,
  MdMilitaryTech,
  MdSubscriptions,
  MdWorkspacePremium,
} from 'react-icons/md';
import { useRequest } from '../../../hooks/request/useRequest.js';
import { useTranslation } from '../../../i18n/client.js';
import { useDashboardText } from '../config/dashboardText.js';
import { localizedField } from '../../notifications/config/notificationsText.js';
import { iconColor } from '@/shared/ui/iconColor.js';
import SectionCard from './SectionCard.jsx';
import LeaderboardWidget from './LeaderboardWidget.jsx';
import SummaryStat from './parentOverview/SummaryStat.jsx';
import ChildCard from './parentOverview/ChildCard.jsx';
import NoChildrenCard from './parentOverview/NoChildrenCard.jsx';

export default function ParentOverview() {
  const txt = useDashboardText();
  const theme = useTheme();
  const { lng } = useTranslation();

  const { data } = useRequest({
    url: 'dashboard/parent',
    method: 'get',
    autoFetch: true,
    syncToUrl: false,
  });

  const children = data?.children || [];
  const recentCerts = data?.recentCertificates || [];
  const recentReports = data?.recentReports || [];

  const totalPoints = children.reduce((sum, c) => sum + (c.points || 0), 0);
  const totalBadges = children.reduce((sum, c) => sum + (c.badgeCount || 0), 0);
  const activeSubs = children.filter((c) => c.activeSubscription).length;

  return (
    <Box>
      {/* greeting */}
      <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
        {txt.welcomeParent}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {txt.welcomeParentSub} 👋
      </Typography>

      {/* summary strip — everything across all children at a glance */}
      {children.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryStat
              icon={<MdChildCare size={22} />}
              value={children.length}
              label={txt.childrenCount}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryStat
              icon={<MdStar size={22} />}
              value={totalPoints}
              label={txt.totalPoints}
              color="secondary.main"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryStat
              icon={<MdMilitaryTech size={22} />}
              value={totalBadges}
              label={txt.totalBadges}
              color="warning.main"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryStat
              icon={<MdSubscriptions size={22} />}
              value={activeSubs}
              label={txt.activeSubsCount}
              color="success.main"
            />
          </Grid>
        </Grid>
      )}

      {/* per-child cards */}
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
        {txt.myChildren}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        {children.map((child) => (
          <Grid key={child.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <ChildCard child={child} txt={txt} lng={lng} />
          </Grid>
        ))}
        {children.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <NoChildrenCard txt={txt} lng={lng} />
          </Grid>
        )}
      </Grid>

      {/* competition — leaderboard elevated alongside recent activity */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Leaderboard takes the prominent half on desktop, full width first on mobile */}
        <Grid size={{ xs: 12, md: 6 }}>
          <LeaderboardWidget title={txt.leaderboardNav} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <SectionCard
                title={txt.recentCertificates}
                empty={recentCerts.length === 0}
                emptyLabel={txt.noData}
              >
                <List dense disablePadding>
                  {recentCerts.map((c) => (
                    <ListItem key={c.id} disableGutters>
                      <ListItemText
                        primary={
                          <Stack direction="row" gap={1} alignItems="center">
                            <MdWorkspacePremium
                              color={iconColor(theme, 'secondary')}
                            />
                            {localizedField(c, 'title', lng)}
                          </Stack>
                        }
                        secondary={`${c.studentName} • ${new Date(c.issuedAt).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </SectionCard>
            </Grid>

            {/* <Grid size={{ xs: 12 }}>
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
            </Grid> */}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
