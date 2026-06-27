"use client";

// CalendarDropTask — kind CALENDAR_DROP. «بطل رمضان»: place good Ramadan deeds
// (صيام / صلاة / صدقة …) onto the right calendar slot. Touch-friendly via a
// tap-pick-then-tap-slot mechanic (NO HTML5 drag, which breaks on phones):
//   1) tap a deed in the tray → it lifts (pulse)
//   2) tap a calendar slot → if it's the deed's slot: chime + jelly + sticker
//      lands + star sparkle; otherwise gentle bounce-back, deed returns to tray.
// When every deed is placed, the task passes (onCorrect → one star). No loss.
//
// mediaJson: {
//   slots: [{ id, labelAr/labelEn, emoji? }],
//   items: [{ id, slotId, labelAr/labelEn, emoji, feedbackAr?/feedbackEn? }]
// }

import { useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { pickText } from "../helpers.js";
import { jelly, shake, SparkleTrail, stampIn } from "../../animations/index.js";

export default function CalendarDropTask({ question, onCorrect, onWrong, sounds }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const slots = useMemo(() => media.slots || [], [media.slots]);
  const items = useMemo(() => media.items || [], [media.items]);

  const [placed, setPlaced] = useState({}); // slotId -> item
  const [held, setHeld] = useState(null); // item currently picked up
  const [wrongSlot, setWrongSlot] = useState(null);
  const [sparkSlot, setSparkSlot] = useState(null);
  const [stampSlot, setStampSlot] = useState(null); // slot whose sticker just landed
  const doneRef = useRef(false);

  // While a deed is held, gently glow the slot it belongs to — a kind hint so the
  // child always knows where the good deed goes (never lost).
  const hintSlotId = held && !placed[held.slotId] ? held.slotId : null;

  const placedItemIds = useMemo(
    () => new Set(Object.values(placed).map((it) => it.id)),
    [placed],
  );
  const tray = items.filter((it) => !placedItemIds.has(it.id));

  function pickUp(item) {
    if (doneRef.current) return;
    sounds?.play("pick");
    setHeld((cur) => (cur?.id === item.id ? null : item));
  }

  function dropOn(slot) {
    if (doneRef.current) return;
    if (!held) {
      // no deed in hand — nudge the child to pick one first
      sounds?.play("tap");
      return;
    }
    if (placed[slot.id]) return; // already filled

    if (held.slotId === slot.id) {
      // a distinct "lands in the right slot" cue: soft place chime + a stamp thud,
      // then a star sparkle — clearly different from a wrong tap.
      sounds?.play("place");
      sounds?.play("stamp");
      setStampSlot(slot.id); // the sticker plays a stamp-landing animation
      setSparkSlot(slot.id);
      const item = held;
      setHeld(null);
      setPlaced((prev) => {
        const next = { ...prev, [slot.id]: item };
        if (Object.keys(next).length >= items.length && !doneRef.current) {
          doneRef.current = true;
          sounds?.play("win");
          setTimeout(() => onCorrect({ placed: Object.keys(next).length, feedback: gd.calendarDone }), 520);
        }
        return next;
      });
      setTimeout(() => setSparkSlot(null), 700);
      setTimeout(() => setStampSlot(null), 560);
    } else {
      sounds?.play("wrong");
      onWrong({ feedback: pickText(held, "feedback", lng) || gd.calendarWrong });
      setWrongSlot(slot.id);
      setTimeout(() => setWrongSlot(null), 460);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {/* progress */}
      <Box
        sx={{
          background: "#f3f1ff",
          border: "2px solid #ece8ff",
          borderRadius: "14px",
          px: 1.5,
          py: 1,
          fontWeight: 800,
          fontSize: 13,
          color: "#6536e0",
          textAlign: "center",
        }}
      >
        {gd.calendarProgress}: {Object.keys(placed).length} / {items.length} 🌙
      </Box>

      {/* calendar slots */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
        {slots.map((slot) => {
          const filled = placed[slot.id];
          const isWrong = wrongSlot === slot.id;
          const isHint = hintSlotId === slot.id; // matches the held deed → glow it
          const justStamped = stampSlot === slot.id;
          const borderColor = filled
            ? "#b5f0db"
            : isWrong
              ? "#ff5fa2"
              : isHint
                ? "#18c08f" // friendly green "place here" glow
                : held
                  ? "#7c4dff"
                  : "#cdbcff";
          return (
            <Box key={slot.id} sx={{ position: "relative" }}>
              <motion.button
                type="button"
                onClick={() => dropOn(slot)}
                animate={
                  isWrong
                    ? shake.shake
                    : justStamped
                      ? jelly(true)
                      : isHint
                        ? {
                            scale: [1, 1.04, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(24,192,143,0)",
                              "0 0 0 7px rgba(24,192,143,0.30)",
                              "0 0 0 0 rgba(24,192,143,0)",
                            ],
                          }
                        : { x: 0, scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
                }
                transition={isHint ? { duration: 1.1, repeat: Infinity } : undefined}
                whileTap={filled ? undefined : { scale: 0.97 }}
                style={{
                  width: "100%",
                  minHeight: 96,
                  border: `2px ${filled ? "solid" : "dashed"} ${borderColor}`,
                  background: filled
                    ? "#e7fbf3"
                    : isWrong
                      ? "#ffeef2"
                      : isHint
                        ? "#e7fbf3" // soft green wash on the hinted slot
                        : "#fbf9ff",
                  borderRadius: 16,
                  cursor: filled ? "default" : "pointer",
                  fontFamily: "inherit",
                  color: "#2b2350",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: 8,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: filled || isHint ? "#0fa377" : "#6536e0" }}>
                  {slot.emoji ? `${slot.emoji} ` : ""}
                  {pickText(slot, "label", lng)}
                </span>
                {filled ? (
                  <motion.span
                    animate={justStamped ? stampIn() : { scale: 1, rotate: 0 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      transformOrigin: "center",
                    }}
                  >
                    <span style={{ fontSize: 30, lineHeight: 1 }}>{filled.emoji || "⭐"}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#0fa377" }}>{pickText(filled, "label", lng)}</span>
                  </motion.span>
                ) : isHint ? (
                  <span style={{ fontSize: 22, color: "#18c08f", fontWeight: 900 }}>👇</span>
                ) : (
                  <span style={{ fontSize: 22, opacity: 0.5 }}>＋</span>
                )}
              </motion.button>
              <AnimatePresence>
                {sparkSlot === slot.id ? <SparkleTrail count={7} size={18} /> : null}
              </AnimatePresence>
            </Box>
          );
        })}
      </Box>

      {/* deed tray */}
      <Box
        sx={{
          border: "2px solid #ece8ff",
          borderRadius: "16px",
          p: 1.25,
          background: "#fff",
          minHeight: 92,
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#6b6790", mb: 0.75, textAlign: "center" }}>
          {held ? gd.calendarHeldHint : gd.calendarTrayHint}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
          {tray.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: "#0fa377", fontWeight: 800 }}>{gd.calendarAllPlaced}</Typography>
          ) : (
            tray.map((item) => {
              const lifted = held?.id === item.id;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => pickUp(item)}
                  animate={lifted ? { y: -6, scale: 1.06 } : { y: 0, scale: 1 }}
                  whileTap={{ scale: 0.94 }}
                  style={{
                    border: `2px solid ${lifted ? "#7c4dff" : "#ffe2a6"}`,
                    background: lifted ? "#f3efff" : "#fff6e2",
                    boxShadow: lifted ? "0 6px 16px rgba(124,77,255,0.28)" : "none",
                    borderRadius: 16,
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: "#2b2350",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    width: 84,
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{item.emoji || "💛"}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, textAlign: "center" }}>
                    {pickText(item, "label", lng)}
                  </span>
                </motion.button>
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
}
