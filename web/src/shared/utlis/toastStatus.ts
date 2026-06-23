import { ToastStatus } from "./types";

function Success(message: string): ToastStatus {
  return {
    render: message,
    type: "success",
    isLoading: false,
    autoClose: 3000,
  };
}

function Failed(error: string): ToastStatus {
  return {
    render: error,
    type: "error",
    isLoading: false,
    autoClose: 3000,
  };
}

export { Success, Failed };
