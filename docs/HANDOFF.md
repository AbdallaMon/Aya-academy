# Ayah Academy — Handoff Prompt (لوكيل ذكاء اصطناعي يكمّل المشروع)

> انسخ كل ما تحت هذا السطر والصقه كبرومبت لوكيل (AI agent) جديد ليكمل العمل.

---

أنت **مطوّر Full-Stack Senior** تكمل بناء مشروع **Ayah Academy** (أكاديمية تعليم قرآن وأخلاق للأطفال) في `c:\coding\ayah-academy`. اشتغل باستقلالية، اتخذ القرارات بنفسك، نفّذ ولا تتوقف، وتحقّق من كل خطوة فعليًا (build/boot) قبل ما تقول إنها خلصت. ردّك بالعربي.

## 0) قرارات معمارية مُقفلة (التزم بها حرفيًا)
- **المرجع:** قلّد معمارية `C:\coding\Transaction-app` بالظبط (هي عائلة نفس المشروع).
- **JavaScript فقط (ESM) — ممنوع TypeScript** في الفرونت والباك.
- **MySQL/MariaDB + Prisma 7** (generator `prisma-client-js` بـ output مخصص + `@prisma/adapter-mariadb`). الـ schema بدون `url`؛ الـ url للـ migrations من `prisma.config.ts`.
- **Monorepo بـ npm workspaces:** `packages/db` (`@ayah/db`) + `packages/shared` (`@ayah/shared`) + `server/` (Express) + `web/` (Next.js App Router + MUI، **JSX مش TS**).
- عقد الـ API: `{ success, message, data, translationKey }` + `AppError` بأكواد رسائل محايدة. Auth: JWT (access+refresh) في httpOnly cookies، الصلاحيات per role (`getPermissionsForRole`).
- العملة GBP. اللغتان: عربي/إنجليزي (i18next، الافتراضي عربي، RTL).

## 1) اللي خلص فعليًا واتأكد منه ✅
- **Monorepo + الحزم:** `@ayah/shared` (أدوار/صلاحيات/enums/أكواد رسائل — JS منبسط)، و`@ayah/db` (Prisma 7 + adapter-mariadb، سكيما كاملة **+35 موديل** تغطي كل الميزات؛ `prisma generate` بيشتغل لـ MySQL).
- **بنية السيرفر (JS):** env, cors, AppError + error-handler, response envelope, middlewares (auth/permissions/validate/asyncHandler), jwt, hash, pagination/search helpers — `nodemon src/server.js`.
- **٨ موديولات باك جاهزة وبتشتغل** (route→controller→usecase→repo→validation، Prisma في الـ repo فقط):
  `auth` · `users`(+ ربط ولي أمر/طلاب + scope) · `plans`(+ خصومات + `/plans/public` تسعير) · `sessions`(حصص) · `notifications`(+ خدمة `createNotification`) · `coupons`(+ `/validate`) · `subscriptions`(+ `/expiring` + إشعارات) · `reports`.
  تحقّقت: السيرفر يقلع، `/health` تمام، الراوت المحمي يرجّع 401، الـ envelope صح.
- **٥ ألعاب أطفال (HTML prototypes) جاهزة ومتحقّقة** تحت `web/public/games/` + مكتبة مشتركة `kit.css` + `kit.js`:
  `phone-manners` (آداب الاتصال) · `good-deeds-catch` (صاروخ الحسنات) · `wudu-steps` (بطل الوضوء) · `azkar-match` (ذاكرة الأذكار) · `pillars-build` (نجوم الأركان) + معرض `index.html`.
  القواعد المطبّقة: **مفيش فشل** (الغلط = اهتزاز لطيف + رسالة تشجيع + إعادة)، أصوات أطفالية ناعمة + صوت كليك، **بدون أي نُطق صوتي/TTS**، حركات (كونفيتي/طفو/نطّ)، نجوم + شهادة في كل لعبة. **هذه نماذج مرجعية يجب نقلها إلى React** (شوف المهمة C).

## 2) ملفات لازم تقرأها قبل ما تبدأ
- `docs/MASTER_PLAN.md` — الرؤية + نموذج البيانات + الصلاحيات + المراحل.
- `docs/GAME_SPEC.md` — مواصفات الألعاب وميكانيكاها وربطها بالداتا.
- `packages/db/prisma/schema.prisma` — كل الموديولات والـ enums.
- `server/src/modules/users/*` و `server/src/modules/plans/*` — **القدوة (gold standard)** لأي موديول جديد.
- `web/public/games/kit.js` + `kit.css` + أي لعبة (مثلاً `phone-manners.html`) — مرجع نقل الألعاب لـ React.
- `web/` الحالية لسه **scaffold قديم بـ TypeScript** (Next.js + MUI) — هتحوّلها JSX وتعيد بناءها (المهمة B).

## 3) اتفاقيات الكود (إلزامية)
- طبقات صارمة: `route → controller → usecase → repo`. Prisma **فقط** في `*.repo.js`. كنترولر رفيع. منطق في usecase. كل دالة usecase تأخذ `authUser`/`authUserId` وتفحص الـ scope.
- ESM: كل الاستيرادات النسبية تنتهي بـ `.js`. Prisma: `import { prisma } from "@ayah/db/prisma.client.js"`. الثوابت: `@ayah/shared`.
- Validation بـ **Zod** في `*.validation.js`. أخطاء عبر `AppError`/factories مع `translationKey: messagesNames.<x>Messages`.
- القوائم: `paginate()` + `paginatedResult()` + `ok(res, result)`؛ بحث بـ `buildSearchQuery` (MySQL — بدون `mode:"insensitive"`).
- صلاحيات من `PERMISSIONS.<X>` (`@ayah/shared`)، per-route مثل موديول users.
- **لو غيّرت السكيما:** عدّل الـ enum في `schema.prisma` **و** ما يقابله في `@ayah/shared/constants/enums.js` معًا، ثم `npm run db:generate`.

## 4) المطلوب منك (بالترتيب) — نفّذ، استخدم sub-agents بالتوازي للأجزاء المستقلة

### A) إكمال الباك (JS)
1. **quizzes** module: بنك أسئلة الادمن + **تصنيفات (categories تظهر للادمن لا لولي الأمر)** + توليد **رابط دعوة (QuizInvite)** لولي أمر محدد بأسئلة مختارة + بناء ولي الأمر للاختبار (أسئلة بنك أو مخصّصة) + اختيار طلابه (المرتبطين + لهم اشتراك فعّال فقط) + هدية الاجتياز (اسم + ثيم/لون/إيموجي) + حد النجاح + محاولات الطلاب + شهادة. (الموديلات موجودة في السكيما: QuizQuestion/QuestionCategory/QuizInvite/Quiz/QuizItem/QuizParticipant/QuizAttempt).
2. **games** module: list/view/assign(لطالب أو أكثر)/attempt + scoring + شهادة + (اختياري) إصدار كوبون هدية. + **seed** (`packages/db/prisma/seed.js`) يزرع: أدمن، شارات، و**لعبة "آداب الاتصال" + باقي الألعاب** كبيانات (Game + GameQuestion + GameOption) ليقرأها محرّك React.
3. **dashboard** module: إحصائيات الادمن (مين اشتراكه منتهي/قرب ينتهي/ملوش اشتراك) + **leaderboard** (من `User.points`) + ملخصات ولي الأمر/الطالب.
4. سجّل كل موديول في `server/src/routes.js` وتحقّق `cd server && node src/server.js` يقلع بدون أخطاء.

### B) أساس الفرونت (Next.js — JSX، قلّد `Transaction-app/web`)
- حوّل `web/` من TS إلى **JSX** وأعد بناءها على نمط `Transaction-app/web`:
  - i18n (i18next، قواميس ar/en، locale في cookie، RTL عبر `stylis-plugin-rtl`).
  - theme factory (MUI) + providers stack (App/Auth/Theme/I18n/Toast).
  - `ApiFetch` + `useRequest` (pagination/filters/toast) + `usePermission` + `useAuth`.
  - `DataTable` مُدارة بـ config + كومبوننتات `RHF*` + `FormDialog`.
- **مهم:** الديبندنسيز موجودة بالفعل (`framer-motion`, `gsap`, `mui`, `react-hook-form`, `stylis-plugin-rtl`).

### C) نقل الألعاب إلى الكود بتاعنا (Next.js — مش HTML عادي) 🔴
- **كودنا Next.js (App Router) + React + JSX، وليس HTML عادي.** انقل الـ ٥ ألعاب من `web/public/games/*.html` إلى **مكوّنات React** تحت `web/src/features/games/`:
  - محرّك عام `<GamePlayer game={...} />` + renderers لكل `kind` (DialpadTask, ChoiceTask, ToneSliderTask, CatchTask, SequenceTask, MemoryMatchTask, BuildTask, RewardStudio, Certificate).
  - **انقل `kit.js` إلى React**: hook/utility `useGameSounds()` (نفس الأصوات الأطفالية الناعمة بـ Web Audio، **بدون أي TTS/نُطق**) + استخدم **framer-motion/gsap** للحركات بدل CSS-only.
  - اللعبة تقرأ بياناتها من **الباك (games module + seed)** عبر `useRequest`، مش hardcoded.
  - حافظ على كل القواعد: **مفيش فشل** (غلط = حركة لطيفة + تشجيع + إعادة)، أصوات ناعمة + صوت كليك، حركات كتير، نجوم، شهادة.
  - صفحة عرض الألعاب داخل الموقع (للطالب) + ربط "لعبة مجانية في الهوم" تعطي كوبون هدية بعد الإنهاء.

### D) أضف ٥ ألعاب أنميشن جديدة (ليصبح المجموع ١٠) + وسّع الحركات
- ابنِها **بنفس المحرّك React + نفس القواعد** (محتوى إسلامي للأطفال ≤٧، أصوات/حركات، مفيش فشل، شهادة). ٥ أشكال/ميكانيكا **مختلفة تمامًا** عن السابقة:
  1. 🔤 **حروف القرآن** — مطابقة الحرف بصورته/كلمته (letters matching).
  2. 🧭 **بوصلة القبلة** — اسحب/أدر السهم ليشير للكعبة (rotation/aim).
  3. 📅 **بطل رمضان** — اسحب العادات الطيبة (صيام/تراويح/صدقة) على أيام التقويم (drag-and-drop).
  4. 🎨 **زيّن مسجدك** — تلوين/تزيين إبداعي مع تعلّم آداب (coloring/creative).
  5. 🎲 **سُلّم الأخلاق** — لعبة لوح بالنرد: تصعد مع العمل الطيب وتنزل مع السيئ + سؤال (board/dice).
- **وكمان زوّد مكتبة الحركات** (في الـ kit/React): أضف ٥ حركات/أنميشن جديدة قابلة لإعادة الاستخدام (مثلاً: bounce-in، slide-in، jelly/squash، sparkle-trail، pulse-glow) واستخدمها في كل الألعاب لإحساس أغنى.

### E) الواجهة العامة + الداشبوردات
- موقع تعريفي (navbar + footer + hero + مكان فيديو + أقسام لماذا/كيف + تسعير الخطط من `/plans/public` + اللعبة المجانية + هدية + SEO: metadata/sitemap/robots/JSON-LD).
- داشبوردات (admin/parent/student) + صفحات تسجيل/دخول + شهادات + إشعارات.

## 5) قواعد الألعاب (للأطفال ≤ ٧) — لا تُكسر
- **مفيش "إجابة غلط وتعدّي" ولا فشل.** الغلط = صوت لطيف + اهتزاز + وجه/رسالة تشجيع + إعادة محاولة. بلا خصم.
- أصوات **أطفالية ناعمة** + **صوت كليك** على كل ضغطة. **ممنوع أي نُطق/TTS** (كان فيه صوت إنجليزي واتشال — لازم يفضل متشال).
- حركات كتير، نجوم، وشهادة تقدير في الآخر. عربي RTL، كلمات بسيطة.

## 6) كيف تتحقق
- باك: `cd server && node src/server.js` (يقلع نظيف) + جرّب endpoints بـ curl. لو فيه MySQL شغّال: `npm run db:migrate` ثم `npm run db:seed`.
- فرونت: `npm run dev:web` (Next يقلع، الصفحات تفتح، التبديل ع/إن وRTL شغّال).
- ألعاب React: تشتغل داخل الموقع وتقرأ من الـ seed.

## 7) ابدأ من هنا
ابدأ بـ **(A) موديول quizzes + dashboard** في الباك (سجّلهم في routes.js وتحقّق الإقلاع)، وبالتوازي ابدأ **(B) أساس الفرونت بـ JSX**. بعدها **(C) نقل الألعاب لـ React**، ثم **(D) الـ ٥ ألعاب الجديدة + الحركات**، ثم **(E)**. حدّث `docs/MASTER_PLAN.md` مع كل مرحلة. انطلق ولا تتوقف. 🚀
