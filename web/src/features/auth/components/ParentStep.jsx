"use client";

import { Button, Stack, Typography } from "@mui/material";
import ParentDetailsForm from "./ParentDetailsForm.jsx";
import IdentityChoiceNotice from "./IdentityChoiceNotice.jsx";

export default function ParentStep({
  parent,
  parentErrors,
  patchParent,
  formError,
  goNext,
  txt,
}) {
  return (
    <Stack spacing={2.5}>
      <IdentityChoiceNotice txt={txt} />

      <ParentDetailsForm
        parent={parent}
        onChange={patchParent}
        errors={parentErrors}
        txt={txt}
      />

      {formError && (
        <Typography color="error" variant="body2">
          {formError}
        </Typography>
      )}

      <Button
        variant="contained"
        size="large"
        onClick={goNext}
        sx={{
          alignSelf: { xs: "stretch", sm: "flex-start" },
          minWidth: 150,
        }}
      >
        {txt.next}
      </Button>
    </Stack>
  );
}
