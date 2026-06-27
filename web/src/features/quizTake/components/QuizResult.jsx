"use client";

// The result screen shown after an attempt is submitted. Built entirely from the
// POST /quizzes/:id/attempt response:
//   { attempt: { score, correctCount, totalQuestions, passed }, passed, certificate }
//
// Passed  → celebratory animation + win sound + confetti, the returned
//           certificate rendered via CertificateCard, PDF/PNG download buttons,
//           and a playful gift reveal.
// Not passed → warm "حاول تاني يا بطل" encouragement (NO failure framing) + a
//              retake button. A soft sound, never harsh.

import { useEffect, useRef, useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  MdCardGiftcard,
  MdImage,
  MdPictureAsPdf,
  MdRefresh,
} from "react-icons/md";
import { useGameSounds } from "../../games/hooks/useGameSounds.js";
import { BounceIn, Confetti, SparkleTrail } from "../../games/animations/index.js";
import CertificateCard from "../../certificates/components/CertificateCard.jsx";
import { useQuizTakeText } from "../config/quizTakeText.js";

function parseTheme(themeJson) {
  if (!themeJson) return {};
  if (typeof themeJson === "object") return themeJson;
  try {
    return JSON.parse(themeJson) || {};
  } catch {
    return {};
  }
}
function orientationOf(cert) {
  const theme = {
    ...parseTheme(cert?.template?.themeJson),
    ...parseTheme(cert?.themeJson),
  };
  return theme.orientation === "portrait" ? "portrait" : "landscape";
}

export default function QuizResult({ result, quiz, onRetake }) {
  const txt = useQuizTakeText();
  const sounds = useGameSounds();
  const certRef = useRef(null);
  const [busy, setBusy] = useState(null); // "pdf" | "png" | null

  const attempt = result?.attempt || {};
  const passed = Boolean(result?.passed);
  const certificate = result?.certificate || null;
  const correct = attempt.correctCount ?? 0;
  const totalQ = attempt.totalQuestions ?? quiz?.items?.length ?? 0;
  const percent = totalQ ? Math.round((correct / totalQ) * 100) : 0;
  const giftName = quiz?.giftName;

  // Play the celebratory / gentle sound once, when the result first lands. The
  // confetti renders directly below (mounts with this screen), so no state is
  // needed to trigger it.
  useEffect(() => {
    sounds.play(passed ? "win" : "wrong");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runExport = async (kind) => {
    const node = certRef.current?.querySelector("[data-certificate-root]");
    if (!node || busy) return;
    setBusy(kind);
    try {
      const lib = await import("../../certificates/lib/exportCertificate.js");
      const orientation = orientationOf(certificate);
      const base = `certificate-${certificate?.id ?? ""}`;
      if (kind === "pdf") {
        await lib.downloadCertificatePdf(node, `${base}.pdf`, { orientation });
      } else {
        await lib.downloadCertificatePng(node, `${base}.png`);
      }
    } catch {
      /* capture failed — leave the screen up to retry */
    } finally {
      setBusy(null);
    }
  };

  // ── Not passed: warm, no-failure encouragement ──
  if (!passed) {
    return (
      <BounceIn style={{ width: "100%" }}>
        <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: "center", borderRadius: 5, maxWidth: 560, mx: "auto" }}>
          <Typography sx={{ fontSize: 64, lineHeight: 1 }}>💛</Typography>
          <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>
            {txt.tryAgainTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {txt.tryAgainHint}
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="center" sx={{ my: 3 }}>
            <Chip color="primary" variant="outlined" label={`${txt.yourScore}: ${correct} / ${totalQ}`} />
            <Chip color="primary" variant="outlined" label={`${txt.percent}: ${percent}%`} />
          </Stack>

          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<MdRefresh />}
            onClick={onRetake}
            sx={{ minWidth: 200, borderRadius: 3, fontWeight: 800 }}
          >
            {txt.retakeNow}
          </Button>
        </Paper>
      </BounceIn>
    );
  }

  // ── Passed: celebration + certificate + downloads ──
  return (
    <Box sx={{ position: "relative" }}>
      <Confetti count={36} />

      <BounceIn style={{ width: "100%" }}>
        <Stack spacing={3} alignItems="center">
          <Box sx={{ position: "relative", textAlign: "center" }}>
            <SparkleTrail count={10} />
            <Typography sx={{ fontSize: 64, lineHeight: 1 }}>🎉</Typography>
            <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>
              {txt.bravo}
            </Typography>
            <Typography color="text.secondary">{txt.youPassed}</Typography>
          </Box>

          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
            <Chip color="success" label={`${txt.yourScore}: ${correct} / ${totalQ}`} sx={{ fontWeight: 700 }} />
            <Chip color="success" variant="outlined" label={`${txt.percent}: ${percent}%`} sx={{ fontWeight: 700 }} />
            {quiz?.passThreshold != null && (
              <Chip variant="outlined" label={`${txt.passThreshold}: ${quiz.passThreshold}%`} />
            )}
          </Stack>

          {giftName && (
            <Chip
              icon={<MdCardGiftcard />}
              color="secondary"
              label={`${txt.giftReveal} — ${giftName}`}
              sx={{ fontWeight: 700, py: 2, px: 1, fontSize: 15 }}
            />
          )}

          {/* The certificate (rendered directly from the response record). */}
          {certificate && (
            <Box ref={certRef} sx={{ width: "100%", maxWidth: 1000 }}>
              <CertificateCard certificate={certificate} printable />
            </Box>
          )}

          {/* Download actions */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center" useFlexGap>
            {certificate && (
              <>
                <Button
                  variant="contained"
                  startIcon={<MdPictureAsPdf />}
                  disabled={!!busy}
                  onClick={() => runExport("pdf")}
                >
                  {txt.downloadPdf}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MdImage />}
                  disabled={!!busy}
                  onClick={() => runExport("png")}
                >
                  {txt.downloadPng}
                </Button>
              </>
            )}
            <Button variant="text" startIcon={<MdRefresh />} onClick={onRetake}>
              {txt.retake}
            </Button>
          </Stack>
        </Stack>
      </BounceIn>
    </Box>
  );
}
