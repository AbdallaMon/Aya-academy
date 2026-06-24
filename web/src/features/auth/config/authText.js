"use client";

// Feature-local bilingual strings for the auth screens. We keep these here (not
// in the central i18n/locales registry) so the auth feature owns its copy.
// Select the active language with `useAuthText()` which reads useTranslation().lng.

import { useTranslation } from "../../../i18n/client.js";

export const authText = {
  ar: {
    // login
    loginTitle: "تسجيل الدخول",
    loginSubtitle: "أهلاً بعودتك إلى أكاديمية آية",
    loginButton: "دخول",
    // register
    registerTitle: "إنشاء حساب ولي أمر",
    registerSubtitle: "ابدأ رحلة طفلك مع القرآن الكريم",
    registerButton: "إنشاء الحساب",
    // fields
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    phone: "رقم الهاتف (اختياري)",
    // links
    noAccount: "ليس لديك حساب؟",
    haveAccount: "لديك حساب بالفعل؟",
    goRegister: "أنشئ حساباً",
    goLogin: "سجّل الدخول",
    backHome: "العودة للرئيسية",
    // validation
    required: "هذا الحقل مطلوب",
    invalidEmail: "بريد إلكتروني غير صالح",
    passwordShort: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    registerSuccess: "تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن",
  },
  en: {
    loginTitle: "Sign in",
    loginSubtitle: "Welcome back to Aya Academy",
    loginButton: "Log in",
    registerTitle: "Create a parent account",
    registerSubtitle: "Start your child's Quran journey",
    registerButton: "Create account",
    name: "Full name",
    email: "Email",
    password: "Password",
    phone: "Phone (optional)",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    goRegister: "Create one",
    goLogin: "Sign in",
    backHome: "Back to home",
    required: "This field is required",
    invalidEmail: "Invalid email address",
    passwordShort: "Password must be at least 6 characters",
    registerSuccess: "Account created. You can sign in now.",
  },
};

export function useAuthText() {
  const { lng } = useTranslation();
  return authText[lng === "en" ? "en" : "ar"];
}
