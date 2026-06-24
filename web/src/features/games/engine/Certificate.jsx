"use client";

// Certificate — a 👑 modal shown at the end. Uses the game's certificate title
// (configJson.certificate) + the child's name + a thanks line. If the attempt
// round-trip returned a server certificate (REAL games only), prefer its title.
//
// DEMO mode (`demo`, the public free-game): there is NO backend. The child can
// type their name and PRINT the certificate — a self-contained printable page is
// generated entirely on the client (no attempt, no server certificate).

import { useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../i18n/client.js";
import { SparkleTrail } from "../animations/index.js";
import { pickText } from "./helpers.js";

// Escape user/content text before injecting into the printable document.
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );

export default function Certificate({
  open,
  certificateConfig,
  serverCertificate,
  heroEmoji,
  childName,
  gameTitle,
  demo = false,
  onClose,
  onReplay,
  sounds,
}) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};

  const title =
    pickText(serverCertificate, "title", lng) ||
    pickText(certificateConfig, "title", lng) ||
    gd.certDefaultTitle;
  const emoji = certificateConfig?.emoji || "👑";

  // Editable name (demo only): an optional override. Left blank, the certificate
  // falls back to the child/avatar name — so the placeholder invites a real name
  // without forcing the child to clear a prefilled field.
  const [nameInput, setNameInput] = useState("");

  const displayName =
    (demo ? nameInput.trim() : "") || childName || gd.certDefaultName;

  // ── frontend-only printable certificate (no backend) ────────────────────────
  function handlePrint() {
    sounds?.play("tap");
    if (typeof window === "undefined") return;
    const dir = lng === "ar" ? "rtl" : "ltr";
    const logoUrl = `${window.location.origin}/logos/logo.png`;
    const dateStr = new Date().toLocaleDateString(lng === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const docHtml = `<!doctype html>
<html dir="${dir}" lang="${esc(lng)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; min-height: 100vh; padding: 24px;
         font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', system-ui, sans-serif;
         background: #fffdf5; display: flex; align-items: center; justify-content: center; }
  .cert { position: relative; width: 100%; max-width: 1040px; aspect-ratio: 1.414;
          background: radial-gradient(circle at 50% 0%, #fffef9 0%, #fff6df 100%);
          border: 14px solid #ffd33d; border-radius: 22px;
          box-shadow: 0 0 0 5px #b9760a inset; padding: 44px 56px; text-align: center;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand img { height: 46px; width: auto; }
  .brand span { color: #b9760a; font-weight: 800; font-size: 21px; }
  .emoji { font-size: 86px; line-height: 1; }
  .title { color: #b9760a; font-weight: 900; font-size: 42px; margin: 2px 0; }
  .body { color: #6b6790; font-size: 20px; max-width: 760px; line-height: 1.7; }
  .name { font-size: 40px; font-weight: 900; color: #6536e0; margin: 6px 0;
          border-bottom: 3px dashed #cdbcff; padding: 4px 36px; }
  .game { color: #5a5577; font-size: 19px; font-weight: 700; }
  .date { color: #9a96b5; font-size: 15px; margin-top: 4px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="cert">
    <div class="brand"><img src="${logoUrl}" alt="" /><span>${esc(gd.certAcademy)}</span></div>
    <div class="emoji">${esc(emoji)}</div>
    <div class="title">${esc(title)}</div>
    <div class="body">${esc(gd.certBody)}</div>
    <div class="name">${esc(heroEmoji)} ${esc(displayName)}</div>
    ${gameTitle ? `<div class="game">${esc(gameTitle)}</div>` : ""}
    <div class="date">${esc(dateStr)}</div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 300);
    });
  </script>
</body>
</html>`;

    // Open a fully self-contained document via a Blob URL (no document.write).
    const blob = new Blob([docHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank", "width=1040,height=760");
    if (!w) {
      URL.revokeObjectURL(url);
      return; // popup blocked — nothing else to do
    }
    w.focus();
    // Release the object URL once the print window has loaded it.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="certificate-title">
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          p: 2,
        }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          style={{
            background: "#fff",
            border: "6px solid #ffd33d",
            borderRadius: 24,
            padding: 24,
            textAlign: "center",
            maxWidth: 360,
            position: "relative",
          }}
        >
          <SparkleTrail count={8} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              mb: 0.5,
            }}
          >
            <Box component="img" src="/logos/logo.png" alt="" sx={{ height: 22, width: "auto" }} />
            <Typography sx={{ color: "#b9760a", fontWeight: 900, fontSize: 13 }}>
              {gd.certAcademy}
            </Typography>
          </Box>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            style={{ fontSize: 52 }}
          >
            {emoji}
          </motion.div>
          <Typography id="certificate-title" sx={{ color: "#b9760a", fontWeight: 900, fontSize: 20, my: 1 }}>
            {title}
          </Typography>
          <Typography sx={{ color: "#6b6790", fontSize: 13, lineHeight: 1.7 }}>
            {gd.certBody}
          </Typography>
          <Box
            sx={{
              border: "2px dashed #cdbcff",
              borderRadius: "14px",
              p: 1.5,
              my: 1.75,
              fontWeight: 900,
              color: "#6536e0",
            }}
          >
            <Typography component="small" sx={{ display: "block", color: "#6b6790", fontWeight: 700, mb: 0.5 }}>
              {gd.certWho}
            </Typography>
            {demo ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}>
                <Box component="span" sx={{ fontSize: 20 }}>{heroEmoji}</Box>
                <Box
                  component="input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={gd.certNamePlaceholder}
                  maxLength={32}
                  aria-label={gd.certWho}
                  sx={{
                    border: "none",
                    borderBottom: "2px dashed #cdbcff",
                    outline: "none",
                    background: "transparent",
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: 16,
                    color: "#6536e0",
                    fontFamily: "inherit",
                    width: 190,
                    maxWidth: "65%",
                    "&:focus": { borderBottomColor: "#6536e0" },
                  }}
                />
              </Box>
            ) : (
              <>
                {heroEmoji} {displayName}
              </>
            )}
          </Box>
          {demo ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handlePrint}
              style={{
                width: "100%", border: "none", borderRadius: 16, padding: "15px",
                fontWeight: 900, fontSize: 16, cursor: "pointer", color: "#fff",
                background: "linear-gradient(180deg, #ffb43d, #f6970a)", fontFamily: "inherit",
                marginBottom: 10,
              }}
            >
              {gd.certPrint}
            </motion.button>
          ) : null}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => { sounds?.play("tap"); onClose(); }}
            style={{
              width: "100%", border: "none", borderRadius: 16, padding: "15px",
              fontWeight: 900, fontSize: 16, cursor: "pointer", color: "#fff",
              background: "linear-gradient(180deg, #20cf99, #0fa377)", fontFamily: "inherit",
            }}
          >
            {gd.certThanks}
          </motion.button>
          {onReplay ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => { sounds?.play("tap"); onReplay(); }}
              style={{
                marginTop: 10, width: "100%", border: "none", borderRadius: 16, padding: "13px",
                fontWeight: 900, fontSize: 14, cursor: "pointer", background: "#eef0fb",
                color: "#2b2350", fontFamily: "inherit",
              }}
            >
              {gd.replay}
            </motion.button>
          ) : null}
        </motion.div>
      </Box>
    </Modal>
  );
}
