import { ApiResponse } from "@/shared/types/api";
import { GetData } from "../types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const cleanPath = path?.startsWith("/") ? path.slice(1) : path;
  const url = new URL(`${API_URL}/${cleanPath}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (k === "filters" && typeof v === "object") {
        url.searchParams.set(k, JSON.stringify(v));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
  }

  return url.toString();
}
export async function getData({
  path = "",
  setLoading,
  setData,
  setError,
  page,
  limit,
  filters,
  search,
  sort,
}: GetData<unknown>): Promise<ApiResponse<unknown> | undefined> {
  try {
    setLoading(true);

    const requestUrl = buildUrl(path, {
      page,
      limit,
      search,
      sort,
      filters,
    });
    const response = await fetch(requestUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    const status = response.status;
    const result = await response.json();
    result.status = status;
    if (setData) {
      setData(result.data);
    }
    return result;
  } catch (e) {
    if (setError && e instanceof Error) {
      setError(e.message);
    }
    console.log(e);
  } finally {
    setLoading(false);
  }
}
