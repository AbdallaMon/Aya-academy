"use client";

// Report detail — a parent-friendly, RTL-aware view of a single report.
// Shows a header card (title + date), the body with line-breaks preserved, the
// students it concerns (avatar chips) and any attachments as download cards.

import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  MdArrowBack,
  MdArrowForward,
  MdCalendarMonth,
  MdDescription,
  MdDownload,
  MdInsertDriveFile,
  MdPeople,
} from "react-icons/md";
import { PERMISSIONS } from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { buildFileUrl } from "../../../shared/lib/fileUrl.js";
import { EmptyState } from "../../../shared/components/index.js";
import { REPORTS_URL, formatReportDate, studentLabel } from "../config/constant.js";
import { useReportsText } from "../config/reportsText.js";

function initial(name) {
  const s = String(name || "").trim();
  return s ? s[0].toUpperCase() : "•";
}

export default function ReportDetailPage({ reportId }) {
  const txt = useReportsText();
  const { lng } = useTranslation();
  const rtl = lng !== "en";
  const BackIcon = rtl ? MdArrowForward : MdArrowBack;

  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.REPORT.VIEW);

  const {
    data: report,
    isLoading,
    error,
  } = useRequest({
    url: `${REPORTS_URL}/${reportId}`,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  const backButton = (
    <Button
      component={Link}
      href={localePath(lng, `/dashboard/${REPORTS_URL}`)}
      startIcon={<BackIcon />}
      size="small"
      sx={{ mb: 2 }}
    >
      {txt.back}
    </Button>
  );

  if (!canView) return null;

  if (isLoading && !report) {
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error || !report) {
    return (
      <Box>
        {backButton}
        <EmptyState
          title={txt.notFoundTitle}
          body={txt.notFoundBody}
          icon={<Box sx={{ fontSize: 48 }}>🔍</Box>}
        />
      </Box>
    );
  }

  const students = report.students || [];
  const attachments = report.attachments || [];

  return (
    <Box sx={{ maxWidth: 980, mx: "auto" }}>
      {backButton}

      {/* Header card — title + date over an accent band. */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Box
          sx={{
            px: { xs: 3, md: 5 },
            py: { xs: 3, md: 4 },
            color: "primary.contrastText",
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.18)",
              }}
            >
              <MdDescription size={28} />
            </Box>
            <Chip
              icon={<MdCalendarMonth />}
              label={formatReportDate(report.reportDate, lng)}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "inherit",
                "& .MuiChip-icon": { color: "inherit" },
              }}
            />
          </Stack>
          <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            {report.title}
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Body */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: 1 }}
              >
                {txt.body}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-line",
                  lineHeight: 1.9,
                  color: "text.primary",
                }}
              >
                {report.body}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Students + attachments */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <MdPeople />
                  <Typography variant="subtitle1" fontWeight={700}>
                    {txt.aboutStudents}
                  </Typography>
                </Stack>
                {students.length ? (
                  <Stack spacing={1}>
                    {students.map((s) => (
                      <Stack
                        key={s.id}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                      >
                        <Avatar sx={{ width: 36, height: 36 }}>
                          {initial(s.student?.name)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {studentLabel(s.student)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {txt.noStudents}
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <MdInsertDriveFile />
                  <Typography variant="subtitle1" fontWeight={700}>
                    {txt.attachments}
                  </Typography>
                </Stack>
                {attachments.length ? (
                  <Stack spacing={1}>
                    {attachments.map((a, i) => (
                      <Button
                        key={a.id}
                        component="a"
                        href={buildFileUrl({ id: a.attachmentId })}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        startIcon={<MdDownload />}
                        sx={{ justifyContent: "flex-start" }}
                      >
                        {`${txt.attachment} ${i + 1}`}
                      </Button>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {txt.noAttachments}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
