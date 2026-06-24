# Aya Academy — Master Plan

> منصة أكاديمية تعليم قرآن للأطفال + موقع تعريفي. عربي/إنجليزي، RTL/LTR.
> هذا المستند هو مصدر الحقيقة (source of truth) لبناء المشروع. يُحدّث مع كل مرحلة.

---

## 1. القرارات المعمارية (Decisions)

| القرار | الاختيار | السبب |
|--------|----------|-------|
| اللغة | **JavaScript فقط (ESM)** (front + back) — ممنوع TypeScript | قرار مُقفل. "نفس النظام" = ترتيب الملفات + الكومبوننت + اللغتين، وليس لغة البرمجة. |
| البنية | **Monorepo** (npm workspaces): `packages/db` (@aya/db) + `packages/shared` (@aya/shared) + `server` + `web` | مطابقة `Transaction-app`. |
| قاعدة البيانات | **MySQL/MariaDB** + Prisma 7 (generator prisma-client-js + output مخصص + `@prisma/adapter-mariadb`؛ الـ url للـ migrations من `prisma.config.ts`) | قرار مُقفل. |
| i18n | **i18next** قواميس `ar/en` + locale في cookie + RTL عبر `stylis-plugin-rtl` | نفس نظام `Transaction-app`. الافتراضي عربي. |
| عقد الـ API | `{ success, message, data, translationKey }` + `AppError` بأكواد رسائل محايدة | نفس النظام. |
| Auth | JWT في httpOnly cookies، permissions per-role/per-module | نفس النظام. |
| العملة | **GBP** (جنيه استرليني) | حسب الطلب. |

### المرجع المعماري
نتبع معمارية `C:\coding\Transaction-app` بالكامل (موصوفة في القسم 4) لكن بـ **JavaScript (ESM) بدون TypeScript**.

---

## 2. هيكل الـ Monorepo

```
aya-academy/
├── package.json                 # workspaces: packages/*, server, web
├── packages/
│   ├── db/                      # Prisma schema + client (singleton) — @aya/db
│   │   ├── prisma/schema.prisma
│   │   ├── src/client.ts
│   │   └── package.json
│   └── shared/                  # ثوابت + أكواد رسائل + أدوار + صلاحيات + أنواع — @aya/shared
│       ├── src/
│       │   ├── constants/       # roles, permissions, enums, currency, pagination
│       │   ├── messages-codes/  # أكواد رسائل محايدة للّغة
│       │   ├── messages-names.ts
│       │   └── index.ts
│       └── package.json
├── server/                      # Express (TS, ESM) — طبقات صارمة
│   └── src/
│       ├── app.ts  server.ts  routes.ts
│       ├── config/ (env, cors)
│       ├── infra/ (security/jwt, hash; clients)
│       ├── shared/ (errors/AppError, http/response, middlewares/, utility/)
│       └── modules/<module>/ (route, controller, usecase, repo, validation, dto)
└── web/                         # Next.js App Router (TS, MUI)
    └── src/
        ├── app/                 # layout + routes (marketing + dashboard groups)
        ├── features/<x>/        # config/ pages/ components/ hooks/
        ├── shared/              # components (tables, forms/rhf, layout, dialogs), data (ar/en)
        ├── providers/           # App, Auth, Theme, I18n, Toast
        ├── hooks/               # useRequest, usePermission, useAuth, useOpen
        ├── i18n/                # settings, client, index, locales
        ├── theme/               # createAppTheme factory
        └── lib/api/ApiFetch.ts
```

---

## 3. نموذج البيانات (Domain Model)

> كل النصوص الديناميكية القادمة من الباك (أسماء الخطط، الأسئلة، التقارير...) تُخزّن بحقلين `*Ar` / `*En`.
> الثوابت/الأكواد محايدة للّغة، والترجمة في الفرونت.

### المستخدمون والصلاحيات
- **User**: `role (ADMIN|PARENT|STUDENT)`, email/username, passwordHash, locale, isActive, sessionVersion, points (للترتيب), birthDate?, nickname?.
- **ParentStudent**: ربط many-to-many (ولي أمر ↔ طالب)، `relation (FATHER|MOTHER|GUARDIAN)`. (الأم والأب لنفس الطلاب).
- التسجيل لولي الأمر فقط؛ ولي الأمر/الادمن يُنشئان حسابات الطلاب.

### الخطط والاشتراكات
- **Plan**: titleAr/En, billingPeriod (MONTHLY|YEARLY), hours, hourlyRate, currency=GBP, isActive. السعر = hours × hourlyRate.
- **PlanDiscount**: type (PERCENT|FIXED), value, constraint (COUNT|DURATION), maxRedemptions?/startsAt?/endsAt?.
- **Coupon** + **CouponPlan**: كود خصم على خطة/خطط محددة (أو الكل لو فاضي)، source (MANUAL|GAME_REWARD|QUIZ_REWARD).
- **Subscription**: studentId, planId, status (ACTIVE|EXPIRED|UPCOMING|CANCELLED|PENDING), startDate/endDate, totalHours/remainingHours, couponId?, createdById. (الادمن يضيفها يدويًا، بلا دفع حاليًا).
- **LessonSession** (حصص): studentId, startsAt/endsAt, status (SCHEDULED|COMPLETED|CANCELLED|MISSED), meetingLink?. تظهر في الداشبورد.

### الألعاب (تفاعلية — ينشئها المطوّر بـ seed)
- **Game**: slug, titleAr/En, type, isPublic (لعبة مجانية في الهوم), isActive, passThreshold?, configJson.
- **GameQuestion**: order, promptAr/En, kind (MULTIPLE_CHOICE|PHONE_CALL|EMOJI_CHOICE|SCENARIO|TAP_CHOICE), mediaJson.
- **GameOption**: labelAr/En, emoji?, isCorrect, feedbackAr/En. (اختيار واحد من 3-4).
- **GameAssignment**: gameId↔studentId (لعبة لأكثر من طالب)، assignedById.
- **GameAttempt**: score, correctCount, answersJson, passed, certificateId?.
- أول لعبة: **آداب إسلامية** (6 أسئلة: كيف تكلّم أمك، آداب الأكل...) بأسلوب طفولي محترم.

### التقارير
- **Report**: title, body (مطوّل), reportDate, createdById.
- **ReportStudent**: تقرير عن طالب أو مجموعة طلاب دفعة واحدة. أولياء أمور الطلاب يرونه.
- **ReportAttachment** ↔ **Attachment** (مرفقات اختيارية).

### الاختبارات (بنك أسئلة الادمن + اختبار يبنيه ولي الأمر برابط)
- **QuestionCategory**: تصنيفات تظهر للادمن لا لولي الأمر.
- **QuizQuestion** + **QuizQuestionOption**: بنك أسئلة الادمن (مع الإجابة الصحيحة).
- **QuizInvite**: token فريد، parentId، الادمن يختار أسئلة فرعية تظهر لولي الأمر فقط، status.
- **QuizInviteQuestion**: الأسئلة المختارة للعرض.
- **Quiz**: يبنيه ولي الأمر، passThreshold (ينجح من كام)، giftName + giftThemeJson (ثيم/لون/إيموجي).
- **QuizItem** + **QuizItemOption**: snapshot للأسئلة (بنك أو مخصّصة من ولي الأمر).
- **QuizParticipant**: طلاب ولي الأمر المرتبطون بيه + لهم اشتراك فعّال فقط.
- **QuizAttempt**: score, passed, couponId? (الهدية), certificateId?.

### الشهادات والهدايا والإشعارات والترتيب
- **Certificate**: لكل اختبار (GAME|QUIZ) شهادة تقدير بسيطة (studentName, themeJson).
- **Reward / Coupon**: هدية اللعبة المجانية / اجتياز الاختبار (كوبون خصم أو محاضرات مجانية).
- **Notification**: type (SUBSCRIPTION_CREATED|EXPIRING|RENEWED|REPORT_RECEIVED|GAME_ASSIGNED|QUIZ_INVITE|QUIZ_PASSED|GIFT_RECEIVED), dataJson, isRead.
- **Badge** + **StudentBadge**: شارات + leaderboard من User.points.
- **AuditLog**: تسجيل الأحداث المهمة (لاحقًا).

---

## 4. اتفاقيات الكود (Conventions — مأخوذة من Transaction-app)

**Backend layering (صارم):**
`route → controller → usecase → repo → prisma`
- Prisma **فقط** في `repo`. لا منطق في route/controller.
- Controllers رفيعة: تقرأ params، تنادي usecase، ترد بـ `ok/created/...`.
- Usecase: منطق العمل، transactions، فحص الصلاحيات والنطاق (scope).
- كل دالة usecase تأخذ `authUserId` لفحص النطاق.
- Validation بـ **Zod** في `<module>.validation.ts`، تُربط عبر `validate()` middleware.
- الأخطاء عبر `AppError` بأكواد محايدة + `translationKey`؛ تُلتقط في `error-handler`.
- IDs: `Int autoincrement`. كل موديل عليه `createdAt/updatedAt`. نصوص طويلة `@db.Text`. مجموعات مغلقة `enum` (مع مزامنة ثوابت `@aya/shared`). فهارس على كل FK يُفلتر/يُرتّب به.

**Frontend:**
- Feature module: `config/` (columns/filters) + `pages/` + `components/` + `hooks/`.
- جلب البيانات عبر `useRequest` (pagination + filters + toast + أخطاء).
- جداول عبر `DataTable` المُدارة بـ config. نماذج عبر `react-hook-form` + كومبوننتات `RHF*` + `FormDialog`.
- صلاحيات عبر `usePermission` (إخفاء UI فقط؛ الأمان من الباك).
- i18n: مفاتيح من `shared/data` (ar/en)، تبديل فوري، RTL مع العربية.

---

## 5. الصلاحيات (Permission codes) — مبدئيًا

```
USER.*            CREATE LIST VIEW EDIT DELETE
PLAN.*            CREATE LIST VIEW EDIT DELETE
COUPON.*          CREATE LIST VIEW EDIT DELETE
SUBSCRIPTION.*    CREATE LIST VIEW EDIT DELETE
SESSION.*         CREATE LIST VIEW EDIT DELETE
GAME.*            LIST VIEW ASSIGN  (الإنشاء عبر seed)
REPORT.*          CREATE LIST VIEW EDIT DELETE
QUIZ.*            CREATE_BANK LIST_BANK CREATE_INVITE LIST BUILD ATTEMPT VIEW
NOTIFICATION.*    LIST READ
DASHBOARD.*       VIEW_ADMIN VIEW_PARENT VIEW_STUDENT
```
ADMIN = كل الصلاحيات. PARENT = نطاق أبنائه. STUDENT = نطاق نفسه.

---

## 6. خطة المراحل (Phases)

- **P0 — الأساس:** Monorepo + Prisma schema كاملة (35+ موديل) + `@aya/shared` + بنية الباك الأساسية. ✅ **خلص**
- **P1 — موديولات الباك الأساسية:** auth, users(+ربط ولي أمر/طلاب), plans(+خصومات+/public), coupons(+/validate), subscriptions(+/expiring), sessions. ✅ **خلص**
- **P2 — موديولات الميزات:** certificates + rewards (خدمات مشتركة), games (list/view/assign/attempt + شهادة + هدية + إشعار), quizzes (تصنيفات + بنك + دعوات + بناء + مشاركون باشتراك فعّال + محاولات + هدية + شهادة), dashboard (admin/parent/student + leaderboard). + seed (أدمن + ٦ شارات + بنك أسئلة + ٦ ألعاب ببيانات). ✅ **خلص** — *يحتاج MySQL شغّال لتشغيل `db:migrate` ثم `db:seed`.*
- **P3 — بنية الفرونت (JSX):** i18n, theme+RTL, providers, ApiFetch, useRequest, usePermission, DataTable, RHF. ✅ **خلص** (build أخضر)
- **P4 — الموقع التعريفي:** hero + أقسام (why/how) + تسعير الخطط من `/plans/public` + CTA للعبة المجانية + روابط دخول/داشبورد في الـ navbar. ✅ **خلص** (footer/فيديو/SEO المتقدّم متبقّي تحسين)
- **P5 — الداشبوردات:** admin / parent / student (تقرأ من dashboard API) + صفحات تسجيل/دخول + شهادات + إشعارات (جرس + قراءة). ✅ **خلص** (جداول CRUD لكل كيان للأدمن = تحسين لاحق فوق الأساس DataTable/RHF).
- **P6 — محرّك الألعاب React (`<GamePlayer>`):** نقل الـ ٥ ألعاب HTML → React + `useGameSounds` (بدون TTS) + ٥ حركات قابلة لإعادة الاستخدام، **+ ٥ ألعاب أنميشن جديدة (المجموع ١٠)**: حروف القرآن (MATCHING) · بوصلة القبلة (COMPASS) · بطل رمضان (CALENDAR_DROP) · زيّن مسجدك (COLORING) · سُلّم الأخلاق (BOARD_DICE). تقرأ من الـ seed عبر الـ API. ✅ **خلص** (build أخضر)
- **P7 — التشفير + النسخ الاحتياطي على Google Drive** (مطابقة `C:\coding\asmaa`): تشفير at-rest (AES-256-GCM، `MASTER_KEY` لتوكنات Drive)، مفاتيح المستخدم على Drive فقط (DB metadata فقط)، حسابات Drive نوعين KEY/DB، نسخ `.enc` لكل مفتاح، استرجاع مع preflight reconnect + استرجاع خارجي (`.enc`+`.pem`)، scheduler (node-cron)، CLI فكّ تشفير، وصفحة `/dashboard/backups` بـ ٣ تبويبات (النسخ والاسترجاع/الحسابات/المفاتيح). ✅ **خلص** (import + build أخضر؛ يحتاج MySQL + بيانات Google OAuth للتشغيل الحيّ).

### حالة التنفيذ — تفصيل
- **الباك (15 موديول)** مسجّل في `server/src/routes.js`: `auth · users · plans · sessions · notifications · coupons · subscriptions · reports · certificates · rewards · games · quizzes · dashboard · backups (+ public OAuth callback) · encryption-keys`. السيرفر يقلع على `:4000` و`/api/v1/health` يرد. كل موديول عدّى import-check + full-app import.
- **الفرونت** كله JSX/JS الآن (لا TS في `web/src`؛ بقي `tsconfig.json`/`next-env.d.ts` لأسماء المسارات فقط). `npm run build -w web` أخضر بالمسارات: `/ · /login · /register · /dashboard · /dashboard/certificates · /dashboard/notifications · /dashboard/backups · /games · /games/[slug]`.
- **يتطلب للتشغيل الحيّ:** MySQL شغّال ثم `npm run db:migrate` + `npm run db:seed`؛ ولميزة Drive: `MASTER_KEY` + `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` في البيئة.

---

## 7. SEO
- `metadata` ديناميكي per-page (title/description ar/en) + Open Graph.
- `sitemap.ts` + `robots.ts` + JSON-LD (EducationalOrganization) + ألت للصور + هيكل headings سليم.
