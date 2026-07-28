"use client";

import { Button, Chip, Stack, Typography } from "@mui/material";
import {
  MdGroupAdd,
  MdBarChart,
  MdPlayArrow,
  MdStar,
  MdMilitaryTech,
} from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";
import { localePath } from "../../../i18n/routing.js";

/**
 * Column descriptors for the games admin list.
 *
 * Factory (not inline) so the page component stays thin — mirrors the reference
 * `<feature>Columns.js` convention. The page passes text, locale, capability
 * flags, the free-game mutation loading state and the row-action handlers.
 *
 * @param {object} params
 * @param {object} params.txt        gamesAdminText hook result
 * @param {string} params.lng        active locale
 * @param {object} params.can        { assign, viewResults, manage }
 * @param {object} params.actions    { onAssign, onLinkBadge, onSetFree }
 * @param {boolean} params.freeLoading  set-as-free mutation loading state
 */
export function buildGamesColumns({ txt, lng, can, actions, freeLoading }) {
  return [
    {
      field: "title",
      headerName: txt.title,
      width: 240,
      renderCell: ({ row }) => (
        <Stack>
          <Typography fontWeight={700}>
            {lng === "en" ? row.titleEn : row.titleAr}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {lng === "en" ? row.titleAr : row.titleEn}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "type",
      headerName: txt.type,
      width: 130,
      renderCell: ({ row }) => (
        <Chip size="small" label={txt[row.type] || row.type} />
      ),
    },
    {
      field: "isPublic",
      headerName: txt.visibility,
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color={row.isPublic ? "info" : "default"}
          label={row.isPublic ? txt.public : txt.private}
        />
      ),
    },
    {
      field: "isActive",
      headerName: txt.active,
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color={row.isActive ? "success" : "default"}
          label={row.isActive ? txt.active : txt.inactive}
        />
      ),
    },
    {
      field: "isFree",
      headerName: txt.freeGame,
      width: 180,
      renderCell: ({ row }) =>
        row.isFree ? (
          <Chip
            size="small"
            color="warning"
            icon={<MdStar />}
            label={txt.freeGameChip}
          />
        ) : can.manage ? (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<MdStar />}
            disabled={freeLoading}
            onClick={() => actions.onSetFree(row)}
          >
            {txt.setFree}
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            —
          </Typography>
        ),
    },
    {
      field: "passThreshold",
      headerName: txt.passThreshold,
      width: 110,
      renderCell: ({ row }) =>
        row.passThreshold != null ? `${row.passThreshold} ✓` : "—",
    },
    {
      field: "badge",
      headerName: txt.badge,
      width: 170,
      renderCell: ({ row }) =>
        row.badge ? (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            icon={<MdMilitaryTech />}
            label={`${row.badge.emoji ? `${row.badge.emoji} ` : ""}${
              lng === "en" ? row.badge.nameEn : row.badge.nameAr
            }`}
          />
        ) : can.manage ? (
          <Button
            size="small"
            variant="text"
            color="warning"
            startIcon={<MdMilitaryTech />}
            onClick={() => actions.onLinkBadge(row)}
          >
            {txt.linkBadge}
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            {txt.noBadge}
          </Typography>
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
              label: txt.assign,
              icon: <MdGroupAdd />,
              onClick: () => actions.onAssign(row),
              hidden: !can.assign,
            },
            {
              label: txt.linkBadge,
              icon: <MdMilitaryTech />,
              onClick: () => actions.onLinkBadge(row),
              hidden: !can.manage,
            },
            {
              label: txt.results,
              icon: <MdBarChart />,
              href: localePath(lng, `/dashboard/games/${row.slug}/results`),
              hidden: !can.viewResults,
            },
            {
              label: txt.preview,
              icon: <MdPlayArrow />,
              href: localePath(lng, `/dashboard/games/${row.slug}`),
            },
          ]}
        />
      ),
    },
  ];
}
