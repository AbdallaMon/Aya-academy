"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import {
  MdOpenInFull,
  MdContentCopy,
  MdPlayArrow,
  MdStop,
  MdPublic,
  MdLock,
  MdDelete,
  MdArrowBack,
} from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { useConfirm } from "../../../shared/components/index.js";
import { localePath } from "../../../i18n/routing.js";
import {
  WHITEBOARD_URL,
  WHITEBOARD_STATUS,
  WHITEBOARD_VISIBILITY,
  buildPrivateBoardPath,
} from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";
import SessionStudentsPanel from "../components/SessionStudentsPanel.jsx";

function SectionCard({ title, children }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export default function WhiteboardSessionDetailPage({ sessionId }) {
  const txt = useWhiteboardText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const canManage = hasPermission(PERMISSIONS.WHITEBOARD.MANAGE);
  const [publicUrl, setPublicUrl] = useState(null);

  const { data: session, refetch } = useRequest({
    url: `${WHITEBOARD_URL}/${sessionId}`,
    method: "get",
    autoFetch: canManage,
    syncToUrl: false,
  });

  const mut = useMultiRequest({ url: WHITEBOARD_URL });

  if (!canManage || !session) return null;

  const isActive = session.status === WHITEBOARD_STATUS.ACTIVE;
  const isPublic = session.visibility === WHITEBOARD_VISIBILITY.PUBLIC;

  const run = async (action) => {
    const res = await mut.postRequest(`${sessionId}/actions/${action}`);
    if (!res?.success) return;
    if (action === "make-public") setPublicUrl(res.data?.url ?? null);
    if (action === "make-private") setPublicUrl(null);
    refetch();
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast({ message: txt.linkCopied, severity: "success" });
    } catch {
      /* clipboard blocked — URL stays visible below to copy manually */
    }
  };

  const openBoard = () =>
    window.open(buildPrivateBoardPath(lng, session.id), "_blank", "noopener");

  const remove = async () => {
    const ok = await confirm({ title: txt.confirmDelete });
    if (!ok) return;
    const res = await mut.deleteRequest(`${sessionId}`);
    if (res?.success) window.location.assign(localePath(lng, "/dashboard/whiteboard"));
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 980, mx: "auto" }}>
      <Button
        component="a"
        href={localePath(lng, "/dashboard/whiteboard")}
        startIcon={<MdArrowBack />}
        size="small"
        sx={{ mb: 1 }}
      >
        {txt.pageTitle}
      </Button>

      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          {session.title}
        </Typography>
        <Chip
          label={txt.statusLabels[session.status]}
          color={isActive ? "success" : "default"}
        />
        <Chip
          label={txt.visibilityLabels[session.visibility]}
          variant="outlined"
          color={isPublic ? "info" : "default"}
        />
      </Stack>

      {/* Primary CTA */}
      <Card
        sx={{
          borderRadius: 3,
          mb: 3,
          background: "linear-gradient(135deg, #6a5ae0 0%, #8f7bff 100%)",
          color: "#fff",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {txt.openBoard}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {txt.openHint}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<MdOpenInFull />}
            onClick={openBoard}
            sx={{ bgcolor: "#fff", color: "#5a4bd0", "&:hover": { bgcolor: "#f3f0ff" } }}
          >
            {txt.openBoard}
          </Button>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          mb: 3,
        }}
      >
        {/* Sharing */}
        <SectionCard title={txt.shareTitle}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isPublic ? txt.publicOnHint : txt.publicOffHint}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {isPublic ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<MdContentCopy />}
                  onClick={publicUrl ? copyLink : () => run("make-public")}
                >
                  {txt.copyLink}
                </Button>
                <Button startIcon={<MdLock />} color="inherit" onClick={() => run("make-private")}>
                  {txt.makePrivate}
                </Button>
              </>
            ) : (
              <Button variant="outlined" startIcon={<MdPublic />} onClick={() => run("make-public")}>
                {txt.makePublic}
              </Button>
            )}
          </Stack>
          {publicUrl && (
            <Typography
              variant="body2"
              sx={{ mt: 1.5, direction: "ltr", wordBreak: "break-all", color: "text.secondary" }}
            >
              {publicUrl}
            </Typography>
          )}
        </SectionCard>

        {/* Manage */}
        <SectionCard title={txt.manageTitle}>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {isActive ? (
              <Button variant="outlined" color="warning" startIcon={<MdStop />} onClick={() => run("end")}>
                {txt.end}
              </Button>
            ) : (
              <Button variant="outlined" color="success" startIcon={<MdPlayArrow />} onClick={() => run("activate")}>
                {txt.activate}
              </Button>
            )}
            <Button variant="outlined" color="error" startIcon={<MdDelete />} onClick={remove}>
              {txt.delete}
            </Button>
          </Stack>
        </SectionCard>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <SessionStudentsPanel session={session} onChanged={() => refetch()} />
        </CardContent>
      </Card>
    </Box>
  );
}
