"use client";

// ChoiceTask — renders MULTIPLE_CHOICE, EMOJI_CHOICE, SCENARIO and PHONE_CALL.
//   - layout: mediaJson.layout "grid" (EMOJI_CHOICE) vs "list" (default)
//   - tone coloring: mediaJson.optionMeta[i].tone → good / warn / bad
//   - SCENARIO / PHONE_CALL: a centered scene emoji + caption (phone-framed)
//
// Kids rule (NO failure): a wrong tap = gentle shake + red flash + sad guide +
// the option's feedback + RETRY. After TWO wrong taps we gently GLOW the correct
// card(s) so the child can always find the answer ("where's the right one?"). A
// correct tap = green flash + sparkle burst + chime, then it advances.

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { bounceIn, jelly, shake, SparkleTrail } from "../../animations/index.js";
import { pickText, tonePalette, flashPalette, isOptionCorrect } from "../helpers.js";
import { useSelectFlash } from "../../hooks/useSelectFlash.js";

// shared pulsing glow for the "reveal the answer" hint
const HINT_ANIM = {
  scale: [1, 1.035, 1],
  boxShadow: [
    "0 0 0 0 rgba(24,192,143,0)",
    "0 0 0 6px rgba(24,192,143,0.35)",
    "0 0 0 0 rgba(24,192,143,0)",
  ],
};

function OptionCard({ option, index, mediaJson, lng, onPick, disabled, flash, shaking, sparkle, hint }) {
  const tone = mediaJson?.optionMeta?.[index]?.tone;
  const pal = flashPalette(flash) || (hint ? { bg: "#e7fbf3", border: "#18c08f" } : tonePalette(tone));
  const label = pickText(option, "label", lng);

  return (
    <Box sx={{ position: "relative" }}>
      <motion.button
        type="button"
        variants={bounceIn}
        initial="hidden"
        animate={
          shaking ? shake.shake : sparkle ? jelly(true) : hint ? HINT_ANIM : "visible"
        }
        whileTap={disabled ? undefined : { scale: 0.97 }}
        custom={index}
        transition={hint ? { duration: 1, repeat: Infinity } : { delay: index * 0.06 }}
        disabled={disabled}
        onClick={() => onPick(option, index)}
        style={{
          border: `2px solid ${pal.border}`,
          background: pal.bg,
          transition: "background-color .2s, border-color .2s",
          borderRadius: 16,
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: disabled ? "default" : "pointer",
          width: "100%",
          fontWeight: 700,
          fontSize: 14,
          lineHeight: 1.6,
          textAlign: "start",
          fontFamily: "inherit",
          color: "#2b2350",
        }}
      >
        {option.emoji ? <span style={{ fontSize: 24, flex: "none" }}>{option.emoji}</span> : null}
        <span>{label}</span>
        {hint ? <span style={{ marginInlineStart: "auto", fontSize: 18 }}>👈</span> : null}
      </motion.button>
      {sparkle ? <SparkleTrail count={7} size={20} /> : null}
    </Box>
  );
}

function GridCard({ option, index, mediaJson, lng, onPick, disabled, flash, shaking, sparkle, hint }) {
  const tone = mediaJson?.optionMeta?.[index]?.tone;
  const pal = flashPalette(flash) || (hint ? { bg: "#e7fbf3", border: "#18c08f" } : tonePalette(tone));
  const label = pickText(option, "label", lng);
  return (
    <Box sx={{ position: "relative" }}>
      <motion.button
        type="button"
        variants={bounceIn}
        initial="hidden"
        animate={
          shaking ? shake.shake : sparkle ? jelly(true) : hint ? HINT_ANIM : "visible"
        }
        whileTap={disabled ? undefined : { scale: 0.95 }}
        transition={hint ? { duration: 1, repeat: Infinity } : { delay: index * 0.06 }}
        disabled={disabled}
        onClick={() => onPick(option, index)}
        style={{
          border: `2px solid ${pal.border}`,
          background: pal.bg,
          transition: "background-color .2s, border-color .2s",
          borderRadius: 18,
          padding: "18px 10px",
          cursor: disabled ? "default" : "pointer",
          fontFamily: "inherit",
          color: "#2b2350",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          minHeight: 120,
          justifyContent: "center",
          width: "100%",
        }}
      >
        <span style={{ fontSize: 40, lineHeight: 1 }}>{option.emoji || "✨"}</span>
        <span style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.4, textAlign: "center" }}>
          {label}
        </span>
      </motion.button>
      {sparkle ? <SparkleTrail count={7} size={20} /> : null}
    </Box>
  );
}

export default function ChoiceTask({ question, onCorrect, onWrong, sounds }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const isGrid = media.layout === "grid" || question.kind === "EMOJI_CHOICE";
  const isScene =
    question.kind === "SCENARIO" ||
    question.kind === "PHONE_CALL" ||
    Boolean(media.sceneEmoji);

  const options = question.options || [];
  const { fire, flashFor } = useSelectFlash();
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongIdx, setWrongIdx] = useState(null);
  const [sparkIdx, setSparkIdx] = useState(null);
  const [locked, setLocked] = useState(false);

  // after 2 misses, glow the correct option(s) so the child can find the answer.
  const reveal = wrongCount >= 2;

  function handlePick(option, index) {
    if (locked) return;
    const correct = isOptionCorrect(option, index, media);
    const feedback = pickText(option, "feedback", lng);
    fire(index, correct);
    if (correct) {
      setLocked(true);
      setSparkIdx(index);
      sounds?.play("correct");
      onCorrect({ optionId: option.id, feedback: feedback || gd.correctGeneric });
    } else {
      sounds?.play("wrong");
      setWrongIdx(index);
      setTimeout(() => setWrongIdx(null), 520);
      const next = wrongCount + 1;
      setWrongCount(next);
      onWrong({ feedback: next >= 2 ? gd.hintReveal : feedback || gd.tryAgain });
    }
  }

  const Card = isGrid ? GridCard : OptionCard;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {isScene ? (
        <Box
          sx={{
            background: "#fff0f5",
            border: "2px solid #ffd9e6",
            borderRadius: "16px",
            p: 2,
            textAlign: "center",
            mb: 0.5,
          }}
        >
          <motion.div
            animate={{ y: [0, -7, 0], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: 52, lineHeight: 1 }}
          >
            {media.sceneEmoji || "📞"}
          </motion.div>
          {pickText(media, "caption", lng) ? (
            <Typography sx={{ color: "#c2185b", fontWeight: 800, fontSize: 13.5, mt: 0.75, lineHeight: 1.6 }}>
              {pickText(media, "caption", lng)}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      <Box
        sx={
          isGrid
            ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 0.5 }
            : { display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }
        }
      >
        {options.map((o, i) => (
          <Card
            key={o.id ?? i}
            option={o}
            index={i}
            mediaJson={media}
            lng={lng}
            onPick={handlePick}
            disabled={locked}
            flash={flashFor(i)}
            shaking={wrongIdx === i}
            sparkle={sparkIdx === i}
            hint={reveal && !locked && isOptionCorrect(o, i, media)}
          />
        ))}
      </Box>
    </Box>
  );
}
