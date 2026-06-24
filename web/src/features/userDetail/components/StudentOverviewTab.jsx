"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { MdStar, MdPerson } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { localePath } from "../../../i18n/routing.js";
import { PhotoUpload } from "../../../shared/components/index.js";
import { USERS_URL, LEVELS, levelLabel } from "../config/constant.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { QURAN_PERMISSIONS } from "@aya/shared";
import QuranProgressView from "../../quran/components/QuranProgressView.jsx";

/**
 * Student overview: level selector (gated USER.SET_LEVEL), points total,
 * linked parents list, and a read-only Quran progress summary.
 *
 * Props:
 *   studentId  — the userId being viewed (passed from UserDetailPage)
 */
export default function StudentOverviewTab({ overview, txt, canSetLevel, onRefetch, studentId }) {
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canViewProgress = hasPermission(QURAN_PERMISSIONS.PROGRESS_VIEW);
  const user = overview?.user || {};
  const parents = overview?.parents || [];

  const [level, setLevel] = useState(user.studentLevel || "");
  useEffect(() => {
    setLevel(user.studentLevel || "");
  }, [user.studentLevel]);

  const levelReq = useRequest({
    url: USERS_URL,
    method: "patch",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => onRefetch?.(),
  });

  // Set the student's avatar from an uploaded attachment.
  const avatarReq = useRequest({
    url: USERS_URL,
    method: "patch",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => onRefetch?.(),
  });

  function saveLevel() {
    if (!level || level === user.studentLevel) return;
    levelReq.fetchData(`${user.id}/level`, { studentLevel: level });
  }

  function onPhotoUploaded(attachment) {
    if (!attachment?.id || !user.id) return;
    avatarReq.fetchData(`${user.id}/avatar`, { attachmentId: attachment.id });
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
              {txt.photoTitle}
            </Typography>
            <PhotoUpload
              value={user.avatar}
              onUploaded={onPhotoUploaded}
              disabled={avatarReq.isLoading}
              buttonLabel={txt.choosePhoto}
              uploadingLabel={txt.uploadingPhoto}
              hintLabel={txt.photoHint}
              invalidTypeLabel={txt.photoInvalidType}
              tooLargeLabel={txt.photoTooLarge}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
              {txt.levelTitle}
            </Typography>
            {canSetLevel ? (
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <TextField
                  select
                  label={txt.levelLabel}
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  size="small"
                  sx={{ minWidth: 220 }}
                >
                  {LEVELS.map((lvl) => (
                    <MenuItem key={lvl} value={lvl}>
                      {levelLabel(lvl, lng)}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  onClick={saveLevel}
                  disabled={levelReq.isLoading || !level || level === user.studentLevel}
                >
                  {txt.saveLevel}
                </Button>
              </Stack>
            ) : (
              <Chip label={levelLabel(user.studentLevel, lng)} color="primary" />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
              {txt.pointsTotal}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <MdStar size={28} color="#F59E0B" />
              <Typography variant="h3" fontWeight={900}>
                {overview?.pointsTotal ?? user.points ?? 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {txt.points}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
              {txt.parentsTitle}
            </Typography>
            {parents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {txt.noParents}
              </Typography>
            ) : (
              <Grid container spacing={1.5}>
                {parents.map((p) => (
                  <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1.5,
                        height: "100%",
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={700}>{p.name}</Typography>
                        <Chip size="small" variant="outlined" label={txt[p.relation] || p.relation} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {p.phone || txt.noPhone}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {p.email || txt.noEmail}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<MdPerson />}
                        component={Link}
                        href={localePath(lng, `/dashboard/users/${p.id}`)}
                        sx={{ mt: 0.5 }}
                      >
                        {txt.viewProfile}
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      {canViewProgress && studentId && (
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                {txt.tabQuranProgress}
              </Typography>
              <QuranProgressView studentId={studentId} />
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}
