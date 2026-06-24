"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdSearch, MdContentCopy, MdCheckCircle } from "react-icons/md";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { localePath } from "../../../i18n/routing.js";
import {
  INVITES_URL,
  BANK_URL,
  USERS_URL,
  buildLinkForToken,
} from "../config/constant.js";

/**
 * Admin: create an invitation.
 *   POST quizzes/invites { parentId, questionIds[], expiresAt? }
 * After success, show a shareable build link + copy button.
 */
export default function CreateInviteDialog({ open, onClose, txt, onSuccess }) {
  const { lng } = useTranslation();
  const { showToast } = useToast();

  const [parentId, setParentId] = useState("");
  const [questionIds, setQuestionIds] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [createdInvite, setCreatedInvite] = useState(null);

  const parentsReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { role: "PARENT", limit: 100 },
  });

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
    onSuccess: (res) => {
      setCreatedInvite(res?.data || null);
      onSuccess?.();
    },
  });

  useEffect(() => {
    if (open) {
      setParentId("");
      setQuestionIds([]);
      setExpiresAt(null);
      setSearch("");
      setFormError("");
      setCreatedInvite(null);
      parentsReq.fetchData();
      questionsReq.fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parents = (parentsReq.data || []).filter((u) => u.role === "PARENT");
  const questions = questionsReq.data || [];

  const filteredQuestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((item) =>
      [item.textAr, item.textEn]
        .filter(Boolean)
        .some((t) => t.toLowerCase().includes(q)),
    );
  }, [questions, search]);

  function toggleQuestion(id) {
    setQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function submit() {
    setFormError("");
    if (!parentId) {
      setFormError(txt.pickParent);
      return;
    }
    if (questionIds.length === 0) {
      setFormError(txt.pickQuestions);
      return;
    }
    const payload = {
      parentId: Number(parentId),
      questionIds: questionIds.map(Number),
    };
    if (expiresAt) payload.expiresAt = dayjs(expiresAt).toISOString();
    createReq.fetchData(null, payload);
  }

  const link = createdInvite?.token
    ? buildLinkForToken(lng, createdInvite.token, localePath)
    : "";

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      showToast({ message: txt.copied, severity: "success" });
    } catch {
      /* clipboard unavailable */
    }
  }

  // ── Success view ─────────────────────────────────────────────────────────
  if (createdInvite) {
    return (
      <FormDialog
        open={open}
        onClose={onClose}
        title={txt.createdTitle}
        maxWidth="sm"
        actions={
          <Button variant="contained" onClick={onClose}>
            {txt.done}
          </Button>
        }
      >
        <Stack spacing={2} alignItems="stretch">
          <Stack direction="row" spacing={1} alignItems="center" color="success.main">
            <MdCheckCircle size={22} />
            <Typography variant="body2" color="text.secondary">
              {txt.createdHint}
            </Typography>
          </Stack>
          <TextField
            value={link}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={copyLink} aria-label={txt.copy}>
                    <MdContentCopy />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </FormDialog>
    );
  }

  // ── Form view ────────────────────────────────────────────────────────────
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.createTitle}
      maxWidth="md"
      loading={createReq.isLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2.5}>
        {formError && <Alert severity="error">{formError}</Alert>}

        <TextField
          select
          label={txt.selectParent}
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          fullWidth
          required
          helperText={parents.length === 0 ? txt.noParents : undefined}
        >
          {parents.map((p) => (
            <MenuItem key={p.id} value={String(p.id)}>
              {p.name} {p.email ? `— ${p.email}` : ""}
            </MenuItem>
          ))}
        </TextField>

        <DatePicker
          label={txt.expiresLabel}
          value={expiresAt}
          onChange={(v) => setExpiresAt(v)}
          disablePast
          slotProps={{ textField: { fullWidth: true } }}
        />

        <Divider />

        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              {txt.questionsLabel}
            </Typography>
            <Chip
              size="small"
              color={questionIds.length ? "primary" : "default"}
              label={`${questionIds.length} ${txt.selectedCount}`}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {txt.questionsHint}
          </Typography>

          <TextField
            size="small"
            fullWidth
            placeholder={txt.searchQuestions}
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

          {filteredQuestions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              {txt.noQuestions}
            </Typography>
          ) : (
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
              {filteredQuestions.map((item) => {
                const text =
                  lng === "en"
                    ? item.textEn || item.textAr
                    : item.textAr || item.textEn;
                const checked = questionIds.includes(item.id);
                return (
                  <ListItemButton
                    key={item.id}
                    onClick={() => toggleQuestion(item.id)}
                    dense
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText
                      primary={text}
                      secondary={item.category?.nameAr || item.category?.nameEn}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Stack>
    </FormDialog>
  );
}
