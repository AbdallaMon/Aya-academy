"use client";

import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { MdChildCare, MdInfoOutline, MdWorkspacePremium } from "react-icons/md";
import { usePermission } from "../../../hooks/usePermission.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { EmptyState, PageHeader } from "../../../shared/components/index.js";
import { useChildrenText } from "../config/childrenText.js";
import { useSubscriptionsText } from "../../subscriptions/config/subscriptionsText.js";
import UsageMeterCard from "../../subscriptionDetail/components/UsageMeterCard.jsx";
import {
  MY_STUDENTS_URL,
  SUBSCRIPTIONS_URL,
  SUBSCRIPTION_REQUEST_URL,
  STATUS_COLOR,
} from "../config/constant.js";
import PlanPickerDialog from "../components/PlanPickerDialog.jsx";
import AddChildDialog from "../components/AddChildDialog.jsx";

export default function ChildrenPage() {
  const txt = useChildrenText();
  const subsTxt = useSubscriptionsText();
  const { lng } = useTranslation();
  usePermission();

  const childrenReq = useRequest({
    url: MY_STUDENTS_URL,
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });
  const subsReq = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: true,
    syncToUrl: false,
    initialParams: { limit: 100 },
  });

  const children = childrenReq.data || [];
  const subs = useMemo(() => subsReq.data || [], [subsReq.data]);

  // The global subscriptions endpoint returns one summary per child:
  // { studentId, current, next }. Keep the current and next buckets separate.
  const subByChild = useMemo(() => {
    const map = {};
    for (const summary of subs) {
      map[summary.studentId] = summary.current ?? summary.next ?? null;
    }
    return map;
  }, [subs]);

  // The open, live-accumulating next-month USAGE bill per child (shown as a
  // meter alongside the current subscription — multi-sub visibility).
  const openByChild = useMemo(() => {
    const map = {};
    for (const summary of subs) {
      if (summary.next) map[summary.studentId] = summary.next;
    }
    return map;
  }, [subs]);

  const addDialog = useOpen();
  const pickerDialog = useOpen();
  const [pickerChild, setPickerChild] = useState(null);

  const requestMut = useMultiRequest({
    url: SUBSCRIPTION_REQUEST_URL,
    onSuccess: () => subsReq.triggerRefetch(),
  });

  function openPicker(child) {
    setPickerChild(child);
    pickerDialog.open();
  }

  async function requestPlan(plan, options = {}) {
    if (!pickerChild) return;
    try {
      await requestMut.postRequest(null, {
        studentId: pickerChild.id,
        planId: plan.id,
        billingPeriod: options.billingPeriod || "MONTHLY",
        ...(options.couponCode ? { couponCode: options.couponCode } : {}),
        applyPlanCoupon: Boolean(options.applyPlanCoupon),
      });
      pickerDialog.close();
    } catch {
      // Error is auto-toasted (e.g. an active subscription blocks the change);
      // keep the dialog open so the user can adjust or cancel.
    }
  }

  return (
    <Box>
      <PageHeader
        title={txt.pageTitle}
        description={txt.pageDescription}
        createLabel={txt.addChild}
        onCreate={addDialog.open}
      />

      {!childrenReq.isLoading && children.length === 0 && (
        <EmptyState title={txt.empty} actionLabel={txt.addChild} onAction={addDialog.open} />
      )}

      <Grid container spacing={2}>
        {children.map((child) => {
          const sub = subByChild[child.id];
          const open = openByChild[child.id];
          return (
            <Grid key={child.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 52, height: 52 }}>
                      <MdChildCare size={26} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        {child.name}
                      </Typography>
                      {child.nickname && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {txt.nickname}: {child.nickname}
                        </Typography>
                      )}
                      {child.email && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ wordBreak: "break-all" }}>
                          {txt.emailLabel}: {child.email}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={2}
                    flexWrap="wrap"
                  >
                    <Typography variant="body2" color="text.secondary">
                      {txt.statusLabel}:
                    </Typography>
                    {sub ? (
                      <Chip
                        size="small"
                        color={STATUS_COLOR[sub.status] || "default"}
                        label={txt[sub.status] || sub.status}
                      />
                    ) : (
                      <Chip size="small" variant="outlined" label={txt.noSubscription} />
                    )}
                  </Stack>

                  {sub?.plan && (
                    <Typography variant="body2" mb={2}>
                      {sub.plan.titleAr}
                    </Typography>
                  )}

                  {/* Live-accumulating next-month usage bill (if any). */}
                  {open && (
                    <Box mb={2}>
                      <UsageMeterCard sub={open} txt={subsTxt} />
                    </Box>
                  )}

                  {/* A child that ALREADY has a subscription (any status) sends the
                      parent to that subscription's detail page — the single renewal
                      home, where the shared RenewDialog (POST /:id/renew) lives. Only
                      a child with NO subscription uses the plan picker (/request) for
                      a first-ever subscription. */}
                  {sub ? (
                    <Button
                      fullWidth
                      variant={sub.status === "ACTIVE" ? "outlined" : "contained"}
                      component={Link}
                      href={localePath(lng, `/dashboard/subscriptions/${sub.id}`)}
                    >
                      {sub.status === "EXPIRED" || sub.status === "CANCELLED"
                        ? txt.renew
                        : txt.manageSubscription}
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => openPicker(child)}
                    >
                      {txt.choosePlan}
                    </Button>
                  )}

                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<MdInfoOutline />}
                    component={Link}
                    href={localePath(lng, `/dashboard/users/${child.id}`)}
                    sx={{ mt: 1 }}
                  >
                    {txt.viewDetails}
                  </Button>

                  <Button
                    fullWidth
                    size="small"
                    variant="text"
                    color="secondary"
                    startIcon={<MdWorkspacePremium />}
                    component={Link}
                    href={localePath(lng, `/dashboard/certificates?studentId=${child.id}`)}
                    sx={{ mt: 1 }}
                  >
                    {txt.certificates}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <AddChildDialog
        open={addDialog.isOpen}
        onClose={addDialog.close}
        lng={lng}
        txt={txt}
        onCreated={() => {
          childrenReq.fetchData();
          subsReq.triggerRefetch();
        }}
      />

      <PlanPickerDialog
        open={pickerDialog.isOpen}
        onClose={pickerDialog.close}
        child={pickerChild}
        onRequest={requestPlan}
        requesting={requestMut.isPostRequestLoading}
        txt={txt}
      />
    </Box>
  );
}
