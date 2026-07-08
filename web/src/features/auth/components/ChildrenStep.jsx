"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { MdAdd } from "react-icons/md";
import ChildEnrollCard from "./ChildEnrollCard.jsx";

/**
 * ChildrenStep — RegisterWizard step 0: one ChildEnrollCard per child, an
 * add-child button, the inline form error and the "next" action. Pure
 * presentational extraction; all state/handlers stay in RegisterWizard.
 */
export default function ChildrenStep({
  childrenList,
  plans,
  childErrors,
  patchChild,
  removeChild,
  addChild,
  formError,
  goNext,
  txt,
  lng,
}) {
  return (
    <Stack spacing={3}>
      {childrenList.map((child, i) => (
        <ChildEnrollCard
          key={i}
          index={i}
          child={child}
          plans={plans}
          onChange={(patch) => patchChild(i, patch)}
          onRemove={() => removeChild(i)}
          canRemove={childrenList.length > 1}
          errors={childErrors[i] || {}}
          txt={txt}
          lng={lng}
        />
      ))}
      <Button
        variant="outlined"
        onClick={addChild}
        startIcon={<MdAdd />}
        fullWidth
        sx={{
          borderStyle: "dashed",
          borderWidth: 2,
          py: 1.5,
          fontWeight: 700,
          "&:hover": { borderStyle: "dashed", borderWidth: 2 },
        }}
      >
        {txt.addChild}
      </Button>
      {formError && (
        <Typography color="error" variant="body2">
          {formError}
        </Typography>
      )}
      <Box>
        <Button
          variant="contained"
          size="large"
          onClick={goNext}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {txt.next}
        </Button>
      </Box>
    </Stack>
  );
}
