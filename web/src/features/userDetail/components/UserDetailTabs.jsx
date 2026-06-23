"use client";

import { Tabs, Tab } from "@mui/material";
import Link from "next/link";

/**
 * URL-driven tab bar. Each tab is a scroll-preserving Link that sets `?tab=`,
 * so back/forward + deep links work. The active tab is derived from the URL by
 * the parent.
 */
export default function UserDetailTabs({ sections, activeKey, getHref }) {
  if (!sections || sections.length === 0) return null;
  return (
    <Tabs
      value={activeKey}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
    >
      {sections.map((s) => (
        <Tab
          key={s.key}
          value={s.key}
          label={s.count != null ? `${s.label} (${s.count})` : s.label}
          component={Link}
          href={getHref(s.key)}
          scroll={false}
        />
      ))}
    </Tabs>
  );
}
