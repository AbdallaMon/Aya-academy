"use client";

import { Chip, Typography } from "@mui/material";
import { MdEdit, MdDelete, MdCheckCircle } from "react-icons/md";
import {
  AUTO_CERTIFICATE_TEMPLATE_TYPES,
  CERTIFICATE_TEMPLATE_TYPES,
} from "@ayah/shared";
import { RowActionsMenu } from "../../../shared/components/index.js";

/**
 * Column descriptors for the certificate-templates list.
 *
 * Factory (not inline) so the page component stays thin — mirrors the reference
 * `<feature>Columns.js` convention. The page passes text, locale and the
 * row-action handlers.
 *
 * @param {object} params
 * @param {object} params.txt      certificateTemplatesText hook result
 * @param {string} params.lng      active locale
 * @param {object} params.actions  { onEdit, onDelete, onActivate }
 */
export function buildCertificateTemplatesColumns({ txt, lng, actions }) {
  return [
    {
      field: "name",
      headerName: txt.name,
      width: 240,
      renderCell: ({ row }) =>
        (lng === "en" ? row.nameEn || row.nameAr : row.nameAr || row.nameEn) || row.key,
    },
    {
      field: "key",
      headerName: txt.key,
      width: 160,
      renderCell: ({ row }) => <Typography variant="body2">{row.key}</Typography>,
    },
    {
      field: "type",
      headerName: txt.type,
      width: 140,
      renderCell: ({ row }) => {
        if (row.type === CERTIFICATE_TEMPLATE_TYPES.GAME)
          return <Chip size="small" color="secondary" label={txt.typeGame} />;
        if (row.type === CERTIFICATE_TEMPLATE_TYPES.EXAM)
          return <Chip size="small" color="info" label={txt.typeExam} />;
        return <Chip size="small" variant="outlined" label={txt.typeGeneral} />;
      },
    },
    {
      field: "isDefault",
      headerName: txt.isDefault,
      width: 120,
      renderCell: ({ row }) =>
        row.isDefault ? (
          <Chip size="small" color="primary" label={txt.yes} />
        ) : (
          <Chip size="small" variant="outlined" label={txt.no} />
        ),
    },
    {
      field: "isActive",
      headerName: txt.isActive,
      width: 130,
      renderCell: ({ row }) => {
        // For auto-applied types (GAME/EXAM) "active" means "in use" — and
        // exactly one of each type can be in use at a time.
        const isAuto = AUTO_CERTIFICATE_TEMPLATE_TYPES.includes(row.type);
        const onLabel = isAuto ? txt.inUse : txt.active;
        const offLabel = isAuto ? txt.notInUse : txt.inactive;
        return (
          <Chip
            size="small"
            color={row.isActive ? "success" : "default"}
            variant={row.isActive ? "filled" : "outlined"}
            label={row.isActive ? onLabel : offLabel}
          />
        );
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: txt.actions,
      width: 80,
      renderCell: ({ row }) => (
        <RowActionsMenu
          actions={[
            // "Use this template" — only for an auto-applied (GAME/EXAM)
            // template that isn't already the active one.
            ...(AUTO_CERTIFICATE_TEMPLATE_TYPES.includes(row.type) &&
            !row.isActive
              ? [
                  {
                    label: txt.useTemplate,
                    icon: <MdCheckCircle />,
                    color: "success",
                    onClick: () => actions.onActivate(row),
                  },
                ]
              : []),
            {
              label: txt.edit,
              icon: <MdEdit />,
              onClick: () => actions.onEdit(row),
            },
            {
              label: txt.delete,
              icon: <MdDelete />,
              color: "error",
              onClick: () => actions.onDelete(row),
            },
          ]}
        />
      ),
    },
  ];
}
