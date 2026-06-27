"use client";

// RowActionsMenu — the single, reusable per-row actions control for every
// DataTable. Renders a compact kebab (⋮) IconButton that opens an MUI Menu of
// actions instead of a row of inline buttons.
//
// Usage (in a column's renderCell):
//   {
//     field: "actions",
//     type: "actions",
//     headerName: txt.actions,
//     width: 80,
//     renderCell: ({ row }) => (
//       <RowActionsMenu
//         actions={[
//           { label: txt.viewDetails, icon: <MdVisibility />, href: viewHref(row) },
//           { label: txt.edit, icon: <MdEdit />, onClick: () => onEdit(row) },
//           { label: txt.delete, icon: <MdDelete />, color: "error",
//             onClick: () => onDelete(row), hidden: !canDelete },
//         ]}
//       />
//     ),
//   }
//
// Each action: { label, icon?, onClick?, href?, color?, hidden?, disabled?, divider? }
//   - href     → renders as a Next.js link (navigation actions like "view").
//   - color    → "error" / "warning" etc. (destructive actions render in error).
//   - hidden   → action is dropped entirely (use for permission/capability gates).
//   - divider  → render a divider ABOVE this item (e.g. to separate destructive).
//
// Conventions baked in: destructive (color "error") items are pushed to the
// bottom and get a separating divider automatically, so callers don't have to
// order/divide by hand. RTL-aware (menu anchors from the inline-end) and
// mobile-friendly tap targets.

import { useMemo, useState } from "react";
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import NextLink from "next/link";
import { MdMoreVert } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";

export default function RowActionsMenu({ actions = [], label }) {
  const { t, lng } = useTranslation();
  const td = t("tableData", { returnObjects: true }) || {};
  const isRtl = lng === "ar";
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Drop hidden actions, then sort so destructive (error) actions sink to the
  // bottom with a divider, regardless of the order the caller passed them in.
  const items = useMemo(() => {
    const visible = actions.filter((a) => a && !a.hidden);
    const normal = visible.filter((a) => a.color !== "error");
    const destructive = visible.filter((a) => a.color === "error");
    return { normal, destructive, total: visible.length };
  }, [actions]);

  if (items.total === 0) return null;

  function handleOpen(e) {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  }
  function handleClose(e) {
    e?.stopPropagation?.();
    setAnchorEl(null);
  }
  function runAction(action, e) {
    e?.stopPropagation?.();
    handleClose();
    action.onClick?.();
  }

  function renderItem(action, key, withDivider) {
    const itemSx = {
      minHeight: 44, // comfortable tap target
      gap: 1,
      ...(action.color === "error" ? { color: "error.main" } : {}),
    };
    const content = (
      <>
        {action.icon && (
          <ListItemIcon
            sx={{
              minWidth: 0,
              color: action.color === "error" ? "error.main" : "inherit",
              fontSize: 20,
              display: "inline-flex",
            }}
          >
            {action.icon}
          </ListItemIcon>
        )}
        <ListItemText
          primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
        >
          {action.label}
        </ListItemText>
      </>
    );

    const common = {
      key,
      disabled: action.disabled,
      sx: itemSx,
    };

    const node = action.href ? (
      <MenuItem
        {...common}
        component={NextLink}
        href={action.href}
        onClick={() => handleClose()}
      >
        {content}
      </MenuItem>
    ) : (
      <MenuItem {...common} onClick={(e) => runAction(action, e)}>
        {content}
      </MenuItem>
    );

    return withDivider ? [<Divider key={`${key}-div`} />, node] : node;
  }

  return (
    <>
      <Tooltip title={label || td.actions || "Actions"}>
        <IconButton
          size="small"
          aria-label={label || td.actions || "Actions"}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleOpen}
        >
          <MdMoreVert size={20} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: isRtl ? "left" : "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: isRtl ? "left" : "right",
        }}
        slotProps={{
          paper: {
            sx: { minWidth: 200, borderRadius: 2, mt: 0.5, boxShadow: 4 },
            dir: isRtl ? "rtl" : "ltr",
          },
        }}
      >
        {items.normal.map((a, i) => renderItem(a, `n-${i}`, a.divider && i > 0))}
        {items.destructive.map((a, i) =>
          renderItem(a, `d-${i}`, i === 0 && items.normal.length > 0),
        )}
      </Menu>
    </>
  );
}
