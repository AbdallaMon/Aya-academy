"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  Chip,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdSearch } from "react-icons/md";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { INVITES_URL } from "../config/constant.js";

const BANK_URL = "quizzes/bank";

/**
 * Send a quiz invite to a preselected PARENT.
 *   POST quizzes/invites { parentId, questionIds[] }
 * Mirrors the quiz-invites CreateInviteDialog but with the parent locked.
 */
export default function SendInviteDialog({ open, onClose, parentId, parentName, txt, onSuccess }) {
  const { lng } = useTranslation();
  const [questionIds, setQuestionIds] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const questionsReq = useRequest({
    url: BANK_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, isActive: true },
  });

  const createReq = useRequest({
    url: INVITES_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
  });

  useEffect(() => {
    if (open) {
      setQuestionIds([]);
      setSearch("");
      setError("");
      questionsReq.fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const questions = questionsReq.data || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((item) =>
      [item.textAr, item.textEn].filter(Boolean).some((t) => t.toLowerCase().includes(q)),
    );
  }, [questions, search]);

  function toggle(id) {
    setQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function submit() {
    setError("");
    if (!parentId) return;
    if (questionIds.length === 0) {
      setError(txt.required);
      return;
    }
    createReq.fetchData(null, {
      parentId: Number(parentId),
      questionIds: questionIds.map(Number),
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.sendInvite}
      subtitle={parentName}
      maxWidth="md"
      loading={createReq.isLoading}
      submitText={txt.send}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2}>
        {error && (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        )}
        <Divider />
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {txt.sendInvite}
            </Typography>
            <Chip
              size="small"
              color={questionIds.length ? "primary" : "default"}
              label={questionIds.length}
            />
          </Stack>
          <TextField
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ my: 1.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch />
                </InputAdornment>
              ),
            }}
          />
          <List
            dense
            sx={{
              maxHeight: 280,
              overflowY: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            {filtered.map((item) => {
              const text =
                lng === "en" ? item.textEn || item.textAr : item.textAr || item.textEn;
              const checked = questionIds.includes(item.id);
              return (
                <ListItemButton key={item.id} onClick={() => toggle(item.id)} dense>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Stack>
    </FormDialog>
  );
}
