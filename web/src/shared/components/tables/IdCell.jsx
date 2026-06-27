"use client";

// IdCell — compact, unobtrusive renderer for the mandatory leading "ID" column
// on every DataTable. Shows the id in muted monospace, truncated, with a
// tooltip carrying the full value and copy-to-clipboard on click.

import { useState } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "../../../i18n/client.js";
import { useToast } from "../../../providers/ToastProvider.jsx";

export default function IdCell({ value }) {
  const { t } = useTranslation();
  const td = t("tableData", { returnObjects: true }) || {};
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (value === null || value === undefined || value === "") return "—";

  const text = String(value);

  async function copy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      showToast({ message: td.copied || "Copied", severity: "success" });
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable (e.g. insecure context) — silently no-op.
    }
  }

  return (
    <Tooltip title={copied ? td.copied || "Copied" : `${text} · ${td.copy || "Copy"}`}>
      <Box
        component="span"
        role="button"
        tabIndex={0}
        onClick={copy}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") copy(e);
        }}
        sx={{
          display: "inline-block",
          maxWidth: 90,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          cursor: "pointer",
          verticalAlign: "middle",
          "&:hover .id-text": { color: "text.primary" },
        }}
      >
        <Typography
          className="id-text"
          component="span"
          sx={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "text.secondary",
            letterSpacing: 0,
          }}
        >
          {text}
        </Typography>
      </Box>
    </Tooltip>
  );
}
