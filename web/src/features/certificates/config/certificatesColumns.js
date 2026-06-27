"use client";

// Declarative DataTable columns for certificates. Built via a factory so the
// columns can use the active language + open the preview modal.

import { Chip } from "@mui/material";
import { MdVisibility } from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";

export function buildCertificateColumns({ txt, lng, onView }) {
  return [
    {
      field: "title",
      headerName: txt.title,
      width: 280,
      renderCell: ({ row }) => (lng === "en" ? row.titleEn : row.titleAr),
    },
    {
      field: "studentName",
      headerName: txt.student,
      width: 180,
      renderCell: ({ row }) => row.studentName || row.student?.name,
    },
    {
      field: "type",
      headerName: txt.type,
      width: 120,
      renderCell: ({ row }) => {
        const meta = {
          GAME: { color: "primary", label: txt.typeGame },
          QUIZ: { color: "secondary", label: txt.typeQuiz },
          MANUAL: { color: "info", label: txt.typeManual },
          CUSTOM: { color: "info", label: txt.typeCustom },
        }[row.type] || { color: "default", label: row.type };
        return <Chip size="small" color={meta.color} label={meta.label} />;
      },
    },
    {
      field: "issuedAt",
      headerName: txt.issuedAt,
      width: 140,
      renderCell: ({ row }) =>
        row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : "",
    },
    {
      field: "actions",
      type: "actions",
      headerName: txt.actions || txt.view,
      width: 80,
      renderCell: ({ row }) => (
        <RowActionsMenu
          actions={[
            {
              label: txt.view,
              icon: <MdVisibility />,
              onClick: () => onView(row),
            },
          ]}
        />
      ),
    },
  ];
}
