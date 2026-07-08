"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";
import { localePath } from "../../../i18n/routing.js";
import { REPORTS_URL, studentLabel } from "./constant.js";

/**
 * Column descriptors for the (management) reports list.
 *
 * Factory (not inline) so the page component stays thin — mirrors the reference
 * `<feature>Columns.js` convention. The page passes text, locale, capability
 * flags and the row-action handlers.
 *
 * @param {object} params
 * @param {object} params.txt      reportsText hook result
 * @param {string} params.lng      active locale
 * @param {object} params.can      { edit, delete }
 * @param {object} params.actions  { onEdit, onDelete }
 */
export function buildReportsColumns({ txt, lng, can, actions }) {
  const reportHref = (id) => localePath(lng, `/dashboard/${REPORTS_URL}/${id}`);

  return [
    {
      field: "title",
      headerName: txt.title,
      width: 260,
      renderCell: ({ row }) => (
        <Typography fontWeight={700}>{row.title}</Typography>
      ),
    },
    {
      field: "students",
      headerName: txt.students,
      width: 280,
      renderCell: ({ row }) => {
        const list = row.students || [];
        if (!list.length) return txt.noStudents;
        const shown = list.slice(0, 2);
        const rest = list.length - shown.length;
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {shown.map((s) => (
              <Chip
                key={s.id}
                size="small"
                label={studentLabel(s.student)}
              />
            ))}
            {rest > 0 && (
              <Chip
                size="small"
                variant="outlined"
                label={txt.moreStudents.replace("{count}", rest)}
              />
            )}
          </Stack>
        );
      },
    },
    {
      field: "reportDate",
      headerName: txt.reportDate,
      width: 140,
      renderCell: ({ row }) =>
        row.reportDate
          ? new Date(row.reportDate).toLocaleDateString(
              lng === "en" ? "en-GB" : "ar-EG",
            )
          : "—",
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
              label: txt.view,
              icon: <MdVisibility />,
              href: reportHref(row.id),
            },
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
