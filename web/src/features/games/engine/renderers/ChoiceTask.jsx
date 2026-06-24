"use client";

// ChoiceTask — renders MULTIPLE_CHOICE, EMOJI_CHOICE, SCENARIO and PHONE_CALL.
//   - layout: mediaJson.layout "grid" (EMOJI_CHOICE) vs "list" (default)
//   - tone coloring: mediaJson.optionMeta[i].tone → good / warn / bad
//   - SCENARIO / PHONE_CALL: a centered scene emoji + caption (phone-framed)
// Kids rule: a wrong tap = gentle shake + sad guide + the option's feedback +
// RETRY. Only a correct tap calls onCorrect (lights a star + advances).

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { bounceIn } from "../../animations/index.js";
import { pickText, tonePalette, isOptionCorrect } from "../helpers.js";

function OptionCard({ option, index, mediaJson, lng, onPick, disabled }) {
  const tone = mediaJson?.optionMeta?.[index]?.tone;
  const pal = tonePalette(tone);
  const label = pickText(option, "label", lng);

  return (
    <motion.button
      type="button"
      variants={bounceIn}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.97 }}
      custom={index}
      transition={{ delay: index * 0.06 }}
      disabled={disabled}
      onClick={() => onPick(option, index)}
      style={{
        border: `2px solid ${pal.border}`,
        background: pal.bg,
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
    </motion.button>
  );
}

function GridCard({ option, index, mediaJson, lng, onPick, disabled }) {
  const tone = mediaJson?.optionMeta?.[index]?.tone;
  const pal = tonePalette(tone);
  const label = pickText(option, "label", lng);
  return (
    <motion.button
      type="button"
      variants={bounceIn}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.95 }}
      transition={{ delay: index * 0.06 }}
      disabled={disabled}
      onClick={() => onPick(option, index)}
      style={{
        border: `2px solid ${pal.border}`,
        background: pal.bg,
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
      }}
    >
      <span style={{ fontSize: 40, lineHeight: 1 }}>{option.emoji || "✨"}</span>
      <span style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.4, textAlign: "center" }}>
        {label}
      </span>
    </motion.button>
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

  function handlePick(option, index) {
    const correct = isOptionCorrect(option, index, media);
    const feedback = pickText(option, "feedback", lng);
    if (correct) {
      sounds?.play("correct");
      onCorrect({ optionId: option.id, feedback: feedback || gd.correctGeneric });
    } else {
      sounds?.play("wrong");
      onWrong({ feedback: feedback || gd.tryAgain });
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {isScene ? (
        <Box
          sx={{
            background: "#ffeef2",
            borderRadius: "16px",
            p: 2,
            textAlign: "center",
            mb: 0.5,
          }}
        >
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: 52, lineHeight: 1 }}
          >
            {media.sceneEmoji || "📞"}
          </motion.div>
          {pickText(media, "caption", lng) ? (
            <Typography sx={{ color: "#d6436a", fontWeight: 800, fontSize: 13, mt: 0.75 }}>
              {pickText(media, "caption", lng)}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      {isGrid ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 0.5 }}>
          {options.map((o, i) => (
            <GridCard
              key={o.id ?? i}
              option={o}
              index={i}
              mediaJson={media}
              lng={lng}
              onPick={handlePick}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }}>
          {options.map((o, i) => (
            <OptionCard
              key={o.id ?? i}
              option={o}
              index={i}
              mediaJson={media}
              lng={lng}
              onPick={handlePick}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
