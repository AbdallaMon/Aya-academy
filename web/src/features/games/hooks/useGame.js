"use client";

// useGame — fetch a single game for the player.
//   - by `free` (marketing/public)  → GET /games/public/free     (no auth, the admin-chosen free game)
//   - by `slug` (marketing/public)  → GET /games/public/:slug    (no auth, only public games)
//   - by `slug` (dashboard, auth)   → GET /games/by-slug/:slug   (auth, ANY active game)
//   - by `id`                       → GET /games/:id             (auth)
// Data flows through useRequest/ApiFetch (never raw fetch).
//
// Demo resilience: for the public free game (and the dev-mirrored slug) we seed
// the phone-manners mirror as `initialData` so the engine renders INSTANTLY and
// stays playable even with no database — whether the API is unreachable, errors,
// or hangs. A successful API response transparently upgrades to the real
// (admin-chosen) game. The API always wins when healthy.
//
// Returns { game, isLoading, error, isFallback, refetch }.

import { useState } from "react";
import { useRequest } from "../../../hooks/request/useRequest.js";
import {
  GAME_PUBLIC_BY_SLUG_URL,
  GAME_PUBLIC_FREE_URL,
  GAME_AUTH_BY_SLUG_URL,
  GAME_BY_ID_URL,
  FREE_GAME_FALLBACK_SLUG,
} from "../config/constant.js";
import { DEV_GAMES_BY_SLUG } from "../devData.js";

export function useGame({ slug, id, auth = false, free = false }) {
  const bySlug = Boolean(slug);
  // Inside the dashboard (auth) any active game is reachable by slug; on the
  // public free-game page the admin-chosen free game (or a public slug) is used.
  const slugUrl = auth ? GAME_AUTH_BY_SLUG_URL : GAME_PUBLIC_BY_SLUG_URL;
  const url = free
    ? GAME_PUBLIC_FREE_URL
    : bySlug
      ? `${slugUrl}/${slug}`
      : `${GAME_BY_ID_URL}/${id}`;

  // Dev mirror: the free game falls back to phone-manners; a slug falls back to
  // its own mirror if one exists (only the trial game has one).
  const fallback = free
    ? DEV_GAMES_BY_SLUG[FREE_GAME_FALLBACK_SLUG]
    : bySlug
      ? DEV_GAMES_BY_SLUG[slug]
      : undefined;
  const [isFallback, setIsFallback] = useState(Boolean(fallback));
  // Set when the public free game hits its per-IP rate limit (HTTP 429). Carries
  // { retryAfterMinutes, ... } so the page can tell the player when to return.
  const [rateLimited, setRateLimited] = useState(null);

  const {
    data: game,
    setData,
    isLoading,
    error,
    triggerRefetch,
  } = useRequest({
    url,
    method: "get",
    isPublic: free || (bySlug && !auth), // public endpoint → no auth refresh
    autoFetch: Boolean(slug || id || free),
    syncToUrl: false,
    initialData: fallback ?? null,
    onSuccess: () => {
      // A real game arrived — we are no longer on the dev fallback / limited.
      if (isFallback) setIsFallback(false);
      if (rateLimited) setRateLimited(null);
    },
    onError: (err) => {
      // Free game hit its rate limit → block and show a "come back later"
      // screen. Do NOT fall back to the dev mirror (that would defeat the limit).
      if (free && err?.status === 429) {
        setRateLimited(err?.details || { retryAfterMinutes: 15 });
        return;
      }
      // API failed → keep the dev mirror on screen so the demo never breaks.
      if (fallback) {
        setData(fallback);
        setIsFallback(true);
      }
    },
  });

  return {
    game: rateLimited ? null : game,
    isLoading: isLoading && !game && !rateLimited,
    error: isFallback || rateLimited ? null : error,
    isFallback,
    rateLimited,
    refetch: triggerRefetch,
  };
}

export default useGame;
