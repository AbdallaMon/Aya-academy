"use client";

// useMultiRequest — bundles the four mutation verbs against a single base URL.
// Handy when one screen needs create/update/delete/patch without wiring four
// separate useRequest calls. Each verb auto-toasts by default.

import { useRequest } from "./useRequest.js";

export function useMultiRequest({ url, onSuccess, shouldAutoToast = true }) {
  const common = { url, autoFetch: false, shouldAutoToast, onSuccess, syncToUrl: false };

  const {
    fetchData: postRequest,
    isLoading: isPostRequestLoading,
    error: postRequestError,
    clearError: clearPostRequestError,
    successMessage: postRequestSuccessMessage,
  } = useRequest({ ...common, method: "post" });

  const {
    fetchData: putRequest,
    isLoading: isPutRequestLoading,
    error: putRequestError,
    clearError: clearPutRequestError,
    successMessage: putRequestSuccessMessage,
  } = useRequest({ ...common, method: "put" });

  const {
    fetchData: deleteRequest,
    isLoading: isDeleteRequestLoading,
    error: deleteRequestError,
    clearError: clearDeleteRequestError,
    successMessage: deleteRequestSuccessMessage,
  } = useRequest({ ...common, method: "delete" });

  const {
    fetchData: patchRequest,
    isLoading: isPatchRequestLoading,
    error: patchRequestError,
    clearError: clearPatchRequestError,
    successMessage: patchRequestSuccessMessage,
  } = useRequest({ ...common, method: "patch" });

  return {
    postRequest,
    isPostRequestLoading,
    postRequestError,
    clearPostRequestError,
    postRequestSuccessMessage,

    putRequest,
    isPutRequestLoading,
    putRequestError,
    clearPutRequestError,
    putRequestSuccessMessage,

    deleteRequest,
    isDeleteRequestLoading,
    deleteRequestError,
    clearDeleteRequestError,
    deleteRequestSuccessMessage,

    patchRequest,
    isPatchRequestLoading,
    patchRequestError,
    clearPatchRequestError,
    patchRequestSuccessMessage,
  };
}
