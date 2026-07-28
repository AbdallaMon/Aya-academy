"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Box, Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { userMessagesCodes } from "@ayah/shared";
import {
  PhotoUpload,
  RHFPhoneField,
  RHFTextField,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useAuth } from "../../../hooks/useAuth.js";
import {
  buildEditableIdentityPayload,
  EMAIL_PATTERN,
  USERNAME_PATTERN,
} from "../../../shared/lib/userIdentity.js";
import { USERS_URL } from "../config/constant.js";

function defaults(user) {
  return {
    name: user?.name ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    nickname: user?.nickname ?? "",
    password: "",
    confirmPassword: "",
  };
}

export default function AccountProfileForm({
  user,
  txt,
  onSaved,
  isSelf = false,
}) {
  const { user: authUser, setAuthUser, logout } = useAuth();
  const {
    control,
    handleSubmit,
    reset,
    setError,
    getValues,
  } = useForm({ defaultValues: defaults(user) });

  useEffect(() => {
    reset(defaults(user));
  }, [user, reset]);

  function syncSelf(nextUser) {
    if (!isSelf || !nextUser) return;
    setAuthUser({
      ...authUser,
      ...nextUser,
      permissions: authUser?.permissions ?? [],
      hasActiveSubscription: authUser?.hasActiveSubscription,
    });
  }

  const updateReq = useRequest({
    url: USERS_URL,
    method: "put",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: (res) => {
      const emailChanged =
        String(res?.data?.email ?? "") !== String(user?.email ?? "");
      const usernameChanged =
        String(res?.data?.username ?? "") !== String(user?.username ?? "");
      if (
        isSelf &&
        (Boolean(getValues("password")) || emailChanged || usernameChanged)
      ) {
        logout();
        return;
      }
      syncSelf(res?.data);
      reset(defaults(res?.data ?? user));
      onSaved?.();
    },
    onError: (error) =>
      applyApiErrorsToForm(error, setError, {
        labelMap: {
          name: txt.nameLabel,
          email: txt.email,
          username: txt.usernameLabel,
          nickname: txt.nicknameLabel,
          password: txt.newPassword,
        },
        messageMap: {
          [userMessagesCodes.EMAIL_OR_USERNAME_REQUIRED]:
            txt.identityRequired,
          [userMessagesCodes.INVALID_EMAIL]: txt.invalidEmail,
          [userMessagesCodes.INVALID_USERNAME]: txt.invalidUsername,
          [userMessagesCodes.USERNAME_ALREADY_EXISTS]:
            txt.usernameAlreadyExists,
        },
        suppressFallbackToast: true,
      }),
  });

  const avatarReq = useRequest({
    url: USERS_URL,
    method: "patch",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: (res) => {
      syncSelf(res?.data);
      onSaved?.();
    },
  });

  function onPhotoUploaded(attachment) {
    if (!attachment?.id || !user?.id) return;
    avatarReq.fetchData(`${user.id}/avatar`, {
      attachmentId: Number(attachment.id),
    });
  }

  function submit(values) {
    const { email, username } = buildEditableIdentityPayload(values);
    if (!email && !username) {
      setError("email", { type: "validate", message: txt.identityRequired });
      setError("username", {
        type: "validate",
        message: txt.identityRequired,
      });
      return;
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      setError("email", { type: "validate", message: txt.invalidEmail });
      return;
    }
    if (username && !USERNAME_PATTERN.test(username)) {
      setError("username", {
        type: "validate",
        message: txt.invalidUsername,
      });
      return;
    }
    if (values.password && values.password.length < 6) {
      setError("password", { type: "validate", message: txt.passwordShort });
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError("confirmPassword", {
        type: "validate",
        message: txt.passwordsDontMatch,
      });
      return;
    }

    const payload = {
      name: values.name.trim(),
      email,
      username,
      phone: values.phone?.trim() || "",
      nickname: values.nickname?.trim() || null,
    };
    if (values.password) payload.password = values.password;
    updateReq.fetchData(String(user.id), payload);
  }

  const isStudent = user?.role === "STUDENT";
  const loading = updateReq.isLoading || avatarReq.isLoading;

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            {txt.photoTitle}
          </Typography>
          <PhotoUpload
            value={user?.avatar}
            onUploaded={onPhotoUploaded}
            disabled={loading}
            buttonLabel={txt.choosePhoto}
            uploadingLabel={txt.uploadingPhoto}
            hintLabel={txt.photoHint}
            invalidTypeLabel={txt.photoInvalidType}
            tooLargeLabel={txt.photoTooLarge}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
            {txt.accountDetailsTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {isStudent ? txt.childAccountHint : txt.parentAccountHint}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit(submit)}
            noValidate
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="name"
                  control={control}
                  label={txt.nameLabel}
                  rules={{ required: txt.required }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="username"
                  control={control}
                  label={txt.usernameLabel}
                  helperText={txt.usernameEditHint}
                  rules={{
                    validate: (value) =>
                      !value && !getValues("email")
                        ? txt.identityRequired
                        : !value ||
                            USERNAME_PATTERN.test(value.trim()) ||
                            txt.invalidUsername,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="email"
                  control={control}
                  label={txt.email}
                  type="email"
                  helperText={txt.emailRecoveryHint}
                  rules={{
                    validate: (value) =>
                      !value && !getValues("username")
                        ? txt.identityRequired
                        : !value ||
                            EMAIL_PATTERN.test(value.trim()) ||
                            txt.invalidEmail,
                  }}
                />
              </Grid>
              {!isStudent && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFPhoneField
                    name="phone"
                    control={control}
                    label={txt.phone}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="nickname"
                  control={control}
                  label={txt.nicknameLabel}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="password"
                  control={control}
                  label={txt.newPassword}
                  type="password"
                  rules={{
                    minLength: {
                      value: 6,
                      message: txt.passwordShort,
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.75 }}
                >
                  {txt.passwordLeaveBlank}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="confirmPassword"
                  control={control}
                  label={txt.confirmPassword}
                  type="password"
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {txt.saveAccount}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
