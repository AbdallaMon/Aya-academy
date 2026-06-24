"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdEdit, MdDelete, MdAdd, MdClose, MdCheck } from "react-icons/md";
import { FormDialog, useConfirm } from "../../../shared/components/index.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { CATEGORIES_URL } from "../config/constant.js";

/**
 * Inline CRUD over quiz categories.
 *   GET/POST quizzes/categories
 *   PUT/DELETE quizzes/categories/:id   body { nameAr, nameEn }
 */
export default function CategoriesDialog({
  open,
  onClose,
  categories,
  txt,
  onChanged,
}) {
  const confirm = useConfirm();
  const [draft, setDraft] = useState({ nameAr: "", nameEn: "" });
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({ nameAr: "", nameEn: "" });

  const mut = useMultiRequest({
    url: CATEGORIES_URL,
    onSuccess: () => onChanged?.(),
  });

  const loading =
    mut.isPostRequestLoading ||
    mut.isPutRequestLoading ||
    mut.isDeleteRequestLoading;

  async function addCategory() {
    if (!draft.nameAr.trim() || !draft.nameEn.trim()) return;
    await mut.postRequest(null, { nameAr: draft.nameAr, nameEn: draft.nameEn });
    setDraft({ nameAr: "", nameEn: "" });
  }

  function startEdit(c) {
    setEditId(c.id);
    setEditDraft({ nameAr: c.nameAr ?? "", nameEn: c.nameEn ?? "" });
  }

  async function saveEdit() {
    if (!editDraft.nameAr.trim() || !editDraft.nameEn.trim()) return;
    await mut.putRequest(String(editId), {
      nameAr: editDraft.nameAr,
      nameEn: editDraft.nameEn,
    });
    setEditId(null);
  }

  async function removeCategory(c) {
    const ok = await confirm({
      title: txt.deleteCatTitle,
      description: txt.deleteCatDescription,
      intent: "danger",
      confirmText: txt.deleteCategory,
    });
    if (!ok) return;
    await mut.deleteRequest(String(c.id));
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.categoriesTitle}
      subtitle={txt.categoriesHint}
      maxWidth="sm"
      loading={loading}
      actions={
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {txt.close}
        </Button>
      }
    >
      <Stack spacing={2}>
        {/* Add new */}
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            size="small"
            label={txt.catNameAr}
            value={draft.nameAr}
            onChange={(e) => setDraft((d) => ({ ...d, nameAr: e.target.value }))}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label={txt.catNameEn}
            value={draft.nameEn}
            onChange={(e) => setDraft((d) => ({ ...d, nameEn: e.target.value }))}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<MdAdd />}
            onClick={addCategory}
            disabled={loading || !draft.nameAr.trim() || !draft.nameEn.trim()}
          >
            {txt.addCategory}
          </Button>
        </Stack>

        <Divider />

        {(categories || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {txt.noCategories}
          </Typography>
        ) : (
          <List dense disablePadding>
            {categories.map((c) => (
              <ListItem key={c.id} disableGutters divider>
                {editId === c.id ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                    <TextField
                      size="small"
                      value={editDraft.nameAr}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, nameAr: e.target.value }))
                      }
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      value={editDraft.nameEn}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, nameEn: e.target.value }))
                      }
                      sx={{ flex: 1 }}
                    />
                    <IconButton color="primary" onClick={saveEdit} disabled={loading}>
                      <MdCheck />
                    </IconButton>
                    <IconButton onClick={() => setEditId(null)}>
                      <MdClose />
                    </IconButton>
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <Typography variant="body2">
                      {c.nameAr} <Typography component="span" color="text.secondary">— {c.nameEn}</Typography>
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => startEdit(c)}>
                        <MdEdit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeCategory(c)}
                      >
                        <MdDelete />
                      </IconButton>
                    </Stack>
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Stack>
    </FormDialog>
  );
}
