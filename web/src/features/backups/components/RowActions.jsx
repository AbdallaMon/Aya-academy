"use client";

// RowActions — a compact per-row actions control (feature-local).
//
// Aya's shared component barrel has no RowActions, so this small helper is kept
// inside the backups feature. It mirrors the action shape the asmaa backups
// feature relied on:
//   action = { key, label, icon, color, hidden, disabled, primary, onClick(row) }
//
// - actions flagged `primary` render as direct icon buttons (with a Tooltip),
//   so the most-used action (e.g. restore) is one click and can show a
//   disabled-reason tooltip.
// - remaining actions collapse into an overflow "⋮" menu.
// Hidden actions are filtered out entirely.

import { useState } from "react";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material";
import { MdMoreVert } from "react-icons/md";

export default function RowActions({ row, actions = [] }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const visible = actions.filter((a) => a && !a.hidden);
  const primaries = visible.filter((a) => a.primary);
  const overflow = visible.filter((a) => !a.primary);

  function handleClose() {
    setAnchorEl(null);
  }

  function runAction(action) {
    handleClose();
    if (!action.disabled) action.onClick?.(row);
  }

  if (visible.length === 0) return null;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
      {primaries.map((action) => {
        const Icon = action.icon;
        const btn = (
          <span>
            <IconButton
              size="small"
              color={action.color || "default"}
              disabled={action.disabled}
              onClick={() => runAction(action)}
              aria-label={action.label}
            >
              {Icon ? <Icon size={18} /> : null}
            </IconButton>
          </span>
        );
        return (
          <Tooltip key={action.key} title={action.label || ""} arrow>
            {btn}
          </Tooltip>
        );
      })}

      {overflow.length > 0 && (
        <>
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="more"
          >
            <MdMoreVert size={18} />
          </IconButton>
          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            {overflow.map((action) => {
              const Icon = action.icon;
              return (
                <MenuItem
                  key={action.key}
                  disabled={action.disabled}
                  onClick={() => runAction(action)}
                  sx={action.color ? { color: `${action.color}.main` } : undefined}
                >
                  {Icon && (
                    <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
                      <Icon size={18} />
                    </ListItemIcon>
                  )}
                  <ListItemText>{action.label}</ListItemText>
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </Stack>
  );
}
