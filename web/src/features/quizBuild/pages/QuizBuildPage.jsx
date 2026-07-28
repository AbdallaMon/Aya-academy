"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdBuild } from "react-icons/md";
import { PERMISSIONS } from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import {
  AsyncUserAutocomplete,
  LoadingOverlay,
} from "../../../shared/components/index.js";
import {
  INVITES_URL,
} from "../config/constant.js";
import { useQuizBuildText } from "../config/quizBuildText.js";
import CustomQuestionsSection from "../components/CustomQuestionsSection.jsx";

function StateMessage({ title, hint, actionLabel, onAction }) {
  return (
    <Paper sx={{ p: 4, textAlign: "center", maxWidth: 520, mx: "auto", mt: 6 }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {hint}
      </Typography>
      {actionLabel && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
}

export default function QuizBuildPage({ token }) {
  const txt = useQuizBuildText();
  const { lng } = useTranslation();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canBuild = hasPermission(PERMISSIONS.QUIZ.BUILD);

  const [selectedBank, setSelectedBank] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formError, setFormError] = useState("");

  const { control, handleSubmit } = useForm({
    defaultValues: {
      title: "",
      passThreshold: 60,
      giftName: "",
      customs: [],
    },
  });

  // Invite (+ exposed questions).
  const inviteReq = useRequest({
    url: `${INVITES_URL}/${token}`,
    method: "get",
    autoFetch: canBuild,
    syncToUrl: false,
  });

  const submitReq = useRequest({
    url: `${INVITES_URL}/${token}/build`,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => router.push(localePath(lng, "/dashboard/quizzes")),
  });

  const invite = inviteReq.data;
  const bankQuestions = useMemo(() => invite?.questions || [], [invite?.questions]);
  const [preselectedInviteId, setPreselectedInviteId] = useState(null);

  // Pre-select all exposed bank questions exactly once per invite.
  if (bankQuestions.length && preselectedInviteId !== invite?.id) {
    setPreselectedInviteId(invite?.id ?? null);
    setSelectedBank(bankQuestions.map((q) => q.id));
  }

  function toggleBank(id) {
    setSelectedBank((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function submit(values) {
    setFormError("");
    if (!values.title?.trim()) {
      setFormError(txt.needTitle);
      return;
    }
    const customs = values.customs || [];
    if (selectedBank.length === 0 && customs.length === 0) {
      setFormError(txt.needQuestions);
      return;
    }
    if (selectedStudents.length === 0) {
      setFormError(txt.needStudents);
      return;
    }
    // Validate custom questions: >=2 options, >=1 correct.
    for (const c of customs) {
      const opts = c.options || [];
      if (opts.length < 2 || !opts.some((o) => o.isCorrect)) {
        setFormError(txt.customNeedsOptions);
        return;
      }
    }

    const items = [
      ...selectedBank.map((id) => ({ source: "BANK", sourceQuestionId: id })),
      ...customs.map((c) => ({
        source: "CUSTOM",
        textAr: c.textAr,
        textEn: c.textEn,
        options: (c.options || []).map((o, i) => ({
          labelAr: o.labelAr,
          labelEn: o.labelEn,
          isCorrect: Boolean(o.isCorrect),
          order: i,
        })),
      })),
    ];

    const payload = {
      title: values.title,
      passThreshold: Number(values.passThreshold) || 0,
      giftName: values.giftName?.trim() || undefined,
      items,
      participantStudentIds: selectedStudents.map((student) => Number(student.id)),
    };
    submitReq.fetchData(null, payload);
  }

  if (!canBuild) return null;

  const loading = inviteReq.isLoading;

  // Friendly terminal states once the invite is loaded.
  if (!loading && !invite) {
    return (
      <StateMessage
        title={txt.notFoundTitle}
        hint={txt.notFoundHint}
        actionLabel={txt.goToQuizzes}
        onAction={() => router.push(localePath(lng, "/dashboard/quizzes"))}
      />
    );
  }
  if (!loading && invite?.status === "BUILT") {
    return (
      <StateMessage
        title={txt.builtTitle}
        hint={txt.builtHint}
        actionLabel={txt.goToQuizzes}
        onAction={() => router.push(localePath(lng, "/dashboard/quizzes"))}
      />
    );
  }
  if (!loading && invite?.status === "EXPIRED") {
    return (
      <StateMessage
        title={txt.expiredTitle}
        hint={txt.expiredHint}
        actionLabel={txt.goToQuizzes}
        onAction={() => router.push(localePath(lng, "/dashboard/quizzes"))}
      />
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay isLoading={loading} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          {txt.pageTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {txt.pageHint}
        </Typography>
      </Box>

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={3}>
          {/* Quiz settings */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              {txt.settingsTitle}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: txt.required }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      label={txt.titleLabel}
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Controller
                  name="passThreshold"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      type="number"
                      fullWidth
                      label={txt.passThresholdLabel}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Controller
                  name="giftName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      label={txt.giftNameLabel}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Bank questions */}
          <Paper sx={{ p: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {txt.bankTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {txt.bankHint}
                </Typography>
              </Box>
              <Chip
                size="small"
                color="primary"
                label={`${selectedBank.length} ${txt.selectedCount}`}
              />
            </Stack>

            {bankQuestions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {txt.noBankQuestions}
              </Typography>
            ) : (
              <List dense>
                {bankQuestions.map((q) => {
                  const text =
                    lng === "en" ? q.textEn || q.textAr : q.textAr || q.textEn;
                  const checked = selectedBank.includes(q.id);
                  const optionsText = (q.options || [])
                    .map((o) => (lng === "en" ? o.labelEn || o.labelAr : o.labelAr || o.labelEn))
                    .filter(Boolean)
                    .join("  •  ");
                  return (
                    <ListItemButton
                      key={q.id}
                      onClick={() => toggleBank(q.id)}
                      sx={{ alignItems: "flex-start" }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                        <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                      </ListItemIcon>
                      <ListItemText
                        primary={text}
                        secondary={optionsText}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Paper>

          {/* Custom questions */}
          <Paper sx={{ p: 3 }}>
            <CustomQuestionsSection control={control} txt={txt} />
          </Paper>

          {/* Participants */}
          <Paper sx={{ p: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {txt.studentsTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {txt.studentsHint}
                </Typography>
              </Box>
              <Chip
                size="small"
                color={selectedStudents.length ? "primary" : "default"}
                label={`${selectedStudents.length} ${txt.selectedCount}`}
              />
            </Stack>

            <AsyncUserAutocomplete
              multiple
              role="STUDENT"
              label={txt.studentsTitle}
              value={selectedStudents}
              onChange={setSelectedStudents}
            />
          </Paper>

          <Divider />

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => router.push(localePath(lng, "/dashboard/quizzes"))}
              disabled={submitReq.isLoading}
            >
              {txt.cancel}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<MdBuild />}
              disabled={submitReq.isLoading}
            >
              {txt.submit}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}
