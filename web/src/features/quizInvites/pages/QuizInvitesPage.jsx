"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import { PERMISSIONS, USER_ROLES } from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { localePath } from "../../../i18n/routing.js";
import { DataTable, PageHeader } from "../../../shared/components/index.js";
import { INVITES_URL, buildLinkForToken } from "../config/constant.js";
import { useQuizInvitesText } from "../config/quizInvitesText.js";
import { buildInvitesColumns } from "../config/quizInvitesColumns.js";
import CreateInviteDialog from "../components/CreateInviteDialog.jsx";

export default function QuizInvitesPage() {
  const txt = useQuizInvitesText();
  const { lng } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission } = usePermission();

  const isParent = user?.role === USER_ROLES.PARENT;
  const canCreate = hasPermission(PERMISSIONS.QUIZ.CREATE_INVITE);
  // Admin reaches the list via CREATE_INVITE; parents via LIST (their own).
  const canSee = canCreate || hasPermission(PERMISSIONS.QUIZ.LIST);

  const {
    data,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    filters,
    setFilters,
    triggerRefetch,
  } = useRequest({
    url: INVITES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canSee,
  });

  const createDialog = useOpen();

  async function onCopyLink(row) {
    const link = buildLinkForToken(lng, row.token, localePath);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      showToast({ message: txt.copied, severity: "success" });
    } catch {
      /* clipboard unavailable */
    }
  }

  function onBuild(row) {
    router.push(localePath(lng, `/dashboard/quiz-build/${row.token}`));
  }

  const columns = useMemo(
    () =>
      buildInvitesColumns({
        txt,
        lng,
        onCopyLink,
        // Only parents get the "Build quiz" action.
        onBuild: isParent ? onBuild : undefined,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng, isParent],
  );

  if (!canSee) return null;

  return (
    <Box>
      <PageHeader
        title={isParent ? txt.pageTitleParent : txt.pageTitleAdmin}
        description={
          isParent ? txt.pageDescriptionParent : txt.pageDescriptionAdmin
        }
        createLabel={txt.create}
        onCreate={canCreate ? createDialog.open : undefined}
      />

      <DataTable
        initialRows={data || []}
        columns={columns}
        total={total}
        page={page}
        rowsPerPage={pageSize}
        setPage={setPage}
        setRowsPerPage={setPageSize}
        loading={isLoading}
        filters={filters}
        setFilters={setFilters}
        noContainer
      />

      <CreateInviteDialog
        open={createDialog.isOpen}
        onClose={createDialog.close}
        txt={txt}
        onSuccess={triggerRefetch}
      />
    </Box>
  );
}
