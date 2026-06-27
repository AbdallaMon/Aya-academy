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
import { MdAdd, MdChildCare, MdWorkspacePremium } from "react-icons/md";
import { usePermission } from "../../../hooks/usePermission.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import {
  AppForm,
  EmptyState,
  FormDialog,
} from "../../../shared/components/index.js";
import { useChildrenText } from "../config/childrenText.js";
import {
  MY_STUDENTS_URL,
  CREATE_STUDENT_URL,
  SUBSCRIPTIONS_URL,
  SUBSCRIPTION_REQUEST_URL,
  STATUS_COLOR,
} from "../config/constant.js";
import PlanPickerDialog from "../components/PlanPickerDialog.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChildrenPage() {
  const txt = useChildrenText();
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
  const subs = subsReq.data || [];

  // Best subscription per child: ACTIVE/UPCOMING > PENDING > most recent.
  const subByChild = useMemo(() => {
    const rank = { ACTIVE: 4, UPCOMING: 3, PENDING: 2, EXPIRED: 1, CANCELLED: 0 };
    const map = {};
    for (const s of subs) {
      const cur = map[s.studentId];
      if (!cur || (rank[s.status] ?? 0) > (rank[cur.status] ?? 0)) {
        map[s.studentId] = s;
      }
    }
    return map;
  }, [subs]);

  const addDialog = useOpen();
  const pickerDialog = useOpen();
  const [pickerChild, setPickerChild] = useState(null);

  const createChildMut = useMultiRequest({
    url: CREATE_STUDENT_URL,
    onSuccess: () => childrenReq.fetchData(),
  });
  const requestMut = useMultiRequest({
    url: SUBSCRIPTION_REQUEST_URL,
    onSuccess: () => subsReq.triggerRefetch(),
  });

  async function addChild(values) {
    await createChildMut.postRequest(null, {
      name: values.name,
      email: values.email,
      password: values.password,
      nickname: values.nickname || undefined,
    });
    addDialog.close();
  }

  function openPicker(child) {
    setPickerChild(child);
    pickerDialog.open();
  }

  async function requestPlan(plan, options = {}) {
    if (!pickerChild) return;
    await requestMut.postRequest(null, {
      studentId: pickerChild.id,
      planId: plan.id,
      billingPeriod: options.billingPeriod || "MONTHLY",
      ...(options.couponCode ? { couponCode: options.couponCode } : {}),
    });
    pickerDialog.close();
  }

  const addFields = useMemo(
    () => [
      { name: "name", label: txt.name, type: "text", rules: { required: txt.required }, gridSize: { xs: 12 } },
      {
        name: "email",
        label: txt.email,
        type: "email",
        rules: {
          required: txt.required,
          pattern: { value: EMAIL_RE, message: txt.invalidEmail },
        },
        gridSize: { xs: 12 },
      },
      {
        name: "password",
        label: txt.password,
        type: "password",
        rules: { required: txt.required, minLength: { value: 6, message: txt.minPassword } },
        gridSize: { xs: 12, sm: 6 },
      },
      { name: "nickname", label: txt.nicknameField, type: "text", gridSize: { xs: 12, sm: 6 } },
    ],
    [txt],
  );

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 3 }}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {txt.pageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {txt.pageDescription}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<MdAdd />} onClick={addDialog.open}>
          {txt.addChild}
        </Button>
      </Stack>

      {!childrenReq.isLoading && children.length === 0 && (
        <EmptyState title={txt.empty} actionLabel={txt.addChild} onAction={addDialog.open} />
      )}

      <Grid container spacing={2}>
        {children.map((child) => {
          const sub = subByChild[child.id];
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
                        <Typography variant="caption" color="text.secondary">
                          {txt.nickname}: {child.nickname}
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

                  <Button
                    fullWidth
                    variant={sub?.status === "ACTIVE" ? "outlined" : "contained"}
                    onClick={() => openPicker(child)}
                  >
                    {sub ? txt.changePlan : txt.choosePlan}
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

      <FormDialog
        open={addDialog.isOpen}
        onClose={addDialog.close}
        title={txt.addChildTitle}
        maxWidth="sm"
        loading={createChildMut.isPostRequestLoading}
        submitText={txt.save}
        cancelText={txt.cancel}
        onSubmit={() => document.getElementById("add-child-form")?.requestSubmit()}
      >
        <AppForm id="add-child-form" fields={addFields} onSubmit={addChild} />
      </FormDialog>

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
