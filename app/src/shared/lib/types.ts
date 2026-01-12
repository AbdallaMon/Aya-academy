import { Setter } from "../types/general";

export type FetcherArgs<TData> = {
  path: string;

  setLoading: Setter<boolean>;
  setData?: Setter<TData | undefined>;
  setError?: Setter<string | null>;
  setMessage?: Setter<string>;
  toastMessage?: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE" | "GET";
  credentials?: RequestCredentials;
};

export type SubmitJsonArgs<TBody, TData> = FetcherArgs<TData> & {
  isFileUpload?: false;
  data: TBody;
};

export type SubmitFileArgs<TData> = FetcherArgs<TData> & {
  isFileUpload: true;
  data: BodyInit;
};

export type SubmitDataArgs<TBody, TData> =
  | SubmitJsonArgs<TBody, TData>
  | SubmitFileArgs<TData>;

export type GetData<TData> = FetcherArgs<TData> & {
  page?: number;
  limit?: number;
  filters?: Record<string, unknown>;
  search?: string;
  sort?: string;
};
