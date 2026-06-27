"use client";

// The kid-friendly, one-question-at-a-time quiz player. Big tappable option
// cards, a progress bar, per-event sounds (reused from the games engine), and a
// "سلِّم إجابتي" button that only enables once every question is answered.
//
// Selections are kept as { [itemId]: optionId }. On submit we build the exact
// API payload: answers = [{ itemId, optionId }].

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { MdArrowBack, MdArrowForward, MdCheck, MdCheckCircle } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { useGameSounds } from "../../games/hooks/useGameSounds.js";
import { BounceIn, SlideIn } from "../../games/animations/index.js";
import { useQuizTakeText } from "../config/quizTakeText.js";

function OptionCard({ label, selected, onClick }) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        cursor: "pointer",
        userSelect: "none",
        p: { xs: 2, md: 2.5 },
        borderRadius: 4,
        border: "3px solid",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "primary.light" : "background.paper",
        color: selected ? "primary.contrastText" : "text.primary",
        boxShadow: selected ? 4 : 1,
        transition: "transform .12s ease, box-shadow .12s ease, background-color .12s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 5 },
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: "50%",
          border: "2px solid",
          borderColor: selected ? "primary.contrastText" : "text.disabled",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <MdCheck size={18} />}
      </Box>
      <Typography fontWeight={700} fontSize={{ xs: 16, md: 18 }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function QuizPlayer({ quiz, onSubmit, submitting }) {
  const { lng } = useTranslation();
  const en = lng === "en";
  const txt = useQuizTakeText();
  const sounds = useGameSounds();

  const items = useMemo(
    () => [...(quiz?.items || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [quiz],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [itemId]: optionId }

  const total = items.length;
  const current = items[index];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = total > 0 && answeredCount === total;
  const isLast = index === total - 1;

  const pickOption = (itemId, optionId) => {
    sounds.play("select");
    setAnswers((prev) => ({ ...prev, [itemId]: optionId }));
  };

  const goNext = () => {
    if (isLast) return;
    sounds.play("tap");
    setIndex((i) => Math.min(total - 1, i + 1));
  };
  const goPrev = () => {
    if (index === 0) return;
    sounds.play("tap");
    setIndex((i) => Math.max(0, i - 1));
  };

  const handleSubmit = () => {
    if (!allAnswered || submitting) return;
    sounds.play("tap");
    const payload = items.map((it) => ({ itemId: it.id, optionId: answers[it.id] }));
    onSubmit(payload);
  };

  if (!current) return null;

  const options = [...(current.options || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const questionText = (en ? current.textEn : current.textAr) || current.textAr || current.textEn || "";

  return (
    <Stack spacing={3}>
      {/* Progress */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={700}>
            {txt.questionLabel} {index + 1} {txt.of} {total}
          </Typography>
          <Chip
            size="small"
            color={allAnswered ? "success" : "default"}
            icon={allAnswered ? <MdCheckCircle /> : undefined}
            label={`${answeredCount} / ${total}`}
          />
        </Stack>
        <LinearProgress
          variant="determinate"
          value={total ? ((index + 1) / total) * 100 : 0}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>

      {/* Question + options */}
      <SlideIn key={current.id} from="start" distance={36}>
        <Stack spacing={2.5}>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.4 }}>
            {questionText}
          </Typography>
          <Stack spacing={1.5}>
            {options.map((opt) => {
              const optLabel = (en ? opt.labelEn : opt.labelAr) || opt.labelAr || opt.labelEn || "";
              return (
                <BounceIn key={opt.id}>
                  <OptionCard
                    label={optLabel}
                    selected={answers[current.id] === opt.id}
                    onClick={() => pickOption(current.id, opt.id)}
                  />
                </BounceIn>
              );
            })}
          </Stack>
        </Stack>
      </SlideIn>

      {/* Nav + submit */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems="center"
      >
        <Button
          variant="text"
          startIcon={en ? <MdArrowBack /> : <MdArrowForward />}
          onClick={goPrev}
          disabled={index === 0}
        >
          {txt.prev}
        </Button>

        {!isLast ? (
          <Button
            variant="contained"
            endIcon={en ? <MdArrowForward /> : <MdArrowBack />}
            onClick={goNext}
            sx={{ minWidth: 160, borderRadius: 3 }}
          >
            {txt.next}
          </Button>
        ) : (
          <Stack spacing={0.5} alignItems="center">
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<MdCheckCircle />}
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              sx={{ minWidth: 200, borderRadius: 3, fontWeight: 800 }}
            >
              {submitting ? txt.submitting : txt.submit}
            </Button>
            {!allAnswered && (
              <Typography variant="caption" color="text.secondary">
                {txt.answerAllHint}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
