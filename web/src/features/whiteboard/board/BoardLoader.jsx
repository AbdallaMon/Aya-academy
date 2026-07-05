"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { WHITEBOARD_URL } from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";
import WhiteboardBoard from "./WhiteboardBoard.jsx";

// mode: "private" (authed, by id) | "public" (token, no auth).
export default function BoardLoader({ mode, idOrToken }) {
  const txt = useWhiteboardText();
  const isPublic = mode === "public";
  const url = isPublic
    ? `${WHITEBOARD_URL}/public/${idOrToken}`
    : `${WHITEBOARD_URL}/${idOrToken}`;

  const { data, isLoading, error } = useRequest({
    url,
    method: "get",
    isPublic,
    autoFetch: true,
    syncToUrl: false,
  });

  if (isLoading) {
    return (
      <Box sx={{ position: "fixed", inset: 0, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          p: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h5">{txt.unavailable}</Typography>
      </Box>
    );
  }

  // Private detail: students:[{ id, studentId, student:{ id, name, nickname }}].
  // Public: students:[{ id, name }]. Normalize both to [{ id, name }].
  const students = (data.students ?? []).map((s) =>
    s.student
      ? { id: s.student.id, name: s.student.nickname || s.student.name }
      : { id: s.id, name: s.name },
  );

  return (
    <WhiteboardBoard
      sessionKey={isPublic ? `t-${idOrToken}` : `s-${data.id}`}
      title={data.title}
      students={students}
      // Private board uploads images to the backend; public board is view-only
      // (token is passed so it can still fetch a public session's images).
      sessionId={data.id}
      canUpload={!isPublic}
      token={isPublic ? idOrToken : null}
    />
  );
}
