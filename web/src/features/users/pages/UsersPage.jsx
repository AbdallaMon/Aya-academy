"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdLink,
  MdPeople,
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
  useConfirm,
} from "../../../shared/components/index.js";
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
  });

  // When locked to a role, always force that role into the filters so the API
  // only ever returns that role. Hide the role filter from the UI below.
  useEffect(() => {
    if (!lockedRole) return;
    setFilters((prev) =>
      prev?.role === lockedRole ? prev : { ...prev, role: lockedRole },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedRole]);

  const form = useOpen();
  const linkDialog = useOpen();
  const childrenDialog = useOpen();
  const [selected, setSelected] = useState(null);

  const mut = useMultiRequest({
    url: USERS_URL,
    onSuccess: () => triggerRefetch(),
  });

  const isEditing = Boolean(selected?.id);

  function onCreate() {
    setSelected(null);
    form.open();
  }
  function onEdit(row) {
    setSelected(row);
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
    } else {
      // createUserSchema: name, email, password, role, phone, locale, nickname
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        phone: values.phone || undefined,
        nickname: values.nickname || undefined,
        locale: values.locale || undefined,
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
      { name: "phone", label: txt.phoneLabel, type: "text" },
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

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: txt.name,
        width: 220,
        renderCell: ({ row }) => (
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
        ),
      },
      {
        field: "email",
        headerName: txt.email,
        width: 230,
        renderCell: ({ row }) => row.email || "—",
      },
      {
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
      },
      {
        field: "parents",
        headerName: txt.parents,
        width: 240,
        sortable: false,
        renderCell: ({ row }) => {
          if (row.role !== "STUDENT") return "—";
          const parents = row.parents || [];
          if (parents.length === 0) return txt.noParentsLinked;
          const relationLabels = {
            FATHER: txt.father,
            MOTHER: txt.mother,
            GUARDIAN: txt.guardian,
            OTHER: txt.other,
          };
          return (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {parents.map((p) => (
                <Chip
                  key={p.id}
                  size="small"
                  variant="outlined"
                  color="info"
                  label={`${p.name} — ${relationLabels[p.relation] || p.relation}`}
                />
              ))}
            </Stack>
          );
        },
      },
      {
        field: "isSubscribed",
        headerName: txt.subscription,
        width: 140,
        sortable: false,
        renderCell: ({ row }) => {
          if (row.role !== "STUDENT") return "—";
          return (
            <Chip
              size="small"
              color={row.isSubscribed ? "success" : "default"}
              variant={row.isSubscribed ? "filled" : "outlined"}
              label={row.isSubscribed ? txt.subscribed : txt.notSubscribed}
            />
          );
        },
      },
      {
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
      },
      {
        field: "createdAt",
        headerName: txt.createdAt,
        width: 130,
        renderCell: ({ row }) =>
          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
      },
      {
        field: "actions",
        type: "actions",
        headerName: txt.actions,
        width: 320,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {canView && (
              <Button
                size="small"
                color="info"
                startIcon={<MdVisibility />}
                component={Link}
                href={localePath(lng, `/dashboard/users/${row.id}`)}
              >
                {txt.viewDetails}
              </Button>
            )}
            {canEdit && (
              <Button size="small" startIcon={<MdEdit />} onClick={() => onEdit(row)}>
                {txt.edit}
              </Button>
            )}
            {canEdit && row.role === "STUDENT" && (
              <Button
                size="small"
                color="secondary"
                startIcon={<MdLink />}
                onClick={() => onLinkParent(row)}
              >
                {txt.linkParent}
              </Button>
            )}
            {canViewChildren && row.role === "STUDENT" && (
              <Button
                size="small"
                color="secondary"
                startIcon={<MdWorkspacePremium />}
                component={Link}
                href={localePath(
                  lng,
                  `/dashboard/certificates?studentId=${row.id}`,
                )}
              >
                {txt.certificates}
              </Button>
            )}
            {canViewChildren && row.role === "PARENT" && (
              <Button
                size="small"
                color="info"
                startIcon={<MdPeople />}
                onClick={() => onViewChildren(row)}
              >
                {row.childrenCount != null
                  ? `${txt.viewChildren} (${row.childrenCount})`
                  : txt.viewChildren}
              </Button>
            )}
            {canDelete && row.isActive && (
              <Button
                size="small"
                color="error"
                startIcon={<MdDelete />}
                onClick={() => onDelete(row)}
              />
            )}
          </Stack>
        ),
      },
    ],
    [txt, lng, canView, canEdit, canDelete, canViewChildren],
  );

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
