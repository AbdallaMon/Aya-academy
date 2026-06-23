"use client";

// The shared, permission-filtered navigation list rendered inside both the
// permanent sidebar (desktop) and the temporary drawer (mobile).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { usePermission } from "../../../hooks/usePermission.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath, stripLocale } from "../../../i18n/routing.js";
import { getNavModelForRole } from "../config/navModel.js";
import { useDashboardText } from "../config/dashboardText.js";

export default function DashboardNav({ role, onNavigate }) {
  const pathname = usePathname();
  const bare = stripLocale(pathname);
  const { lng } = useTranslation();
  const { hasPermission, hasAnyPermission } = usePermission();
  const txt = useDashboardText();

  const items = getNavModelForRole(role).filter((item) => {
    if (item.permission) return hasPermission(item.permission);
    if (item.anyPermission) return hasAnyPermission(item.anyPermission);
    return true;
  });

  const isActive = (href) =>
    href === "/dashboard" ? bare === "/dashboard" : bare.startsWith(href);

  return (
    <List sx={{ px: 1.25 }} disablePadding>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <ListItemButton
            key={item.key}
            component={Link}
            href={localePath(lng, item.href)}
            onClick={onNavigate}
            selected={active}
            sx={{
              position: "relative",
              borderRadius: 2.5,
              mb: 0.5,
              py: 1.05,
              px: 1.5,
              color: "text.secondary",
              transition:
                "background-color .2s ease, color .2s ease, transform .2s ease",
              // ListItemText renders a `body1` Typography, whose theme color
              // (text.secondary) would otherwise override the button's `color`
              // cascade — forcing `inherit` lets the default/hover/active colors
              // below actually apply to the label text.
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
            }}
          >
            <ListItemIcon sx={{ minWidth: 38 }}>
              {Icon ? <Icon size={20} /> : null}
            </ListItemIcon>
            <ListItemText primary={txt[item.labelKey] ?? item.labelKey} />
          </ListItemButton>
        );
      })}
    </List>
  );
}
