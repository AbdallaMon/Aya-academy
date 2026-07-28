"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Box, Grid, Typography } from "@mui/material";
import {
  PERMISSIONS,
  USER_ROLES,
  userMessagesCodes,
} from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  DataTable,
  FormDialog,
  PageHeader,
  PhotoUpload,
  RHFPhoneField,
  RHFSelect,
  RHFSwitch,
  RHFTextField,
  applyApiErrorsToForm,
  useConfirm,
} from "../../../shared/components/index.js";
import { USERS_URL } from "../config/constant.js";
import { useUsersText } from "../config/usersText.js";
import { buildUsersColumns } from "../config/usersColumns.js";
import { buildUsersFilters } from "../config/usersFilters.js";
import LinkParentDialog from "../components/LinkParentDialog.jsx";
import ChildrenDialog from "../components/ChildrenDialog.jsx";
import {
  buildEditableIdentityPayload,
  buildIdentityPayload,
  EMAIL_PATTERN,
  USERNAME_PATTERN,
} from "../../../shared/lib/userIdentity.js";

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

  const defaultValues = useMemo(() => {
    if (selected) {
      return {
        name: selected.name ?? "",
        email: selected.email ?? "",
        username: selected.username ?? "",
        password: "",
        phone: selected.phone ?? "",
        nickname: selected.nickname ?? "",
        isActive: selected.isActive ?? true,
      };
    }
    return {
      name: "",
      email: "",
      username: "",
      password: "",
      role: "STUDENT",
      phone: "",
      nickname: "",
    };
  }, [selected]);

  const { control, handleSubmit, reset, setError, getValues } = useForm({
    defaultValues,
  });

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
        // updateUserSchema: editable identity + account/profile fields.
        const payload = {
          name: values.name,
          ...buildEditableIdentityPayload(values),
          phone: values.phone || undefined,
          nickname: values.nickname?.trim() || null,
          isActive: Boolean(values.isActive),
        };
        if (values.password) payload.password = values.password;
        await mut.putRequest(String(selected.id), payload);
        // Avatar lives on its own scoped endpoint — only patch when it changed.
        if (avatarId && avatarId !== selected.avatarId) {
          await mut.patchRequest(`${selected.id}/avatar`, { attachmentId: avatarId });
        }
      } else {
        // createUserSchema: name, email, password, role, phone, nickname, avatarId
        const payload = {
          name: values.name,
          ...buildIdentityPayload(values),
          password: values.password,
          role: values.role,
          phone: values.phone || undefined,
          nickname: values.nickname || undefined,
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
            username: txt.usernameLabel,
            password: txt.passwordLabel,
            role: txt.roleLabel,
            phone: txt.phoneLabel,
            nickname: txt.nicknameLabel,
            isActive: txt.isActive,
          },
          messageMap: {
            [userMessagesCodes.EMAIL_OR_USERNAME_REQUIRED]:
              txt.identityRequired,
            [userMessagesCodes.INVALID_EMAIL]: txt.invalidEmail,
            [userMessagesCodes.INVALID_USERNAME]: txt.invalidUsername,
            [userMessagesCodes.USERNAME_ALREADY_EXISTS]:
              txt.usernameAlreadyExists,
          },
          suppressFallbackToast: true,
        },
      );
    }
  }

  const columns = useMemo(
    () =>
      buildUsersColumns({
        txt,
        lng,
        lockedRole,
        can: {
          view: canView,
          edit: canEdit,
          delete: canDelete,
          viewChildren: canViewChildren,
        },
        actions: { onEdit, onLinkParent, onViewChildren, onDelete },
      }),
    [txt, lng, lockedRole, canView, canEdit, canDelete, canViewChildren],
  );

  const filterConfig = useMemo(
    () => buildUsersFilters({ txt, lockedRole }),
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
                    rules={{
                      validate: (value) => {
                        if (!value && !getValues("username")) {
                          return txt.identityRequired;
                        }
                        return (
                          !value ||
                          EMAIL_PATTERN.test(value.trim()) ||
                          txt.invalidEmail
                        );
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="username"
                    control={control}
                    label={txt.usernameLabel}
                    rules={{
                      validate: (value) => {
                        if (!value && !getValues("email")) {
                          return txt.identityRequired;
                        }
                        return (
                          !value ||
                          USERNAME_PATTERN.test(value.trim()) ||
                          txt.invalidUsername
                        );
                      },
                    }}
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
              // Role is immutable; either login identity may be changed.
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="username"
                    control={control}
                    label={txt.usernameLabel}
                    helperText={txt.usernameEditHint}
                    rules={{
                      validate: (value) =>
                        !value && !getValues("email")
                          ? txt.identityRequired
                          : !value ||
                              USERNAME_PATTERN.test(value.trim()) ||
                              txt.invalidUsername,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="email"
                    control={control}
                    label={txt.emailLabel}
                    type="email"
                    rules={{
                      validate: (value) =>
                        !value && !getValues("username")
                          ? txt.identityRequired
                          : !value ||
                              EMAIL_PATTERN.test(value.trim()) ||
                              txt.invalidEmail,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="password"
                    control={control}
                    label={txt.passwordEditLabel}
                    type="password"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.75 }}
                  >
                    {txt.passwordLeaveBlank}
                  </Typography>
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFPhoneField name="phone" control={control} label={txt.phoneLabel} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField name="nickname" control={control} label={txt.nicknameLabel} />
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
