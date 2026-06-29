// @ts-check
import { prisma } from "../../prisma.client.js";

/**
 * Idempotent: upsert the seeded certificate templates by key. Three visually
 * distinct GENERAL templates (admin-pickable for manual certificates) plus the
 * single GAME template that is auto-applied to every game certificate.
 */
export async function seedCertificateTemplates() {
  const templates = [
    // ── 1. GENERAL · ornate green/gold portrait (the default) ──────────────
    {
      key: "achievement",
      type: "GENERAL",
      nameAr: "شهادة تقدير",
      nameEn: "Certificate of Achievement",
      isDefault: true,
      isActive: true,
      headingAr: "شهادة تقدير",
      headingEn: "Certificate of Achievement",
      introAr:
        "يسرّ أكاديمية آية لتعليم القرآن والعربية أونلاين أن تمنح هذه الشهادة للطالب:",
      introEn:
        "Ayah Academy for teaching Qur'an and Arabic online is pleased to grant this certificate to the student:",
      bodyAr:
        "تقديرًا لتفانيه واجتهاده المتميّز في {reason}. نسأل الله أن يبارك له في علمه ويزيده من فضله ويثيبه على جهده ومثابرته.",
      bodyEn:
        "in recognition of dedication and excellent effort in {reason}. May Allah bless them with beneficial knowledge, increase them in faith, and reward them for their hard work and perseverance.",
      congratsAr: "تهانينا على هذا الإنجاز الرائع!",
      congratsEn: "Congratulations on this wonderful achievement!",
      thanksAr: "بارك الله فيك",
      thanksEn: "May Allah reward you",
      signatureName: "Aya",
      signatureTitleAr: "المعلمة",
      signatureTitleEn: "Teacher",
      themeJson: {
        orientation: "portrait",
        decoration: "elegant",
        fontStyle: "elegant",
        accent: "#1E6F5C",
        secondary: "#C9A227",
        background: "#FBF7EC",
        borderStyle: "ornate",
        showPhoto: true,
        showBismillah: true,
        showSeal: true,
        showWatermark: true,
        showTagline: true,
        showDate: true,
        logoSize: "md",
        nameScale: 1,
      },
    },

    // ── 2. GENERAL · regal navy/gold landscape (formal excellence) ─────────
    {
      key: "excellence-royal",
      type: "GENERAL",
      nameAr: "شهادة تميّز",
      nameEn: "Certificate of Excellence",
      isDefault: false,
      isActive: true,
      headingAr: "شهادة تميّز",
      headingEn: "Certificate of Excellence",
      introAr: "تشهد أكاديمية آية لتعليم القرآن والعربية بأن الطالب:",
      introEn:
        "Ayah Academy for Qur'an and Arabic hereby certifies that the student:",
      bodyAr:
        "قد حقّق تميّزًا واضحًا في {reason}، فاستحقّ هذه الشهادة تقديرًا لتفوّقه وحرصه على التعلّم.",
      bodyEn:
        "has demonstrated clear excellence in {reason}, earning this certificate in recognition of outstanding achievement and dedication to learning.",
      congratsAr: "نبارك لك هذا التفوّق المستحق!",
      congratsEn: "Congratulations on this well-deserved distinction!",
      thanksAr: "زادك الله علمًا وتوفيقًا",
      thanksEn: "May Allah increase you in knowledge",
      signatureName: "Aya",
      signatureTitleAr: "إدارة الأكاديمية",
      signatureTitleEn: "Academy Management",
      themeJson: {
        orientation: "landscape",
        decoration: "geometric",
        fontStyle: "classic",
        accent: "#1B3A6B",
        secondary: "#C9A227",
        background: "#FAF7EF",
        borderStyle: "foil",
        showPhoto: false,
        showBismillah: true,
        showSeal: true,
        showWatermark: true,
        showTagline: true,
        showDate: true,
        logoSize: "lg",
        nameScale: 1.05,
      },
    },

    // ── 3. GENERAL · playful teal/coral portrait (kid-friendly star) ───────
    {
      key: "little-star",
      type: "GENERAL",
      nameAr: "شهادة نجمة",
      nameEn: "Little Star Certificate",
      isDefault: false,
      isActive: true,
      headingAr: "نجمة آية",
      headingEn: "Ayah Star",
      introAr: "نفخر بنجمتنا الصغيرة:",
      introEn: "We are so proud of our little star:",
      bodyAr: "على تميّزك الرائع في {reason}. واصل التألّق يا نجم! 🌟",
      bodyEn:
        "for shining so brightly in {reason}. Keep it up, little star! 🌟",
      congratsAr: "أحسنت صنعًا!",
      congratsEn: "Wonderful work!",
      thanksAr: "بارك الله فيك",
      thanksEn: "May Allah bless you",
      signatureName: "Aya",
      signatureTitleAr: "المعلمة",
      signatureTitleEn: "Teacher",
      themeJson: {
        orientation: "portrait",
        decoration: "stars",
        fontStyle: "modern",
        accent: "#0E9594",
        secondary: "#FF7A59",
        background: "#FFF8F0",
        borderStyle: "double",
        showPhoto: true,
        showBismillah: false,
        showSeal: true,
        showWatermark: true,
        showTagline: true,
        showDate: true,
        logoSize: "md",
        nameScale: 1,
      },
    },

    // ── 4. GAME · the single template auto-applied to game certificates ────
    {
      key: "game-champion",
      type: "GAME",
      nameAr: "شهادة الألعاب",
      nameEn: "Game Certificate",
      isDefault: false,
      isActive: true,
      headingAr: "بطل الألعاب",
      headingEn: "Game Champion",
      introAr: "تهانينا للبطل الصغير:",
      introEn: "Congratulations to our little champion:",
      bodyAr:
        "لقد أتممت لعبة {reason} بنجاح وأظهرت تركيزًا ومثابرة رائعة. أحسنت!",
      bodyEn:
        "You completed the {reason} game successfully and showed wonderful focus and perseverance. Well done!",
      congratsAr: "أحسنت! استمر في التألّق 🌟",
      congratsEn: "Great job — keep shining! 🌟",
      thanksAr: "بارك الله فيك",
      thanksEn: "May Allah bless you",
      signatureName: "Aya",
      signatureTitleAr: "المعلمة",
      signatureTitleEn: "Teacher",
      themeJson: {
        orientation: "landscape",
        decoration: "stars",
        fontStyle: "modern",
        accent: "#7C4DFF",
        secondary: "#FFC93C",
        background: "#F5F0FF",
        borderStyle: "foil",
        emoji: "🏆",
        showPhoto: false,
        showBismillah: false,
        showSeal: true,
        showWatermark: true,
        showTagline: true,
        showDate: true,
        logoSize: "md",
        nameScale: 1.05,
      },
    },

    // ── 5. EXAM · the template auto-applied to quiz/exam certificates ──────
    {
      key: "exam-pass",
      type: "EXAM",
      nameAr: "شهادة الاختبارات",
      nameEn: "Exam Certificate",
      isDefault: false,
      isActive: true,
      headingAr: "شهادة اجتياز الاختبار",
      headingEn: "Certificate of Exam Achievement",
      introAr: "تُمنح هذه الشهادة إلى:",
      introEn: "This certificate is proudly awarded to:",
      bodyAr: "تقديرًا لاجتيازه اختبار {reason} بتفوّق. أحسنت!",
      bodyEn: "in recognition of passing the {reason} exam with excellence. Well done!",
      congratsAr: "مبارك النجاح! نسأل الله لك دوام التوفيق 🌟",
      congratsEn: "Congratulations on passing — keep up the great work! 🌟",
      thanksAr: "بارك الله فيك",
      thanksEn: "May Allah bless you",
      signatureName: "Aya",
      signatureTitleAr: "المعلمة",
      signatureTitleEn: "Teacher",
      themeJson: {
        orientation: "landscape",
        decoration: "elegant",
        fontStyle: "elegant",
        accent: "#7C4DFF",
        secondary: "#C9A227",
        background: "#FBF7EC",
        borderStyle: "ornate",
        showPhoto: false,
        showBismillah: true,
        showSeal: true,
        showWatermark: true,
        showTagline: true,
        showDate: true,
        logoSize: "md",
        nameScale: 1.05,
      },
    },
  ];

  for (const tpl of templates) {
    await prisma.certificateTemplate.upsert({
      where: { key: tpl.key },
      update: tpl,
      create: tpl,
    });
  }

  console.log(`[seed] certificate templates — ${templates.length} upserted`);
  return templates.map((t) => t.key);
}

