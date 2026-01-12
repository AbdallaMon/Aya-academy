// types/api.ts
export type ApiResponse<TData = unknown> = {
  status: number;
  message: string;
  data?: TData;
  errors?: unknown;
};
