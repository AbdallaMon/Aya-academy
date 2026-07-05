"use client";

import { useState } from "react";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import {
  MdOpenInFull,
  MdContentCopy,
  MdPlayArrow,
  MdStop,
  MdPublic,
  MdLock,
} from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import {
  WHITEBOARD_URL,
  WHITEBOARD_STATUS,
  WHITEBOARD_VISIBILITY,
  buildPrivateBoardPath,
} from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";
import SessionStudentsPanel from "../components/SessionStudentsPanel.jsx";

export default function WhiteboardSessionDetailPage({ sessionId }) {
  const txt = useWhiteboardText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const { showToast } = useToast();
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
      /* clipboard blocked — the URL stays visible below to copy manually */
    }
  };

  const openBoard = () =>
    window.open(buildPrivateBoardPath(lng, session.id), "_blank", "noopener");

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Typography variant="h5">{session.title}</Typography>
        <Chip
          label={txt.statusLabels[session.status]}
          color={isActive ? "success" : "default"}
          size="small"
        />
        <Chip
          label={txt.visibilityLabels[session.visibility]}
          variant="outlined"
          color={isPublic ? "info" : "default"}
          size="small"
        />
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Button variant="contained" size="large" startIcon={<MdOpenInFull />} onClick={openBoard}>
          {txt.openBoard}
        </Button>
        {isActive ? (
          <Button startIcon={<MdStop />} onClick={() => run("end")}>
            {txt.end}
          </Button>
        ) : (
          <Button startIcon={<MdPlayArrow />} onClick={() => run("activate")}>
            {txt.activate}
          </Button>
        )}
        {isPublic ? (
          <Button startIcon={<MdLock />} onClick={() => run("make-private")}>
            {txt.makePrivate}
          </Button>
        ) : (
          <Button startIcon={<MdPublic />} onClick={() => run("make-public")}>
            {txt.makePublic}
          </Button>
        )}
        {isPublic && (
          <Button
            startIcon={<MdContentCopy />}
            onClick={publicUrl ? copyLink : () => run("make-public")}
          >
            {txt.copyLink}
          </Button>
        )}
      </Stack>

      {publicUrl && (
        <Typography
          variant="body2"
          sx={{ mb: 2, direction: "ltr", wordBreak: "break-all", color: "text.secondary" }}
        >
          {publicUrl}
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <SessionStudentsPanel session={session} onChanged={() => refetch()} />
    </Box>
  );
}
