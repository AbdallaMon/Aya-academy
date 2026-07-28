# خطة إعادة التنظيم — ayah-academy

> الهدف: توحيد تنظيم الملفات (مش اللوجيك) عشان يبقى مطابق للـ ref.
> المرجع الأساسي = **school-system** (الهيكل + الـ validation + فصل ملفات الـ config).
> مرجع الـ query-handling = **Transaction-app** (بناء الـ `where` في الـ repo + شكل `{items,total,page,pageSize}`).
>
> الحالة: **بلان فقط — مفيش تعديل كود لسه.**
> رموز الأولوية: 🔴 = must-fix (بيخالف الـ convention) — 🟡 = nice-to-have.

---

## الشكل النهائي المستهدف (Target Conventions)

**باك اند — كل موديول:**
```
modules/<feature>/
  <feature>.route.js        # middlewares + verb→controller
  <feature>.controller.js   # رفيع: يقرا req، ينده usecase، يرجّع ok()/created()
  <feature>.usecase.js      # لوجيك فقط — يمرّر الفلاتر، مايبنيش where
  <feature>.repo.js         # المكان الوحيد لـ Prisma + بناء where/search/orderBy
  <feature>.validation.js   # كلاس Zod (static schemas)
  <feature>.dto.js          # select + mappers
```
- بناء الـ `where` في الـ **repo** عن طريق `shared/utility/helper.js` (`buildSearchQuery`…).
- رسائل الأكواد من `@ayah/shared` مباشرة — **من غير** ملفات `.messages.js` محلية.
- الموديولات المترابطة تتجمّع تحت parent + aggregator route.

**فرونت اند — كل feature:**
```
features/<feature>/
  pages/       # <Feature>Page.jsx (رفيع)
  components/  # dialogs + أجزاء الصفحة
  config/
    constant.js          # <FEATURE>_URL + ثوابت
    <feature>Columns.js  # descriptors الأعمدة (مش inline)
    <feature>Filters.js  # descriptors الفلاتر (مش inline)
    <feature>Text.js     # نصوص i18n
```
- الأعمدة والفلاتر في ملفات config منفصلة، **مش** `useMemo` جوه الصفحة.

---

# المرحلة 1 — الباك اند (server/src)

## 🔴 1-A. نقل بناء الـ `where` من الـ usecase للـ repo
11 موديول بيبنوا الـ where في الـ usecase. المطلوب ينتقل للـ `<feature>.repo.js` (فيه template شغّال جاهز نقلّده من: `coupons.repo.js`, `plans.repo.js`, `badges.repo.js`, `certificateTemplates.repo.js`).

| Module | المكان الحالي |
|---|---|
| whiteboardSessions | `whiteboardSession.usecase.js:42` `buildListWhere()` |
| certificates | `certificate.usecase.js:29` `buildListWhere()` |
| reports | `report.usecase.js:23` `buildListWhere()` + `buildSearchQuery` بينده في الـ usecase (:26) |
| users | `user.usecase.js:34` `buildListWhere()` |
| games | `game.usecase.js:108` `buildListWhere()` + where عشوائي (:412) |
| sessionLogs | `sessionLog.usecase.js:35` `buildListWhere()` |
| rewards | `reward.usecase.js:33` `buildListWhere()` |
| subscriptions | `subscription.usecase.js:213` `buildListWhere()` + where (:269) |
| quizzes | `quiz.usecase.js` — 4 builders (:81/94, :208, :420, :514) |
| invoices | `invoice.usecase.js:279` where inline |
| backups | `backups.usecase.js:34` where inline |

## 🔴 1-B. تقسيم الملفات الضخمة
| ملف | ~أسطر | بيخلط |
|---|---|---|
| `subscriptions/subscription.usecase.js` | 1156 | list/scope + coupon + invoice snapshot + 7 workflows |
| `quizzes/quiz.usecase.js` | 712 | bank + invites + scope + list + attempts + 4 builders |
| `users/user.usecase.js` | 525 | |
| `invoices/invoice.usecase.js` | 490 | |
| `quizzes/quiz.repo.js` | 462 | |
| `games/game.usecase.js` | 423 | |
| `auth/auth.usecase.js` | 365 | |

## 🟡 1-C. حذف shims الـ `.messages.js` (18 ملف)
كلها re-export سطر واحد من `@ayah/shared` — تتحذف والـ importers تروح على `@ayah/shared` مباشرة (زي ما `auth`/`backups`/`users`/`encryptionKeys` عاملين بالفعل).
> attachments, badges, certificateTemplates, certificates, coupons, dashboard, games, invoices, notifications, paymentTemplates, plans, points, quizzes, reports, rewards, sessionLogs, settings, subscriptions, whiteboardSessions.

## 🟡 1-D. تجميع الموديولات المتفرّقة (parent + aggregator route)
`routes.js` بيركّب 25 راوتر فلات. المقترح:
- `finance/` ← subscriptions, invoices, plans, coupons, paymentTemplates
- `gamification/` ← games, quizzes, badges, points, rewards
- `certificates/` ← certificates + certificateTemplates (بيشتركوا في نفس message codes)
- `sessions/` ← sessionLogs, whiteboardSessions, reports

## 🟡 1-E. توحيد التسميات المخالفة
- `backups/*` كله جمع → المفروض مفرد `backup.<layer>.js`.
- `backups/backups.public.routes.js` → مخالفة مزدوجة (جمع + `.routes.js` + `.public.`).
- `backups/driveAccounts.repo.js` → repo لكيان فرعي؛ الأنضف `backup/driveAccount.repo.js` تحت الجروب.

## 🟡 1-F. نقل helpers الـ storage/upload لطبقة infra مشتركة
`attachments/storage.js`, `attachments/attachment.upload.js`, `whiteboardSessions/whiteboardImage.storage.js`, `backups/backups.upload.js` — دي infra (multer/paths) مش feature layers، و`whiteboardImage.storage.js` بيمد إيده جوه `attachments/storage.js`. تنقل لـ `shared/storage` أو `infra/upload`.

## 🟡 1-G. ملفات layer ناقصة (تأكيد حسب الحاجة الفعلية)
- `coupons`, `dashboard` — مفيش `.dto.js`.
- `dashboard`, `notifications`, `rewards` — مفيش `.validation.js` (dashboard read-only ممكن يكون طبيعي — نتأكد).

---

# المرحلة 2 — الفرونت اند (web/src/features)

> 38 feature. **`quizzes` هو الوحيد المطابق 100%** (Columns + Filters منفصلين) — نستخدمه كـ template.

## 🔴 2-A. استخراج الأعمدة/الفلاتر inline لملفات config
الصفحات دي معرّفة `columns`/`filterConfig` بـ `useMemo` جوه الصفحة → تتنقل لـ `config/<x>Columns.js` + `config/<x>Filters.js`:

| ملف الصفحة | columns @ | filters @ |
|---|---|---|
| `users/pages/UsersPage.jsx` | L243 | L473 |
| `subscriptions/pages/SubscriptionsPage.jsx` | L162 | L417 |
| `reports/pages/ReportsPage.jsx` | L177 | L261 |
| `coupons/pages/CouponsPage.jsx` | L114 | L270 |
| `plans/pages/PlansPage.jsx` | L169 | L257 |
| `games/pages/GamesAdminPage.jsx` | L86 | L241 |
| `certificateTemplates/pages/CertificateTemplatesPage.jsx` | L86 | L185 |
| `badgesAdmin/pages/BadgesAdminPage.jsx` | L75 | L145 |
| `sessionLog/pages/SessionLogPage.jsx` | L113 | inline setFilters |
| `userDetail/components/CertificatesTab.jsx` | L63 | — |

## 🔴 2-B. توحيد ملفات الـ Filters
- `quizBank/config/quizBankColumns.js` فيه `buildQuizBankFilters` → يتنقل لـ `quizBankFilters.js`.
- الـ features اللي عندها Columns بس من غير Filters منفصل: `backups`, `certificates`, `quizInvites`, `whiteboard`.

## 🔴 2-C. تقسيم الملفات الضخمة
| ملف | ~أسطر | ملاحظة |
|---|---|---|
| `certificates/components/CertificateCard.jsx` | 1678 | template layouts متعددة في ملف واحد — تتقسّم per-renderer |
| `certificates/components/CreateCertificateDialog.jsx` | 1013 | dialog + form + preview |
| `certificateTemplates/components/TemplateFormDialog.jsx` | 758 | dialog + fields + validation |
| `users/pages/UsersPage.jsx` | 646 | هيصغر لوحده بعد استخراج columns/filters |
| `subscriptions/pages/SubscriptionsPage.jsx` | 542 | |
| `paymentTemplate/pages/PaymentTemplateSettingsPage.jsx` | 479 | |
| `quizBuild/pages/QuizBuildPage.jsx` | 416 | |
| `reports/pages/ReportsPage.jsx` | 393 | |
| `plans/pages/PlansPage.jsx` | 383 | |
| `sessionLog/pages/SessionLogPage.jsx` | 333 | |
| `coupons/pages/CouponsPage.jsx` | 328 | |
| `userDetail/pages/UserDetailPage.jsx` | 319 | |
| `games/pages/GamesAdminPage.jsx` | 306 | |

Components كبيرة (candidate split, >~330): `dashboard/ParentOverview.jsx` (584), `dashboard/StudentOverview.jsx` (565), `backups/KeysSection.jsx` (499), `dashboard/DashboardShell.jsx` (406), `auth/RegisterWizard.jsx` (406), `backups/DriveAccountsSection.jsx` (376), `invoices/InvoiceDocument.jsx` (358), `backups/ExternalRestoreDialog.jsx` (353), `subscriptionDetail/SubscriptionActions.jsx` (352), `quizInvites/CreateInviteDialog.jsx` (351), `subscriptions/SubscriptionCreateDialog.jsx` (337), `invoices/InvoiceEditForm.jsx` (338).

## 🟡 2-D. توحيد مكان شاشات التفاصيل (Detail)
حالياً مختلط: بعضها فولدر مستقل (`subscriptionDetail/`, `userDetail/`)، وبعضها جوه parent (`certificates/pages/CertificateDetailPage.jsx`, `reports/…ReportDetailPage.jsx`, `invoices/…InvoiceDetailPage.jsx`, `whiteboard/…WhiteboardSessionDetailPage.jsx`). نختار نظام واحد. (التسمية `Detail` مفرد ثابتة — كويس.)

## 🟡 2-E. الـ features المسطحة (marketing) — تدّي `pages/` على الأقل
- `blog/` → `BlogArticle.jsx`,`BlogList.jsx` ينزلوا `pages/`.
- `pricing/PricingSection.jsx` → `pages/`.
- `faq/`, `hero/`, `programs/`, `whyAyah/`, `promo/`, `trust/`, `reviews/`, `childDashboard/` → تجميع بسيط في `pages/` (+`data/`).

## 🟡 2-F. توحيد التسميات
- `backups/config/backupText.js` → `backupsText.js` (يطابق `backupsColumns.js`).
- `games/config/gamesAdminText.js` → توحيد مع اسم الـ feature `games`.
- إضافة `constant.js` الناقص في: `dashboard`, `leaderboard`, `notifications`, `quizTake`.
- نقل `games/devData.js` و`games/index.js` من جذر الـ feature لـ `config/` أو `data/`.

---

# المرحلة 3 — الطبقات المشتركة (shared)

## 🔴 3-A. إصلاح فولدر مكتوب غلط + tokens في مكان غلط
- `web/src/shared/utlis/` → **utlis** غلط إملائي (المفروض utils). importers: `providers/MUITheme.jsx`, `shared/ui/utility/CircleProgress.jsx`.
- محتواه ألوان/theme tokens (`colors`,`darkColors`,`getCurrentColorScheme`) → مكانه `shared/ui/theme/` مش utils.

## 🔴 3-B. توحيد ملفات الـ constants المتفرّقة
- `web/src/utils/constant.js` (مفرد — routing/auth) مقابل `web/src/shared/utlis/constants.js` (جمع — ألوان). 3 اتفاقيات متضاربة. نوحّدهم في مكان واحد صحيح الإملاء باسم ثابت.
- `EXCLUDED_FROM_ERROR_REDIRECT` متعرّف في `utils/constant.js:16` ومُعاد تصديره من `ApiFetch.js:374` — نختار مصدر واحد.

## 🔴 3-C. تقسيم الملفات المشتركة الضخمة
| ملف | ~أسطر | التقسيم المقترح |
|---|---|---|
| `web/src/lib/api/ApiFetch.js` | 374 | url/query builder + headers + auth/refresh + fetch dispatcher |
| `web/src/hooks/request/useRequest.js` | 360 | `useUrlFilters` + pagination reducer + toast/error effect |
| `server/src/infra/backup/backupService.js` | 688 | fs/path helpers → `backup/fs`، والكلاس يرفّع |

## 🟡 3-D. تقسيم DataTable (parity مع الـ ref)
`web/src/shared/components/tables/DataTable.jsx` (258) ملف واحد فيه Head/Body/Cell/skeleton/empty/Pagination → يتقسّم `DataTableHead/Body/Cell/Toolbar/Pagination` زي المشروع الأنضج.

## 🟡 3-E. فصل الـ query-builders في الباك
`server/src/shared/utility/helper.js` (208) بيخلط query-builders (`buildSearchQuery`…) مع helpers تانية (`parseIdList`,`normalizeText`) → نطلّع `shared/utility/queryBuilders.js` ونسيب المتفرّقات في `helper.js`.

## 🟡 3-F. تنظيم components متبقية في جذر shared
`ColorPicker.jsx`, `CouponControl.jsx` (214), `PhotoUpload.jsx` (173), `SubscriptionLockedState.jsx` لسه في جذر `shared/components/` → يتوزّعوا على `forms/`/`display/`/`feedback/`.

## 🟡 3-G. تفرقات أصغر
- `async-handler.js` (kebab، من غير `.middleware`) وسط ملفات `*.middleware.js` — helper مش middleware، يتوحّد.
- الـ barrels نص-ونص: بس `shared/components/index.js` موجود (ويعمل leak بـ `useConfirm` من برّه shared). نقرّر: barrels لكل concern أو deep-imports — مش مخلوط.
- `shared/data/reviews/index.js` مقابل `shared/data/navigation/navbar.js` — تسمية ملفات data مش متسقة.

---

## نقاط سليمة (مفيش action)
- `packages/shared/` منظّم كويس (constants + messages-codes + barrels).
- `server/src/shared/` مطابق للـ ref (http/errors/middlewares/utility/access/crypto).
- `server/src/infra/` متقسّم كويس (ماعدا backupService).
- شكل الـ pagination `{items,total,page,pageSize}` = مطابق Transaction ✅.

---

## ترتيب التنفيذ المقترح
1. **موديول template واحد كامل** (`users` باك + فرونت) على الشكل النهائي — نراجعه مع بعض.
2. تعميم 1-A (where→repo) على الـ 11 موديول.
3. 2-A/2-B (استخراج columns/filters) على الـ 10 صفحات.
4. تقسيم الملفات الضخمة (1-B, 2-C, 3-C).
5. الـ nice-to-have (grouping, تسميات, shared cleanup).
