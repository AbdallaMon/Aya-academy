"use client";

// Content section of the create-certificate form: student picker, template
// picker, optional badge award, template-path reason/photo notes, and the
// certificate title / subtitle / body / signature fields.

import {
  Alert,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { MdInfoOutline } from "react-icons/md";
import { RHFTextField } from "../../../../shared/components/index.js";
import BadgeChip from "../../../userDetail/components/BadgeChip.jsx";

export default function ContentSection({
  control,
  values,
  setValue,
  txt,
  lng,
  lockedStudentId,
  lockedStudentName,
  selectedStudent,
  students,
  templates,
  badges,
  selectedBadge,
  usingTemplate,
  requireTitle,
}) {
  return (
    <>
      {/* Content section */}
      <Typography variant="overline" color="text.secondary">
        {txt.sectionContent}
      </Typography>
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12 }}>
          {lockedStudentId ? (
            <TextField
              fullWidth
              label={txt.studentLabel}
              value={lockedStudentName || selectedStudent?.name || ""}
              disabled
            />
          ) : (
            <Controller
              name="studentId"
              control={control}
              rules={{ required: txt.required }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  required
                  label={txt.studentLabel}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  <MenuItem value="" disabled>
                    {txt.studentPlaceholder}
                  </MenuItem>
                  {students.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.name}
                      {s.nickname ? ` (${s.nickname})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}
        </Grid>

        {/* Template picker — default to the isDefault template. */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="templateId"
            control={control}
            render={({ field }) => (
              <TextField {...field} select fullWidth label={txt.template}>
                <MenuItem value="">{txt.customNoTemplate}</MenuItem>
                {templates.map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {(lng === "en" ? t.nameEn : t.nameAr) || t.nameAr || t.nameEn || t.key}
                    {t.isDefault ? " ★" : ""}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        {/* ── Optional: award a badge with this certificate ── */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="awardBadge"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      // Clear any picked badge when turning the toggle off.
                      if (!e.target.checked) setValue("badgeId", "");
                    }}
                  />
                }
                label={txt.awardBadgeToggle}
              />
            )}
          />
        </Grid>
        {values.awardBadge && (
          <Grid size={{ xs: 12 }}>
            <Controller
              name="badgeId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label={txt.selectBadge}
                  helperText={txt.awardBadgeHint}
                  slotProps={{
                    select: {
                      displayEmpty: true,
                      renderValue: () =>
                        selectedBadge ? (
                          <BadgeChip badge={selectedBadge} lng={lng} size="sm" />
                        ) : (
                          <Typography component="span" color="text.secondary">
                            {txt.selectBadge}
                          </Typography>
                        ),
                    },
                  }}
                >
                  {badges.length === 0 ? (
                    <MenuItem value="" disabled>
                      {txt.noBadges}
                    </MenuItem>
                  ) : (
                    badges.map((b) => (
                      <MenuItem key={b.id} value={String(b.id)}>
                        <BadgeChip badge={b} lng={lng} size="sm" />
                      </MenuItem>
                    ))
                  )}
                </TextField>
              )}
            />
          </Grid>
        )}

        {/* ── Template path: dynamic reason + photo ── */}
        {usingTemplate && (
          <>
            <Grid size={{ xs: 12 }}>
              <Alert icon={<MdInfoOutline />} severity="info" sx={{ py: 0.25 }}>
                {txt.templateTextsNote}
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField name="reasonAr" control={control} label={txt.reasonAr} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField name="reasonEn" control={control} label={txt.reasonEn} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                {txt.reasonHint}
              </Typography>
              <Alert icon={<MdInfoOutline />} severity="info" sx={{ py: 0.25 }}>
                {txt.photoAutoNote}
              </Alert>
            </Grid>
          </>
        )}

        {/* Certificate title (ar/en). Always available — required only for
            the free-form path; optional override when a template supplies
            the heading. */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="titleAr"
            control={control}
            rules={{ validate: requireTitle }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label={
                  usingTemplate ? txt.titleArOptionalLabel : txt.titleArLabel
                }
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ||
                  (usingTemplate ? txt.titleOptionalHint : undefined)
                }
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="titleEn"
            control={control}
            rules={{ validate: requireTitle }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label={
                  usingTemplate ? txt.titleEnOptionalLabel : txt.titleEnLabel
                }
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        {!usingTemplate && (
        <Grid size={{ xs: 12, sm: 6 }}>
          <RHFTextField name="subtitleAr" control={control} label={txt.subtitleArLabel} />
        </Grid>
        )}
        {!usingTemplate && (
        <Grid size={{ xs: 12, sm: 6 }}>
          <RHFTextField name="subtitleEn" control={control} label={txt.subtitleEnLabel} />
        </Grid>
        )}

        {!usingTemplate && (
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="bodyAr"
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth multiline minRows={2} label={txt.bodyArLabel} />
            )}
          />
        </Grid>
        )}
        {!usingTemplate && (
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="bodyEn"
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth multiline minRows={2} label={txt.bodyEnLabel} />
            )}
          />
        </Grid>
        )}

        {!usingTemplate && (
        <Grid size={{ xs: 12 }}>
          <RHFTextField
            name="signature"
            control={control}
            label={txt.signatureFieldLabel}
            placeholder={txt.defaultSignature}
          />
        </Grid>
        )}
      </Grid>
    </>
  );
}
