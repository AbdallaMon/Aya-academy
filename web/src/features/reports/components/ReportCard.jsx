"use client";

// Parent-facing report card — a pretty, tappable summary that links to the full
// report detail page. Used in the parent (read-only) reports grid.

import Link from "next/link";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { MdChevronLeft, MdChevronRight, MdDescription } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import {
  REPORTS_URL,
  bodyExcerpt,
  formatReportDate,
  studentLabel,
} from "../config/constant.js";

// First grapheme/letter of a name for the avatar fallback.
function initial(name) {
  const s = String(name || "").trim();
  return s ? s[0].toUpperCase() : "•";
}

export default function ReportCard({ report, txt }) {
  const { lng } = useTranslation();
  const rtl = lng !== "en";
  const Chevron = rtl ? MdChevronLeft : MdChevronRight;

  const students = report.students || [];
  const shown = students.slice(0, 3);
  const rest = students.length - shown.length;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        transition: "box-shadow .2s, transform .2s, border-color .2s",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-2px)",
          borderColor: "primary.main",
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={localePath(lng, `/dashboard/${REPORTS_URL}/${report.id}`)}
        sx={{
          height: "100%",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="flex-start"
          sx={{ width: "100%" }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            }}
          >
            <MdDescription size={24} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                lineHeight: 1.25,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {report.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatReportDate(report.reportDate, lng)}
            </Typography>
          </Box>
          <Box sx={{ color: "text.disabled", mt: 0.5 }}>
            <Chevron size={22} />
          </Box>
        </Stack>

        {report.body && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {bodyExcerpt(report.body, 200)}
          </Typography>
        )}

        {students.length > 0 && (
          <Stack
            direction="row"
            spacing={0.75}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: "auto", pt: 2 }}
          >
            {shown.map((s) => (
              <Chip
                key={s.id}
                size="small"
                avatar={<Avatar>{initial(s.student?.name)}</Avatar>}
                label={studentLabel(s.student)}
                sx={{ maxWidth: "100%" }}
              />
            ))}
            {rest > 0 && (
              <Chip
                size="small"
                variant="outlined"
                label={txt.moreStudents.replace("{count}", rest)}
              />
            )}
          </Stack>
        )}
      </CardActionArea>
    </Card>
  );
}
