"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Avatar, Box, Chip, Grid, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";
import {
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
import { useToast } from "../../../providers/ToastProvider.jsx";
import { localePath } from "../../../i18n/routing.js";
import {
  DataTable,
  FormDialog,
  PageHeader,
  PhotoUpload,
  RHFPhoneField,
  RHFSelect,
  RHFSwitch,
  RHFTextField,
  RowActionsMenu,
  applyApiErrorsToForm,
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
  const { showToast } = useToast();
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

  const { control, handleSubmit, reset, setError } = useForm({ defaultValues });

  // Re-seed the form each time the dialog opens (or the edited row changes) so
  // create starts blank and edit is pre-filled.
  useEffect(() => {
    if (!form.isOpen) return;
    reset(defaultValues);
  }, [form.isOpen, defaultValues, reset]);

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
    try {
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
    } catch (err) {
      // The mutation already auto-toasted the failure; bind any field-level
      // validation errors onto the form (suppress a duplicate fallback toast).
      applyApiErrorsToForm(
        {
          message: err?.data?.message || err?.message,
          status: err?.status,
          details: err?.data?.details,
          translationKey: err?.data?.translationKey || err?.translationKey,
        },
        setError,
        {
          labelMap: {
            name: txt.nameLabel,
            email: txt.emailLabel,
            password: txt.passwordLabel,
            role: txt.roleLabel,
            phone: txt.phoneLabel,
            nickname: txt.nicknameLabel,
            locale: txt.localeLabel,
            isActive: txt.isActive,
          },
          showToast,
          suppressFallbackToast: true,
        },
      );
    }
  }

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
      <PageHeader
        title={(titleKey && txt[titleKey]) || txt.pageTitle}
        description={(descriptionKey && txt[descriptionKey]) || txt.pageDescription}
        createLabel={txt.create}
        onCreate={canCreate ? onCreate : undefined}
      />

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

        <form id="user-form" onSubmit={handleSubmit(submit)} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="name"
                control={control}
                label={txt.nameLabel}
                rules={{ required: txt.required }}
              />
            </Grid>

            {!isEditing ? (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="email"
                    control={control}
                    label={txt.emailLabel}
                    type="email"
                    rules={{ required: txt.required }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="password"
                    control={control}
                    label={txt.passwordLabel}
                    type="password"
                    rules={{ required: txt.required }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFSelect
                    name="role"
                    control={control}
                    label={txt.roleLabel}
                    options={{ ADMIN: txt.admin, PARENT: txt.parent, STUDENT: txt.student }}
                    rules={{ required: txt.required }}
                  />
                </Grid>
              </>
            ) : (
              // email + role are immutable on the update endpoint → omit them.
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="password"
                  control={control}
                  label={txt.passwordEditLabel}
                  type="password"
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFPhoneField name="phone" control={control} label={txt.phoneLabel} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField name="nickname" control={control} label={txt.nicknameLabel} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSelect
                name="locale"
                control={control}
                label={txt.localeLabel}
                options={{ ar: txt.arabic, en: txt.english }}
              />
            </Grid>

            {isEditing && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFSwitch name="isActive" control={control} label={txt.isActive} />
              </Grid>
            )}
          </Grid>
        </form>
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
