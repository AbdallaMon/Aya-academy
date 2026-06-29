"use client";

import { Grid, InputAdornment, TextField } from "@mui/material";
import { MdPerson, MdEmail } from "react-icons/md";
import { MuiTelInput } from "mui-tel-input";
import { PasswordField } from "../../../shared/components/index.js";
import { useBrowserCountry } from "../../../shared/lib/browserCountry.js";

export default function ParentDetailsForm({ parent, onChange, errors = {}, txt }) {
  const setField = (key) => (e) => onChange({ [key]: e.target.value });
  const country = useBrowserCountry();

  const adorn = (icon) => ({
    input: {
      startAdornment: (
        <InputAdornment position="start" sx={{ color: "text.disabled" }}>
          {icon}
        </InputAdornment>
      ),
    },
  });

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
          slotProps={adorn(<MdPerson size={18} />)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTelInput
          key={country ?? "pending"}
          label={txt.phone}
          value={parent.phone || ""}
          onChange={(value) => onChange({ phone: value })}
          defaultCountry={country}
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
          slotProps={adorn(<MdEmail size={18} />)}
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
