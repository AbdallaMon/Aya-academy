"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";
import { formatSessionDate, studentLabel } from "./constant.js";
import { formatDurationMinutes } from "../../../shared/lib/money.js";

/**
 * Column descriptors for the session-log management table.
 *
 * Factory (not inline) so the page component stays thin — mirrors the reference
 * `<feature>Columns.js` convention. The page passes text, locale, capability
 * flags and the row-action handlers.
 *
 * @param {object} params
 * @param {object} params.txt      sessionLogText hook result
 * @param {string} params.lng      active locale
 * @param {object} params.can      { edit, delete }
 * @param {object} params.actions  { onEdit, onDelete }
 */
export function buildSessionLogColumns({ txt, lng, can, actions }) {
  return [
    {
      field: "student",
      headerName: txt.student,
      width: 200,
      renderCell: ({ row }) => (
        <Typography fontWeight={700}>{studentLabel(row.student)}</Typography>
      ),
    },
    {
      field: "subjects",
      headerName: txt.subjects,
      width: 260,
      renderCell: ({ row }) => {
        const list = Array.isArray(row.subjectsJson) ? row.subjectsJson : [];
        if (!list.length) return txt.dash;
        const shown = list.slice(0, 2);
        const rest = list.length - shown.length;
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {shown.map((s) => (
              <Chip key={s} size="small" label={txt[s] || s} />
            ))}
            {rest > 0 && (
              <Chip
                size="small"
                variant="outlined"
                label={txt.moreItems.replace("{count}", rest)}
              />
            )}
          </Stack>
        );
      },
    },
    {
      field: "durationMinutes",
      headerName: txt.minutes,
      width: 150,
      renderCell: ({ row }) => formatDurationMinutes(row.durationMinutes, lng),
    },
    {
      field: "rating",
      headerName: txt.rating,
      width: 120,
      renderCell: ({ row }) => (row.rating ? txt[row.rating] || row.rating : txt.dash),
    },
    {
      field: "attendance",
      headerName: txt.attendance,
      width: 120,
      renderCell: ({ row }) => {
        const present = row.attendance === "PRESENT";
        return (
          <Chip
            size="small"
            color={present ? "success" : "error"}
            label={present ? txt.PRESENT : txt.ABSENT}
          />
        );
      },
    },
    {
      field: "sessionDate",
      headerName: txt.date,
      width: 150,
      renderCell: ({ row }) => formatSessionDate(row.sessionDate, lng),
    },
    {
      field: "teacher",
      headerName: txt.teacher,
      width: 160,
      renderCell: ({ row }) => row.teacher?.name || txt.dash,
    },
    {
      field: "actions",
      type: "actions",
      headerName: txt.actions,
      width: 80,
      renderCell: ({ row }) => (
        <RowActionsMenu
          actions={[
            {
              label: txt.edit,
              icon: <MdEdit />,
              onClick: () => actions.onEdit(row),
              hidden: !can.edit,
            },
            {
              label: txt.delete,
              icon: <MdDelete />,
              color: "error",
              onClick: () => actions.onDelete(row),
              hidden: !can.delete,
            },
          ]}
        />
      ),
    },
  ];
}
