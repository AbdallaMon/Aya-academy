"use client";

/**
 * LessonPlanFields — RHF-bound plan section embedded in the session form.
 *
 * Receives the AppForm "custom" field signature:
 *   { control, name, label, rules, setValue, getValues, watch, ...rest }
 *
 * Registers three sub-paths on the parent form:
 *   plan.memorize  — array of { surahId, wholeSurah, fromAyah, toAyah, ayahCount }
 *   plan.review    — same shape
 *   plan.homework  — string
 */

import {
  Autocomplete,
  Box,
  Divider,
  FormHelperText,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdAdd, MdDelete } from "react-icons/md";
import { useFieldArray, Controller } from "react-hook-form";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { QURAN_SURAHS_URL } from "../../quran/config/constant.js";

// ---------------------------------------------------------------------------
// AssignmentRow — one MEMORIZE or REVIEW row
// ---------------------------------------------------------------------------
function AssignmentRow({ control, watch, setValue, prefix, index, onRemove, surahs, txt }) {
  const wholeSurah = watch(`${prefix}.${index}.wholeSurah`);
  const ayahCount = watch(`${prefix}.${index}.ayahCount`) || 0;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems="flex-start"
      sx={{ mb: 1 }}
    >
      {/* Surah autocomplete */}
      <Controller
        name={`${prefix}.${index}.surahId`}
        control={control}
        rules={{ required: txt.surahRequired }}
        render={({ field, fieldState }) => (
          <Autocomplete
            options={surahs}
            getOptionLabel={(opt) => (opt ? `${opt.number}. ${opt.nameAr}` : "")}
            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
            value={field.value ? (surahs.find((s) => s.id === field.value) || null) : null}
            onChange={(_, newVal) => {
              field.onChange(newVal?.id ?? null);
              setValue(`${prefix}.${index}.ayahCount`, newVal?.ayahCount ?? 0);
              setValue(`${prefix}.${index}.fromAyah`, "");
              setValue(`${prefix}.${index}.toAyah`, "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={txt.surahLabel}
                size="small"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{ minWidth: 220 }}
              />
            )}
          />
        )}
      />

      {/* Whole-surah toggle */}
      <Controller
        name={`${prefix}.${index}.wholeSurah`}
        control={control}
        render={({ field }) => (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
            <Switch
              size="small"
              checked={field.value === undefined ? true : !!field.value}
              onChange={(e) => {
                field.onChange(e.target.checked);
                if (e.target.checked) {
                  setValue(`${prefix}.${index}.fromAyah`, "");
                  setValue(`${prefix}.${index}.toAyah`, "");
                }
              }}
            />
            <Typography variant="caption" noWrap>
              {txt.wholeSurah}
            </Typography>
          </Stack>
        )}
      />

      {/* Ayah range — visible only when NOT whole-surah */}
      {wholeSurah === false && (
        <>
          <Controller
            name={`${prefix}.${index}.fromAyah`}
            control={control}
            rules={{
              required: txt.ayahRequired,
              min: { value: 1, message: txt.ayahMin },
              max: ayahCount ? { value: ayahCount, message: `${txt.ayahMax} ${ayahCount}` } : undefined,
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                type="number"
                label={txt.fromAyah}
                size="small"
                inputProps={{ min: 1, max: ayahCount || undefined }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{ width: 100 }}
              />
            )}
          />
          <Controller
            name={`${prefix}.${index}.toAyah`}
            control={control}
            rules={{
              required: txt.ayahRequired,
              min: { value: 1, message: txt.ayahMin },
              max: ayahCount ? { value: ayahCount, message: `${txt.ayahMax} ${ayahCount}` } : undefined,
              validate: (value) => {
                // Cross-field guard: toAyah must be >= fromAyah for this same row.
                // Only meaningful while the range is active (not whole-surah) and
                // both values are present.
                const from = watch(`${prefix}.${index}.fromAyah`);
                if (value === "" || value == null) return true;
                if (from === "" || from == null) return true;
                return Number(value) >= Number(from) || txt.fromExceedsTo;
              },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                type="number"
                label={txt.toAyah}
                size="small"
                inputProps={{ min: 1, max: ayahCount || undefined }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{ width: 100 }}
              />
            )}
          />
        </>
      )}

      <Tooltip title={txt.removeRow}>
        <IconButton
          size="small"
          color="error"
          onClick={onRemove}
          aria-label={txt.removeRow}
          sx={{ mt: 0.5 }}
        >
          <MdDelete />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// AssignmentSection — headed group for MEMORIZE or REVIEW
// ---------------------------------------------------------------------------
function AssignmentSection({ control, watch, setValue, prefix, sectionLabel, addLabel, surahs, txt }) {
  const { fields, append, remove } = useFieldArray({ control, name: prefix });

  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {sectionLabel}
        </Typography>
        <Tooltip title={addLabel}>
          <IconButton
            size="small"
            color="primary"
            onClick={() =>
              append({ surahId: null, wholeSurah: true, fromAyah: "", toAyah: "", ayahCount: 0 })
            }
          >
            <MdAdd />
          </IconButton>
        </Tooltip>
      </Stack>

      {fields.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {txt.noRows}
        </Typography>
      )}

      {fields.map((row, idx) => (
        <AssignmentRow
          key={row.id}
          control={control}
          watch={watch}
          setValue={setValue}
          prefix={prefix}
          index={idx}
          onRemove={() => remove(idx)}
          surahs={surahs}
          txt={txt}
        />
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// LessonPlanFields — the AppForm "custom" component
// ---------------------------------------------------------------------------
export default function LessonPlanFields({ control, watch, setValue, txt: txtProp }) {
  // Fetch surah list once on mount
  const { data: surahs, isLoading: surahsLoading } = useRequest({
    url: QURAN_SURAHS_URL,
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  const surahList = surahs || [];
  const txt = txtProp || {};

  return (
    <Box sx={{ mt: 1 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        {txt.planTitle}
      </Typography>

      {surahsLoading && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          {txt.loadingSurahs}
        </Typography>
      )}

      {/* MEMORIZE section */}
      <AssignmentSection
        control={control}
        watch={watch}
        setValue={setValue}
        prefix="plan.memorize"
        sectionLabel={txt.memorizeSection}
        addLabel={txt.addMemorize}
        surahs={surahList}
        txt={txt}
      />

      {/* REVIEW section */}
      <AssignmentSection
        control={control}
        watch={watch}
        setValue={setValue}
        prefix="plan.review"
        sectionLabel={txt.reviewSection}
        addLabel={txt.addReview}
        surahs={surahList}
        txt={txt}
      />

      <Divider sx={{ mb: 2 }} />

      {/* Homework textarea */}
      <Controller
        name="plan.homework"
        control={control}
        defaultValue=""
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value ?? ""}
            label={txt.homeworkLabel}
            fullWidth
            multiline
            minRows={3}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <FormHelperText sx={{ mt: 0.5 }}>{txt.planOptional}</FormHelperText>
    </Box>
  );
}
