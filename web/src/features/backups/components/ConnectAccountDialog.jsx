"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { FiKey, FiDatabase } from "react-icons/fi";
import { DRIVE_ACCOUNT_TYPES } from "@ayah/shared";
import { FormDialog } from "../../../shared/components/index.js";
import { useBackupsText } from "../hooks/useBackupsText.js";

/**
 * ConnectAccountDialog — choose a Drive account type (KEY|DB) before OAuth.
 * Calls onChoose(type); the caller then opens the connect URL in a new tab.
 *
 * props: open, onClose, onChoose(type)
 */
export default function ConnectAccountDialog({ open, onClose, onChoose }) {
  const { tr } = useBackupsText();

  const options = [
    {
      type: DRIVE_ACCOUNT_TYPES.DB,
      icon: FiDatabase,
      label: tr.connectTypeDb,
      hint: tr.connectTypeDbHint,
      color: "info.main",
    },
    {
      type: DRIVE_ACCOUNT_TYPES.KEY,
      icon: FiKey,
      label: tr.connectTypeKey,
      hint: tr.connectTypeKeyHint,
      color: "secondary.main",
    },
  ];

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={tr.connectDrive}
      subtitle={tr.connectChooseType}
      maxWidth="sm"
      actions={null}
    >
      <Stack spacing={1.5}>
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <Button
              key={opt.type}
              variant="outlined"
              onClick={() => onChoose?.(opt.type)}
              sx={{
                justifyContent: "flex-start",
                textAlign: "start",
                p: 2,
                gap: 1.5,
              }}
            >
              <Box component="span" sx={{ color: opt.color, display: "inline-flex" }}>
                <Icon size={24} />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight={700}>
                  {opt.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {opt.hint}
                </Typography>
              </Box>
            </Button>
          );
        })}
      </Stack>
    </FormDialog>
  );
}
