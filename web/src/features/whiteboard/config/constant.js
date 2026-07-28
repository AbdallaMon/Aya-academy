import { WHITEBOARD_SESSION_STATUSES, WHITEBOARD_VISIBILITIES } from "@ayah/shared";
import { localePath } from "../../../i18n/routing.js";

export const WHITEBOARD_URL = "whiteboard-sessions";

// Admin student picker (reuse the users endpoint filtered to STUDENT).
export const STUDENTS_PICKER_URL = "users";
export const STUDENTS_PICKER_PARAMS = { role: "STUDENT", limit: 100 };

export const WHITEBOARD_STATUS = WHITEBOARD_SESSION_STATUSES;
export const WHITEBOARD_VISIBILITY = WHITEBOARD_VISIBILITIES;

// Full-screen board routes (outside the dashboard shell).
export const buildPrivateBoardPath = (lng, id) => localePath(lng, `/board/${id}`);
export const buildPublicBoardPath = (lng, token) => localePath(lng, `/w/${token}`);
