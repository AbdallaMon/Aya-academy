"use client";

import { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdClose, MdPersonAdd } from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import {
  WHITEBOARD_URL,
  STUDENTS_PICKER_URL,
  STUDENTS_PICKER_PARAMS,
} from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";

const nameOf = (u) => u?.nickname || u?.name || "";

// Manage the students attached to a whiteboard session (add from real STUDENT
// accounts / remove). `onChanged` re-fetches the parent session.
export default function SessionStudentsPanel({ session, onChanged }) {
  const txt = useWhiteboardText();
  const [picked, setPicked] = useState(null);

  const { data: students } = useRequest({
    url: STUDENTS_PICKER_URL,
    method: "get",
    isPaginated: true,
    autoFetch: true,
    initialParams: STUDENTS_PICKER_PARAMS,
    syncToUrl: false,
  });

  const mut = useMultiRequest({ url: WHITEBOARD_URL });

  const attachedIds = new Set(session.students.map((s) => s.studentId));
  const options = (students || []).filter((u) => !attachedIds.has(u.id));

  const add = async () => {
    if (!picked) return;
    const res = await mut.postRequest(`${session.id}/students`, {
      studentId: picked.id,
    });
    if (res?.success) {
      setPicked(null);
      onChanged?.();
    }
  };

  const remove = async (studentId) => {
    const res = await mut.deleteRequest(`${session.id}/students/${studentId}`);
    if (res?.success) onChanged?.();
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {txt.studentsCount}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Autocomplete
          sx={{ minWidth: 260 }}
          options={options}
          value={picked}
          onChange={(_e, v) => setPicked(v)}
          getOptionLabel={nameOf}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          renderInput={(params) => (
            <TextField {...params} label={txt.addStudent} size="small" />
          )}
        />
        <Button
          variant="contained"
          startIcon={<MdPersonAdd />}
          onClick={add}
          disabled={!picked || mut.isPostRequestLoading}
        >
          {txt.addStudent}
        </Button>
      </Stack>

      {session.students.length === 0 ? (
        <Typography color="text.secondary">{txt.noStudents}</Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {session.students.map((s) => (
            <Chip
              key={s.id}
              label={nameOf(s.student)}
              onDelete={() => remove(s.studentId)}
              deleteIcon={<MdClose />}
              disabled={mut.isDeleteRequestLoading}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
