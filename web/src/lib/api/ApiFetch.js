// Unified API client for the Aya Academy web app.
//
// One coherent client wrapping fetch. Every response is the standard envelope
// `{ success, message, data, translationKey }`. Errors are normalized into an
// Error carrying `.status`, `.data`, and `.translationKey` so callers (and the
// useRequest hook) can toast/redirect consistently.
//
// - Base URL from config (NEXT_PUBLIC_API_URL).
// - credentials: "include" so the httpOnly JWT cookies ride along.
// - Transparent refresh-on-401: on a 401 we try POST /auth/refresh once, then
//   replay the original request. If refresh fails we fire onAuthFailure.
//
// Never call this client directly inside a component — go through useRequest /
// useMultiRequest.

import { authMessagesCodes, generalMessagesCodes } from "@aya/shared";
import { config } from "../../config/config.js";
import { EXCLUDED_FROM_ERROR_REDIRECT } from "../../utils/constant.js";

const MUTATION_BODY_METHODS = ["POST", "PUT", "PATCH"];

class ApiFetch {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this._refreshPromise = null;
    // Hooks set these so React state (redirect, toast, logout) can react to
    // transport-level events.
    this.onAuthFailure = null;
    this.onTooManyRequests = null;
    this.onError = null;
  }

  _buildUrl(path) {
    return `${this.baseUrl}/${String(path).replace(/^\//, "")}`;
  }

  _buildHeaders(isFileUpload, customHeader, isMultipart) {
    if (customHeader) return { "Content-Type": customHeader };
    if (isFileUpload || isMultipart) return {};
    return { "Content-Type": "application/json" };
  }

  _serializeBody(body, isFileUpload, isMultipart) {
    if (body === undefined || body === null) return undefined;
    return isFileUpload || isMultipart ? body : JSON.stringify(body);
  }

  // Build a query string for paginated GET requests. Scalars are encoded
  // directly; arrays repeat the key; plain objects (e.g. a dateRange) are
  // JSON-serialized so the backend can parse them.
  _buildPaginatedPath(url, { page, limit, search = "", sort = "", others, ...filters }) {
    let queryPrefix = "?";
    if (url.endsWith("&")) queryPrefix = "";
    else if (url.includes("?")) queryPrefix = "&";

    const parts = [
      `page=${page}`,
      `limit=${limit}`,
      `search=${encodeURIComponent(search ?? "")}`,
      `sort=${encodeURIComponent(JSON.stringify(sort ?? ""))}`,
    ];

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((val) => {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
        });
        return;
      }
      if (typeof value === "object") {
        const serialized = JSON.stringify(value);
        if (serialized === "{}" || serialized === "null") return;
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(serialized)}`);
        return;
      }
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });

    if (others) parts.push(others);
    return `${url}${queryPrefix}${parts.join("&")}`;
  }

  async _refreshToken() {
    // De-dupe concurrent refreshes — many in-flight 401s share one refresh.
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = this._request("auth/refresh", {
      method: "POST",
      _skipRefresh: true,
      // Transparent mechanism: a failed refresh must NOT raise the global error
      // toast (that was the bogus "session expired" toast on the homepage). Its
      // failure is handled by onAuthFailure on the ORIGINAL request instead.
      _public: true,
    })
      .then((result) => result?.status === 200 || result?.success === true)
      .catch(() => false)
      .finally(() => {
        this._refreshPromise = null;
      });

    return this._refreshPromise;
  }

  async _request(path, opts = {}) {
    const {
      method = "GET",
      body,
      isFileUpload = false,
      customHeader,
      _skipRefresh = false,
      isMultipart = false,
      _retriedAfterRefresh = false,
      // Anonymous, best-effort calls reached from public/exempt pages (free-game,
      // homepage, pricing). These have their own fallbacks, so a transport error
      // must NOT raise the global error toast (e.g. the bogus "session expired"
      // toast that used to appear on /free-game when its public endpoint 401s).
      _public = false,
    } = opts;

    const windowExists = typeof window !== "undefined";
    const headers = this._buildHeaders(isFileUpload, customHeader, isMultipart);

    const response = await fetch(this._buildUrl(path), {
      method,
      body,
      headers,
      credentials: "include",
    });
    const status = response.status;

    let result;
    try {
      result = await response.json();
    } catch {
      result = { message: response.statusText };
    }
    result.status = status;

    if (status === 401 && !_skipRefresh && !_retriedAfterRefresh) {
      const refreshed = await this._refreshToken();
      if (refreshed) {
        return this._request(path, { ...opts, _retriedAfterRefresh: true });
      }
      if (this.onAuthFailure && windowExists) this.onAuthFailure();
      const error = new Error(result.message || authMessagesCodes.UNAUTHORIZED);
      error.status = status;
      error.data = result;
      error.translationKey = result.translationKey;
      throw error;
    }

    if (status === 429) {
      if (this.onTooManyRequests && windowExists) {
        this.onTooManyRequests(generalMessagesCodes.TOO_MANY_REQUESTS);
      }
      const error = new Error(generalMessagesCodes.TOO_MANY_REQUESTS);
      error.status = status;
      error.data = result;
      throw error;
    }

    if (status >= 400) {
      const error = new Error(
        result.message || response.statusText || generalMessagesCodes.UNEXPECTED_ERROR,
      );
      error.status = status;
      error.data = result;
      error.translationKey = result.translationKey;
      if (this.onError && !_public) this.onError(error);
      throw error;
    }

    return result;
  }

  async _blobRequest(path, opts = {}) {
    const {
      _skipRefresh = false,
      _retriedAfterRefresh = false,
      method = "GET",
      body,
      _public = false,
    } = opts;

    const requestInit = { method, headers: {}, credentials: "include" };
    if (body !== undefined && body !== null) {
      requestInit.body = typeof body === "string" ? body : JSON.stringify(body);
      requestInit.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(this._buildUrl(path), requestInit);
    const status = response.status;

    if (status === 401 && !_skipRefresh && !_retriedAfterRefresh) {
      const refreshed = await this._refreshToken();
      if (refreshed) {
        return this._blobRequest(path, { ...opts, _retriedAfterRefresh: true });
      }
      if (this.onAuthFailure && typeof window !== "undefined") this.onAuthFailure();
      const error = new Error(authMessagesCodes.UNAUTHORIZED);
      error.status = status;
      throw error;
    }

    if (status >= 400) {
      let errorResult;
      try {
        errorResult = await response.json();
      } catch {
        errorResult = { message: response.statusText };
      }
      const error = new Error(errorResult.message || response.statusText || "Request failed");
      error.status = status;
      error.data = errorResult;
      error.translationKey = errorResult.translationKey;
      if (this.onError && !_public) this.onError(error);
      throw error;
    }

    return response.blob();
  }

  // ── Public verb helpers ────────────────────────────────────────────────────
  async get(path) {
    return this._request(path, { method: "GET" });
  }

  async getPaginated(url, params) {
    return this._request(this._buildPaginatedPath(url, params), { method: "GET" });
  }

  async submit(method, path, body, isFileUpload = false, customHeader, isMultipart = false) {
    const upper = method.toUpperCase();
    const options = {
      method: upper,
      body: MUTATION_BODY_METHODS.includes(upper)
        ? this._serializeBody(body, isFileUpload, isMultipart)
        : undefined,
      isFileUpload,
      customHeader,
      isMultipart,
    };
    return this._request(path, options);
  }

  async post(path, body, isFileUpload = false, customHeader, isMultipart = false) {
    return this.submit("POST", path, body, isFileUpload, customHeader, isMultipart);
  }

  async put(path, body, isFileUpload = false, customHeader) {
    return this.submit("PUT", path, body, isFileUpload, customHeader);
  }

  async patch(path, body, isFileUpload = false, customHeader) {
    return this.submit("PATCH", path, body, isFileUpload, customHeader);
  }

  async delete(path) {
    return this._request(path, { method: "DELETE" });
  }

  async blob(path) {
    return this._blobRequest(path);
  }

  async postBlob(path, body) {
    return this._blobRequest(path, { method: "POST", body });
  }

  // Public (no-refresh) variant for endpoints reached anonymously. Arrow
  // functions capture the instance `this` lexically.
  get public() {
    return {
      get: (path) => this._request(path, { method: "GET", _skipRefresh: true, _public: true }),
      post: (path, body) =>
        this._request(path, {
          method: "POST",
          body: this._serializeBody(body),
          _skipRefresh: true,
          _public: true,
        }),
      put: (path, body) =>
        this._request(path, {
          method: "PUT",
          body: this._serializeBody(body),
          _skipRefresh: true,
          _public: true,
        }),
      patch: (path, body) =>
        this._request(path, {
          method: "PATCH",
          body: this._serializeBody(body),
          _skipRefresh: true,
          _public: true,
        }),
      delete: (path) =>
        this._request(path, { method: "DELETE", _skipRefresh: true, _public: true }),
      blob: (path) => this._blobRequest(path, { _skipRefresh: true, _public: true }),
    };
  }
}

const apiFetch = new ApiFetch(config.api.baseUrl);
export default apiFetch;
export { EXCLUDED_FROM_ERROR_REDIRECT };
