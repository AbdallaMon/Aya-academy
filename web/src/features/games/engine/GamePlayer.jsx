"use client";

// GamePlayer — the engine shell. Renders ONLY from the game contract:
//   configJson (theme, hero, avatars, stars, certificate, rewardStudio)
//   questions[] (kind → renderer)
//
// Flow: [avatar select?] → tasks (one star each, retry-until-right) →
//       [reward studio?] → certificate.
//
// Kids rules ENFORCED: no failure / no game-over. A wrong choice plays a gentle
// error chime + shake + sad guide + an encouraging message + RETRY. Only a
// correct action advances and lights a star.
//
// Scoring: correctness is computed client-side from the contract (tone 'good' /
// dial sequence / slider zone). correctCount/totalQuestions accumulate.
//
// Two completely separate end-of-game flows:
//   - REAL game (dashboard, auth student) → POST /games/:id/attempt, which may
//     return a server certificate. This is the graded, persisted path.
//   - DEMO (`demo` prop, the public free-game) → NO attempt, NO server. It is a
//     pure client-side trial: the certificate is generated and PRINTED entirely
//     on the frontend. Nothing touches the backend.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "../../../i18n/client.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useGameSounds } from "../hooks/useGameSounds.js";
import { GAME_ATTEMPT_URL } from "../config/constant.js";
import GameShell from "./GameShell.jsx";
import RewardStudio from "./RewardStudio.jsx";
import Certificate from "./Certificate.jsx";
import { getRenderer } from "./renderers/index.js";
import { SlideIn, BounceIn } from "../animations/index.js";
import { pickText, DEFAULT_THEME } from "./helpers.js";

// Phases: "avatar" | "task" | "studio" | "cert"
// `demo` → public free-game trial: skip the attempt round-trip, print the
// certificate on the client (see header note).
export default function GamePlayer({ game, demo = false }) {
  const { t, lng } = useTranslation();
  const gd = useMemo(() => t("gamesData", { returnObjects: true }) || {}, [t]);
  const { user } = useAuth();
  const sounds = useGameSounds();

  const config = game?.configJson || {};
  const theme = { ...DEFAULT_THEME, ...(config.theme || {}) };
  const questions = useMemo(
    () => [...(game?.questions || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [game],
  );
  // Graded-task count = questions excluding DIALPAD pass-through sub-steps; this
  // is what stars + correctCount/totalQuestions are measured against.
  const gradedTotal = useMemo(
    () =>
      questions.filter((q) => !(q.kind === "DIALPAD" && q.mediaJson?.thenChoose))
        .length,
    [questions],
  );
  const avatars = config.avatars || [];
  const totalStars = config.stars || gradedTotal || 1;
  const hasStudio = Boolean(config.rewardStudio);

  // ── state ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState(avatars.length > 0 ? "avatar" : "task");
  const [avatar, setAvatar] = useState(avatars[1] || avatars[0] || null);
  const [taskIndex, setTaskIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [mood, setMood] = useState(null); // "good" | "bad" | null
  const [guideOverride, setGuideOverride] = useState(null);
  const [showAdvance, setShowAdvance] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [serverCertificate, setServerCertificate] = useState(null);
  const [burst, setBurst] = useState(0); // bump → confetti celebration in the shell

  // grading accumulators
  const answersRef = useRef({});
  const correctRef = useRef(0);
  const gradedRef = useRef(0); // count of graded (star-bearing) tasks completed
  const advanceRef = useRef(() => {}); // latest advance(), for dial pass-through

  const heroEmoji = avatar?.emoji || config.hero?.emoji || "🧒";
  const heroName =
    pickText(avatar, "label", lng) ||
    pickText(config.hero, "name", lng) ||
    "🌟";
  const childName = user?.name || pickText(avatar, "label", lng) || null;

  // ── attempt round-trip (REAL games only; never in demo) ─────────────────────
  // In demo mode the URL is empty and we never call postAttempt — the public
  // trial must not hit the backend (no auth → 403) and needs no server result.
  const { fetchData: postAttempt } = useRequest({
    url: !demo && game?.id ? `${GAME_ATTEMPT_URL}/${game.id}/attempt` : "",
    method: "post",
    shouldAutoToast: false,
    autoFetch: false,
    onSuccess: (res) => {
      if (res?.data?.certificate) setServerCertificate(res.data.certificate);
    },
  });

  // DEMO (anonymous free-game): no attempt → no server certificate. Pull the
  // single active GAME template (public, render fields only) so the free-game
  // certificate matches the admin-designed look instead of a hardcoded card.
  const { data: gameTemplate } = useRequest({
    url: "certificate-templates/public/active-game",
    method: "get",
    isPublic: true,
    autoFetch: demo,
    syncToUrl: false,
    shouldAutoToast: false,
  });

  const currentQuestion = questions[taskIndex];

  // ── guide text resolution ───────────────────────────────────────────────────
  const guideText = useMemo(() => {
    if (guideOverride) return guideOverride;
    if (phase === "avatar") return gd.chooseAvatar;
    if (currentQuestion) return pickText(currentQuestion, "prompt", lng);
    return gd.greatJob;
  }, [guideOverride, phase, currentQuestion, lng, gd]);

  const setGuide = useCallback((text, nextMood = null) => {
    setGuideOverride(text);
    setMood(nextMood);
  }, []);

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleWrong = useCallback(
    ({ feedback }) => {
      setMood("bad");
      setGuideOverride(feedback || gd.tryAgain);
    },
    [gd],
  );

  const handleCorrect = useCallback(
    ({ feedback, ...answer }) => {
      if (!currentQuestion) return;

      // A DIALPAD with `thenChoose` is a SUB-STEP that unlocks the next
      // (choice) question — it does NOT light a star or count as a graded task.
      // It simply auto-advances so the contract's star/score totals stay aligned
      // with configJson.stars + passThreshold.
      const isDialPassThrough =
        currentQuestion.kind === "DIALPAD" && currentQuestion.mediaJson?.thenChoose;

      answersRef.current[currentQuestion.id ?? taskIndex] = {
        kind: currentQuestion.kind,
        ...answer,
      };

      if (isDialPassThrough) {
        sounds.play("tap");
        setMood("good");
        setGuideOverride(feedback || gd.greatJob);
        // brief beat so the green call animation reads, then advance.
        setTimeout(() => advanceRef.current(), 650);
        return;
      }

      // graded task: count it, light a star, offer "next".
      correctRef.current += 1;
      gradedRef.current += 1;
      const nextStars = Math.min(stars + 1, totalStars);
      setStars(nextStars);
      setMood("good");
      setGuideOverride(feedback || gd.greatJob);
      sounds.play("star");
      setBurst((b) => b + 1);
      setShowAdvance(true);
    },
    [currentQuestion, taskIndex, stars, totalStars, gd, sounds],
  );

  const finishGame = useCallback(() => {
    // a big celebration as the whole adventure completes.
    sounds.play("win");
    setBurst((b) => b + 1);
    // REAL game only: record the attempt (auth student). The DEMO is fully
    // client-side — it never posts an attempt.
    if (!demo && game?.id) {
      const payload = {
        answersJson: answersRef.current,
        correctCount: correctRef.current,
        totalQuestions: gradedTotal,
      };
      postAttempt(null, payload).catch(() => {
        // anonymous / non-student: ignore — local experience is complete.
      });
    }
    if (hasStudio) {
      setPhase("studio");
      setGuide(gd.collectStars, "good");
    } else {
      setPhase("cert");
      setCertOpen(true);
    }
  }, [demo, game, gradedTotal, postAttempt, hasStudio, gd, setGuide, sounds]);

  const advance = useCallback(() => {
    sounds.play("tap");
    setShowAdvance(false);
    setMood(null);
    setGuideOverride(null);
    const next = taskIndex + 1;
    if (next < questions.length) {
      setTaskIndex(next);
    } else {
      finishGame();
    }
  }, [taskIndex, questions.length, finishGame, sounds]);

  // keep advanceRef pointing at the latest advance for the dial pass-through.
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  const replay = useCallback(() => {
    answersRef.current = {};
    correctRef.current = 0;
    gradedRef.current = 0;
    setStars(0);
    setTaskIndex(0);
    setMood(null);
    setGuideOverride(null);
    setShowAdvance(false);
    setCertOpen(false);
    setServerCertificate(null);
    setPhase(avatars.length > 0 ? "avatar" : "task");
  }, [avatars.length]);

  // ── render bodies ───────────────────────────────────────────────────────────
  function renderAvatarSelect() {
    return (
      <BounceIn style={{ width: "100%" }}>
        <Box sx={{ textAlign: "center" }}>
          <Box sx={{ fontSize: 64, lineHeight: 1, my: 1 }}>{heroEmoji}</Box>
          <Typography sx={{ color: "#3a1d6e", fontWeight: 900, fontSize: 19 }}>
            {pickText(game, "title", lng)}
          </Typography>
          <Typography sx={{ color: "#5a4a86", fontWeight: 700, fontSize: 13, mt: 0.5 }}>
            {gd.chooseAvatar}
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 2 }}>
          {avatars.map((a) => {
            const selected = a.id === avatar?.id;
            return (
              <Box
                key={a.id}
                onClick={() => { sounds.play("pick"); setAvatar(a); }}
                sx={{
                  border: `2px solid ${selected ? theme.primary : "#ece8ff"}`,
                  boxShadow: selected ? `0 0 0 4px ${theme.primary}22` : "none",
                  borderRadius: "18px", p: "14px 8px", textAlign: "center", cursor: "pointer",
                  background: "#fff", transition: "transform .15s, border-color .15s",
                  "&:hover": { transform: "translateY(-3px)" },
                }}
              >
                <Box sx={{ fontSize: 34 }}>{a.emoji}</Box>
                <Typography sx={{ fontWeight: 800, mt: 0.75, fontSize: 14 }}>
                  {pickText(a, "label", lng)}
                </Typography>
              </Box>
            );
          })}
        </Box>
        <Box
          sx={{
            mt: 2, border: "2px dashed #cdbcff", borderRadius: "16px", p: "12px 14px",
            background: "#f7f3ff", fontSize: 13, fontWeight: 700, color: "#6536e0",
            textAlign: "center", lineHeight: 1.6,
          }}
        >
          {gd.collectStars}
        </Box>
        <button
          type="button"
          onClick={() => { sounds.play("tap"); setPhase("task"); setGuideOverride(null); }}
          style={{
            marginTop: 14, width: "100%", border: "none", borderRadius: 16, padding: "15px 18px",
            fontWeight: 900, fontSize: 16, cursor: "pointer", color: "#fff", fontFamily: "inherit",
            background: "linear-gradient(180deg, #20cf99, #0fa377)",
          }}
        >
          {gd.startAdventure}
        </button>
      </BounceIn>
    );
  }

  function renderTask() {
    if (!currentQuestion) return null;
    const Renderer = getRenderer(currentQuestion.kind);
    return (
      <Box sx={{ width: "100%" }}>
        <AnimatePresence mode="wait">
          <SlideIn key={taskIndex} from="bottom" style={{ width: "100%" }}>
            <Renderer
              question={currentQuestion}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              sounds={sounds}
            />
          </SlideIn>
        </AnimatePresence>
        {showAdvance ? (
          <BounceIn style={{ width: "100%" }}>
            <button
              type="button"
              onClick={advance}
              style={{
                marginTop: 16, width: "100%", border: "none", borderRadius: 16, padding: "15px 18px",
                fontWeight: 900, fontSize: 16, cursor: "pointer", color: "#fff", fontFamily: "inherit",
                background: "linear-gradient(180deg, #ffb43d, #f6970a)",
              }}
            >
              {taskIndex + 1 < questions.length ? gd.nextTask : gd.finishTask}
            </button>
          </BounceIn>
        ) : null}
      </Box>
    );
  }

  function renderBody() {
    if (phase === "avatar") return renderAvatarSelect();
    if (phase === "studio") {
      return (
        <RewardStudio
          studio={config.rewardStudio}
          sounds={sounds}
          setGuide={setGuide}
          onContinue={() => { setPhase("cert"); setCertOpen(true); }}
          onReplay={replay}
        />
      );
    }
    if (phase === "cert") {
      // body stays calm behind the modal
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Box sx={{ fontSize: 64 }}>{config.certificate?.emoji || "👑"}</Box>
          <Typography sx={{ fontWeight: 900, color: "#3a1d6e", mt: 1 }}>
            {gd.greatJob}
          </Typography>
        </Box>
      );
    }
    return renderTask();
  }

  return (
    <>
      <GameShell
        heroName={heroName}
        avatarEmoji={heroEmoji}
        guideEmoji={heroEmoji}
        stars={stars}
        totalStars={totalStars}
        score={stars}
        mood={mood}
        muted={sounds.muted}
        onToggleMute={sounds.toggleMute}
        guideText={guideText}
        subtitle={pickText(game, "title", lng)}
        starLabel="⭐"
        burst={burst}
      >
        {renderBody()}
      </GameShell>

      <Certificate
        open={certOpen}
        certificateConfig={config.certificate}
        serverCertificate={serverCertificate}
        gameTemplate={gameTemplate}
        heroEmoji={heroEmoji}
        childName={childName}
        gameTitle={pickText(game, "title", lng)}
        demo={demo}
        onClose={() => setCertOpen(false)}
        onReplay={replay}
        sounds={sounds}
      />
    </>
  );
}
