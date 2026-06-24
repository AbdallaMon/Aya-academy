"use client";

import { Box, Button, Divider, Typography } from "@mui/material";
import { FiPlus } from "react-icons/fi";
import { useTranslation } from "../../../i18n/client.js";

/**
 * PageHeader — title + description + optional Create action for a list page.
 *
 * Props:
 *   translationKey       i18n section key (e.g. "usersListData"). Read keys:
 *                        pageTitle, pageDescription, createButton.
 *   onCreate             if provided, renders a Create button (gate it behind a
 *                        permission at the call site).
 *   renderExtraComponent optional () => ReactNode for extra header actions.
 */
export default function PageHeader({ translationKey, onCreate, renderExtraComponent }) {
  const { t } = useTranslation();
  const translator = t(translationKey, { returnObjects: true }) || {};
  const common = t("common", { returnObjects: true }) || {};

  const title = translator.pageTitle || common.pageTitle || "";
  const description = translator.pageDescription;
  const createLabel = translator.createButton || common.createButton || "Create";

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
          <Typography variant="h2" fontWeight={700} sx={{ mb: description ? 0.5 : 0 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 560 }}>
              {description}
            </Typography>
          )}
        </Box>

        {(renderExtraComponent || onCreate) && (
          <Box sx={{ display: "flex", gap: 2, flexShrink: 0 }}>
            {onCreate && (
              <Button variant="contained" startIcon={<FiPlus />} onClick={onCreate}>
                {createLabel}
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
