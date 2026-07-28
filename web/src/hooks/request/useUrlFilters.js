'use client';

// useUrlFilters — the searchParams <-> filters bridge for useRequest.
//
// Owns two things, extracted verbatim from useRequest:
//   1. The initial `filters` state, hydrated from the current URL query string
//      (so deep links + back/forward restore the active filters).
//   2. An effect that mirrors `filters` back into the URL query string.
//
// It returns the raw state tuple `[filters, setFiltersState]`. useRequest wraps
// `setFiltersState` with its own pagination reset (setPage(1)) — that coupling
// intentionally stays in the composing hook.

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function useUrlFilters(syncToUrl) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFiltersState] = useState(() => {
    if (!syncToUrl) return {};
    const params = {};
    searchParams.forEach((value, key) => {
      if (value.startsWith('[') || value.startsWith('{')) {
        try {
          params[key] = JSON.parse(value);
          return;
        } catch {}
      }
      params[key] = value;
    });
    return params;
  });

  // Mirror filters into the URL query string.
  useEffect(() => {
    if (!syncToUrl) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v) || typeof v === 'object')
        params.set(k, JSON.stringify(v));
      else params.set(k, String(v));
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters, syncToUrl, router]);

  return [filters, setFiltersState];
}
