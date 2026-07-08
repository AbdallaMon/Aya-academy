"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FiKey, FiPlus, FiRefreshCw } from "react-icons/fi";

/**
 * KeySaveCard — the «generate + save a key» panel: header/generate button,
 * no-account alerts, the save form (name / KEY account picker / key value /
 * submit) and the reconnect-disconnected-accounts list.
 * Pure presentational extraction from KeysSection.
 */
export default function KeySaveCard({
  canManage,
  tr,
  keyAccounts,
  hasConnectedKeyAccount,
  name,
  setName,
  resolvedAccountId,
  setKeyAccountId,
  keyValue,
  setKeyValue,
  connect,
  reconnectKeyAccount,
  submitSave,
  saveLoading,
  onGenerate,
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {tr.saveKeyTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tr.keysHint}
            </Typography>
          </Box>
          {canManage && (
            <Button
              variant="outlined"
              startIcon={<FiKey />}
              onClick={onGenerate}
            >
              {tr.generateKey}
            </Button>
          )}
        </Stack>

        {canManage && keyAccounts.length > 0 && !hasConnectedKeyAccount && (
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            {tr.saveKeyNoAccounts}
          </Alert>
        )}

        {canManage && keyAccounts.length === 0 ? (
          <Alert severity="info" variant="outlined">
            {tr.saveKeyNoAccounts}
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={tr.saveKeyName}
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              sx={{ maxWidth: 480 }}
            />

            <TextField
              select
              label={tr.saveKeyAccount}
              size="small"
              value={resolvedAccountId}
              onChange={(e) => setKeyAccountId(e.target.value)}
              fullWidth
              sx={{ maxWidth: 480 }}
              helperText={tr.saveKeySelectAccount}
            >
              {keyAccounts.map((a) => (
                <MenuItem
                  key={a.id}
                  value={String(a.id)}
                  disabled={!a.connected}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ width: "100%" }}
                  >
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {a.email || a.label || `#${a.id}`}
                    </Typography>
                    {!a.connected && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={tr.disconnected}
                      />
                    )}
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            {/* Reconnect disconnected KEY accounts so they become selectable. */}
            {keyAccounts.some((a) => !a.connected) && (
              <Stack spacing={1}>
                {keyAccounts
                  .filter((a) => !a.connected)
                  .map((a) => (
                    <Stack
                      key={a.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        maxWidth: 480,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {a.email || a.label || `#${a.id}`}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<FiRefreshCw />}
                        disabled={connect.isLoading}
                        onClick={() => reconnectKeyAccount(a)}
                      >
                        {tr.reconnect}
                      </Button>
                    </Stack>
                  ))}
              </Stack>
            )}

            <TextField
              label={tr.saveKeyKey}
              size="small"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={{ maxWidth: 480 }}
            />

            <Box>
              <Button
                variant="contained"
                startIcon={
                  saveLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <FiPlus />
                  )
                }
                disabled={
                  !canManage ||
                  saveLoading ||
                  !name.trim() ||
                  resolvedAccountId === "" ||
                  !keyValue.trim()
                }
                onClick={submitSave}
              >
                {tr.saveKeySubmit}
              </Button>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
