"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useRequest } from "../../../hooks/request/useRequest.js";
import useDebounce from "../../../hooks/useDebounce.js";
import { useTranslation } from "../../../i18n/client.js";

export const USERS_URL = "users";
const PAGE_SIZE = 25;

export function userOptionLabel(user) {
  if (!user) return "";
  return user.name || user.nickname || user.username || user.email || `#${user.id}`;
}

/**
 * Server-backed user picker for every long student/parent/admin list.
 *
 * It does not preload the entire user table: opening it requests the first 25
 * users, typing sends the existing `users?search=` filter after a short debounce,
 * and scrolling to the end retrieves subsequent pages through `useRequest`.
 */
export default function AsyncUserAutocomplete({
  role,
  label,
  value = null,
  onChange,
  multiple = false,
  required = false,
  disabled = false,
  error = false,
  helperText,
  placeholder,
  excludeIds = [],
  size = "medium",
  fullWidth = true,
  sx,
}) {
  const { t } = useTranslation();
  const td = t("tableData", { returnObjects: true }) || {};
  const common = t("common", { returnObjects: true }) || {};
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const query = useDebounce(inputValue.trim(), 300);

  const request = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    scrollLoad: true,
    autoFetch: open,
    syncToUrl: false,
    initialParams: { limit: PAGE_SIZE, ...(role ? { role } : {}) },
  });
  const selectedId = !multiple && value != null && typeof value !== "object" ? value : null;
  const selectedRequest = useRequest({
    url: USERS_URL,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });

  // Filters are URL-backed and therefore often provide just an ID. Resolve that
  // ID once so the input can still show the selected user's name after a refresh.
  useEffect(() => {
    if (selectedId == null) return;
    if (String(selectedRequest.data?.id) === String(selectedId)) return;
    selectedRequest.fetchData(String(selectedId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Reset to page one whenever a new search term settles. `useRequest` owns the
  // actual request and its accumulated scroll-loading rows.
  useEffect(() => {
    if (!open) return;
    request.setFilters({ search: query || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  const excluded = useMemo(
    () => new Set((excludeIds || []).map((id) => Number(id))),
    [excludeIds],
  );
  const options = useMemo(
    () => (request.data || []).filter((user) => !excluded.has(Number(user.id))),
    [request.data, excluded],
  );
  const selectedValue = multiple
    ? value || []
    : value && typeof value === "object"
      ? value
      : selectedRequest.data || null;

  const handleListScroll = (event) => {
    const list = event.currentTarget;
    const nearEnd = list.scrollTop + list.clientHeight >= list.scrollHeight - 24;
    if (nearEnd && request.hasMore && !request.isLoading) request.loadMore();
  };

  return (
    <Autocomplete
      multiple={multiple}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      value={selectedValue}
      onChange={(_event, nextValue) => onChange?.(nextValue)}
      inputValue={inputValue}
      onInputChange={(_event, nextValue, reason) => {
        // Keep MUI's reset value too, otherwise a controlled input would keep
        // showing the old search text after the user chooses an option.
        if (reason === "input" || reason === "clear" || reason === "reset") {
          setInputValue(nextValue);
        }
      }}
      getOptionLabel={userOptionLabel}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={(items) => items}
      loading={request.isLoading}
      loadingText={common.loading || "Loading..."}
      noOptionsText={td.noData || "No data"}
      ListboxProps={{ onScroll: handleListScroll }}
      sx={sx}
      renderOption={(props, user) => (
        <Box component="li" {...props} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ minWidth: 0, py: 0.25 }}>
            <Typography variant="body2" fontWeight={600}>
              {user.name || userOptionLabel(user)}
            </Typography>
            {user.nickname && user.nickname !== user.name && (
              <Typography variant="caption" color="text.secondary" display="block">
                {user.nickname}
              </Typography>
            )}
            {user.email && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", overflowWrap: "anywhere", whiteSpace: "normal" }}
              >
                {user.email}
              </Typography>
            )}
            {user.username && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", overflowWrap: "anywhere" }}
              >
                @{user.username}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          error={error}
          helperText={helperText}
          size={size}
          fullWidth={fullWidth}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {request.isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
