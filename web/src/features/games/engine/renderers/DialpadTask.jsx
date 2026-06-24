"use client";

// DialpadTask — tap mediaJson.sequence digits in order, then the green call key
// to advance. Wrong order / early call = gentle wrong feedback, never a loss.
// Per the contract, a DIALPAD with `thenChoose` is followed by a separate
// MULTIPLE_CHOICE question; completing the dial simply advances (lights a star).

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { PulseGlow } from "../../animations/index.js";

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "call", "0", "del"];

export default function DialpadTask({ question, onCorrect, onWrong, sounds }) {
  const { t } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const sequence = useMemo(
    () => String(question.mediaJson?.sequence ?? "").split(""),
    [question],
  );
  const [dialed, setDialed] = useState([]);
  const ready = dialed.join("") === sequence.join("") && sequence.length > 0;

  function pressDigit(k) {
    if (dialed.length >= sequence.length) {
      sounds?.play("wrong");
      onWrong({ feedback: gd.dialReady });
      return;
    }
    sounds?.play("tap");
    setDialed((prev) => [...prev, k]);
  }

  function pressDelete() {
    sounds?.play("tap");
    setDialed((prev) => prev.slice(0, -1));
  }

  function pressCall() {
    if (ready) {
      sounds?.play("win");
      onCorrect({ dialSuccess: true, feedback: gd.calling });
    } else {
      sounds?.play("wrong");
      onWrong({ feedback: gd.dialWrong });
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* dialed-progress dots */}
      <Box
        sx={{
          background: "#f3f1ff",
          border: "2px solid #ece8ff",
          borderRadius: "16px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.75,
          mb: 0.5,
        }}
      >
        {sequence.map((_, i) => (
          <motion.span
            key={i}
            animate={{
              scale: i < dialed.length ? 1.15 : 1,
              backgroundColor: i < dialed.length ? "#7c4dff" : "#d7cffb",
            }}
            style={{ width: 16, height: 16, borderRadius: "50%", display: "inline-block" }}
          />
        ))}
      </Box>

      {/* keypad */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.25 }}>
        {PAD_KEYS.map((k) => {
          if (k === "call") {
            return (
              <PulseGlow key="call" active={ready} style={{ borderRadius: 16 }}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={pressCall}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 16,
                    padding: "16px 0",
                    fontSize: 22,
                    fontWeight: 900,
                    cursor: "pointer",
                    color: "#fff",
                    background: "linear-gradient(180deg, #20cf99, #0fa377)",
                    fontFamily: "inherit",
                  }}
                  aria-label="call"
                >
                  📞
                </motion.button>
              </PulseGlow>
            );
          }
          if (k === "del") {
            return (
              <motion.button
                key="del"
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={pressDelete}
                style={{
                  border: "2px solid #ffd5de",
                  background: "#ffeef2",
                  color: "#d6436a",
                  borderRadius: 16,
                  padding: "16px 0",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {gd.dialClear}
              </motion.button>
            );
          }
          return (
            <motion.button
              key={k}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => pressDigit(k)}
              style={{
                background: "#fff",
                border: "2px solid #ece8ff",
                borderRadius: 16,
                padding: "16px 0",
                fontSize: 22,
                fontWeight: 900,
                cursor: "pointer",
                color: "#2b2350",
                fontFamily: "inherit",
              }}
            >
              {k}
            </motion.button>
          );
        })}
      </Box>

      <Typography sx={{ textAlign: "center", color: "#6b6790", fontSize: 12, mt: 1 }}>
        {gd.dialHint}
      </Typography>
    </Box>
  );
}
