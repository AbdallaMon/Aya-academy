# تصميم: تجديد الاشتراك + فلو الفاتورة (Subscription Renewal & Invoice Flow)

التاريخ: 2026-06-28

## 1. الهدف (Goal)

تبسيط تجربة الاشتراك لكل من الأدمن وولي الأمر:

1. **عرض السعر + الخصم** بشكل واضح (السعر الأساسي، الخصم/الكوبون، الصافي).
2. **اشتراك واحد ظاهر لكل طالب** — المفعّل حالياً، وإلا أحدث اشتراك (منتهي/ملغي). الاشتراكات القديمة **تُخفى تماماً** من الواجهة (تبقى في الداتابيز فقط).
3. **تجديد** بدل إنشاء اشتراك جديد ظاهر — التجديد ينشئ صفاً جديداً فعلياً لكنه يظهر كـ"الاشتراك الحالي".
4. **تغيير الخطة** عبر زر مستقل.
5. **الخصم** يضيفه الأدمن أو ولي الأمر بكود كوبون.
6. **فلو فاتورة** متكامل: تجديد → اشتراك غير مفعّل + فاتورة → صفحة اشتراك مستقلة → إرسال لولي الأمر → ربط ثنائي الاتجاه بين دفع الفاتورة وتفعيل الاشتراك.
7. **WhatsApp** منفّذ بالكامل (Meta WhatsApp Cloud API عبر HTTP) ومتحكَّم فيه من الـ`.env`: لو `WHATSAPP_ENABLED=true` والإعداد مكتمل → يرسل فعلياً؛ غير ذلك no-op صامت. بالإضافة لإشعار داخل اللوحة (دائماً).

كل طالب له اشتراكه وفاتورته منفصلين (موجود بالبنية الحالية، نحافظ عليه).

---

## 2. الوضع الحالي (Baseline)

- `Subscription` (1:1) `Invoice`. حالات الاشتراك: `PENDING | UPCOMING | ACTIVE | EXPIRED | CANCELLED`. حالات الفاتورة: `UNPAID | PAID | VOID`.
- صفحة `/dashboard/subscriptions` تعرض **كل** الاشتراكات (صف لكل اشتراك).
- الفاتورة تُفتح في `InvoiceDialog` (لا توجد صفحة مستقلة).
- يوجد بالفعل:
  - `subscriptionUsecase.create / request / approve / reject / cancel`.
  - `invoiceUsecase.update(..., { activateSubscription: true })` يفعّل الاشتراك عند الدفع (اتجاه واحد فقط).
  - نظام إشعارات `notificationUsecase.createNotification / createManyForUsers` (ثنائي اللغة، يدعم `link` و`dataJson`).
  - نمط providers ناضج في `server/src/infra/backup/providers/` + توجيه عبر `ENV` (مثل `BACKUP_PROVIDER`, `*_ENABLED === "true"`).
  - نظام الكوبون/الخصم كامل (`couponPricing.js`, `CouponControl`, `/plans/quote`).

لا يوجد حالياً: مفهوم "تجديد"، "اشتراك واحد لكل طالب"، صفحة اشتراك مستقلة، "إرسال الفاتورة لولي الأمر"، الربط العكسي (تفعيل الاشتراك → عرض اعتماد الفاتورة)، أي provider للرسائل الخارجية.

---

## 3. تغييرات قاعدة البيانات (Schema — additive)

ملف: `packages/db/prisma/schema.prisma`

1. **`Invoice.sentAt DateTime?`** — وقت آخر إرسال للفاتورة لولي الأمر (null = لم تُرسل). تستخدمه الواجهة لإظهار "تم الإرسال". (اختياري إضافي: `sentChannelsJson Json?` لتسجيل القنوات — نتركه الآن، YAGNI).
2. **إضافة قيمة لـ enum `NotificationType`**: `INVOICE_SENT` (additive). مع مزامنة الثابت في `packages/shared/constants/enums.js` (`NOTIFICATION_TYPES.INVOICE_SENT`).

لا حاجة لربط `renewedFromId`؛ "الاشتراك المعروض" يُحسب كأحدث صف لكل طالب (انظر §4.1). الاشتراكات القديمة مخفية تماماً فلا نحتاج تتبّع السلسلة.

ميغريشن: additive فقط (عمود nullable + قيمة enum) — لا backfill.

---

## 4. الباك إند (Backend)

### 4.1 "أحدث اشتراك لكل طالب" (Latest-per-student)

- **القاعدة**: الاشتراك المعروض لطالب = الصف صاحب أكبر `id` (autoincrement ⇒ الأحدث، وهو دائماً آخر تجديد حتى لو لم يُفعّل بعد).
- `subscription.repo.js`: دالة `listLatestPerStudent({ where, skip, take })`:
  - `prisma.subscription.groupBy({ by: ['studentId'], _max: { id: true }, ... })` للحصول على أحدث id لكل طالب (مع فلترة scope الدور)، ثم `findMany({ where: { id: { in: maxIds } } })` بالـ projection الحالي.
  - الباجينيشن تتم على مستوى الطلاب (group) لا الصفوف.
- فلتر الحالة (status) يُطبَّق على الاشتراك المعروض (الأحدث).
- `subscription.usecase.list` يستدعي هذه الدالة. الـ scope: ADMIN يرى كل الطلاب، PARENT أبناءه، STUDENT نفسه (كما هو).

> النتيجة: صفحة الاشتراكات تصبح "دليل طلاب": صف واحد لكل طالب = أحدث اشتراك له.

### 4.2 التجديد (Renew)

- **Endpoint**: `POST /subscriptions/:id/renew`
- **المدخلات**: `{ planId?, billingPeriod?, couponCode?, startDate?, allowWhileActive? }`
  - الافتراضات من الاشتراك المصدر `:id`: نفس `planId` و`billingPeriod`. يمكن تغييرها.
- **اللوجيك** (`subscriptionUsecase.renew`):
  1. جلب الاشتراك المصدر + التحقق من scope (ADMIN، أو PARENT لابنه).
  2. **التحقق من اشتراك فعّال**: لو للطالب اشتراك `ACTIVE` ضمن `[startDate,endDate]` و`allowWhileActive !== true` ⇒ رمي `SUBSCRIPTION_STILL_ACTIVE` (تحذير، لا حظر نهائي).
  3. حساب التسعير (نفس `computePricing` الحالي) + `endDate` (`computeEndDate`) + الساعات.
  4. إنشاء **اشتراك جديد بحالة `PENDING`** (غير مفعّل) + استهلاك الكوبون ذرّياً داخل ترانزاكشن.
  5. توليد فاتورة `UNPAID` (إعادة استخدام `ensureInvoice` / `generateForSubscription`).
  6. إشعارات: للأدمن لو المُجدِّد ولي أمر (نمط `request` الحالي)؛ نوع `SUBSCRIPTION_RENEWED`.
  7. **Return**: الاشتراك الجديد (الواجهة تنتقل لصفحته).
- **الصلاحيات**: ADMIN ⇒ `SUBSCRIPTION.RENEW`؛ PARENT ⇒ `SUBSCRIPTION.REQUEST` (التجديد بالنسبة له = طلب ⇒ `PENDING` بانتظار الدفع/الموافقة).

### 4.3 تغيير الخطة (Change Plan)

- **Endpoint**: `POST /subscriptions/:id/change-plan`
- **المدخلات**: `{ planId, billingPeriod?, couponCode? }`
- **اللوجيك**: مسموح فقط طالما الفاتورة `UNPAID` (الاشتراك لم يُدفع/يُفعّل بعد) — وإلا رمي `CANNOT_CHANGE_PLAN_PAID` (التغيير بعد الدفع = استخدم تجديد).
  - إعادة حساب `priceCharged / totalHours / remainingHours / endDate / couponId`.
  - تحديث الاشتراك + **إعادة توليد الفاتورة** (regenerate) لتعكس التسعير الجديد.
- **الصلاحيات**: `SUBSCRIPTION.EDIT` (ADMIN)؛ PARENT scoped على ابنه طالما `PENDING`.

### 4.4 تفعيل الاشتراك + الربط الثنائي (Two-way linkage)

- **Endpoint جديد**: `POST /subscriptions/:id/activate` — `{ markInvoicePaid? }`
  - `PENDING/UPCOMING → ACTIVE` (resolve بالتواريخ). لو `markInvoicePaid === true` ⇒ ضبط الفاتورة `PAID` ضمن نفس العملية.
  - إشعار `SUBSCRIPTION_CREATED/RENEWED` للطالب ("تم تفعيل اشتراكك 🎉").
  - **الصلاحيات**: `SUBSCRIPTION.ACTIVATE` (ADMIN).
- **الاتجاه الآخر (موجود، نبقيه)**: `PATCH /invoices/:id { status: PAID, activateSubscription? }` — اعتماد الفاتورة مدفوعة يعرض خيار تفعيل الاشتراك.
- النتيجة على الواجهة: زرّان متكاملان، كل منهما يعرض الإجراء المكمّل (تفاصيل §5.2).

### 4.5 إرسال الفاتورة لولي الأمر (Send to Parent)

- **Endpoint**: `POST /invoices/:id/send`
- **اللوجيك** (`invoiceUsecase.send` → `messagingService.notifyInvoiceSent`):
  1. التحقق: ADMIN فقط، الفاتورة موجودة ومسعّرة.
  2. جلب أولياء أمور الطالب (عبر `studentLinks`).
  3. **إشعار داخل اللوحة** لكل ولي أمر: نوع `INVOICE_SENT`، عنوان/نص ثنائي اللغة، `link` لصفحة الاشتراك/الفاتورة، `dataJson: { invoiceId, subscriptionId }`.
  4. **WhatsApp** (best-effort): لو `ENV.whatsapp.enabled` والإعداد مكتمل ⇒ استدعاء `whatsappProvider.send(...)`؛ غير ذلك no-op صامت.
  5. ضبط `Invoice.sentAt = now`.
- **Return**: الفاتورة المحدّثة + رمز `INVOICE_SENT`.
- **الصلاحيات**: `INVOICE.SEND` (ADMIN).

### 4.6 طبقة الرسائل الخارجية + WhatsApp provider (scaffold)

مجلد جديد على نمط `infra/backup/providers/`. **المزوّد: Meta WhatsApp Cloud API** عبر HTTP POST مباشر (بدون SDK، باستخدام `fetch`/`undici` المتاح في Node).

```
server/src/infra/messaging/
  messagingService.js        // facade: notifyInvoiceSent({ parents, invoice, student })
  providers/
    whatsapp.js              // class WhatsAppProvider { async send(phone, payload) } — Meta Cloud API
```

- `whatsapp.js` — **منفّذ بالكامل الآن**:
  - `send(phone, { templateName, params } | { text })` ⇒ `POST https://graph.facebook.com/v21.0/{PHONE_ID}/messages` بترويسة `Authorization: Bearer {TOKEN}` وجسم رسالة (template للإشعارات خارج نافذة 24 ساعة، أو text داخلها).
  - يقرأ الإعداد من `ENV.whatsapp`؛ يرمي `WHATSAPP_NOT_CONFIGURED` لو الإعداد ناقص.
- `messagingService.notifyInvoiceSent`:
  - **دائماً** ينشئ الإشعار الداخلي (عبر `notificationUsecase`).
  - **شرطياً**: لو `ENV.whatsapp.enabled && isWhatsAppConfigured()` ⇒ يستدعي `whatsappProvider.send(...)` لكل ولي أمر له رقم؛ محاط بـ try/catch (فشل الإرسال يُسجَّل ولا يُفشِل الطلب). لو `enabled=false` ⇒ يتخطّى واتساب صامتاً (no-op).

**`env.js` — إضافات (على نمط `backup`/`aws`)**:

```js
whatsapp: {
  enabled: process.env.WHATSAPP_ENABLED === "true",   // افتراضي false
  token: process.env.WHATSAPP_TOKEN,                  // Meta permanent access token
  phoneId: process.env.WHATSAPP_PHONE_ID,             // Meta phone number id
  templateName: process.env.WHATSAPP_TEMPLATE_INVOICE || "invoice_sent", // اسم القالب المعتمد
  apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
  apiUrl: process.env.WHATSAPP_API_URL,               // override اختياري
},
```

`isWhatsAppConfigured()` helper (مثل `isAwsConfigured`): يتحقق من `token` و`phoneId`.

> **مطلوب منك لتشغيل واتساب فعلياً** (الكود جاهز ويعمل بمجرد توفّرها — لحد ما تجهّزهم خلِّ `WHATSAPP_ENABLED=false`): `WHATSAPP_TOKEN` (permanent token من Meta)، `WHATSAPP_PHONE_ID`، واسم قالب رسالة معتمد من Meta (`WHATSAPP_TEMPLATE_INVOICE`) بمتغيّراته (اسم الطالب/الإجمالي/الرابط).

### 4.7 الصلاحيات (Permissions) — `packages/shared/constants/permissions.js`

- `SUBSCRIPTION.RENEW = "subscription.renew"`
- `SUBSCRIPTION.ACTIVATE = "subscription.activate"`
- `INVOICE.SEND = "invoice.send"`
- (تغيير الخطة يعيد استخدام `SUBSCRIPTION.EDIT`.)
- مزامنة بروفايلات الأدوار: ADMIN يحصل على الكل؛ PARENT يحصل على `SUBSCRIPTION.REQUEST` (للتجديد) فقط — لا `ACTIVATE`/`INVOICE.SEND`.

### 4.8 رموز الرسائل ثنائية اللغة (Message Codes — ar+en)

`packages/shared/messages-codes/` + مزامنة `web` messagesCodes:

- `invoice.js`: `INVOICE_SENT`, `INVOICE_SEND_FAILED`, `CANNOT_SEND_INVOICE`, `WHATSAPP_NOT_CONFIGURED`.
- `subscription.js`: `SUBSCRIPTION_STILL_ACTIVE`, `SUBSCRIPTION_RENEWED`, `PLAN_CHANGED`, `SUBSCRIPTION_ACTIVATED`, `CANNOT_CHANGE_PLAN_PAID`.

كل رمز له ترجمة ar+en (التزاماً بقاعدة المشروع).

---

## 5. الفرونت إند (Frontend)

### 5.1 صفحة الاشتراكات (List) — تتحول لـ"دليل طلاب"

`web/src/features/subscriptions/pages/SubscriptionsPage.jsx`:
- صف واحد لكل طالب (أحدث اشتراك). أعمدة: الطالب، الخطة، الحالة (chip)، حالة الفاتورة (chip)، **السعر + الخصم** (الأساسي مشطوب + الصافي)، تاريخ الانتهاء.
- النقر/زر **"عرض"** ⇒ صفحة الاشتراك المستقلة. زر سريع **"تجديد"**.
- معظم الإجراءات تنتقل لصفحة التفاصيل.

### 5.2 صفحة الاشتراك المستقلة (جديدة)

- Route: `web/src/app/[lng]/dashboard/subscriptions/[id]/page.jsx` (نمط `users/[id]`، `params` async).
- Feature: `web/src/features/subscriptionDetail/` (`pages/`, `components/`, `config/`).
- **المحتوى**:
  - رأس: اسم الطالب + حالة الاشتراك (chip واضح: مفعّل / قيد الانتظار / منتهي / ملغي).
  - بطاقة الاشتراك: الخطة، الفترة، التواريخ، الساعات (كلي/متبقي)، **تفصيل السعر + الخصم**.
  - بطاقة الفاتورة: حالة الفاتورة (مدفوعة/غير مدفوعة)، الإجمالي، "تم الإرسال" لو `sentAt`، عرض/تنزيل عبر `InvoiceDocument`/`InvoiceDialog` (إعادة استخدام).
- **الأزرار (permission-gated)**:
  - **تجديد** → ديالوج (نفس الخطة افتراضياً، قابلة للتغيير، + كوبون) → عند النجاح ينتقل لصفحة الاشتراك الجديد.
  - **تعديل الخطة** (طالما `UNPAID`).
  - **كوبون/خصم** (Admin + Parent) — إعادة استخدام `CouponControl`.
  - **إرسال لولي الأمر** (Admin) — يصبح "تم الإرسال ✓" بعد الإرسال (مع إمكانية إعادة الإرسال).
  - **تفعيل الاشتراك** (Admin، لو غير مفعّل): عند الضغط ولو الفاتورة `UNPAID` ⇒ checkbox "اعتمد الفاتورة كمدفوعة كمان؟".
  - **اعتماد الفاتورة كمدفوعة** (Admin، لو `UNPAID`): عند الضغط ولو الاشتراك غير مفعّل ⇒ checkbox "فعّل الاشتراك كمان؟".
  - **تعديل الساعات** (`EditHoursDialog` الحالي).

### 5.3 واجهة ولي الأمر

- يرى أحدث اشتراك لكل طالب من أبنائه (صف لكل طالب). النقر ⇒ نفس صفحة التفاصيل (scoped).
- إجراءات ولي الأمر: **تجديد** (⇒ `PENDING`) + **إضافة كوبون** فقط. لا تفعيل/اعتماد دفع/إرسال (تظهر مخفية بالصلاحيات).

### 5.4 الكوبون/الخصم

إعادة استخدام `couponPricing.js` + `CouponControl` في ديالوجات التجديد/تغيير الخطة لكلٍ من الأدمن وولي الأمر. الفاتورة وصفحة الاشتراك تعرضان تفصيل الخصم من الـ snapshot الموجود.

---

## 6. فلو شامل (End-to-end)

1. الأدمن (أو ولي الأمر) يفتح اشتراك الطالب الحالي → **تجديد**.
2. ديالوج: نفس الخطة افتراضياً (قابلة للتغيير) + كوبون اختياري. لو فيه اشتراك فعّال ⇒ تحذير "اشتراك لم ينتهِ بعد" (تأكيد للمتابعة).
3. ينشأ اشتراك جديد `PENDING` (غير مفعّل) + فاتورة `UNPAID`.
4. ينتقل تلقائياً لصفحة الاشتراك الجديد (تُظهر: غير مفعّل / فاتورة غير مدفوعة).
5. الأدمن يراجع/يعدّل الفاتورة → **إرسال لولي الأمر** (إشعار داخلي الآن، + واتساب لاحقاً).
6. عند الدفع: الأدمن إمّا **يعتمد الفاتورة مدفوعة** (مع خيار تفعيل الاشتراك)، أو **يفعّل الاشتراك** (مع خيار اعتماد الفاتورة) — الربط ثنائي الاتجاه.
7. الطالب/ولي الأمر يصله إشعار التفعيل.

---

## 7. خارج النطاق (Out of Scope / YAGNI)

- بوابة دفع حقيقية (الدفع يدوي كما هو).
- ربط سلسلة التجديدات (`renewedFromId`) — غير مطلوب لأن القديم مخفي.
- إرسال الفاتورة بالإيميل.

---

## 8. خطة التنفيذ (ترتيب مقترح)

1. Schema + enum + permissions + message codes (ar+en) — الأساس المشترك.
2. Backend: `listLatestPerStudent`, `renew`, `change-plan`, `activate`, `invoice.send`, `messaging/` + `whatsapp` scaffold + `env`.
3. Frontend: تحويل القائمة لدليل طلاب + صفحة الاشتراك المستقلة + الأزرار/الديالوجات + الربط الثنائي + عرض السعر/الخصم.
4. واجهة ولي الأمر (scoped).
5. اختبار يدوي E2E + فحص الصلاحيات/الـ scope (IDOR).
