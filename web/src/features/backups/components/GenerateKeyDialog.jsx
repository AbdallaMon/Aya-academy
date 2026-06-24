"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import { FiCopy } from "react-icons/fi";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { useBackupsText } from "../hooks/useBackupsText.js";
import { ENCRYPTION_KEYS_GENERATE_URL } from "../config/constant.js";

/**
 * GenerateKeyDialog — generate an encryption key (POST /encryption-keys/generate).
 *
 * The generated base64 key is shown once in a read-only field with a copy button
 * and a warning that it will not be shown again (the system never stores key
 * material — it is only persisted to Drive on save). On close we hand the key to
 * the save form via onUseKey so it can be saved to a KEY account.
 *
 * props: open, onClose, onUseKey(base64)
 */
export default function GenerateKeyDialog({ open, onClose, onUseKey }) {
  const { tr } = useBackupsText();
  const { showToast } = useToast();
  const [generated, setGenerated] = useState("");

  const genReq = useRequest({
    url: ENCRYPTION_KEYS_GENERATE_URL,
    method: "post",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: (res) => {
      setGenerated(res?.data?.key || "");
    },
  });

  // Generate a fresh key on each open. Clear the old key immediately so a
  // previous session's key isn't shown while generating (intentional reset on
  // the open prop change).
  useEffect(() => {
    if (open) {
      setGenerated("");
      genReq.fetchData(null, {}).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function copyKey() {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      showToast({ message: tr.keyCopied, severity: "success" });
    } catch {
      // Fallback hint when clipboard access is blocked.
      showToast({ message: tr.copyKey, severity: "info" });
    }
  }

  function useKey() {
    onUseKey?.(generated);
    onClose?.();
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={tr.generateKeyTitle}
      maxWidth="sm"
      loading={genReq.isLoading}
      submitText={tr.generateAndSave}
      submitColor="primary"
      onSubmit={generated ? useKey : undefined}
    >
      <Stack spacing={2}>
        <Alert severity="warning" variant="outlined">
          {tr.generateWarning}
        </Alert>

        {genReq.isLoading && !generated ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={tr.generatedKeyLabel}
            value={generated}
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      startIcon={<FiCopy />}
                      onClick={copyKey}
                      disabled={!generated}
                    >
                      {tr.copyKey}
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      </Stack>
    </FormDialog>
  );
}
