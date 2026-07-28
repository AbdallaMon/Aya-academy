"use client";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { PERMISSIONS, USER_ROLES } from "@ayah/shared";
import { useAuth } from "../../../hooks/useAuth.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  EmptyState,
  PageHeader,
  SubscriptionLockedState,
} from "../../../shared/components/index.js";
import {
  REWARDS_URL,
  REWARD_TYPE_META,
  REWARD_STATUS_COLOR,
  formatDate,
} from "../config/constant.js";
import { useBadgesText } from "../config/badgesText.js";

export default function BadgesPage() {
  const txt = useBadgesText();
  const { user } = useAuth();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.REWARD.LIST);
  const blocked = user?.role === USER_ROLES.STUDENT && user?.hasActiveSubscription === false;

  // Rewards endpoint is paginated + role-scoped (a student sees only their own).
  const { data, isLoading } = useRequest({
    url: REWARDS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList && !blocked,
    syncToUrl: false,
    initialParams: { limit: 100 },
  });

  const rewards = data || [];

  function typeTitle(type) {
    return txt[type] || type;
  }

  function typeDescription(reward) {
    if (reward.type === "COUPON") return txt.couponDesc;
    if (reward.type === "FREE_LECTURES") return txt.freeLecturesDesc;
    return txt.badgeDesc;
  }

  if (!canList) return null;
  if (blocked) return <SubscriptionLockedState variant="student" />;

  return (
    <Box>
      <PageHeader title={txt.pageTitle} description={txt.pageDescription} />

      {isLoading && (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={`sk-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      )}

      {!isLoading && rewards.length === 0 && (
        <EmptyState title={txt.empty} body={txt.emptyBody} icon={<Box sx={{ fontSize: 48 }}>🏅</Box>} />
      )}

      {!isLoading && rewards.length > 0 && (
        <Grid container spacing={2}>
          {rewards.map((reward) => {
            const meta = REWARD_TYPE_META[reward.type] || REWARD_TYPE_META.BADGE;
            return (
              <Grid key={reward.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: `${meta.color}.light`,
                          width: 56,
                          height: 56,
                          fontSize: 28,
                        }}
                      >
                        {meta.emoji}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={800}>
                          {typeTitle(reward.type)}
                        </Typography>
                        <Chip
                          size="small"
                          color={REWARD_STATUS_COLOR[reward.status] || "default"}
                          label={txt[reward.status] || reward.status}
                        />
                      </Box>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" mb={1.5}>
                      {typeDescription(reward)}
                    </Typography>

                    {reward.type === "COUPON" && reward.coupon && (
                      <Stack spacing={0.5} mb={1.5}>
                        <Typography variant="body2">
                          {txt.code}: <strong>{reward.coupon.code}</strong>
                        </Typography>
                        {reward.coupon.value != null && (
                          <Typography variant="body2">
                            {txt.value}: <strong>{reward.coupon.value}</strong>
                          </Typography>
                        )}
                      </Stack>
                    )}

                    {reward.type === "FREE_LECTURES" &&
                      reward.freeLectureCount != null && (
                        <Typography variant="body2" mb={1.5}>
                          <strong>{reward.freeLectureCount}</strong> {txt.lectures}
                        </Typography>
                      )}

                    <Typography variant="caption" color="text.secondary">
                      {reward.claimedAt
                        ? `${txt.claimedOn}: ${formatDate(reward.claimedAt, lng)}`
                        : `${txt.earnedOn}: ${formatDate(reward.createdAt, lng)}`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
