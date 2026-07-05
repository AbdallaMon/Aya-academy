"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  Alert,
  Autocomplete,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { DEFAULT_APP_SETTINGS } from "@aya/shared";
import { FormDialog, RHFTextField } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import {
  WHITEBOARD_URL,
  STUDENTS_PICKER_URL,
  STUDENTS_PICKER_PARAMS,
} from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";

const nameOf = (u) => u?.nickname || u?.name || "";

// Create a whiteboard session that opens immediately: title + attendees +
// public/private are all chosen up front, then we go straight to the session.
export default function CreateWhiteboardDialog({ open, onClose, onCreated }) {
  const txt = useWhiteboardText();
  const { lng } = useTranslation();
  const router = useRouter();
  const { control, handleSubmit, reset } = useForm({ defaultValues: { title: "" } });
  const [selected, setSelected] = useState([]);
  const [isPublic, setIsPublic] = useState(false);

  const { data: students } = useRequest({
    url: STUDENTS_PICKER_URL,
    method: "get",
    isPaginated: true,
    autoFetch: open,
    initialParams: STUDENTS_PICKER_PARAMS,
    syncToUrl: false,
  });

  // Show the teacher the current image-retention window (configurable in Settings).
  const { data: settings } = useRequest({
    url: "settings",
    method: "get",
    autoFetch: open,
    syncToUrl: false,
  });
  const retentionDays =
    settings?.whiteboardRetentionDays ?? DEFAULT_APP_SETTINGS.whiteboardRetentionDays;

  const { fetchData, isLoading } = useRequest({
    url: WHITEBOARD_URL,
    method: "post",
    autoFetch: false,
    shouldAutoToast: true,
  });

  const resetAll = () => {
    reset();
    setSelected([]);
    setIsPublic(false);
  };

  const submit = handleSubmit(async (values) => {
    const res = await fetchData(undefined, {
      title: values.title.trim(),
      studentIds: selected.map((s) => s.id),
      isPublic,
    });
    if (res?.success) {
      resetAll();
      onClose?.();
      onCreated?.(res.data);
      // Straight to the session so the teacher can open the board.
      if (res.data?.id) {
        router.push(localePath(lng, `/dashboard/whiteboard/${res.data.id}`));
      }
    }
  });

  const close = () => {
    if (isLoading) return;
    resetAll();
    onClose?.();
  };

  return (
    <FormDialog
      open={open}
      onClose={close}
      title={txt.createTitle}
      subtitle={txt.createSubtitle}
      onSubmit={submit}
      submitText={txt.createBtn}
      cancelText={txt.cancel}
      loading={isLoading}
      maxWidth="sm"
    >
      <Stack spacing={2.5} component="form" onSubmit={submit}>
        <RHFTextField
          name="title"
          control={control}
          label={txt.titleLabel}
          rules={{ required: true }}
          autoFocus
        />

        <Stack spacing={0.5}>
          <Autocomplete
            multiple
            options={students || []}
            value={selected}
            onChange={(_e, v) => setSelected(v)}
            getOptionLabel={nameOf}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(params) => (
              <TextField {...params} label={txt.studentsLabel} placeholder={txt.addStudent} />
            )}
          />
          <Typography variant="caption" color="text.secondary">
            {txt.studentsHint}
          </Typography>
        </Stack>

        <FormControlLabel
          control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
          label={
            <Stack>
              <Typography>{txt.publicLabel}</Typography>
              <Typography variant="caption" color="text.secondary">
                {isPublic ? txt.publicOnHint : txt.publicOffHint}
              </Typography>
            </Stack>
          }
        />

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {txt.retentionNote(retentionDays)}
        </Alert>
      </Stack>
    </FormDialog>
  );
}
