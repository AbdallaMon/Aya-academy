"use client";

// useRequest — the single data hook for the app. Wraps ApiFetch and handles:
//   - GET (single + paginated) and mutations (post/put/patch/delete) + blob
//   - pagination state (page, pageSize, total) and scroll-loading
//   - filters synced to the URL query string (so back/forward + deep links work)
//   - loading / error / successMessage state
//   - auto-toast on mutation start/success/error (code-based, localized)
//
// NEVER call ApiFetch directly from a component — always go through this hook.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoading } from "../useLoading.js";
import apiFetch from "../../lib/api/ApiFetch.js";
import { DEFAULT_PAGE_SIZE } from "../../utils/constant.js";
import { useToast } from "../../providers/ToastProvider.jsx";
import { useTranslation } from "../../i18n/client.js";

const MUTATION_METHODS = ["post", "put", "patch", "delete"];

function createToastId(method, url) {
  return `${method}_${url}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function useRequest({
  url,
  method = "get",
  isPublic = false,
  isPaginated = false,
  autoFetch = false,
  initialData = null,
  initialParams = undefined,
  shouldAutoToast = false,
  onSuccess,
  onError,
  syncToUrl = true,
  scrollLoad = false,
  skipInitialFetch = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const td = t("tableData", { returnObjects: true }) || {};

  const [data, setData] = useState(initialData);
  const { isLoading, startLoading, stopLoading } = useLoading(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isFirstRender = useRef(true);

  const [filters, setFiltersState] = useState(() => {
    if (!syncToUrl) return {};
    const params = {};
    searchParams.forEach((value, key) => {
      if (value.startsWith("[") || value.startsWith("{")) {
        try {
          params[key] = JSON.parse(value);
          return;
        } catch {}
      }
      params[key] = value;
    });
    return params;
  });

  const [refetch, setRefetch] = useState(false);
  const { showToast } = useToast();

  // Keep callbacks + initialParams stable by VALUE so fetchData / effects don't
  // loop when callers pass fresh inline objects each render.
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const initialParamsRef = useRef(initialParams);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    initialParamsRef.current = initialParams;
  });
  const initialParamsKey = JSON.stringify(initialParams ?? null);

  const setFilters = useCallback(
    (value) => {
      setFiltersState((prev) =>
        typeof value === "function" ? value(prev) : value,
      );
      if (syncToUrl) setPage(1);
    },
    [syncToUrl],
  );

  // Mirror filters into the URL query string.
  useEffect(() => {
    if (!syncToUrl) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v) || typeof v === "object") params.set(k, JSON.stringify(v));
      else params.set(k, String(v));
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters, syncToUrl, router]);

  function triggerRefetch() {
    setRefetch((prev) => !prev);
  }

  const isMutationMethod = MUTATION_METHODS.includes(method);

  async function loadMore() {
    if (isLoading || !hasMore) return;
    setPage((prev) => prev + 1);
  }

  const fetchData = useCallback(
    async (slug, body) => {
      const builtUrl = slug ? `${url}/${slug}` : url;
      if (scrollLoad && !hasMore) return;

      startLoading();
      setError(null);
      setSuccessMessage(null);

      const currentToastId = createToastId(method, builtUrl);
      if (shouldAutoToast && isMutationMethod) {
        showToast({
          id: currentToastId,
          message: td.requestInProgress,
          severity: "loading",
        });
      }

      try {
        let response;
        const client = isPublic ? apiFetch.public : apiFetch;
        const params = isPaginated
          ? { page, limit: pageSize, ...filters, ...initialParamsRef.current }
          : body !== undefined
            ? body
            : initialParamsRef.current;

        // Multipart uploads: when the body is a FormData, POST it as multipart
        // so the client doesn't JSON-stringify it (e.g. external-restore .enc
        // upload). Non-public client only.
        const isFormData =
          typeof FormData !== "undefined" && params instanceof FormData;

        if (method === "get") {
          response = await client[isPaginated ? "getPaginated" : "get"](builtUrl, params);
        } else if (method === "blob") {
          response = await client.blob(builtUrl);
          setData(response);
          if (onSuccessRef.current) onSuccessRef.current(response);
          return response;
        } else if (isFormData && method === "post" && !isPublic) {
          response = await apiFetch.post(builtUrl, params, false, undefined, true);
        } else {
          response = await client[method](builtUrl, params);
        }

        if (!response || !response.success) return response;

        if (shouldAutoToast && isMutationMethod) {
          showToast({
            id: currentToastId,
            message: response.message || td.operationSuccessful,
            severity: "success",
            translationKey: response.translationKey,
          });
        }

        setSuccessMessage(response.message || "OK");

        if (scrollLoad) {
          setData((prev) =>
            page === 1
              ? response.data?.items || []
              : [...(prev || []), ...(response.data?.items || [])],
          );
        } else {
          setData(isPaginated ? response.data?.items : response.data);
        }

        if (onSuccessRef.current && response.success) onSuccessRef.current(response);

        if (isPaginated && response.data) {
          setTotal(response.data.total ?? 0);
          if (!scrollLoad && response.data.page != null) {
            setPage((prev) =>
              Number(response.data.page) === prev ? prev : Number(response.data.page),
            );
          }
          if (response.data.pageSize != null) {
            setPageSize((prev) =>
              Number(response.data.pageSize) === prev
                ? prev
                : Number(response.data.pageSize),
            );
          }
          if (scrollLoad) setHasMore(page * pageSize < (response.data.total ?? 0));
        }

        return response;
      } catch (e) {
        const message = e?.data?.message || e?.message || td.somethingWentWrong;
        setError(message);
        if (shouldAutoToast && isMutationMethod) {
          showToast({
            id: currentToastId,
            message,
            severity: "error",
            translationKey: e?.data?.translationKey || e?.translationKey,
          });
        }
        if (onErrorRef.current) {
          onErrorRef.current({
            ...e,
            message,
            status: e?.status,
            details: e?.data?.details,
            translationKey: e?.data?.translationKey || e?.translationKey,
          });
        }
        throw e;
      } finally {
        stopLoading();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      url,
      method,
      isPublic,
      isPaginated,
      initialParamsKey,
      shouldAutoToast,
      showToast,
      page,
      pageSize,
      filters,
      hasMore,
      scrollLoad,
      isMutationMethod,
    ],
  );

  const clearError = useCallback(() => setError(null), []);

  // Auto-fetch GETs on mount + whenever page/filters/refetch change.
  useEffect(() => {
    if (autoFetch && method === "get") {
      if (isFirstRender.current && skipInitialFetch) {
        isFirstRender.current = false;
        return;
      }
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, method, fetchData, page, pageSize, filters, refetch, skipInitialFetch]);

  // Surface transport-level errors (set by ApiFetch.onError) as toasts.
  useEffect(() => {
    apiFetch.onError = (err) => {
      const message = err?.data?.message || err?.message || td.somethingWentWrong;
      setError(message);
      // Never toast auth/session (401) errors: on protected pages the session
      // failure already redirects to /login (onAuthFailure); on public pages an
      // anonymous 401 is expected and must stay silent. A "please log in" toast
      // should only ever appear via the pages that actually require auth.
      if (err?.status === 401) return;
      showToast({
        message,
        severity: "error",
        translationKey: err?.data?.translationKey || err?.translationKey,
      });
    };
    apiFetch.onTooManyRequests = (code) => {
      showToast({ message: code, severity: "error" });
    };
    return () => {
      apiFetch.onError = null;
      apiFetch.onTooManyRequests = null;
    };
  }, [showToast, td.somethingWentWrong]);

  return {
    data,
    setData,
    isLoading,
    error,
    fetchData,
    refetch: fetchData,
    clearError,
    successMessage,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    triggerRefetch,
    hasMore,
    loadMore,
    setHasMore,
  };
}
