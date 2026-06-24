"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdDelete, MdAdd } from "react-icons/md";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import {
  PLANS_URL,
  DISCOUNT_TYPES,
  DISCOUNT_CONSTRAINTS,
  formatGBP,
} from "../config/constant.js";

/**
 * Manage discounts for a single plan. Mounts per-plan so the request hooks bind
 * to `plans/:planId/discounts`.
 */
export default function PlanDiscountsDialog({ open, onClose, plan, txt }) {
  const planId = plan?.id;
  const url = planId ? `${PLANS_URL}/${planId}/discounts` : PLANS_URL;

  const [type, setType] = useState("PERCENT");
  const [value, setValue] = useState("");
  const [constraint, setConstraint] = useState("DURATION");

  const listReq = useRequest({
    url: `${PLANS_URL}/${planId}`,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });

  const discounts = listReq.data?.discounts || plan?.discounts || [];

  useEffect(() => {
    if (open && planId) listReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planId]);

  const mut = useMultiRequest({
    url,
    onSuccess: () => listReq.fetchData(),
  });

  async function add() {
    if (!value) return;
    await mut.postRequest(null, {
      type,
      value: Number(value),
      constraint,
      isActive: true,
    });
    setValue("");
  }

  async function remove(id) {
    await mut.deleteRequest(String(id));
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`${txt.discountsFor} — ${plan?.titleAr || ""}`}
      maxWidth="sm"
      actions={null}
      showCloseIcon
    >
      <Stack spacing={2}>
        {discounts.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            {txt.noDiscounts}
          </Typography>
        )}

        {discounts.map((d) => (
          <Stack
            key={d.id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                color="secondary"
                label={d.type === "PERCENT" ? txt.percent : txt.fixed}
              />
              <Typography fontWeight={700}>
                {d.type === "PERCENT" ? `${d.value}%` : formatGBP(d.value)}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={d.constraint === "COUNT" ? txt.count : txt.duration}
              />
            </Stack>
            <IconButton
              color="error"
              size="small"
              onClick={() => remove(d.id)}
              aria-label={txt.delete}
            >
              <MdDelete />
            </IconButton>
          </Stack>
        ))}

        <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
          <Typography variant="subtitle2" mb={1}>
            {txt.addDiscount}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              select
              size="small"
              label={txt.type}
              value={type}
              onChange={(e) => setType(e.target.value)}
              sx={{ minWidth: 130 }}
            >
              {DISCOUNT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t === "PERCENT" ? txt.percent : txt.fixed}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="number"
              label={txt.value}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              sx={{ minWidth: 110 }}
            />
            <TextField
              select
              size="small"
              label={txt.constraint}
              value={constraint}
              onChange={(e) => setConstraint(e.target.value)}
              sx={{ minWidth: 130 }}
            >
              {DISCOUNT_CONSTRAINTS.map((c) => (
                <MenuItem key={c} value={c}>
                  {c === "COUNT" ? txt.count : txt.duration}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={add}
              disabled={mut.isPostRequestLoading || !value}
            >
              {txt.addDiscount}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </FormDialog>
  );
}
