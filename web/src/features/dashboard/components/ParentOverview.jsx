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
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  MdChildCare,
  MdStar,
  MdMilitaryTech,
  MdSubscriptions,
  MdArrowForward,
  MdWorkspacePremium,
} from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { useDashboardText } from "../config/dashboardText.js";
import { localizedField } from "../../notifications/config/notificationsText.js";
import { iconColor } from "@/shared/ui/iconColor.js";
import SectionCard from "./SectionCard.jsx";
import LeaderboardWidget from "./LeaderboardWidget.jsx";

// Small headline stat used in the parent summary strip.
function SummaryStat({ icon, value, label, color = "primary.main" }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
        <Avatar
          variant="rounded"
          sx={{
            bgcolor: (t) => alpha(t.palette[color.split(".")[0]]?.main || t.palette.primary.main, 0.14),
            color,
            width: 44,
            height: 44,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function ChildMetric({ value, label, color }) {
  return (
    <Box sx={{ textAlign: "center", flex: 1 }}>
      <Typography variant="h6" fontWeight={900} color={color} sx={{ lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default function ParentOverview() {
  const txt = useDashboardText();
  const theme = useTheme();
  const { lng } = useTranslation();

  const { data } = useRequest({
    url: "dashboard/parent",
    method: "get",
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
            <SummaryStat icon={<MdChildCare size={22} />} value={children.length} label={txt.childrenCount} />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryStat icon={<MdStar size={22} />} value={totalPoints} label={txt.totalPoints} color="secondary.main" />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryStat icon={<MdMilitaryTech size={22} />} value={totalBadges} label={txt.totalBadges} color="warning.main" />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryStat icon={<MdSubscriptions size={22} />} value={activeSubs} label={txt.activeSubsCount} color="success.main" />
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
            <Card
              sx={{
                height: "100%",
                position: "relative",
                overflow: "hidden",
                transition: "box-shadow .25s ease, transform .25s ease",
                "&:hover": { transform: "translateY(-3px)", boxShadow: 6 },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  insetInlineStart: 0,
                  top: 0,
                  bottom: 0,
                  width: 5,
                  background: (t) =>
                    `linear-gradient(180deg, ${t.palette.primary.main}, ${t.palette.success.main})`,
                },
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: "primary.main", width: 46, height: 46, fontWeight: 800 }}>
                    {String(child.nickname || child.name || "?").charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={800} noWrap>
                      {child.nickname || child.name}
                    </Typography>
                    <Chip
                      size="small"
                      color={child.activeSubscription ? "success" : "default"}
                      label={child.activeSubscription ? txt.activeSubscription : txt.noActiveSubscription}
                      sx={{ height: 22, fontSize: 11, fontWeight: 700 }}
                    />
                  </Box>
                </Stack>

                {/* Branch on the backend-computed subscriptionState so a pending
                    renewal reads as "awaiting payment", not "expired". Only ACTIVE
                    shows the stats/achievements; every other state hides them and
                    surfaces a state-appropriate note + CTA. */}
                {(() => {
                  const state = child.subscriptionState;
                  if (state === "ACTIVE") {
                    return (
                      <>
                        <Stack
                          direction="row"
                          divider={<Box sx={{ width: "1px", bgcolor: "divider" }} />}
                          sx={{ py: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.05) }}
                        >
                          <ChildMetric value={child.points ?? 0} label={txt.points2} color="primary.main" />
                          <ChildMetric value={child.level ?? 1} label={txt.level} color="secondary.main" />
                          <ChildMetric value={`#${child.rank ?? "-"}`} label={txt.rank} color="text.primary" />
                          <ChildMetric value={child.badgeCount ?? 0} label={txt.badgesLabel} color="warning.main" />
                        </Stack>

                        {child.activeSubscription?.remainingHours != null && (
                          <Typography variant="caption" color="success.main" fontWeight={700} sx={{ display: "block", mt: 1.5 }}>
                            ⏳ {child.activeSubscription.remainingHours} {txt.remainingHours}
                          </Typography>
                        )}
                      </>
                    );
                  }

                  if (state === "PENDING") {
                    return (
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                        sx={{ py: 1.5, px: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.info.main, 0.08) }}
                      >
                        <Box aria-hidden sx={{ fontSize: 22 }}>⏳</Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          {txt.pendingChildNote}
                        </Typography>
                      </Stack>
                    );
                  }

                  if (state === "NONE") {
                    return (
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                        sx={{ py: 1.5, px: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.grey[500], 0.08) }}
                      >
                        <Box aria-hidden sx={{ fontSize: 22 }}>📋</Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          {txt.noSubscriptionNote}
                        </Typography>
                      </Stack>
                    );
                  }

                  // EXPIRED (and any unknown/legacy state) → actionable renew note.
                  return (
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={1}
                      sx={{ py: 1.5, px: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.warning.main, 0.08) }}
                    >
                      <Box aria-hidden sx={{ fontSize: 22 }}>🔒</Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        {txt.inactiveChildNote}
                      </Typography>
                    </Stack>
                  );
                })()}

                {(() => {
                  const state = child.subscriptionState;
                  const subHref =
                    child.latestSubscriptionId != null
                      ? localePath(lng, `/dashboard/subscriptions/${child.latestSubscriptionId}`)
                      : null;

                  // PENDING: view the in-flight subscription — no renew, no "expired".
                  if (state === "PENDING") {
                    return (
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        component={Link}
                        href={subHref || localePath(lng, "/dashboard/subscriptions")}
                        endIcon={
                          <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                            <MdArrowForward />
                          </Box>
                        }
                        sx={{ mt: 1.5, fontWeight: 700 }}
                      >
                        {txt.viewSubscription}
                      </Button>
                    );
                  }

                  // EXPIRED: renew. Prefer the latest subscription's detail page
                  // (where the Renew dialog lives); fall back to children area.
                  if (state === "EXPIRED") {
                    return (
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        component={Link}
                        href={subHref || localePath(lng, "/dashboard/children")}
                        endIcon={
                          <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                            <MdArrowForward />
                          </Box>
                        }
                        sx={{ mt: 1.5, fontWeight: 700 }}
                      >
                        {txt.renewSubscription}
                      </Button>
                    );
                  }

                  // NONE: choose a plan (reuse the page's existing subscriptions nav).
                  if (state === "NONE") {
                    return (
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        component={Link}
                        href={localePath(lng, "/dashboard/subscriptions")}
                        endIcon={
                          <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                            <MdArrowForward />
                          </Box>
                        }
                        sx={{ mt: 1.5, fontWeight: 700 }}
                      >
                        {txt.choosePlan}
                      </Button>
                    );
                  }

                  // ACTIVE (and fallback): view child details.
                  return (
                    <Button
                      fullWidth
                      size="small"
                      variant="text"
                      component={Link}
                      href={localePath(lng, "/dashboard/children")}
                      endIcon={
                        <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                          <MdArrowForward />
                        </Box>
                      }
                      sx={{ mt: 1.5, fontWeight: 700 }}
                    >
                      {txt.viewDetails}
                    </Button>
                  );
                })()}
              </CardContent>
            </Card>
          </Grid>
        ))}
        {children.length === 0 && (
          <Grid size={{ xs: 12 }}>
            {/* First-run guidance: a new parent has no children — give one clear
                "add child → choose a plan" next step instead of an empty card. */}
            <Card sx={{ textAlign: "center", py: 4, px: 2 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "inline-flex",
                    p: 2,
                    borderRadius: "50%",
                    color: "primary.main",
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                    mb: 2,
                  }}
                >
                  <MdChildCare size={40} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {txt.noChildren}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {txt.noChildrenSub}
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="center"
                >
                  <Button
                    variant="contained"
                    component={Link}
                    href={localePath(lng, "/dashboard/children")}
                    startIcon={<MdChildCare />}
                    sx={{ fontWeight: 700 }}
                  >
                    {txt.addFirstChild}
                  </Button>
                  <Button
                    variant="outlined"
                    component={Link}
                    href={localePath(lng, "/dashboard/subscriptions")}
                    startIcon={<MdSubscriptions />}
                    sx={{ fontWeight: 700 }}
                  >
                    {txt.choosePlan}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
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
              <SectionCard title={txt.recentCertificates} empty={recentCerts.length === 0} emptyLabel={txt.noData}>
                <List dense disablePadding>
                  {recentCerts.map((c) => (
                    <ListItem key={c.id} disableGutters>
                      <ListItemText
                        primary={
                          <Stack direction="row" gap={1} alignItems="center">
                            <MdWorkspacePremium color={iconColor(theme, "secondary")} />
                            {localizedField(c, "title", lng)}
                          </Stack>
                        }
                        secondary={`${c.studentName} • ${new Date(c.issuedAt).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12 }}>
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
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
