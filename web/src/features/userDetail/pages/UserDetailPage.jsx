"use client";

import { useCallback, useMemo } from "react";
import { Box, CircularProgress, Stack } from "@mui/material";
import { usePathname, useSearchParams } from "next/navigation";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useConfirm, EmptyState } from "../../../shared/components/index.js";
import { USERS_URL } from "../config/constant.js";
import { useUserDetailText } from "../config/userDetailText.js";
import UserDetailHeader from "../components/UserDetailHeader.jsx";
import UserDetailTabs from "../components/UserDetailTabs.jsx";
import StudentOverviewTab from "../components/StudentOverviewTab.jsx";
import BadgesTab from "../components/BadgesTab.jsx";
import CertificatesTab from "../components/CertificatesTab.jsx";
import GamesTab from "../components/GamesTab.jsx";
import EvaluationsTab from "../components/EvaluationsTab.jsx";
import SubscriptionsTab from "../components/SubscriptionsTab.jsx";
import ParentChildrenTab from "../components/ParentChildrenTab.jsx";
import ProfileTab from "../components/ProfileTab.jsx";
import AwardBadgeDialog from "../components/AwardBadgeDialog.jsx";
import GrantPointsDialog from "../components/GrantPointsDialog.jsx";
import SendReportDialog from "../components/SendReportDialog.jsx";
import SendInviteDialog from "../components/SendInviteDialog.jsx";
import AddSubscriptionDialog from "../components/AddSubscriptionDialog.jsx";
import BanDialog from "../components/BanDialog.jsx";

export default function UserDetailPage({ userId }) {
  const txt = useUserDetailText();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();

  const canView = hasPermission(PERMISSIONS.USER.VIEW);
  const canSetLevel = hasPermission(PERMISSIONS.USER.SET_LEVEL);
  const canBan = hasPermission(PERMISSIONS.USER.BAN);
  const canAwardBadge = hasPermission(PERMISSIONS.BADGE.AWARD);
  const canRevokeBadge = hasPermission(PERMISSIONS.BADGE.REVOKE);
  const canGrantPoints = hasPermission(PERMISSIONS.POINT.AWARD);
  const canSendReport = hasPermission(PERMISSIONS.REPORT.CREATE);
  const canSendInvite = hasPermission(PERMISSIONS.QUIZ.CREATE_INVITE);
  const canAddSub = hasPermission(PERMISSIONS.SUBSCRIPTION.CREATE);
  const canCancelSub = hasPermission(PERMISSIONS.SUBSCRIPTION.CANCEL);
  const canEditSub = hasPermission(PERMISSIONS.SUBSCRIPTION.EDIT);
  const canAssignGame = hasPermission(PERMISSIONS.GAME.ASSIGN);
  const canCreateCert = hasPermission(PERMISSIONS.CERTIFICATE.CREATE);

  const {
    data: overview,
    isLoading,
    error,
    triggerRefetch,
  } = useRequest({
    url: `${USERS_URL}/${userId}/overview`,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  const user = overview?.user;
  const role = user?.role;
  const isStudent = role === USER_ROLES.STUDENT;
  const isParent = role === USER_ROLES.PARENT;

  // Unban goes through a simple confirm; ban uses a reason dialog.
  const unbanMut = useMultiRequest({
    url: `${USERS_URL}/${userId}`,
    onSuccess: () => triggerRefetch(),
  });

  // ── Dialog open-state ─────────────────────────────────────────────────────
  const awardDialog = useOpen();
  const pointsDialog = useOpen();
  const reportDialog = useOpen();
  const inviteDialog = useOpen();
  const subscriptionDialog = useOpen();
  const banDialog = useOpen();

  async function onUnban() {
    const ok = await confirm({ title: txt.unbanConfirm });
    if (!ok) return;
    await unbanMut.postRequest("unban");
  }

  // ── Tabs (role-adaptive) ──────────────────────────────────────────────────
  const validTabs = useMemo(() => {
    if (isStudent) {
      return ["overview", "badges", "certificates", "games", "evaluations", "subscriptions"];
    }
    if (isParent) return ["overview", "children"];
    return ["overview"];
  }, [isStudent, isParent]);

  const sections = useMemo(() => {
    if (isStudent) {
      return [
        { key: "overview", label: txt.tabOverview },
        { key: "badges", label: txt.tabBadges, count: overview?.badges?.length ?? 0 },
        { key: "certificates", label: txt.tabCertificates },
        { key: "games", label: txt.tabGames },
        { key: "evaluations", label: txt.tabEvaluations },
        { key: "subscriptions", label: txt.tabSubscriptions },
      ];
    }
    if (isParent) {
      return [
        { key: "overview", label: txt.tabOverview },
        { key: "children", label: txt.tabChildren, count: overview?.children?.length ?? 0 },
      ];
    }
    return [{ key: "overview", label: txt.tabOverview }];
  }, [isStudent, isParent, overview, txt]);

  const pathname = usePathname();
  const sp = useSearchParams();
  const rawTab = sp.get("tab");
  const activeTab = validTabs.includes(rawTab) ? rawTab : "overview";
  const getHref = useCallback(
    (key) => {
      const params = new URLSearchParams(sp.toString());
      params.set("tab", key);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, sp],
  );

  // ── States ────────────────────────────────────────────────────────────────
  if (!canView) return null;

  if (isLoading && !overview) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error || !user) {
    return <EmptyState title={txt.notFound} body={txt.notFoundBody} icon={<Box sx={{ fontSize: 48 }}>🔍</Box>} />;
  }

  function renderActive() {
    switch (activeTab) {
      case "overview":
        if (isStudent) {
          return (
            <StudentOverviewTab
              overview={overview}
              txt={txt}
              canSetLevel={canSetLevel}
              onRefetch={triggerRefetch}
            />
          );
        }
        return <ProfileTab overview={overview} txt={txt} />;
      case "badges":
        return (
          <BadgesTab
            overview={overview}
            studentId={userId}
            txt={txt}
            canAward={canAwardBadge}
            canRevoke={canRevokeBadge}
            canGrantPoints={canGrantPoints}
            onAward={awardDialog.open}
            onGrantPoints={pointsDialog.open}
            onRefetch={triggerRefetch}
          />
        );
      case "certificates":
        return (
          <CertificatesTab
            studentId={userId}
            studentName={user.name}
            txt={txt}
            canCreate={canCreateCert}
          />
        );
      case "games":
        return (
          <GamesTab
            studentId={userId}
            studentName={user.name}
            txt={txt}
            canAssign={canAssignGame}
          />
        );
      case "evaluations":
        return <EvaluationsTab overview={overview} txt={txt} />;
      case "subscriptions":
        return (
          <SubscriptionsTab
            overview={overview}
            txt={txt}
            canAdd={canAddSub}
            canCancel={canCancelSub}
            canEdit={canEditSub}
            onAdd={subscriptionDialog.open}
            onRefetch={triggerRefetch}
          />
        );
      case "children":
        return <ParentChildrenTab overview={overview} txt={txt} canView={canView} />;
      default:
        return null;
    }
  }

  // For a STUDENT detail page, the "send invite" target is the first linked
  // parent (invites are addressed to a parent). For a PARENT page it's the user.
  const inviteParent = isParent
    ? { id: user.id, name: user.name }
    : overview?.parents?.[0]
      ? { id: overview.parents[0].id, name: overview.parents[0].name }
      : null;

  return (
    <Box>
      <UserDetailHeader
        user={user}
        txt={txt}
        can={{
          ban: canBan,
          sendReport: canSendReport && isStudent,
          sendInvite: canSendInvite && Boolean(inviteParent),
        }}
        actions={{
          onSendReport: reportDialog.open,
          onSendInvite: inviteDialog.open,
          onBan: banDialog.open,
          onUnban,
        }}
      />

      <UserDetailTabs sections={sections} activeKey={activeTab} getHref={getHref} />

      <Box sx={{ minHeight: 280 }}>{renderActive()}</Box>

      {/* ── Action dialogs ─────────────────────────────────────────────────── */}
      {isStudent && (
        <>
          <AwardBadgeDialog
            open={awardDialog.isOpen}
            onClose={awardDialog.close}
            studentId={userId}
            txt={txt}
            onSuccess={triggerRefetch}
          />
          <GrantPointsDialog
            open={pointsDialog.isOpen}
            onClose={pointsDialog.close}
            studentId={userId}
            txt={txt}
            onSuccess={triggerRefetch}
          />
          <SendReportDialog
            open={reportDialog.isOpen}
            onClose={reportDialog.close}
            studentId={userId}
            studentName={user.name}
            txt={txt}
            onSuccess={triggerRefetch}
          />
          <AddSubscriptionDialog
            open={subscriptionDialog.isOpen}
            onClose={subscriptionDialog.close}
            studentId={userId}
            studentName={user.name}
            txt={txt}
            onSuccess={triggerRefetch}
          />
        </>
      )}

      {inviteParent && (
        <SendInviteDialog
          open={inviteDialog.isOpen}
          onClose={inviteDialog.close}
          parentId={inviteParent.id}
          parentName={inviteParent.name}
          txt={txt}
          onSuccess={triggerRefetch}
        />
      )}

      <BanDialog
        open={banDialog.isOpen}
        onClose={banDialog.close}
        userId={userId}
        txt={txt}
        onSuccess={triggerRefetch}
      />
    </Box>
  );
}
