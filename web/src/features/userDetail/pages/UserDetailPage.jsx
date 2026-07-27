"use client";

import { useCallback, useMemo } from "react";
import { Box, CircularProgress, Stack } from "@mui/material";
import { usePathname, useSearchParams } from "next/navigation";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useConfirm, EmptyState, SubscriptionLockedState } from "../../../shared/components/index.js";
import { USERS_URL } from "../config/constant.js";
import { useUserDetailText } from "../config/userDetailText.js";
import UserDetailHeader from "../components/UserDetailHeader.jsx";
import UserDetailTabs from "../components/UserDetailTabs.jsx";
import StudentOverviewTab from "../components/StudentOverviewTab.jsx";
import BadgesTab from "../components/BadgesTab.jsx";
import CertificatesTab from "../components/CertificatesTab.jsx";
import GamesTab from "../components/GamesTab.jsx";
import EvaluationsTab from "../components/EvaluationsTab.jsx";
import SubscriptionsPage from "../../subscriptions/pages/SubscriptionsPage.jsx";
import ParentChildrenTab from "../components/ParentChildrenTab.jsx";
import ProfileTab from "../components/ProfileTab.jsx";
import AwardBadgeDialog from "../components/AwardBadgeDialog.jsx";
import GrantPointsDialog from "../components/GrantPointsDialog.jsx";
import SendReportDialog from "../components/SendReportDialog.jsx";
import SendInviteDialog from "../components/SendInviteDialog.jsx";
import BanDialog from "../components/BanDialog.jsx";
import AccountProfileForm from "../components/AccountProfileForm.jsx";

export default function UserDetailPage({ userId }) {
  const txt = useUserDetailText();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();
  const { user: viewer } = useAuth();

  const canView = hasPermission(PERMISSIONS.USER.VIEW);
  const canSetLevel = hasPermission(PERMISSIONS.USER.SET_LEVEL);
  const canBan = hasPermission(PERMISSIONS.USER.BAN);
  const canAwardBadge = hasPermission(PERMISSIONS.BADGE.AWARD);
  const canRevokeBadge = hasPermission(PERMISSIONS.BADGE.REVOKE);
  const canGrantPoints = hasPermission(PERMISSIONS.POINT.AWARD);
  const canSendReport = hasPermission(PERMISSIONS.REPORT.CREATE);
  const canSendInvite = hasPermission(PERMISSIONS.QUIZ.CREATE_INVITE);
  const canAssignGame = hasPermission(PERMISSIONS.GAME.ASSIGN);
  const canCreateCert = hasPermission(PERMISSIONS.CERTIFICATE.CREATE);
  const canEditProfile = hasPermission(PERMISSIONS.USER.EDIT);

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
  // The games tab is an admin-only surface (assign/remove games). A parent
  // viewing their child should never see it.
  const viewerIsParent = viewer?.role === USER_ROLES.PARENT;

  // A parent viewing an INACTIVE child sees identity + certificates + reports +
  // subscriptions, but not the child's stats/achievements (overview/badges/
  // games tabs). Admin is never subscription-gated.
  const lockChildAchievements =
    viewer?.role === USER_ROLES.PARENT &&
    isStudent &&
    overview?.isActive === false;

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
  const banDialog = useOpen();

  async function onUnban() {
    const ok = await confirm({ title: txt.unbanConfirm });
    if (!ok) return;
    await unbanMut.postRequest("unban");
  }

  // ── Tabs (role-adaptive) ──────────────────────────────────────────────────
  const validTabs = useMemo(() => {
    if (isStudent) {
      const tabs = [
        "overview",
        ...(canEditProfile ? ["profile"] : []),
        "badges",
        "certificates",
        "games",
        "evaluations",
        "subscriptions",
      ];
      return viewerIsParent ? tabs.filter((t) => t !== "games") : tabs;
    }
    if (isParent) {
      return ["overview", ...(canEditProfile ? ["profile"] : []), "children"];
    }
    return ["overview", ...(canEditProfile ? ["profile"] : [])];
  }, [isStudent, isParent, viewerIsParent, canEditProfile]);

  const sections = useMemo(() => {
    if (isStudent) {
      const tabs = [
        { key: "overview", label: txt.tabOverview },
        ...(canEditProfile
          ? [{ key: "profile", label: txt.tabProfile }]
          : []),
        { key: "badges", label: txt.tabBadges, count: overview?.badges?.length ?? 0 },
        { key: "certificates", label: txt.tabCertificates },
        { key: "games", label: txt.tabGames },
        { key: "evaluations", label: txt.tabEvaluations },
        { key: "subscriptions", label: txt.tabSubscriptions },
      ];
      return viewerIsParent ? tabs.filter((t) => t.key !== "games") : tabs;
    }
    if (isParent) {
      return [
        { key: "overview", label: txt.tabOverview },
        ...(canEditProfile
          ? [{ key: "profile", label: txt.tabProfile }]
          : []),
        { key: "children", label: txt.tabChildren, count: overview?.children?.length ?? 0 },
      ];
    }
    return [
      { key: "overview", label: txt.tabOverview },
      ...(canEditProfile
        ? [{ key: "profile", label: txt.tabProfile }]
        : []),
    ];
  }, [isStudent, isParent, viewerIsParent, canEditProfile, overview, txt]);

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
    // Parent viewing an inactive child: stats/achievements tabs are locked.
    if (lockChildAchievements && ["overview", "badges", "games"].includes(activeTab)) {
      // Multi-sub aware: pending when any subscription is awaiting payment
      // (PENDING/UPCOMING); falls back to the legacy scalar state.
      const childPending = overview?.subscriptions
        ? overview.subscriptions.some((s) =>
            ["PENDING", "UPCOMING"].includes(s.status),
          )
        : overview?.subscriptionState === "PENDING";
      const subHref = overview?.latestSubscriptionId
        ? `/dashboard/subscriptions/${overview.latestSubscriptionId}`
        : null;
      return (
        <SubscriptionLockedState
          variant="parent"
          childName={user.nickname || user.name}
          pending={childPending}
          subscriptionHref={subHref}
          renewHref={
            overview?.latestSubscriptionId
              ? `/dashboard/subscriptions/${overview.latestSubscriptionId}`
              : "/dashboard/children"
          }
        />
      );
    }
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
        // The user-scoped subscriptions tab IS the real subscriptions page,
        // filtered to this student — a per-subscription card grid (current, next
        // and history) with the same per-card action menu (renew / activate /
        // edit-hours / cancel / send / mark-paid …) for admin and parent alike.
        return (
          <SubscriptionsPage
            studentId={userId}
            studentName={user.name}
            embedded
          />
        );
      case "children":
        return <ParentChildrenTab overview={overview} txt={txt} canView={canView} />;
      case "profile":
        return (
          <AccountProfileForm
            user={user}
            txt={txt}
            onSaved={triggerRefetch}
          />
        );
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
          // Send-report button temporarily disabled in the dashboard (kept in backend). Uncomment to restore.
          // sendReport: canSendReport && isStudent,
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
