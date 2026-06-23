"use client";

// PhotoUpload — a reusable avatar/photo picker.
//
// Shows the current image (resolved via buildFileUrl) or a neutral placeholder,
// plus a "choose image" button that uploads the picked file to `POST attachments`
// (multipart, field name `file`, cookies sent with credentials:"include" like the
// project's other fetchers) and hands the resulting attachment { id, url, ... }
// to `onUploaded`.
//
// Client-side validation: image mime-types only, ≤ MAX_SIZE. Errors and the
// upload progress surface through the shared toast layer.
//
// NOTE: file upload goes straight to fetch here (not useRequest) because it is a
// multipart attachment POST that returns the raw attachment record; useRequest is
// for the app's JSON envelope endpoints. This mirrors submitData/uploadInChunks.

import { useRef, useState } from "react";
import { Avatar, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { MdPhotoCamera, MdPerson } from "react-icons/md";
import { useToast } from "../../providers/ToastProvider.jsx";
import { buildFileUrl } from "../lib/fileUrl.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function PhotoUpload({
  value, // current attachment object or url string
  onUploaded, // (attachment) => void
  size = 96,
  buttonLabel,
  uploadingLabel,
  hintLabel,
  invalidTypeLabel,
  tooLargeLabel,
  disabled = false,
  shape = "circle",
}) {
  const { showToast } = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const currentUrl = previewUrl || buildFileUrl(value);
  const radius = shape === "circle" ? "50%" : 2;

  function pick() {
    if (disabled || uploading) return;
    inputRef.current?.click();
  }

  async function onChange(e) {
    const file = e.target.files?.[0];
    // Reset so re-picking the same file fires change again.
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast({
        message: invalidTypeLabel || "Please pick a PNG, JPEG, WEBP or GIF image.",
        severity: "error",
      });
      return;
    }
    if (file.size > MAX_SIZE) {
      showToast({
        message: tooLargeLabel || "Image must be 5MB or smaller.",
        severity: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/attachments`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      let json = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      // Attachment endpoint returns the raw record { id, url, ... } (possibly
      // wrapped in the standard { data } envelope — accept both shapes).
      const attachment = json?.data ?? json;
      if (!res.ok || !attachment?.id) {
        showToast({
          message: json?.message || "Upload failed",
          severity: "error",
          translationKey: json?.translationKey,
        });
        return;
      }
      setPreviewUrl(buildFileUrl(attachment));
      onUploaded?.(attachment);
    } catch (err) {
      showToast({ message: err?.message || "Upload failed", severity: "error" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={currentUrl || undefined}
          variant={shape === "circle" ? "circular" : "rounded"}
          sx={{
            width: size,
            height: size,
            bgcolor: "action.hover",
            color: "text.disabled",
            borderRadius: radius,
            border: 1,
            borderColor: "divider",
          }}
        >
          {!currentUrl && <MdPerson size={size * 0.5} />}
        </Avatar>
        {uploading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0,0,0,0.35)",
              borderRadius: radius,
            }}
          >
            <CircularProgress size={size * 0.35} sx={{ color: "#fff" }} />
          </Box>
        )}
      </Box>

      <Stack spacing={0.5}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<MdPhotoCamera />}
          onClick={pick}
          disabled={disabled || uploading}
        >
          {uploading ? uploadingLabel || "Uploading…" : buttonLabel || "Choose image"}
        </Button>
        {hintLabel && (
          <Typography variant="caption" color="text.secondary">
            {hintLabel}
          </Typography>
        )}
      </Stack>

      <Box
        component="input"
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={onChange}
        sx={{ display: "none" }}
      />
    </Stack>
  );
}
