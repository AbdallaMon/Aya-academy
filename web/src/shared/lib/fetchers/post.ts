import { Failed, Success } from "@/shared/utlis/toastStatus";
import { toast } from "react-toastify";
import { SubmitDataArgs } from "../types";
import { ApiResponse } from "@/shared/types/api";
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function submitData<TBody = unknown, TData = unknown>({
  data,
  setLoading,
  setData,
  setError,
  setMessage,
  path,
  isFileUpload = false,
  toastMessage = "Sending...",
  method = "POST",
}: SubmitDataArgs<TBody, TData>): Promise<ApiResponse<TData>> {
  setLoading(true);
  const toastId = toast.loading(toastMessage);
  const body: BodyInit | null = isFileUpload
    ? (data as BodyInit)
    : JSON.stringify(data);
  const headers: HeadersInit = isFileUpload
    ? {}
    : { "Content-Type": "application/json" };
  try {
    const request = await fetch(API_URL + "/" + path, {
      method: method,
      body,
      headers,
      credentials: "include",
    });
    const reqStatus = request.status;
    const response = await request.json();
    response.status = reqStatus;
    if (reqStatus === 200) {
      toast.update(toastId, Success(response.message));
    } else {
      toast.update(toastId, Failed(response.message));
    }
    if (setData) {
      setData(response.data);
    }
    if (setMessage) {
      setMessage(response.message);
    }
    return response;
  } catch (error) {
    if (error instanceof Error) {
      toast.update(toastId, Failed("Error, " + error.message));
      if (setError) {
        setError(error.message);
      }
      if (setMessage) {
        setMessage("Error, " + error.message);
      }
      console.error("An error occurred:", error.message);
    } else {
      console.error("An unknown error occurred:", error);
    }

    return {
      status: 500,
      message:
        "Error, " + (error instanceof Error ? error.message : "Unknown error"),
    };
  } finally {
    setLoading(false);
  }
}
