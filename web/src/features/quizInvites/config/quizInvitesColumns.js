import { Button, Chip, Stack, Typography } from "@mui/material";
import { MdContentCopy, MdBuild } from "react-icons/md";
import { INVITE_STATUS_COLOR, formatDate } from "./constant.js";

/**
 * Column factory for the invites table. Admin and parent see the same columns;
 * the parent gets a "Build quiz" action when an invite isn't built/expired.
 */
export function buildInvitesColumns({ txt, lng, onCopyLink, onBuild }) {
  const cols = [
    {
      field: "parent",
      headerName: txt.parent,
      width: 240,
      renderCell: ({ row }) => (
        <Stack>
          <Typography fontWeight={600}>
            {row.parent?.name || row.parentName || `#${row.parentId}`}
          </Typography>
          {row.parent?.email && (
            <Typography variant="caption" color="text.secondary">
              {row.parent.email}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: "status",
      headerName: txt.status,
      width: 130,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color={INVITE_STATUS_COLOR[row.status] || "default"}
          label={txt[row.status] || row.status}
        />
      ),
    },
    {
      field: "questions",
      headerName: txt.questions,
      width: 100,
      renderCell: ({ row }) => (
        <Chip size="small" label={row._count?.questions ?? row.questionIds?.length ?? 0} />
      ),
    },
    {
      field: "createdAt",
      headerName: txt.createdAt,
      width: 140,
      renderCell: ({ row }) => formatDate(row.createdAt, lng),
    },
    {
      field: "expiresAt",
      headerName: txt.expiresAt,
      width: 140,
      renderCell: ({ row }) =>
        row.expiresAt ? formatDate(row.expiresAt, lng) : txt.noExpiry,
    },
    {
      field: "actions",
      type: "actions",
      headerName: txt.actions,
      width: 220,
      renderCell: ({ row }) => {
        const canBuild = onBuild && row.status !== "BUILT" && row.status !== "EXPIRED";
        return (
          <Stack direction="row" spacing={0.5}>
            <Button
              size="small"
              startIcon={<MdContentCopy />}
              onClick={() => onCopyLink(row)}
            >
              {txt.copyLink}
            </Button>
            {canBuild && (
              <Button
                size="small"
                variant="contained"
                startIcon={<MdBuild />}
                onClick={() => onBuild(row)}
              >
                {txt.buildQuiz}
              </Button>
            )}
          </Stack>
        );
      },
    },
  ];

  return cols;
}
