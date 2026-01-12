import { Action } from "@/shared/types/general";

export type NavLink = Action;
export type NavAction = Action & {
  type: "link" | "button";
};
