import { z } from "zod";
import { authMessagesCodes } from "@aya/shared";

export class AuthValidation {
  static registerSchema = z.object({
    name: z.string().min(1, authMessagesCodes.NAME_REQUIRED),
    email: z.string().email(authMessagesCodes.INVALID_EMAIL),
    password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
    phone: z.string().trim().optional(),
    locale: z.enum(["ar", "en"]).optional(),
  });

  static loginSchema = z.object({
    email: z.string().email(authMessagesCodes.INVALID_EMAIL),
    password: z.string().min(1, authMessagesCodes.PASSWORD_REQUIRED),
  });
}
