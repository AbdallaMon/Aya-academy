"use client";

import { useForm } from "react-hook-form";
import { Stack } from "@mui/material";
import { FormDialog, RHFTextField } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { WHITEBOARD_URL } from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";

// Create a new whiteboard session (title only → DRAFT / PRIVATE).
export default function CreateWhiteboardDialog({ open, onClose, onCreated }) {
  const txt = useWhiteboardText();
  const { control, handleSubmit, reset } = useForm({ defaultValues: { title: "" } });
  const { fetchData, isLoading } = useRequest({
    url: WHITEBOARD_URL,
    method: "post",
    autoFetch: false,
    shouldAutoToast: true,
  });

  const submit = handleSubmit(async (values) => {
    const res = await fetchData(undefined, { title: values.title.trim() });
    if (res?.success) {
      reset();
      onClose?.();
      onCreated?.(res.data);
    }
  });

  const close = () => {
    if (isLoading) return;
    reset();
    onClose?.();
  };

  return (
    <FormDialog
      open={open}
      onClose={close}
      title={txt.createBtn}
      onSubmit={submit}
      submitText={txt.createBtn}
      cancelText={txt.cancel}
      loading={isLoading}
      maxWidth="xs"
    >
      <Stack spacing={2} component="form" onSubmit={submit}>
        <RHFTextField
          name="title"
          control={control}
          label={txt.titleLabel}
          rules={{ required: true }}
          autoFocus
        />
      </Stack>
    </FormDialog>
  );
}
