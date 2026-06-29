"use client";

// The shared, permission-filtered navigation list rendered inside both the
// permanent sidebar (desktop) and the temporary drawer (mobile).

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { USER_ROLES } from "@aya/shared";
import { useAuth } from "../../../hooks/useAuth.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath, stripLocale } from "../../../i18n/routing.js";
import { getNavGroupsForRole } from "../config/navModel.js";
import { useDashboardText } from "../config/dashboardText.js";

const itemSx = {
  position: "relative",
  borderRadius: 2.5,
  mb: 0.5,
  py: 1.05,
  px: 1.5,
  color: "text.secondary",
  transition: "background-color .2s ease, color .2s ease, transform .2s ease",
  // ListItemText renders a `body1` Typography, whose theme color
  // (text.secondary) would otherwise override the button's `color` cascade —
  // forcing `inherit` lets the default/hover/active colors below actually apply
  // to the label text.
  "& .MuiListItemText-primary": {
    fontWeight: 700,
    fontSize: "0.92rem",
    color: "inherit",
  },
  "& .MuiListItemIcon-root": {
    color: "inherit",
    transition: "color .2s ease",
  },
  "&:hover": {
    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
    color: "text.primary",
  },
  "&.Mui-selected": {
    background: (t) =>
      `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
    color: (t) => t.palette.primary.contrastText,
    boxShadow: (t) => `0 6px 16px ${alpha(t.palette.primary.main, 0.32)}`,
    "& .MuiListItemIcon-root": {
      color: (t) => t.palette.primary.contrastText,
    },
    "& .MuiListItemText-primary": { fontWeight: 800 },
    "&:hover": {
      background: (t) =>
        `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
    },
  },
};

const subheaderSx = {
  bgcolor: "transparent",
  color: "text.secondary",
  fontWeight: 800,
  fontSize: "0.7rem",
  lineHeight: 2.4,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  px: 1.5,
  mt: 1,
};

export default function DashboardNav({ role, onNavigate }) {
  const pathname = usePathname();
  const bare = stripLocale(pathname);
  const { lng } = useTranslation();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermission();
  const txt = useDashboardText();

  const studentBlocked = user?.role === USER_ROLES.STUDENT && user?.hasActiveSubscription === false;

  const canSee = (item) => {
    if (studentBlocked && item.subscriptionGated) return false;
    if (item.permission) return hasPermission(item.permission);
    if (item.anyPermission) return hasAnyPermission(item.anyPermission);
    return true;
  };

  // Filter each section's items by permission, then drop sections left empty.
  const groups = getNavGroupsForRole(role)
    .map((group) => ({ ...group, items: group.items.filter(canSee) }))
    .filter((group) => group.items.length > 0);

  const isActive = (href) =>
    href === "/dashboard" ? bare === "/dashboard" : bare.startsWith(href);

  return (
    <List sx={{ px: 1.25 }} disablePadding>
      {groups.map((group) => (
        <li key={group.key} style={{ listStyle: "none" }}>
          <ul style={{ padding: 0, margin: 0 }}>
            {group.labelKey ? (
              <ListSubheader disableSticky sx={subheaderSx}>
                {txt[group.labelKey] ?? group.labelKey}
              </ListSubheader>
            ) : null}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.key}
                  component={Link}
                  href={localePath(lng, item.href)}
                  onClick={onNavigate}
                  selected={isActive(item.href)}
                  sx={itemSx}
                >
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    {Icon ? <Icon size={20} /> : null}
                  </ListItemIcon>
                  <ListItemText primary={txt[item.labelKey] ?? item.labelKey} />
                </ListItemButton>
              );
            })}
          </ul>
        </li>
      ))}
    </List>
  );
}
