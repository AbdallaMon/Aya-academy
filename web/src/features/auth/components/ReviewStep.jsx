"use client";

import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import {
  MdAlternateEmail,
  MdEdit,
  MdEmail,
  MdPerson,
  MdPhone,
} from "react-icons/md";
import EnrollSummaryTable from "./EnrollSummaryTable.jsx";

function SummaryLine({ icon, children }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color: "text.secondary", display: "flex", flexShrink: 0 }}>
        {icon}
      </Box>
      <Typography variant="body2">{children}</Typography>
    </Stack>
  );
}

export default function ReviewStep({
  childrenList,
  plans,
  parent,
  formError,
  goBack,
  onEditParent,
  submit,
  isSubmitting,
  txt,
  lng,
}) {
  return (
    <Stack spacing={2.5}>
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="subtitle1" fontWeight={800}>
            {txt.parentTitle}
          </Typography>
          <Button
            size="small"
            variant="text"
            startIcon={<MdEdit />}
            onClick={onEditParent}
          >
            {txt.edit}
          </Button>
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          <SummaryLine icon={<MdPerson size={18} />}>{parent.name}</SummaryLine>
          {parent.email && (
            <SummaryLine icon={<MdEmail size={18} />}>
              {parent.email}
            </SummaryLine>
          )}
          {parent.username && (
            <SummaryLine icon={<MdAlternateEmail size={18} />}>
              @{parent.username}
            </SummaryLine>
          )}
          <SummaryLine icon={<MdPhone size={18} />}>{parent.phone}</SummaryLine>
        </Stack>
      </Paper>

      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="subtitle1" fontWeight={800}>
            {txt.summaryTitle}
          </Typography>
          <Button
            size="small"
            variant="text"
            startIcon={<MdEdit />}
            onClick={goBack}
          >
            {txt.edit}
          </Button>
        </Stack>
        <EnrollSummaryTable
          items={childrenList}
          plans={plans}
          lng={lng}
          txt={txt}
        />
      </Box>

      {formError && (
        <Typography color="error" variant="body2">
          {formError}
        </Typography>
      )}

      <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5}>
        <Button
          variant="text"
          size="large"
          onClick={goBack}
          disabled={isSubmitting}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {txt.back}
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={submit}
          disabled={isSubmitting}
          sx={{ width: { xs: "100%", sm: "auto" }, minWidth: 170 }}
        >
          {isSubmitting ? txt.submitting : txt.submit}
        </Button>
      </Stack>
    </Stack>
  );
}
