"use client";

// The /dashboard/quizzes/:id route. Role-aware:
//   STUDENT       → interactive take-quiz flow (intro → player → result)
//   ADMIN/PARENT  → read-only details view (meta + per-child results)
//
// Fetches GET /quizzes/:id for the quiz (student sees items WITHOUT the answer
// key). The attempt is posted to POST /quizzes/:id/attempt (auto-toast off — we
// render our own celebratory result), and the response (incl. the full
// certificate) drives the result screen.

import { useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { MdArrowBack, MdCardGiftcard, MdPlayArrow } from "react-icons/md";
import NextLink from "next/link";
import { PERMISSIONS, USER_ROLES } from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { LoadingOverlay } from "../../../shared/components/index.js";
import { BounceIn } from "../../games/animations/index.js";
import { useGameSounds } from "../../games/hooks/useGameSounds.js";
import { QUIZZES_URL } from "../../quizzes/config/constant.js";
import { useQuizTakeText } from "../config/quizTakeText.js";
import QuizPlayer from "../components/QuizPlayer.jsx";
import QuizResult from "../components/QuizResult.jsx";
import QuizDetailsAdmin from "../components/QuizDetailsAdmin.jsx";

// Student phases: intro → playing → done.
const PHASE = { INTRO: "intro", PLAYING: "playing", DONE: "done" };

export default function QuizTakePage({ quizId }) {
  const { lng } = useTranslation();
  const txt = useQuizTakeText();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const sounds = useGameSounds();

  const role = user?.role;
  const isStudent = role === USER_ROLES.STUDENT;
  const isAdminOrParent = role === USER_ROLES.ADMIN || role === USER_ROLES.PARENT;

  // Student needs ATTEMPT; admin/parent need VIEW to see details.
  const canStudent = isStudent && hasPermission(PERMISSIONS.QUIZ.ATTEMPT);
  const canManage = isAdminOrParent && hasPermission(PERMISSIONS.QUIZ.VIEW);
  const canSee = canStudent || canManage;

  const [phase, setPhase] = useState(PHASE.INTRO);
  const [result, setResult] = useState(null);
  // Bump to remount the player on retake (fresh selections).
  const [attemptKey, setAttemptKey] = useState(0);

  const {
    data: quiz,
    isLoading,
  } = useRequest({
    url: `${QUIZZES_URL}/${quizId}`,
    method: "get",
    autoFetch: canSee,
    syncToUrl: false,
  });

  const { fetchData: submitAttempt, isLoading: submitting } = useRequest({
    url: `${QUIZZES_URL}/${quizId}/attempt`,
    method: "post",
    shouldAutoToast: false, // we render a custom celebratory result
    syncToUrl: false,
    onSuccess: (res) => {
      setResult(res?.data || null);
      setPhase(PHASE.DONE);
    },
  });

  const backLink = localePath(lng, "/dashboard/quizzes");

  const BackButton = (
    <Button
      component={NextLink}
      href={backLink}
      startIcon={lng === "en" ? <MdArrowBack /> : undefined}
      endIcon={lng === "en" ? undefined : <MdArrowBack style={{ transform: "scaleX(-1)" }} />}
      variant="text"
      sx={{ mb: 2 }}
    >
      {txt.back}
    </Button>
  );

  if (!canSee) {
    return (
      <Box sx={{ p: 4 }}>
        <Paper sx={{ p: 4, textAlign: "center", maxWidth: 480, mx: "auto" }}>
          <Typography variant="h6" fontWeight={800}>
            {txt.noAccess}
          </Typography>
          {BackButton}
        </Paper>
      </Box>
    );
  }

  // ── ADMIN / PARENT: read-only details ──
  if (canManage) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {BackButton}
        <QuizDetailsAdmin quizId={quizId} quiz={quiz} metaLoading={isLoading} />
      </Box>
    );
  }

  // ── STUDENT: take-quiz flow ──
  const startQuiz = () => {
    sounds.play("whoosh");
    setPhase(PHASE.PLAYING);
  };

  const handleSubmit = (answers) => {
    submitAttempt(null, { answers });
  };

  const retake = () => {
    sounds.play("tap");
    setResult(null);
    setAttemptKey((k) => k + 1);
    setPhase(PHASE.PLAYING);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 820, mx: "auto", position: "relative", minHeight: 360 }}>
      <LoadingOverlay isLoading={isLoading && !quiz} type="box" />
      {BackButton}

      {!quiz && !isLoading && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">{txt.notFound}</Typography>
        </Paper>
      )}

      {quiz && phase === PHASE.INTRO && (
        <BounceIn style={{ width: "100%" }}>
          <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: "center", borderRadius: 5 }}>
            <Typography sx={{ fontSize: 56, lineHeight: 1 }}>🌟</Typography>
            <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>
              {quiz.title}
            </Typography>
            <Typography variant="h6" color="primary" fontWeight={800} sx={{ mt: 1 }}>
              {txt.introHi}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 460, mx: "auto" }}>
              {txt.introHint}
            </Typography>

            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ my: 3 }}>
              <Chip label={`${txt.questions}: ${quiz.items?.length ?? 0}`} />
              {quiz.passThreshold != null && (
                <Chip variant="outlined" label={`${txt.passThreshold}: ${quiz.passThreshold}%`} />
              )}
              {quiz.giftName && (
                <Chip icon={<MdCardGiftcard />} color="secondary" variant="outlined" label={quiz.giftName} />
              )}
            </Stack>

            <Button
              variant="contained"
              size="large"
              startIcon={<MdPlayArrow />}
              onClick={startQuiz}
              sx={{ minWidth: 220, borderRadius: 3, fontWeight: 800 }}
            >
              {txt.start}
            </Button>
          </Paper>
        </BounceIn>
      )}

      {quiz && phase === PHASE.PLAYING && (
        <QuizPlayer key={attemptKey} quiz={quiz} onSubmit={handleSubmit} submitting={submitting} />
      )}

      {quiz && phase === PHASE.DONE && result && (
        <QuizResult result={result} quiz={quiz} onRetake={retake} />
      )}
    </Box>
  );
}
