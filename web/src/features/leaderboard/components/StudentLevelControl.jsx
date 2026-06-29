"use client";

// Student pedagogical-level control used across the leaderboard.
//   - Parents/students see a read-only colored chip with the level label.
//   - Admins (canEdit) get a clickable chip that opens a menu to reassign the
//     level, patching `PATCH users/:id/level` (USER.SET_LEVEL gated server-side).
// Level labels come from the single source of truth in the userDetail config.

import { useState } from "react";
import { Chip, Menu, MenuItem, Tooltip } from "@mui/material";
import { MdEdit } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { LEVELS, levelLabel } from "../../userDetail/config/constant.js";

export default function StudentLevelControl({
  studentId,
  level,
  canEdit = false,
  txt,
  onSaved,
  size = "small",
}) {
  const { lng } = useTranslation();
  const [anchor, setAnchor] = useState(null);

  const req = useRequest({
    url: "users",
    method: "patch",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => {
      setAnchor(null);
      onSaved?.();
    },
  });

  const label = level ? levelLabel(level, lng) : txt.noLevel;

  if (!canEdit) {
    return (
      <Chip
        size={size}
        label={label}
        color={level ? "primary" : "default"}
        variant={level ? "filled" : "outlined"}
        sx={{ fontWeight: 700, maxWidth: "100%" }}
      />
    );
  }

  function choose(value) {
    if (value === level) {
      setAnchor(null);
      return;
    }
    req.fetchData(`${studentId}/level`, { studentLevel: value });
  }

  return (
    <>
      <Tooltip title={txt.editLevel}>
        <Chip
          size={size}
          icon={<MdEdit size={14} />}
          label={label}
          onClick={(e) => setAnchor(e.currentTarget)}
          color={level ? "primary" : "default"}
          variant={level ? "filled" : "outlined"}
          disabled={req.isLoading}
          sx={{ fontWeight: 700, cursor: "pointer", maxWidth: "100%" }}
        />
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {LEVELS.map((lvl) => (
          <MenuItem key={lvl} selected={lvl === level} onClick={() => choose(lvl)}>
            {levelLabel(lvl, lng)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
