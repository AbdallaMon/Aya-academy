"use client";

// Site-wide floating WhatsApp button. Opens a chat with the academy number in
// the WhatsApp app (or web). Mounted globally from the locale layout.

import { Fab, Tooltip, Zoom } from "@mui/material";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslation } from "../../../i18n/client.js";

const WHATSAPP_NUMBER = "966582509655";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function WhatsAppButton() {
  const { lng } = useTranslation();
  const label = lng === "en" ? "Chat on WhatsApp" : "تواصل عبر واتساب";

  return (
    <Tooltip title={label} placement={lng === "en" ? "left" : "right"}>
      <Zoom in>
        <Fab
          component="a"
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
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
      </Zoom>
    </Tooltip>
  );
}
