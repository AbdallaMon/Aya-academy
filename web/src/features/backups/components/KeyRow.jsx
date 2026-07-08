"use client";

import { Box, Button, Chip, Stack, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import { FiRefreshCw, FiStar } from "react-icons/fi";
import RowActions from "./RowActions.jsx";

/**
 * KeyRow — a single saved-key row inside KeysListCard: name, primary/connection
 * badges, short fingerprint, holding account + date, and per-row actions.
 * Pure presentational extraction from KeysSection.
 */
export default function KeyRow({
  item,
  tr,
  canManage,
  connect,
  reconnectKeyAccount,
  buildActions,
}) {
  const short = item.fingerprint ? item.fingerprint.slice(0, 8) : "";
  const account = item.keyAccount?.email || item.keyAccount?.label || "—";
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        p: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Typography variant="body1" fontWeight={600}>
            {item.name}
          </Typography>
          {item.isPrimary && (
            <Chip
              size="small"
              color="primary"
              icon={<FiStar size={14} />}
              label={tr.primaryBadge}
            />
          )}
          <Chip
            size="small"
            variant="outlined"
            color={item.connected ? "success" : "warning"}
            label={item.connected ? tr.connected : tr.disconnected}
          />
          {short && (
            <Tooltip title={item.fingerprint || ""} arrow>
              <Typography variant="caption" color="text.secondary">
                {short}
              </Typography>
            </Tooltip>
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {account}
          {item.createdAt
            ? ` · ${dayjs(item.createdAt).format("DD/MM/YYYY")}`
            : ""}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} alignItems="center">
        {!item.connected && (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<FiRefreshCw />}
            disabled={connect.isLoading || !item.keyAccount}
            onClick={() =>
              item.keyAccount && reconnectKeyAccount(item.keyAccount)
            }
          >
            {tr.reconnect}
          </Button>
        )}
        {canManage && <RowActions row={item} actions={buildActions(item)} />}
      </Stack>
    </Stack>
  );
}
