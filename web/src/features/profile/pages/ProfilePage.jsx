"use client";

import { Box } from "@mui/material";
import { useAuth } from "../../../hooks/useAuth.js";
import { PageHeader } from "../../../shared/components/index.js";
import { PERMISSIONS } from "@ayah/shared";
import AccountProfileForm from "../../userDetail/components/AccountProfileForm.jsx";
import { useUserDetailText } from "../../userDetail/config/userDetailText.js";
import { usePermission } from "../../../hooks/usePermission.js";

export default function ProfilePage() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const txt = useUserDetailText();
  if (!user || !hasPermission(PERMISSIONS.USER.EDIT)) return null;

  return (
    <Box>
      <PageHeader
        title={txt.myProfileTitle}
        description={txt.myProfileDescription}
      />
      <AccountProfileForm user={user} txt={txt} isSelf />
    </Box>
  );
}
