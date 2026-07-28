"use client";

import { Box, Button, Divider, Typography } from "@mui/material";
import { FiPlus } from "react-icons/fi";
import { useTranslation } from "../../../i18n/client.js";

/**
 * PageHeader — title + description + optional Create action for a list page.
 *
 * Text can be passed two ways:
 *   - Directly: `title` / `description` / `createLabel` (the ayah per-feature
 *     `txt` approach — preferred for dashboard features).
 *   - Via `translationKey`: an i18n section key whose pageTitle / pageDescription
 *     / createButton keys are read from the global i18n table.
 * Direct props win when both are provided.
 *
 * Props:
 *   title, description, createLabel   direct text (from a feature's `txt`).
 *   translationKey                    optional i18n section fallback.
 *   onCreate                          if provided, renders a Create button (gate
 *                                     it behind a permission at the call site).
 *   renderExtraComponent              optional () => ReactNode for extra actions.
 */
export default function PageHeader({
  title,
  description,
  createLabel,
  translationKey,
  onCreate,
  renderExtraComponent,
}) {
  const { t } = useTranslation();
  const translator = translationKey ? t(translationKey, { returnObjects: true }) || {} : {};
  const common = t("common", { returnObjects: true }) || {};

  const resolvedTitle = title ?? translator.pageTitle ?? common.pageTitle ?? "";
  const resolvedDescription = description ?? translator.pageDescription;
  const resolvedCreateLabel =
    createLabel ?? translator.createButton ?? common.createButton ?? "Create";

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="h2"
            fontWeight={700}
            sx={{ mb: resolvedDescription ? 0.5 : 0 }}
          >
            {resolvedTitle}
          </Typography>
          {resolvedDescription && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 560 }}>
              {resolvedDescription}
            </Typography>
          )}
        </Box>

        {(renderExtraComponent || onCreate) && (
          <Box sx={{ display: "flex", gap: 2, flexShrink: 0 }}>
            {onCreate && (
              <Button variant="contained" startIcon={<FiPlus />} onClick={onCreate}>
                {resolvedCreateLabel}
              </Button>
            )}
            {renderExtraComponent && renderExtraComponent()}
          </Box>
        )}
      </Box>
      <Divider />
    </Box>
  );
}
