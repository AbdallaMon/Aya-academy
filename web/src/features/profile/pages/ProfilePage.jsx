"use client";

import { Box, Stack } from "@mui/material";
import { useAuth } from "../../../hooks/useAuth.js";
import { PageHeader } from "../../../shared/components/index.js";
import { PERMISSIONS } from "@ayah/shared";
import AccountProfileForm from "../../userDetail/components/AccountProfileForm.jsx";
import { useUserDetailText } from "../../userDetail/config/userDetailText.js";
import { usePermission } from "../../../hooks/usePermission.js";
import NotificationPreferencesForm from "../components/NotificationPreferencesForm.jsx";

export default function ProfilePage() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const txt = useUserDetailText();
  if (!user) return null;
  const canEditAccount = hasPermission(PERMISSIONS.USER.EDIT);

  return (
    <Box>
      <PageHeader
        title={txt.myProfileTitle}
        description={txt.myProfileDescription}
      />
      <Stack spacing={2}>
        {canEditAccount && (
          <AccountProfileForm user={user} txt={txt} isSelf />
        )}
        <NotificationPreferencesForm user={user} txt={txt} />
      </Stack>
    </Box>
  );
}
