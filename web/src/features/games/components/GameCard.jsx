"use client";

// GameCard — a big, friendly tappable card for the games list. Uses the game's
// theme + hero emoji from configJson. Links to /games/:slug.

import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { pickText, DEFAULT_THEME } from "../engine/helpers.js";
import CertificateDownloadButton from "../../certificates/components/CertificateDownloadButton.jsx";

export default function GameCard({ game, basePath = "/dashboard/games", assignment, locked = false }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const config = game.configJson || {};
  const theme = { ...DEFAULT_THEME, ...(config.theme || {}) };
  const emoji = config.hero?.emoji || "🎮";

  const assignedLabel = gd.assignedBadge || (lng === "en" ? "Assigned to you" : "مُسندة لك");
  const dueLabel = gd.dueLabel || (lng === "en" ? "Due" : "آخر موعد");
  const dueText =
    assignment?.dueAt && assignment.status !== "COMPLETED"
      ? `${dueLabel}: ${new Date(assignment.dueAt).toLocaleDateString()}`
      : null;

  const isCompleted = assignment?.status === "COMPLETED";
  const certificateId = assignment?.certificateId || null;
  const ctaLabel = locked ? gd.locked : isCompleted ? gd.replay || gd.playNow : gd.playNow;

  const body = (
    <Box
      sx={{
        borderRadius: "26px",
        p: 2.5,
        background: `linear-gradient(160deg, ${theme.bg}, #ffffff)`,
        border: `2px solid ${theme.primary}22`,
        boxShadow: "0 14px 36px rgba(70,50,140,0.12)",
        cursor: locked ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: 56, lineHeight: 1 }}
        >
          {emoji}
        </motion.div>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-end" }}>
          {assignment ? (
            <Box
              sx={{
                background: theme.primary, color: "#fff", borderRadius: 999,
                px: 1.25, py: 0.4, fontSize: 11, fontWeight: 900,
                display: "flex", alignItems: "center", gap: 0.5,
              }}
            >
              ⭐ {assignedLabel}
            </Box>
          ) : null}
          {game.isPublic ? (
            <Box
              sx={{
                background: theme.accent, color: "#fff", borderRadius: 999,
                px: 1.25, py: 0.4, fontSize: 11, fontWeight: 900,
              }}
            >
              {gd.freeBadge}
            </Box>
          ) : null}
        </Box>
      </Box>

      {dueText ? (
        <Typography sx={{ color: theme.warn, fontWeight: 800, fontSize: 11 }}>
          ⏰ {dueText}
        </Typography>
      ) : null}

      <Typography sx={{ color: theme.primary, fontWeight: 900, fontSize: 18, mt: 0.5 }}>
        {pickText(game, "title", lng)}
      </Typography>
      <Typography sx={{ color: "#564d7a", fontWeight: 500, fontSize: 13, lineHeight: 1.6, flex: 1 }}>
        {pickText(game, "description", lng)}
      </Typography>

      <Box
        sx={{
          mt: 1.5, borderRadius: 16, py: 1.25, textAlign: "center",
          fontWeight: 900, fontSize: 15, color: "#fff",
          background: `linear-gradient(180deg, ${theme.accent}, ${theme.primary})`,
        }}
      >
        {ctaLabel}
      </Box>
    </Box>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={locked ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      {locked ? (
        <div style={{ position: "relative", opacity: 0.6 }}>
          {body}
          <Box sx={{ position: "absolute", top: 12, insetInlineEnd: 12, fontSize: 24 }}>🔒</Box>
        </div>
      ) : (
        <Link href={localePath(lng, `${basePath}/${game.slug}`)} style={{ textDecoration: "none" }}>
          {body}
        </Link>
      )}

      {/* Completed → offer the earned certificate right next to the game. The
          button lives OUTSIDE the play <Link> (no nested interactive elements)
          and renders nothing when no certificate exists. */}
      {certificateId ? (
        <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
          <CertificateDownloadButton
            certificateId={certificateId}
            label={gd.downloadCertificate}
            variant="text"
          />
        </Box>
      ) : null}
    </motion.div>
  );
}
