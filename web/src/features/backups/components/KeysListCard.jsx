"use client";

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import KeyRow from "./KeyRow.jsx";

/**
 * KeysListCard — the saved-keys list panel (loading / empty / rows).
 * Pure presentational extraction from KeysSection.
 */
export default function KeysListCard({
  tr,
  isLoading,
  keys,
  canManage,
  connect,
  reconnectKeyAccount,
  buildActions,
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          {tr.keysTitle}
        </Typography>

        {isLoading && keys.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : keys.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
            {tr.noKeys}
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {keys.map((key) => (
              <KeyRow
                key={key.id}
                item={key}
                tr={tr}
                canManage={canManage}
                connect={connect}
                reconnectKeyAccount={reconnectKeyAccount}
                buildActions={buildActions}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
