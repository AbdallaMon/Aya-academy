"use client";

import { Avatar, Chip, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";
import {
  MdDelete,
  MdEdit,
  MdLink,
  MdPeople,
  MdPerson,
  MdVisibility,
  MdWorkspacePremium,
} from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";
import { buildFileUrl } from "../../../shared/lib/fileUrl.js";
import { localePath } from "../../../i18n/routing.js";
import { ROLE_COLOR } from "./constant.js";

/**
 * Column descriptors for the users list.
 *
 * Factory (not inline) so the page component stays thin — mirrors the reference
 * `<feature>Columns.js` convention. The page passes text, locale, capability
 * flags and the row-action handlers; column order adapts to `lockedRole`.
 *
 * @param {object} params
 * @param {object} params.txt          usersText hook result
 * @param {string} params.lng          active locale
 * @param {"PARENT"|"STUDENT"} [params.lockedRole]
 * @param {object} params.can          { view, edit, delete, viewChildren }
 * @param {object} params.actions      { onEdit, onLinkParent, onViewChildren, onDelete }
 */
export function buildUsersColumns({ txt, lng, lockedRole, can, actions }) {
  const relationLabels = {
    FATHER: txt.father,
    MOTHER: txt.mother,
    GUARDIAN: txt.guardian,
    OTHER: txt.other,
  };

  const nameCol = {
    field: "name",
    headerName: txt.name,
    width: 240,
    renderCell: ({ row }) => (
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar
          src={buildFileUrl(row.avatar) || undefined}
          sx={{ width: 36, height: 36, bgcolor: "action.hover" }}
        >
          {!row.avatar && <MdPerson size={20} />}
        </Avatar>
        <Stack>
          {can.view ? (
            <MuiLink
              component={Link}
              href={localePath(lng, `/dashboard/users/${row.id}`)}
              underline="hover"
              fontWeight={700}
            >
              {row.name}
            </MuiLink>
          ) : (
            <Typography fontWeight={700}>{row.name}</Typography>
          )}
          {row.nickname && (
            <Typography variant="caption" color="text.secondary">
              {row.nickname}
            </Typography>
          )}
        </Stack>
      </Stack>
    ),
  };

  const emailCol = {
    field: "email",
    headerName: txt.email,
    width: 230,
    renderCell: ({ row }) => row.email || "—",
  };

  const usernameCol = {
    field: "username",
    headerName: txt.username,
    width: 180,
    renderCell: ({ row }) => row.username || "—",
  };

  const phoneCol = {
    field: "phone",
    headerName: txt.phone,
    width: 150,
    renderCell: ({ row }) => row.phone || txt.noPhone,
  };

  const roleCol = {
    field: "role",
    headerName: txt.role,
    width: 120,
    renderCell: ({ row }) => (
      <Chip
        size="small"
        color={ROLE_COLOR[row.role] || "default"}
        label={
          row.role === "ADMIN"
            ? txt.admin
            : row.role === "PARENT"
              ? txt.parent
              : txt.student
        }
      />
    ),
  };

  // Students: their linked parents, each chip a direct link to the parent.
  const parentsCol = {
    field: "parents",
    headerName: txt.parents,
    width: 260,
    sortable: false,
    renderCell: ({ row }) => {
      const parents = row.parents || [];
      if (parents.length === 0) return txt.noParentsLinked;
      return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {parents.map((p) => (
            <Chip
              key={p.id}
              size="small"
              clickable
              component={Link}
              href={localePath(lng, `/dashboard/users/${p.id}`)}
              variant="outlined"
              color="info"
              label={`${p.name} — ${relationLabels[p.relation] || p.relation}`}
            />
          ))}
        </Stack>
      );
    },
  };

  // Parents: how many children are linked.
  const childrenCol = {
    field: "childrenCount",
    headerName: txt.children,
    width: 130,
    sortable: false,
    renderCell: ({ row }) => (
      <Chip
        size="small"
        color={row.childrenCount ? "info" : "default"}
        variant={row.childrenCount ? "filled" : "outlined"}
        icon={<MdPeople />}
        label={row.childrenCount ?? 0}
      />
    ),
  };

  const subscriptionCol = {
    field: "isSubscribed",
    headerName: txt.subscription,
    width: 140,
    sortable: false,
    renderCell: ({ row }) => (
      <Chip
        size="small"
        color={row.isSubscribed ? "success" : "default"}
        variant={row.isSubscribed ? "filled" : "outlined"}
        label={row.isSubscribed ? txt.subscribed : txt.notSubscribed}
      />
    ),
  };

  const activeCol = {
    field: "isActive",
    headerName: txt.active,
    width: 110,
    renderCell: ({ row }) => (
      <Chip
        size="small"
        color={row.isActive ? "success" : "default"}
        label={row.isActive ? txt.activeYes : txt.activeNo}
      />
    ),
  };

  const createdCol = {
    field: "createdAt",
    headerName: txt.createdAt,
    width: 130,
    renderCell: ({ row }) =>
      row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
  };

  const actionsCol = {
    field: "actions",
    type: "actions",
    headerName: txt.actions,
    width: 80,
    renderCell: ({ row }) => (
      <RowActionsMenu
        actions={[
          {
            label: txt.viewDetails,
            icon: <MdVisibility />,
            href: localePath(lng, `/dashboard/users/${row.id}`),
            hidden: !can.view,
          },
          {
            label: txt.edit,
            icon: <MdEdit />,
            onClick: () => actions.onEdit(row),
            hidden: !can.edit,
          },
          {
            label: txt.linkParent,
            icon: <MdLink />,
            onClick: () => actions.onLinkParent(row),
            hidden: !(can.edit && row.role === "STUDENT"),
          },
          {
            label: txt.certificates,
            icon: <MdWorkspacePremium />,
            href: localePath(lng, `/dashboard/certificates?studentId=${row.id}`),
            hidden: !(can.viewChildren && row.role === "STUDENT"),
          },
          {
            label:
              row.childrenCount != null
                ? `${txt.viewChildren} (${row.childrenCount})`
                : txt.viewChildren,
            icon: <MdPeople />,
            onClick: () => actions.onViewChildren(row),
            hidden: !(can.viewChildren && row.role === "PARENT"),
          },
          {
            label: txt.delete,
            icon: <MdDelete />,
            color: "error",
            onClick: () => actions.onDelete(row),
            hidden: !(can.delete && row.isActive),
          },
        ]}
      />
    ),
  };

  // Parents and students are genuinely different surfaces, so each gets its
  // own column set rather than one shared table with half-empty cells.
  if (lockedRole === "PARENT") {
    return [
      nameCol,
      usernameCol,
      emailCol,
      phoneCol,
      childrenCol,
      activeCol,
      createdCol,
      actionsCol,
    ];
  }
  if (lockedRole === "STUDENT") {
    return [
      nameCol,
      usernameCol,
      emailCol,
      parentsCol,
      subscriptionCol,
      activeCol,
      createdCol,
      actionsCol,
    ];
  }
  return [
    nameCol,
    usernameCol,
    emailCol,
    roleCol,
    parentsCol,
    subscriptionCol,
    activeCol,
    createdCol,
    actionsCol,
  ];
}
