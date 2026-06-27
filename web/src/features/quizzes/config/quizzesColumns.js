"use client";

// Declarative, role-aware columns for the quizzes list (the config/ folder is the
// contract — no inline columns in the page).
//
// buildQuizzesColumns({ txt, lng, isStudent, backLinkBase }) returns the column
// set for the current viewer:
//   - common: title, questions, pass score, gift, created
//   - admin/parent: + participants count
//   - status column (role-aware chip)
//   - actions column (role-aware buttons → /dashboard/quizzes/:id, plus a direct
//     certificate download for a student who already passed)

import { Button, Chip, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { MdCardGiftcard, MdPlayArrow, MdRefresh, MdWorkspacePremium, MdVisibility, MdStar } from "react-icons/md";
import CertificateDownloadButton from "../../certificates/components/CertificateDownloadButton.jsx";
import { formatDate } from "./constant.js";

// Student status chip: PASSED (green + star), ATTEMPTED (amber), PENDING (grey).
function StudentStatusChip({ row, txt }) {
  const status = row.status; // "PASSED" | "ATTEMPTED" | "PENDING"
  if (status === "PASSED") {
    return <Chip size="small" color="success" icon={<MdStar />} label={txt.statusPassedStudent} />;
  }
  if (status === "ATTEMPTED") {
    return <Chip size="small" color="warning" label={txt.statusAttemptedStudent} />;
  }
  return <Chip size="small" label={txt.statusPendingStudent} />;
}

// Admin/parent status chip: DONE (green), PARTIAL (amber n/m), PENDING (grey).
function ManagerStatusChip({ row, txt }) {
  const status = row.status; // "DONE" | "PARTIAL" | "PENDING"
  if (status === "DONE") {
    return <Chip size="small" color="success" label={txt.statusDoneManager} />;
  }
  if (status === "PARTIAL") {
    const done = row.completedCount ?? 0;
    const total = row.participantsCount ?? 0;
    return <Chip size="small" color="warning" label={`${done}/${total}`} />;
  }
  return <Chip size="small" label={txt.statusPendingManager} />;
}

function StudentActions({ row, txt, href }) {
  const status = row.status;
  if (status === "PASSED") {
    return (
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button
          component={NextLink}
          href={href}
          size="small"
          variant="outlined"
          startIcon={<MdWorkspacePremium />}
        >
          {txt.actViewCertificate}
        </Button>
        <Button component={NextLink} href={href} size="small" variant="text" startIcon={<MdRefresh />}>
          {txt.actRetry}
        </Button>
        {row.certificateId != null && (
          <CertificateDownloadButton certificateId={row.certificateId} />
        )}
      </Stack>
    );
  }
  if (status === "ATTEMPTED") {
    return (
      <Button component={NextLink} href={href} size="small" variant="contained" startIcon={<MdRefresh />}>
        {txt.actRetry}
      </Button>
    );
  }
  return (
    <Button component={NextLink} href={href} size="small" variant="contained" startIcon={<MdPlayArrow />}>
      {txt.actStart}
    </Button>
  );
}

export function buildQuizzesColumns({ txt, lng, isStudent, backLinkBase }) {
  const hrefFor = (row) => `${backLinkBase}/${row.id}`;

  const cols = [
    {
      field: "title",
      headerName: txt.title,
      width: 240,
      renderCell: ({ row }) => (
        <Typography fontWeight={700}>{row.title || txt.noTitle}</Typography>
      ),
    },
    {
      field: "questions",
      headerName: txt.questions,
      width: 100,
      renderCell: ({ row }) => <Chip size="small" label={row._count?.items ?? 0} />,
    },
    {
      field: "passThreshold",
      headerName: txt.passThreshold,
      width: 110,
      renderCell: ({ row }) => (row.passThreshold != null ? `${row.passThreshold}%` : "—"),
    },
    {
      field: "gift",
      headerName: txt.gift,
      width: 160,
      renderCell: ({ row }) =>
        row.giftName ? (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <MdCardGiftcard />
            <Typography variant="body2">{row.giftName}</Typography>
          </Stack>
        ) : (
          txt.noGift
        ),
    },
    {
      field: "status",
      headerName: txt.statusCol,
      width: 140,
      // Branch on the row.status VALUE, not just role: when a manager focuses on
      // ONE child (?studentId=), the row is reshaped to that child's lens
      // (PASSED/ATTEMPTED), so render the student-style chip. DONE/PARTIAL is the
      // unfocused manager shape. A plain PENDING falls back to the role default.
      renderCell: ({ row }) => {
        if (row.status === "PASSED" || row.status === "ATTEMPTED") {
          return <StudentStatusChip row={row} txt={txt} />;
        }
        if (row.status === "DONE" || row.status === "PARTIAL") {
          return <ManagerStatusChip row={row} txt={txt} />;
        }
        // PENDING (or anything else) → role-based default.
        return isStudent ? (
          <StudentStatusChip row={row} txt={txt} />
        ) : (
          <ManagerStatusChip row={row} txt={txt} />
        );
      },
    },
    {
      field: "createdAt",
      headerName: txt.createdAt,
      width: 140,
      renderCell: ({ row }) => formatDate(row.createdAt, lng),
    },
    {
      field: "actions",
      type: "actions",
      headerName: txt.actionsCol,
      width: isStudent ? 320 : 240,
      renderCell: ({ row }) =>
        isStudent ? (
          <StudentActions row={row} txt={txt} href={hrefFor(row)} />
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Button
              component={NextLink}
              href={hrefFor(row)}
              size="small"
              variant="outlined"
              startIcon={<MdVisibility />}
            >
              {txt.actViewDetails}
            </Button>
            {/* Focused-child row (?studentId=) carries that child's certificateId. */}
            {row.certificateId != null && (
              <CertificateDownloadButton certificateId={row.certificateId} />
            )}
          </Stack>
        ),
    },
  ];

  // Participant count is meaningful for admin/parent, redundant for a student.
  if (!isStudent) {
    cols.splice(2, 0, {
      field: "participants",
      headerName: txt.participants,
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          variant="outlined"
          label={row.participantsCount ?? row._count?.participants ?? 0}
        />
      ),
    });
  }

  return cols;
}
