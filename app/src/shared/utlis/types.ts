type ToastType = "success" | "error" | "info" | "warning";
export type ToastStatus = {
  render: string;
  type: ToastType;
  isLoading: boolean;
  autoClose: number;
};
