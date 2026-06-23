"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { MdAdd, MdStar, MdRemoveCircleOutline } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useConfirm, EmptyState } from "../../../shared/components/index.js";
import { BADGES_URL, formatDate } from "../config/constant.js";
import BadgeChip from "./BadgeChip.jsx";

/**
 * Student badges: grid of awarded badges + Award / Grant points / Revoke
 * actions. The awarded badges come from the overview payload.
 */
export default function BadgesTab({
  overview,
  studentId,
  txt,
  canAward,
  canRevoke,
  canGrantPoints,
  onAward,
  onGrantPoints,
  onRefetch,
}) {
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const badges = overview?.badges || [];

  const revokeReq = useRequest({
    url: BADGES_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => onRefetch?.(),
  });

  async function onRevoke(badge) {
    const ok = await confirm({ title: txt.revokeConfirm, intent: "danger" });
    if (!ok) return;
    revokeReq.fetchData(`${badge.id}/revoke`, { studentId: Number(studentId) });
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        {canAward && (
          <Button variant="contained" startIcon={<MdAdd />} onClick={onAward}>
            {txt.awardBadge}
          </Button>
        )}
        {canGrantPoints && (
          <Button variant="outlined" startIcon={<MdStar />} onClick={onGrantPoints}>
            {txt.grantPoints}
          </Button>
        )}
      </Stack>

      {badges.length === 0 ? (
        <EmptyState
          title={txt.noBadges}
          icon={<Box sx={{ fontSize: 48 }}>🏅</Box>}
        />
      ) : (
        <Grid container spacing={2}>
          {badges.map((badge) => (
            <Grid key={badge.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <BadgeChip badge={badge} lng={lng} />
                  {(badge.descriptionAr || badge.descriptionEn) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      {lng === "en"
                        ? badge.descriptionEn || badge.descriptionAr
                        : badge.descriptionAr || badge.descriptionEn}
                    </Typography>
                  )}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 1.5 }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {txt.awardedAt}: {formatDate(badge.awardedAt, lng)}
                    </Typography>
                    {canRevoke && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<MdRemoveCircleOutline />}
                        onClick={() => onRevoke(badge)}
                        disabled={revokeReq.isLoading}
                      >
                        {txt.revoke}
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
