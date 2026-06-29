"use client";

import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdSearch, MdDelete, MdCheckCircle, MdStars } from "react-icons/md";
import { FormDialog, useConfirm } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useTranslation } from "../../../i18n/client.js";

const PAGE_SIZE = 9;

/**
 * GameBadgeDialog — link / change / remove the badge auto-awarded when a student
 * completes ONE game. Searches badges with infinite scroll (9 per page), shows
 * the currently linked badge up top, and commits via POST games/:id/badge
 * ({ badgeId } to link, { badgeId: null } to unlink).
 *
 * Mounts per-game (parent renders keyed by game.id, only when open) so the
 * mutation binds to the right `games/${game.id}` url.
 */
export default function GameBadgeDialog({ open, onClose, game, txt, onChanged }) {
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const gameId = game?.id;

  // Currently linked badge — seeded from the row, updated locally on mutate so
  // the dialog reflects the change instantly without waiting for a list refetch.
  const [linkedBadge, setLinkedBadge] = useState(game?.badge ?? null);
  const [selectedId, setSelectedId] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  const badgeName = (b) => (lng === "en" ? b?.nameEn : b?.nameAr) || b?.code;

  // Badge search — paginated + infinite scroll, 9 per page, no URL sync.
  const badgesReq = useRequest({
    url: "badges",
    method: "get",
    isPaginated: true,
    scrollLoad: true,
    autoFetch: true,
    syncToUrl: false,
    initialParams: { limit: PAGE_SIZE },
  });

  const mut = useMultiRequest({
    url: `games/${gameId}`,
    onSuccess: () => onChanged?.(),
  });

  // Debounced search → reset to page 1 and re-enable "load more".
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = setTimeout(() => {
      badgesReq.setHasMore(true);
      badgesReq.setPage(1);
      badgesReq.setFilters({ search: searchInput.trim() || undefined });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const badges = Array.isArray(badgesReq.data) ? badgesReq.data : [];

  function onListScroll(e) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      badgesReq.loadMore();
    }
  }

  async function link() {
    if (!selectedId) return;
    await mut.postRequest("badge", { badgeId: Number(selectedId) });
    const chosen = badges.find((b) => b.id === selectedId);
    if (chosen) setLinkedBadge(chosen);
    setSelectedId(null);
  }

  async function remove() {
    const ok = await confirm({ title: txt.removeBadgeConfirm, intent: "danger" });
    if (!ok) return;
    await mut.postRequest("badge", { badgeId: null });
    setLinkedBadge(null);
  }

  const busy = mut.isPostRequestLoading;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`${txt.linkBadgeTitle} — ${lng === "en" ? game?.titleEn : game?.titleAr}`}
      maxWidth="sm"
      actions={null}
      showCloseIcon
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {txt.linkBadgeHint}
        </Typography>

        {/* Currently linked */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            {txt.currentBadge}
          </Typography>
          {linkedBadge ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Avatar
                sx={{
                  bgcolor: linkedBadge.bgColor || "warning.light",
                  color: linkedBadge.textColor || "warning.contrastText",
                }}
              >
                {linkedBadge.emoji || <MdStars />}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography fontWeight={700} noWrap>
                  {badgeName(linkedBadge)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {linkedBadge.score} {txt.points}
                </Typography>
              </Box>
              <Button
                size="small"
                color="error"
                variant="outlined"
                startIcon={<MdDelete />}
                disabled={busy}
                onClick={remove}
              >
                {txt.removeBadge}
              </Button>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {txt.noBadge}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Search + pick */}
        <TextField
          size="small"
          fullWidth
          placeholder={txt.searchBadge}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch />
              </InputAdornment>
            ),
          }}
        />

        <Box
          onScroll={onListScroll}
          sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}
        >
          {badgesReq.isLoading && badges.length === 0 ? (
            <Stack alignItems="center" sx={{ py: 3 }}>
              <CircularProgress size={24} />
            </Stack>
          ) : badges.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 3, textAlign: "center" }}
            >
              {txt.noBadgesFound}
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
              }}
            >
              {badges.map((b) => {
                const isSelected = selectedId === b.id;
                const isLinked = linkedBadge?.id === b.id;
                return (
                  <Stack
                    key={b.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    onClick={() => setSelectedId(b.id)}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: isSelected ? "primary.main" : "divider",
                      bgcolor: isSelected ? "action.hover" : "transparent",
                      transition: "border-color .15s",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        fontSize: 18,
                        bgcolor: b.bgColor || "warning.light",
                        color: b.textColor || "warning.contrastText",
                      }}
                    >
                      {b.emoji || <MdStars />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        noWrap
                        title={badgeName(b)}
                      >
                        {badgeName(b)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {b.score} {txt.points}
                      </Typography>
                    </Box>
                    {isLinked && (
                      <MdCheckCircle color="var(--mui-palette-success-main)" />
                    )}
                  </Stack>
                );
              })}
            </Box>
          )}
          {badgesReq.isLoading && badges.length > 0 && (
            <Stack alignItems="center" sx={{ py: 1.5 }}>
              <CircularProgress size={18} />
            </Stack>
          )}
        </Box>

        <Button
          variant="contained"
          disabled={!selectedId || busy || linkedBadge?.id === selectedId}
          onClick={link}
          startIcon={
            busy ? <CircularProgress size={16} color="inherit" /> : undefined
          }
        >
          {linkedBadge ? txt.change : txt.link}
        </Button>
      </Stack>
    </FormDialog>
  );
}
