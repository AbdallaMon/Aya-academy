"use client";

// Certificate — the celebration shown at the end of a game. It now renders the
// REAL, unified CertificateCard so a game certificate looks EXACTLY like the
// admin-designed GAME template (heading, body, colors, frame, seal, signature…):
//
//   - REAL game (auth student): once the attempt round-trip returns, it carries a
//     server certificate already linked to the active GAME template → render it
//     as-is. Until then (and for games that aren't passed, which issue no server
//     certificate) we render the active GAME template fetched on the client, so
//     the card NEVER falls back to a hardcoded look while the admin has a
//     template configured.
//   - DEMO (public free-game): no backend, so the active GAME template fetched on
//     the client IS the source.
//   In both cases we build a synthetic certificate around the child's name + the
//     game title (the template's {reason}). Only when NO GAME template is
//     configured do we fall back to the game's own certificate config.
//
// From here the child/parent can PRINT, or DOWNLOAD a PDF / image — the download
// path is what makes this work on mobile, where printing is often unavailable.

import { useRef, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../i18n/client.js";
import { SparkleTrail } from "../animations/index.js";
import { pickText } from "./helpers.js";
import CertificateCard from "../../certificates/components/CertificateCard.jsx";
import BadgeChip from "../../userDetail/components/BadgeChip.jsx";

// Parse a themeJson value (object or JSON string) into a plain object.
function parseTheme(themeJson) {
  if (!themeJson) return {};
  if (typeof themeJson === "object") return themeJson;
  try {
    return JSON.parse(themeJson) || {};
  } catch {
    return {};
  }
}

// A safe, readable file name for the downloaded certificate.
function safeFileBase(name) {
  const cleaned = String(name || "certificate")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return cleaned || "certificate";
}

export default function Certificate({
  open,
  certificateConfig,
  serverCertificate,
  badge,
  gameTemplate,
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

  // Editable name (demo only). Left blank, the certificate falls back to the
  // child/avatar name — the placeholder invites a real name without forcing the
  // child to clear a prefilled field.
  const [nameInput, setNameInput] = useState("");
  const displayName =
    (demo ? nameInput.trim() : "") || childName || gd.certDefaultName;

  const [busy, setBusy] = useState(null); // "print" | "pdf" | "png" | null
  const certWrapRef = useRef(null);

  // The certificate object handed to the unified renderer.
  const certForRender = (() => {
    if (serverCertificate) {
      // Server cert may carry its own studentName; for the demo-less real path
      // it's already correct. Keep it as the source of truth.
      return serverCertificate;
    }
    const base = {
      type: "GAME",
      studentName: displayName,
      issuedAt: new Date().toISOString(),
      // The game title is the dynamic {reason} on the template.
      reasonAr: gameTitle || "",
      reasonEn: gameTitle || "",
    };
    if (gameTemplate) return { ...base, template: gameTemplate };

    // No GAME template configured: fall back to the game's own certificate
    // config so the unified card still renders (branded, framed, not hardcoded).
    const title =
      pickText(certificateConfig, "title", lng) || gd.certDefaultTitle;
    return {
      ...base,
      titleAr: title,
      titleEn: title,
      bodyAr: gd.certBody,
      bodyEn: gd.certBody,
      themeJson: certificateConfig || undefined,
    };
  })();

  // Orientation drives the PDF page + print @page size.
  const renderTheme = {
    ...parseTheme(certForRender.template?.themeJson),
    ...parseTheme(certForRender.themeJson),
  };
  const orientation =
    renderTheme.orientation === "portrait" ? "portrait" : "landscape";

  const fileBase = `certificate-${safeFileBase(displayName)}`;
  const docTitle = pickText(certForRender, "title", lng) || gd.certDefaultTitle;

  // Grab the actual certificate root node for rasterized export.
  function getCertNode() {
    return certWrapRef.current?.querySelector("[data-certificate-root]") || null;
  }

  async function runExport(kind, fn) {
    const node = getCertNode();
    if (!node || busy) return;
    sounds?.play("tap");
    setBusy(kind);
    try {
      await fn(node);
    } catch {
      /* capture/popup failed — leave the modal open so the user can retry */
    } finally {
      setBusy(null);
    }
  }

  function handlePrint() {
    runExport("print", async (node) => {
      const { printCertificateNode } = await import(
        "../../certificates/lib/exportCertificate.js"
      );
      await printCertificateNode(node, { orientation, title: docTitle });
    });
  }

  function handleDownloadPdf() {
    runExport("pdf", async (node) => {
      const { downloadCertificatePdf } = await import(
        "../../certificates/lib/exportCertificate.js"
      );
      await downloadCertificatePdf(node, `${fileBase}.pdf`, { orientation });
    });
  }

  function handleDownloadPng() {
    runExport("png", async (node) => {
      const { downloadCertificatePng } = await import(
        "../../certificates/lib/exportCertificate.js"
      );
      await downloadCertificatePng(node, `${fileBase}.png`);
    });
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="certificate-title">
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", p: { xs: 1, sm: 2 } }}>
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          style={{
            background: "#fff",
            border: "6px solid #ffd33d",
            borderRadius: 24,
            padding: 18,
            textAlign: "center",
            width: "min(980px, 96vw)",
            maxHeight: "94vh",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <SparkleTrail count={8} />

          {/* Celebration header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mb: 0.5 }}>
            <Box component="img" src="/logos/logo.png" alt="" sx={{ height: 24, width: "auto" }} />
            <Typography id="certificate-title" sx={{ color: "#b9760a", fontWeight: 900, fontSize: { xs: 16, sm: 20 } }}>
              {gd.certCongrats}
            </Typography>
          </Box>

          {/* A newly-granted badge (first completion only) — a celebratory line
              under the congrats, with the localized name + emoji as a chip. */}
          {badge ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.15 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0.75, mb: 0.75 }}>
                <Typography sx={{ color: "#6536e0", fontWeight: 800, fontSize: { xs: 13, sm: 15 } }}>
                  {gd.badgeEarnedPrefix}
                </Typography>
                <BadgeChip badge={badge} lng={lng} />
              </Box>
            </motion.div>
          ) : null}

          {/* Demo: let the child type their name (updates the certificate live) */}
          {demo && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mb: 1 }}>
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
                  width: 220,
                  maxWidth: "70%",
                  "&:focus": { borderBottomColor: "#6536e0" },
                }}
              />
            </Box>
          )}

          {/* The REAL certificate — identical to the admin-designed template */}
          <Box ref={certWrapRef} sx={{ my: 1.5, display: "flex", justifyContent: "center" }}>
            <CertificateCard certificate={certForRender} />
          </Box>

          {/* Actions: print + downloads (download is the mobile-friendly path) */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", mt: 1.5 }}>
            <PlayfulButton onClick={handlePrint} disabled={!!busy} bg="linear-gradient(180deg, #ffb43d, #f6970a)">
              {gd.certPrint}
            </PlayfulButton>
            <PlayfulButton onClick={handleDownloadPdf} disabled={!!busy} bg="linear-gradient(180deg, #4dabf7, #1c7ed6)">
              {busy === "pdf" ? "…" : gd.certDownloadPdf}
            </PlayfulButton>
            <PlayfulButton onClick={handleDownloadPng} disabled={!!busy} bg="linear-gradient(180deg, #9775fa, #7048e8)">
              {busy === "png" ? "…" : gd.certDownloadImage}
            </PlayfulButton>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", mt: 1 }}>
            <PlayfulButton
              onClick={() => { sounds?.play("tap"); onClose(); }}
              bg="linear-gradient(180deg, #20cf99, #0fa377)"
              grow
            >
              {gd.certThanks}
            </PlayfulButton>
            {onReplay ? (
              <PlayfulButton
                onClick={() => { sounds?.play("tap"); onReplay(); }}
                bg="#eef0fb"
                color="#2b2350"
                grow
              >
                {gd.replay}
              </PlayfulButton>
            ) : null}
          </Box>
        </motion.div>
      </Box>
    </Modal>
  );
}

// A small playful pill button matching the kids' game chrome.
function PlayfulButton({ children, onClick, disabled, bg, color = "#fff", grow }) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: grow ? "1 1 160px" : "0 1 auto",
        minWidth: 130,
        border: "none",
        borderRadius: 16,
        padding: "13px 18px",
        fontWeight: 900,
        fontSize: 15,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        color,
        background: bg,
        fontFamily: "inherit",
      }}
    >
      {children}
    </motion.button>
  );
}
