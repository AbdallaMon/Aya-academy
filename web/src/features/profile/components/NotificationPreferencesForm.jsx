"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { RHFSwitch } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useAuth } from "../../../hooks/useAuth.js";

function defaults(user) {
  return {
    inAppNotificationsEnabled: user?.inAppNotificationsEnabled !== false,
    emailNotificationsEnabled: user?.emailNotificationsEnabled !== false,
  };
}

export default function NotificationPreferencesForm({ user, txt }) {
  const { setAuthUser } = useAuth();
  const { control, handleSubmit, reset } = useForm({
    defaultValues: defaults(user),
  });

  useEffect(() => {
    reset(defaults(user));
  }, [user, reset]);

  const request = useRequest({
    url: "users/me/notification-preferences",
    method: "patch",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: (response) => {
      const preferences = response?.data;
      if (!preferences) return;
      setAuthUser({ ...user, ...preferences });
      reset(defaults({ ...user, ...preferences }));
    },
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
          {txt.notificationPreferencesTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {txt.notificationPreferencesDescription}
        </Typography>

        <Stack
          component="form"
          onSubmit={handleSubmit((values) => request.fetchData(null, values))}
          spacing={1.5}
          noValidate
        >
          <Stack spacing={0}>
            <RHFSwitch
              name="inAppNotificationsEnabled"
              control={control}
              label={txt.inAppNotificationsLabel}
              disabled={request.isLoading}
            />
            <Typography variant="caption" color="text.secondary">
              {txt.inAppNotificationsHint}
            </Typography>
          </Stack>

          <Stack spacing={0}>
            <RHFSwitch
              name="emailNotificationsEnabled"
              control={control}
              label={txt.emailNotificationsLabel}
              disabled={request.isLoading}
            />
            <Typography variant="caption" color="text.secondary">
              {user?.email
                ? txt.emailNotificationsHint
                : txt.emailNotificationsNoEmailHint}
            </Typography>
          </Stack>

          <Button
            type="submit"
            variant="contained"
            disabled={request.isLoading}
            sx={{ alignSelf: "flex-start", mt: 1 }}
          >
            {txt.saveNotificationPreferences}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
