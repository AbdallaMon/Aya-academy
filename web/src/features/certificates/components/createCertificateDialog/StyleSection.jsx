"use client";

// Style section of the create-certificate form: template motif, font style,
// accent presets + custom accent/background colors, and the emblem emoji.

import {
  Box,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { MdCheck } from "react-icons/md";
import { RHFTextField } from "../../../../shared/components/index.js";
import {
  TEMPLATE_KEYS,
  FONT_STYLES,
  ACCENT_PRESETS,
} from "../../config/constant.js";
import { FONT_LABEL_KEY } from "./constants.js";

export default function StyleSection({ control, values, setValue, txt }) {
  return (
    <>
      {/* Style section */}
      <Typography variant="overline" color="text.secondary">
        {txt.sectionStyle}
      </Typography>
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="templateKey"
            control={control}
            render={({ field }) => (
              <TextField {...field} select fullWidth label={txt.templateLabel}>
                {TEMPLATE_KEYS.map((k) => (
                  <MenuItem key={k} value={k}>
                    {txt[k] || k}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="fontStyle"
            control={control}
            render={({ field }) => (
              <TextField {...field} select fullWidth label={txt.fontLabel}>
                {FONT_STYLES.map((f) => (
                  <MenuItem key={f} value={f}>
                    {txt[FONT_LABEL_KEY[f]] || f}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        {/* Accent presets — quick color swatches. */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
            {txt.presetsLabel}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {ACCENT_PRESETS.map((color) => {
              const isActive =
                String(values.accent).toLowerCase() === color.toLowerCase();
              return (
                <Tooltip key={color} title={color}>
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue("accent", color, { shouldDirty: true })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setValue("accent", color, { shouldDirty: true });
                      }
                    }}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      border: "2px solid #fff",
                      outline: isActive
                        ? `2px solid ${color}`
                        : "2px solid transparent",
                      boxShadow: 1,
                    }}
                  >
                    {isActive && <MdCheck size={16} />}
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="accent"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="color"
                fullWidth
                label={txt.accentLabel}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="background"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="color"
                fullWidth
                label={txt.backgroundLabel}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <RHFTextField
            name="emoji"
            control={control}
            label={txt.emojiLabel}
            placeholder="🌟 🏆 🌙 🎈"
            slotProps={{ htmlInput: { maxLength: 4 } }}
          />
        </Grid>
      </Grid>
    </>
  );
}
