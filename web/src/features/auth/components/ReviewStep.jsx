"use client";

import { Button, Paper, Stack, Typography } from "@mui/material";
import EnrollSummaryTable from "./EnrollSummaryTable.jsx";
import ParentDetailsForm from "./ParentDetailsForm.jsx";

/**
 * ReviewStep — RegisterWizard step 1: enrollment summary table, the parent
 * details form, inline form error and the back/submit actions. Pure
 * presentational extraction; all state/handlers stay in RegisterWizard.
 */
export default function ReviewStep({
  childrenList,
  plans,
  parent,
  parentErrors,
  patchParent,
  formError,
  goBack,
  submit,
  isSubmitting,
  txt,
  lng,
}) {
  return (
    <Stack spacing={3}>
      <Typography variant="h6" fontWeight={800}>
        {txt.summaryTitle}
      </Typography>
      <EnrollSummaryTable items={childrenList} plans={plans} lng={lng} txt={txt} />

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          {txt.parentTitle}
        </Typography>
        <ParentDetailsForm
          parent={parent}
          onChange={patchParent}
          errors={parentErrors}
          txt={txt}
        />
      </Paper>

      {formError && (
        <Typography color="error" variant="body2">
          {formError}
        </Typography>
      )}

      <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2}>
        <Button
          variant="text"
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
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {isSubmitting ? txt.submitting : txt.submit}
        </Button>
      </Stack>
    </Stack>
  );
}
