import { z } from "zod";
import {
  PARENT_RELATIONS,
  STUDENT_LEVELS,
  USER_ROLES,
  authMessagesCodes,
  userMessagesCodes,
} from "@aya/shared";
import {
  normalizeEmail,
  normalizeUsername,
  USERNAME_PATTERN,
} from "../../shared/utility/userIdentity.js";

const roles = [USER_ROLES.ADMIN, USER_ROLES.PARENT, USER_ROLES.STUDENT];
const studentLevels = Object.values(STUDENT_LEVELS);
const relations = [
  PARENT_RELATIONS.FATHER,
  PARENT_RELATIONS.MOTHER,
  PARENT_RELATIONS.GUARDIAN,
  PARENT_RELATIONS.OTHER,
];
const emptyToUndefined = (value) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;
const optionalEmail = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .email(userMessagesCodes.INVALID_EMAIL)
    .transform(normalizeEmail)
    .optional(),
);
const optionalUsername = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .regex(USERNAME_PATTERN, userMessagesCodes.INVALID_USERNAME)
    .transform(normalizeUsername)
    .optional(),
);
const editableEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? null : value,
  z
    .union([
      z
        .string()
        .trim()
        .email(userMessagesCodes.INVALID_EMAIL)
        .transform(normalizeEmail),
      z.null(),
    ])
    .optional(),
);
const optionalNullableText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? null : value,
  z.union([z.string().trim(), z.null()]).optional(),
);
const requireIdentity = (schema) =>
  schema.superRefine((value, ctx) => {
    if (value.email || value.username) return;
    ctx.addIssue({
      code: "custom",
      path: ["email"],
      message: userMessagesCodes.EMAIL_OR_USERNAME_REQUIRED,
    });
    ctx.addIssue({
      code: "custom",
      path: ["username"],
      message: userMessagesCodes.EMAIL_OR_USERNAME_REQUIRED,
    });
  });

export class UserValidation {
  // admin creating any user
  static createUserSchema = requireIdentity(
    z.object({
      name: z.string().trim().min(1, userMessagesCodes.USER_NAME_REQUIRED),
      email: optionalEmail,
      username: optionalUsername,
      password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
      role: z.enum(roles, { message: userMessagesCodes.USER_ROLE_REQUIRED }),
      phone: z.string().trim().optional(),
      locale: z.enum(["ar", "en"]).optional(),
      nickname: z.string().trim().optional(),
      birthDate: z.coerce.date().optional(),
      avatarId: z.number().int().positive().optional(),
      parentIds: z.array(z.number().int().positive()).optional(),
    }),
  );

  // parent creating a child student account
  static createStudentSchema = requireIdentity(
    z.object({
      name: z.string().trim().min(1, userMessagesCodes.USER_NAME_REQUIRED),
      email: optionalEmail,
      username: optionalUsername,
      password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
      nickname: z.string().trim().optional(),
      birthDate: z.coerce.date().optional(),
      avatarId: z.number().int().positive().optional(),
      relation: z.enum(relations).optional(),
    }),
  );

  static updateUserSchema = z.object({
    name: z.string().min(1, userMessagesCodes.USER_NAME_REQUIRED).optional(),
    email: editableEmail,
    phone: z.string().trim().optional(),
    locale: z.enum(["ar", "en"]).optional(),
    nickname: optionalNullableText,
    birthDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT).optional(),
  });

  static linkSchema = z.object({
    relation: z.enum(relations).optional(),
  });

  static setLevelSchema = z.object({
    studentLevel: z.enum(studentLevels, {
      message: userMessagesCodes.INVALID_STUDENT_LEVEL,
    }),
  });

  static banSchema = z.object({
    reason: z.string().trim().optional(),
  });

  static setAvatarSchema = z.object({
    attachmentId: z.number().int().positive(),
  });
}
