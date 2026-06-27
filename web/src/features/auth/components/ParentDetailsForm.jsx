"use client";

import { Grid, TextField } from "@mui/material";
import { PasswordField } from "../../../shared/components/index.js";

export default function ParentDetailsForm({ parent, onChange, errors = {}, txt }) {
  const setField = (key) => (e) => onChange({ [key]: e.target.value });

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label={txt.name}
          value={parent.name}
          onChange={setField("name")}
          error={Boolean(errors.name)}
          helperText={errors.name}
          fullWidth
          size="small"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label={txt.phone}
          value={parent.phone}
          onChange={setField("phone")}
          error={Boolean(errors.phone)}
          helperText={errors.phone}
          fullWidth
          size="small"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label={txt.email}
          type="email"
          value={parent.email}
          onChange={setField("email")}
          error={Boolean(errors.email)}
          helperText={errors.email}
          fullWidth
          size="small"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <PasswordField
          label={txt.password}
          value={parent.password}
          onChange={setField("password")}
          error={Boolean(errors.password)}
          helperText={errors.password}
          fullWidth
          size="small"
        />
      </Grid>
    </Grid>
  );
}
