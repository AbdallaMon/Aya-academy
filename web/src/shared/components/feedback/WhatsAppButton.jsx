"use client";

// Site-wide floating WhatsApp button. Opens a chat with the academy number in
// the WhatsApp app (or web). Mounted globally from the locale layout.

import { Fab } from "@mui/material";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useTranslation } from "../../../i18n/client.js";
import { stripLocale } from "../../../i18n/routing.js";

const WHATSAPP_NUMBER = "966582509655";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

// Routes that take over the whole screen (the interactive whiteboard) and must
// stay clean — no floating chat button on top of the canvas.
const HIDDEN_PREFIXES = ["/board", "/w"];

export default function WhatsAppButton() {
  const { lng } = useTranslation();
  const pathname = usePathname();
  const bare = stripLocale(pathname || "");
  if (HIDDEN_PREFIXES.some((p) => bare === p || bare.startsWith(`${p}/`))) {
    return null;
  }
  const label = lng === "en" ? "Chat on WhatsApp" : "تواصل عبر واتساب";

  return (
    <Fab
      component="a"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      sx={{
        position: "fixed",
        bottom: { xs: 16, md: 24 },
        insetInlineEnd: { xs: 16, md: 24 },
        zIndex: (theme) => theme.zIndex.snackbar + 1,
        bgcolor: "#25D366",
        color: "#fff",
        "&:hover": { bgcolor: "#1da851" },
        boxShadow: 6,
      }}
    >
      <FaWhatsapp size={28} />
    </Fab>
  );
}
