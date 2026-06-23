"use client";

import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { MdEmail, MdPhone, MdCalendarToday } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { formatDate } from "../config/constant.js";

function Row({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      {icon}
      <Stack>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          {value || "—"}
        </Typography>
      </Stack>
    </Stack>
  );
}

/** Generic contact/profile card — used for PARENT contact + ADMIN profile. */
export default function ProfileTab({ overview, txt }) {
  const { lng } = useTranslation();
  const user = overview?.user || {};

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
          {txt.contactTitle}
        </Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Row icon={<MdEmail size={20} />} label={txt.email} value={user.email} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Row icon={<MdPhone size={20} />} label={txt.phone} value={user.phone} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Row
              icon={<MdCalendarToday size={20} />}
              label={txt.joinedOn}
              value={formatDate(user.createdAt, lng)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
