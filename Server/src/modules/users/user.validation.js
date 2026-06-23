import { z } from "zod";
import {
  PARENT_RELATIONS,
  STUDENT_LEVELS,
  USER_ROLES,
  authMessagesCodes,
  userMessagesCodes,
} from "@aya/shared";

const roles = [USER_ROLES.ADMIN, USER_ROLES.PARENT, USER_ROLES.STUDENT];
const studentLevels = Object.values(STUDENT_LEVELS);
const relations = [
  PARENT_RELATIONS.FATHER,
  PARENT_RELATIONS.MOTHER,
  PARENT_RELATIONS.GUARDIAN,
  PARENT_RELATIONS.OTHER,
];

export class UserValidation {
  // admin creating any user
  static createUserSchema = z.object({
    name: z.string().min(1, userMessagesCodes.USER_NAME_REQUIRED),
    email: z.string().email(authMessagesCodes.INVALID_EMAIL),
    password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
    role: z.enum(roles, { message: userMessagesCodes.USER_ROLE_REQUIRED }),
    phone: z.string().trim().optional(),
    locale: z.enum(["ar", "en"]).optional(),
    nickname: z.string().trim().optional(),
    birthDate: z.coerce.date().optional(),
    parentIds: z.array(z.number().int().positive()).optional(),
  });

  // parent creating a child student account
  static createStudentSchema = z.object({
    name: z.string().min(1, userMessagesCodes.USER_NAME_REQUIRED),
    email: z.string().email(authMessagesCodes.INVALID_EMAIL),
    password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
    nickname: z.string().trim().optional(),
    birthDate: z.coerce.date().optional(),
    relation: z.enum(relations).optional(),
  });

  static updateUserSchema = z.object({
    name: z.string().min(1, userMessagesCodes.USER_NAME_REQUIRED).optional(),
    phone: z.string().trim().optional(),
    locale: z.enum(["ar", "en"]).optional(),
    nickname: z.string().trim().optional(),
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
}
