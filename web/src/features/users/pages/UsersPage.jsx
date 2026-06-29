"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Box, Button, Chip, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdLink,
  MdPeople,
  MdPerson,
  MdVisibility,
  MdWorkspacePremium,
} from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import {
  AppForm,
  DataTable,
  FormDialog,
  PhotoUpload,
  RowActionsMenu,
  useConfirm,
} from "../../../shared/components/index.js";
import { buildFileUrl } from "../../../shared/lib/fileUrl.js";
import { USERS_URL, ROLE_COLOR } from "../config/constant.js";
import { useUsersText } from "../config/usersText.js";
import LinkParentDialog from "../components/LinkParentDialog.jsx";
import ChildrenDialog from "../components/ChildrenDialog.jsx";

/**
 * Shared user-list screen.
 *
 * @param {object} props
 * @param {"PARENT"|"STUDENT"} [props.lockedRole] When set, the list is locked
 *   to a single role: the `role` filter is always sent to the API and the role
 *   filter dropdown is hidden. Used by the Parents / Students focused pages.
 * @param {string} [props.titleKey]  usersText key for the page title override.
 * @param {string} [props.descriptionKey] usersText key for the description override.
 */
export default function UsersPage({ lockedRole, titleKey, descriptionKey } = {}) {
  const txt = useUsersText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const canList = hasPermission(PERMISSIONS.USER.LIST) && isAdmin;
  const canView = hasPermission(PERMISSIONS.USER.VIEW) && isAdmin;
  const canCreate = hasPermission(PERMISSIONS.USER.CREATE) && isAdmin;
  const canEdit = hasPermission(PERMISSIONS.USER.EDIT) && isAdmin;
  const canDelete = hasPermission(PERMISSIONS.USER.DELETE) && isAdmin;
  const canViewChildren = hasPermission(PERMISSIONS.USER.VIEW) && isAdmin;

  // When the list is locked to a role, the role is a PROPERTY OF THE PAGE, not a
  // user-toggleable filter. Send it as a fixed request param (initialParams) that
  // is merged into EVERY request — including the very first auto-fetch — instead
  // of injecting it into the mutable `filters` after mount. The old approach let
  // the first fetch go out with no role (returning everyone) and, via syncToUrl,
  // leaked the role into the URL across client-side navigations.
  const lockedParams = useMemo(
    () => (lockedRole ? { role: lockedRole } : undefined),
    [lockedRole],
  );

  const {
    data,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    filters,
    setFilters,
    triggerRefetch,
  } = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
    initialParams: lockedParams,
  });

  // Default the Status filter to "Active only" on first load — but never clobber
  // a deep-linked value (e.g. ?isActive=false). Runs once before the first fetch
  // settles so the very first request already carries isActive=true.
  const seededStatus = useRef(false);
  useEffect(() => {
    if (seededStatus.current) return;
    seededStatus.current = true;
    if (filters.isActive === undefined) {
      setFilters((prev) => ({ ...prev, isActive: "true" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useOpen();
  const linkDialog = useOpen();
  const childrenDialog = useOpen();
  const [selected, setSelected] = useState(null);
  // The picked avatar attachment ({ id, url }) for the create/edit form.
  const [avatarAttachment, setAvatarAttachment] = useState(null);

  const mut = useMultiRequest({
    url: USERS_URL,
    onSuccess: () => triggerRefetch(),
  });

  const isEditing = Boolean(selected?.id);

  function onCreate() {
    setSelected(null);
    setAvatarAttachment(null);
    form.open();
  }
  function onEdit(row) {
    setSelected(row);
    setAvatarAttachment(row?.avatar ?? null);
    form.open();
  }
  function onLinkParent(row) {
    setSelected(row);
    linkDialog.open();
  }
  function onViewChildren(row) {
    setSelected(row);
    childrenDialog.open();
  }
  async function onDelete(row) {
    const ok = await confirm({ title: txt.deleteConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(String(row.id));
  }

  async function submit(values) {
    const avatarId = avatarAttachment?.id ? Number(avatarAttachment.id) : null;
    if (isEditing) {
      // updateUserSchema: name, phone, locale, nickname, isActive, password
      const payload = {
        name: values.name,
        phone: values.phone || undefined,
        nickname: values.nickname || undefined,
        locale: values.locale || undefined,
        isActive: Boolean(values.isActive),
      };
      if (values.password) payload.password = values.password;
      await mut.putRequest(String(selected.id), payload);
      // Avatar lives on its own scoped endpoint — only patch when it changed.
      if (avatarId && avatarId !== selected.avatarId) {
        await mut.patchRequest(`${selected.id}/avatar`, { attachmentId: avatarId });
      }
    } else {
      // createUserSchema: name, email, password, role, phone, locale, nickname, avatarId
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        phone: values.phone || undefined,
        nickname: values.nickname || undefined,
        locale: values.locale || undefined,
        avatarId: avatarId || undefined,
      };
      await mut.postRequest(null, payload);
    }
    form.close();
  }

  const fields = useMemo(() => {
    const base = [
      { name: "name", label: txt.nameLabel, type: "text", rules: { required: txt.required } },
    ];

    if (!isEditing) {
      base.push(
        { name: "email", label: txt.emailLabel, type: "email", rules: { required: txt.required } },
        { name: "password", label: txt.passwordLabel, type: "password", rules: { required: txt.required } },
        {
          name: "role",
          label: txt.roleLabel,
          type: "select",
          options: { ADMIN: txt.admin, PARENT: txt.parent, STUDENT: txt.student },
          rules: { required: txt.required },
        },
      );
    } else {
      // email + role are immutable on the update endpoint → omit them.
      base.push({
        name: "password",
        label: txt.passwordEditLabel,
        type: "password",
      });
    }

    base.push(
      { name: "phone", label: txt.phoneLabel, type: "phone" },
      { name: "nickname", label: txt.nicknameLabel, type: "text" },
      {
        name: "locale",
        label: txt.localeLabel,
        type: "select",
        options: { ar: txt.arabic, en: txt.english },
      },
    );

    if (isEditing) {
      base.push({ name: "isActive", label: txt.isActive, type: "switch" });
    }

    return base;
  }, [txt, isEditing]);

  const defaultValues = useMemo(() => {
    if (selected) {
      return {
        name: selected.name ?? "",
        password: "",
        phone: selected.phone ?? "",
        nickname: selected.nickname ?? "",
        locale: selected.locale ?? "",
        isActive: selected.isActive ?? true,
      };
    }
    return {
      name: "",
      email: "",
      password: "",
      role: "STUDENT",
      phone: "",
      nickname: "",
      locale: "",
    };
  }, [selected]);

  const columns = useMemo(() => {
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
            {canView ? (
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
              hidden: !canView,
            },
            {
              label: txt.edit,
              icon: <MdEdit />,
              onClick: () => onEdit(row),
              hidden: !canEdit,
            },
            {
              label: txt.linkParent,
              icon: <MdLink />,
              onClick: () => onLinkParent(row),
              hidden: !(canEdit && row.role === "STUDENT"),
            },
            {
              label: txt.certificates,
              icon: <MdWorkspacePremium />,
              href: localePath(lng, `/dashboard/certificates?studentId=${row.id}`),
              hidden: !(canViewChildren && row.role === "STUDENT"),
            },
            {
              label:
                row.childrenCount != null
                  ? `${txt.viewChildren} (${row.childrenCount})`
                  : txt.viewChildren,
              icon: <MdPeople />,
              onClick: () => onViewChildren(row),
              hidden: !(canViewChildren && row.role === "PARENT"),
            },
            {
              label: txt.delete,
              icon: <MdDelete />,
              color: "error",
              onClick: () => onDelete(row),
              hidden: !(canDelete && row.isActive),
            },
          ]}
        />
      ),
    };

    // Parents and students are genuinely different surfaces, so each gets its
    // own column set rather than one shared table with half-empty cells.
    if (lockedRole === "PARENT") {
      return [nameCol, emailCol, phoneCol, childrenCol, activeCol, createdCol, actionsCol];
    }
    if (lockedRole === "STUDENT") {
      return [nameCol, emailCol, parentsCol, subscriptionCol, activeCol, createdCol, actionsCol];
    }
    return [
      nameCol,
      emailCol,
      roleCol,
      parentsCol,
      subscriptionCol,
      activeCol,
      createdCol,
      actionsCol,
    ];
  }, [txt, lng, lockedRole, canView, canEdit, canDelete, canViewChildren]);

  const filterConfig = useMemo(
    () => [
      { type: "search", key: "search", label: txt.searchLabel },
      // When the list is locked to a role, the role filter is omitted entirely.
      ...(lockedRole
        ? []
        : [
            {
              type: "enum",
              key: "role",
              label: txt.role,
              options: {
                ADMIN: txt.admin,
                PARENT: txt.parent,
                STUDENT: txt.student,
              },
            },
          ]),
      {
        type: "enum",
        key: "isActive",
        label: txt.statusLabel,
        // Active is the default (seeded above); "All" clears the filter.
        options: { true: txt.activeYes, false: txt.activeNo, ALL: txt.all },
      },
    ],
    [txt, lockedRole],
  );

  if (!canList) return null;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 3 }}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {(titleKey && txt[titleKey]) || txt.pageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {(descriptionKey && txt[descriptionKey]) || txt.pageDescription}
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<MdAdd />} onClick={onCreate}>
            {txt.create}
          </Button>
        )}
      </Stack>

      <DataTable
        initialRows={data || []}
        columns={columns}
        total={total}
        page={page}
        rowsPerPage={pageSize}
        setPage={setPage}
        setRowsPerPage={setPageSize}
        loading={isLoading}
        filters={filters}
        setFilters={setFilters}
        filterConfig={filterConfig}
        noContainer
      />

      <FormDialog
        open={form.isOpen}
        onClose={form.close}
        title={isEditing ? txt.editTitle : txt.createTitle}
        maxWidth="md"
        loading={mut.isPostRequestLoading || mut.isPutRequestLoading}
        submitText={txt.save}
        cancelText={txt.cancel}
        onSubmit={() => document.getElementById("user-form")?.requestSubmit()}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {txt.photoLabel}
          </Typography>
          <PhotoUpload
            value={avatarAttachment}
            onUploaded={(att) => setAvatarAttachment(att)}
            buttonLabel={txt.choosePhoto}
            uploadingLabel={txt.uploadingPhoto}
            hintLabel={txt.photoHint}
          />
        </Box>
        <AppForm
          id="user-form"
          fields={fields}
          defaultValues={defaultValues}
          onSubmit={submit}
        />
      </FormDialog>

      <LinkParentDialog
        open={linkDialog.isOpen}
        onClose={linkDialog.close}
        student={selected}
        txt={txt}
        onSuccess={triggerRefetch}
      />

      <ChildrenDialog
        open={childrenDialog.isOpen}
        onClose={childrenDialog.close}
        parent={selected}
        txt={txt}
      />
    </Box>
  );
}
