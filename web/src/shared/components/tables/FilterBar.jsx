"use client";

// Config-driven filter bar. Renders inputs declared in a feature's
// config/<feature>Filters.js and writes into the `filters` object owned by
// useRequest (which syncs them to the URL).
//
// Supported filter types:
//   search / multiKeySearch  → debounced text input (writes filters.search)
//   enum                     → Select of options (label/value)
//   dateRange                → two date inputs writing { from, to }

import { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import useDebounce from "../../../hooks/useDebounce.js";
import { useTranslation } from "../../../i18n/client.js";
import AsyncUserAutocomplete from "../forms/AsyncUserAutocomplete.jsx";

function DebouncedSearch({ value, onChange, delay = 400, label }) {
  const [local, setLocal] = useState(value ?? "");
  const [previousValue, setPreviousValue] = useState(value);
  const debounced = useDebounce(local, delay);

  if (value !== previousValue) {
    setPreviousValue(value);
    setLocal(value ?? "");
  }

  useEffect(() => {
    onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <TextField
      size="small"
      label={label}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      sx={{ minWidth: 220 }}
    />
  );
}

export default function FilterBar({ filterConfig = [], filters = {}, setFilters, translator = {} }) {
  const { t } = useTranslation();
  const td = t("tableData", { returnObjects: true }) || {};

  function update(key, value) {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === null || value === "" ) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  if (!Array.isArray(filterConfig) || filterConfig.length === 0) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {filterConfig.map((f) => {
          const label = translator[f.label] || translator[f.key] || f.label || f.key;

          if (f.type === "search" || f.type === "multiKeySearch") {
            return (
              <DebouncedSearch
                key={f.key}
                label={td.search || "Search"}
                delay={f.delay ?? 400}
                value={filters.search ?? ""}
                onChange={(v) => update("search", v)}
              />
            );
          }

          if (f.type === "enum") {
            const options = f.options || {};
            const entries = Array.isArray(options)
              ? options.map((o) => [o, o])
              : Object.entries(options);
            return (
              <FormControl key={f.key} size="small" sx={{ minWidth: 180 }}>
                <InputLabel>{label}</InputLabel>
                <Select
                  label={label}
                  value={filters[f.key] ?? ""}
                  onChange={(e) =>
                    update(f.key, e.target.value === "ALL" ? "" : e.target.value)
                  }
                >
                  {entries.map(([val, display]) => (
                    <MenuItem key={val} value={val}>
                      {translator[display] || display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }

          if (f.type === "asyncUser") {
            return (
              <AsyncUserAutocomplete
                key={f.key}
                role={f.role}
                label={label}
                value={filters[f.key] ?? null}
                onChange={(user) => update(f.key, user?.id)}
                size="small"
                sx={{ minWidth: 220 }}
              />
            );
          }

          if (f.type === "dateRange") {
            const range = filters[f.key] || {};
            return (
              <Stack key={f.key} direction="row" spacing={1}>
                <TextField
                  size="small"
                  type="date"
                  label={`${label || ""} ${td.from || "From"}`.trim()}
                  InputLabelProps={{ shrink: true }}
                  value={range.from || ""}
                  onChange={(e) => update(f.key, { ...range, from: e.target.value })}
                />
                <TextField
                  size="small"
                  type="date"
                  label={`${label || ""} ${td.to || "To"}`.trim()}
                  InputLabelProps={{ shrink: true }}
                  value={range.to || ""}
                  onChange={(e) => update(f.key, { ...range, to: e.target.value })}
                />
              </Stack>
            );
          }

          return null;
        })}
      </Stack>
    </Box>
  );
}
