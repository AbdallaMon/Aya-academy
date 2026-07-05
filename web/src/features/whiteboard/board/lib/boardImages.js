// Board image pipeline: upload inserted images to the backend (silently), keep
// only their URLs locally, and rebuild Excalidraw's binary-files map on load by
// fetching those URLs. This keeps localStorage small AND makes images survive a
// refresh (the raw base64 would blow the ~5MB quota).

import { config } from "../../../../config/config.js";

const API = config.api.baseUrl; // e.g. http://localhost:4000/api/v1

function dataURLtoBlob(dataURL) {
  const [head, body] = String(dataURL).split(",");
  const mime = /:(.*?);/.exec(head)?.[1] || "image/png";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Upload one Excalidraw binary file → returns { id, url } for the stored image.
export async function uploadBoardImage(sessionId, file) {
  const blob = dataURLtoBlob(file.dataURL);
  const form = new FormData();
  form.append("file", blob, `board-${file.id}`);
  const res = await fetch(`${API}/whiteboard-sessions/${sessionId}/images`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error("upload failed");
  const json = await res.json();
  const imageId = json?.data?.id ?? json?.id;
  return {
    id: imageId,
    url: `${API}/whiteboard-sessions/${sessionId}/images/${imageId}/raw`,
    mimeType: file.mimeType,
  };
}

// Rebuild Excalidraw's files array from a saved { fileId: { url, mimeType } } map.
// `token` (public board) is appended so the backend access check passes.
export async function hydrateBoardFiles(imageMap, token) {
  const entries = Object.entries(imageMap || {});
  const files = await Promise.all(
    entries.map(async ([fileId, ref]) => {
      try {
        // Send the share token in a header (not the URL) so it can't leak via
        // access logs, Referer, or browser history.
        const res = await fetch(ref.url, {
          credentials: "include",
          headers: token ? { "X-Whiteboard-Token": token } : undefined,
        });
        if (!res.ok) return null;
        const dataURL = await blobToDataURL(await res.blob());
        return {
          id: fileId,
          dataURL,
          mimeType: ref.mimeType || "image/png",
          created: 0,
        };
      } catch {
        return null;
      }
    }),
  );
  return files.filter(Boolean);
}
