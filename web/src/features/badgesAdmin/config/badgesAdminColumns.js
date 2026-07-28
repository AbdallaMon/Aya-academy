"use client";

import { Chip, Typography } from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";
import BadgeChip from "../../userDetail/components/BadgeChip.jsx";

/**
 * Column descriptors for the badge-definitions admin list.
 *
 * Factory (not inline) so the page component stays thin — mirrors the reference
 * `<feature>Columns.js` convention. The page passes text, locale, capability
 * flags and the row-action handlers.
 *
 * @param {object} params
 * @param {object} params.txt      badgesAdminText hook result
 * @param {string} params.lng      active locale
 * @param {object} params.can      { edit, delete }
 * @param {object} params.actions  { onEdit, onDelete }
 */
export function buildBadgesAdminColumns({ txt, lng, can, actions }) {
  return [
    {
      field: "preview",
      headerName: txt.preview,
      width: 200,
      sortable: false,
      renderCell: ({ row }) => <BadgeChip badge={row} lng={lng} size="sm" />,
    },
    {
      field: "code",
      headerName: txt.code,
      width: 160,
      renderCell: ({ row }) => <Typography variant="body2">{row.code}</Typography>,
    },
    {
      field: "name",
      headerName: txt.name,
      width: 200,
      renderCell: ({ row }) => (lng === "en" ? row.nameEn || row.nameAr : row.nameAr || row.nameEn),
    },
    {
      field: "score",
      headerName: txt.score,
      width: 100,
      renderCell: ({ row }) => row.score ?? 0,
    },
    {
      field: "isActive",
      headerName: txt.active,
      width: 120,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color={row.isActive ? "success" : "default"}
          variant={row.isActive ? "filled" : "outlined"}
          label={row.isActive ? txt.activeYes : txt.activeNo}
        />
      ),
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
