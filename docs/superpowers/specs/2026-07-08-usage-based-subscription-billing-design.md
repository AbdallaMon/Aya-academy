# Usage-Based Subscription Billing — Design / فوترة الاشتراك حسب الاستهلاك — التصميم

**Date:** 2026-07-08
**Status:** Draft (pending user review)
**Related:** [2026-06-28 subscription renewal + invoice flow](2026-06-28-subscription-renewal-invoice-flow-design.md), memory `project-aya-subscription-hours-renewal`

---

## 1. الهدف / Goal

**عربي:** نحوّل الفوترة من "دفع مقدّم لعدد ساعات نختاره" إلى **فوترة بأثر رجعي حسب الاستهلاك الفعلي**: نجمع ساعات الحصص المسجّلة خلال الشهر، ونصدر بيها اشتراك + فاتورة للشهر اللي بعده. المسار المقدّم (الخطط) يفضل موجود كـ fallback ولمسار يدوي، فالنظامين يتعايشوا.

**EN:** Shift billing from prepaid-hours to **arrears usage-based billing**: sum the session hours a student consumed during a month, and issue a subscription + invoice for the **following** month. The prepaid/plan path remains as a fallback and for manual use — the two models coexist.

---

## 2. المبدأ الأساسي / Core principle

**المصدر الوحيد للحقيقة = صفوف `SessionLog`.** رقم ساعات الاشتراك المفتوح **محسوب (derived)** من الحصص وقت العرض — مش مكتوب فيزيائياً مع كل حصة. ده بيمنع أي عدم تطابق (drift) بين الحصص الفعلية والرقم المخزّن، وبيلغي الحاجة لأي hooks على إضافة/تعديل/حذف الحصص. الرقم **يتجمّد (freeze)** مرة واحدة بس: لحظة قفل الشهر.

**EN:** Single source of truth = `SessionLog` rows. The open subscription's hours are **derived** (`SUM` computed on read), never mutated per session. This eliminates drift and removes any need for session-mutation hooks. The value is **frozen** exactly once — at month close.

---

## 3. القاعدة والفترة / Bucketing rule & period

- الحصة اللي `sessionDate` بتاعها في الشهر **M** بتتجمّع على اشتراك الشهر **M+1** (شهر الدفع).
  - مثال: حصة `15/7/2026` → اشتراك `1/8/2026 – 31/8/2026`.
- الفترة **شهر ميلادي** كامل.
- الحصص المحسوبة = `attendance = PRESENT` **فقط** (الغياب ماينحسبش دلوقتي).

**EN:** A session dated in month **M** accumulates into the **M+1** (payment-month) subscription. Calendar month. Only `PRESENT` sessions count (ABSENT not billed for now).

---

## 4. حساب الساعات / Hours computation

للطالب في نهاية الشهر M:

```
usageHours = SUM(SessionLog.durationHours
                 WHERE studentId = X
                   AND attendance = PRESENT
                   AND sessionDate ∈ [1/M, نهاية M])

subsHours  = usageHours > 0 ? usageHours : planHours(X)
```

- `planHours(X)` = ساعات خطة الطالب المأخوذة من اشتراكه الحالي (`Subscription.planId → Plan.hours`).
- **فرضية (محتاجة تأكيد):** لو الطالب عمل حصص أقل من خطته، بنفوتر **الحصص الفعلية** (الخطة مش حد أدنى). الـ plan fallback بيشتغل بس عند صفر حصص.
- السعر: `priceCharged = roundMoney(subsHours × AppSetting.hourlyRate)` (نفس `priceFromHours` الموجودة).

**EN:** `subsHours = usageHours if any else the student's plan hours`. Price via existing `priceFromHours`. **Assumption to confirm:** actual sessions bill as-is even if below plan; plan is a zero-sessions fallback only, not a floor.

---

## 5. تعديلات الداتا / Data model changes

`packages/db/prisma/schema.prisma`:

1. **`Subscription.origin`** — enum جديد `SubscriptionOrigin { MANUAL, USAGE }`, default `MANUAL`.
   - `MANUAL` = المسار الحالي (prepaid/plan pick/renew). `USAGE` = المتولّد من الاستهلاك.
   - additive + default → **مفيش backfill** لازم.
2. **(اختياري / hardening)** `SessionLog.billedSubscriptionId Int?` (FK → Subscription, `onDelete: SetNull`) — يتحدد لما الحصة تتضم لفاتورة USAGE متصدّرة. يمنع الازدواج ويسمح بكنس الحصص المتأخرة. **مش ضروري للـ MVP** طالما الكرون بيبكتة بالتاريخ ويشتغل مرة واحدة/شهر مع قيد تفرّد.
3. مفيش status جديد — بنعيد استخدام `SubscriptionStatus` الموجود (شوف §7).

> **قرار الترحيل:** الاشتراكات الحالية كلها تبقى `origin = MANUAL` تلقائياً. لا migration بيانات. (زي عرف [[project-aya-subscription-hours-renewal]] مع `subsHours @map`.)

**EN:** Add `Subscription.origin (MANUAL|USAGE)`, default MANUAL — additive, no backfill. Optional `SessionLog.billedSubscriptionId` for idempotency hardening (skip for MVP). Reuse existing statuses.

---

## 6. الاشتراك المفتوح والعرض اللحظي / The open sub & live view

- لكل طالب نشط بيتولّد اشتراك USAGE للشهر الجاي (`startDate = 1/(M+1)`, `endDate = نهاية (M+1)`) **أول ما تتسجّل أول حصة في الشهر M** (لا اشتراكات فاضية).
- بما إن تاريخه في المستقبل → حالته `UPCOMING` طبيعياً (`resolveStatus`)، وده معناه "مفتوح/بيتجمّع".
- في الداشبورد بيظهر رقم ساعاته = `SUM(حصص الشهر M)` **محسوب لحظياً**. كل حصة تتضاف → يعلى؛ تتحذف → يقلّ. من غير أي كتابة.
- endpoint قراءة جديد: `GET /subscriptions/:id/usage-preview` (أو حقل محسوب في الـ DTO) يرجّع المجموع الحي + عدد الحصص.

**EN:** An open `USAGE` sub for month M+1 is created when the **first** session of month M is logged. It's future-dated → naturally `UPCOMING` = "open/accumulating." Dashboard shows its hours as a **live-computed** `SUM`. New read endpoint exposes the running total + session count.

---

## 7. دورة الحياة والحالات / Lifecycle & statuses

بنعيد استخدام `SubscriptionStatus` الموجود — **مفيش enum جديد**:

| مرحلة | الحالة | ملاحظة |
|------|--------|--------|
| بيتجمّع خلال الشهر M | `UPCOMING` | origin=USAGE، تاريخه (M+1)، لسه مفيش فاتورة/freeze |
| الكرون يقفل الشهر M | `PENDING` | تجمّد الساعات + اتبعتت الفاتورة، مستني الدفع |
| اتدفع | `ACTIVE` | عبر `activateSubscription` الموجود |
| عدّى شهره | `EXPIRED` | date-driven |

**Timeline (مثال يوليو):**

```
طول يوليو:
  • اشتراك يوليو  [ACTIVE]   — فاتورته اتدفعت، مانتلمسوش
  • اشتراك أغسطس [UPCOMING] — origin=USAGE، عدّاد حي = SUM(حصص يوليو)

31 يوليو 11م — cron (subscriptionScheduler، آخر يوم بالشهر، متوصّل أصلاً):
  1. freeze: subsHours = SUM(حصص يوليو) أو planHours لو صفر
  2. generateForSubscription → فاتورة UNPAID + send
  3. اشتراك يوليو → EXPIRED
  4. اشتراك أغسطس → PENDING
  5. (عند تسجيل أول حصة في أغسطس) يتفتح اشتراك سبتمبر [UPCOMING]
```

**EN:** Reuse existing statuses — `UPCOMING` (accumulating) → `PENDING` (frozen + invoiced) → `ACTIVE` (paid) → `EXPIRED`. No new enum. The already-wired month-end cron performs freeze → invoice+send → expire old → set next PENDING.

---

## 8. الكرون / The cron job

- بيملأ الـ stub الموجود: `subscriptionUsecase.autoRenewSubscriptions(now)` → نعيد تسميته/نكتبه كـ `generateMonthlyUsageInvoices(now)`.
- الكرون متوصّل أصلاً: `subscriptionScheduler.js`, `CRON_EXPR = "0 23 28-31 * *"` + حارس `isLastDayOfMonth`.
- لكل طالب نشط:
  1. احسب `subsHours` (§4).
  2. لاقي اشتراك USAGE المفتوح لـ (M+1) أو اعمله لو مش موجود (حالة صفر حصص/الخطة).
  3. freeze `subsHours` + `priceCharged`، حوّل لـ `PENDING`.
  4. `invoiceUsecase.generateForSubscription` (موجودة) + `send`.
  5. اقفل اشتراك M → `EXPIRED` لو محتاج.
- **Idempotent:** قيد تفرّد "اشتراك USAGE واحد لكل طالب لكل شهر دفع"؛ إعادة التشغيل ماتعملش تكرار.

**EN:** Fill the existing `autoRenewSubscriptions` stub (rename → `generateMonthlyUsageInvoices`). Cron already wired (last-day guard). Per active student: compute hours → find/create the M+1 USAGE sub → freeze + invoice + send → expire month-M sub. Idempotent via a one-USAGE-sub-per-student-per-month guard.

---

## 9. التعديل اليدوي / Manual override

- طول الشهر مفتوح: التصحيح يتم على **الحصة نفسها** (المصدر) — الرقم المحسوب يتحدّث لوحده.
- عند/بعد القفل: `subsHours` اتجمّد وبقى **قابل للتعديل اليدوي** عبر مسار `update()` الموجود، اللي بيعيد حساب السعر ويولّد الفاتورة UNPAID تاني — **بس طالما الفاتورة لسه UNPAID/مش متبعتة** (مايعيدش كتابة فاتورة PAID/VOID).
- الحساب واحد (المعلمة = الأدمن)، فمفيش تقسيم صلاحيات إرسال.

**EN:** During the open month, correct the **session** (source). At/after freeze, `subsHours` is editable via the existing `update()` (recomputes price + regenerates the UNPAID invoice only while unpaid). Teacher == admin, so no send-permission split.

---

## 10. التعايش والحواف / Coexistence & edge cases

- **مسارات المانيوال/prepaid** (`POST /subscriptions`, `/request`, `/renew`, `changePlan`) **زي ما هي** — بتتعلّم `origin = MANUAL`.
- **`prepareForNewSubscription`** لازم يتظبط **يتجاهل اشتراكات USAGE** (ماياخدش مكانها ولا يحذفها كـ PENDING) عشان الاتنين يتعايشوا من غير تعارض. (حالياً بيحذف أي PENDING ويمنع ثاني ACTIVE.)
- **طالب من غير خطة ومن غير حصص:** يتخطّى (مفيش فاتورة) — أو يتسجّل للمراجعة. **قرار مفتوح.**
- **حصة تتضاف متأخر بعد القفل** (لشهر قفل): تروح لاشتراك الشهر الجاي، أو تتعالج يدوي عبر `previousDebt`/`previousCredit` الموجودين على الفاتورة. (لو فعّلنا `billedSubscriptionId` بتتكنس تلقائياً.)

**EN:** Manual/prepaid paths unchanged (tagged `MANUAL`). `prepareForNewSubscription` must **ignore USAGE subs**. A student with no plan and no sessions → skipped (open decision). Late sessions after close → next month or manual credit/debit adjustment (or auto-swept if `billedSubscriptionId` enabled).

---

## 11. خارج النطاق / Out of scope (لهذه المرحلة)

- فوترة الغياب / per-student hourly rates / minimum-hours floor.
- المسار A (تخزين الرقم وتحديثه مع كل حصة) — **مرفوض** لصالح derived.
- أي تغيير في موديل الحصص نفسه (بيفضل منفصل تماماً).

---

## 12. قرارات مفتوحة للمراجعة / Open decisions to confirm

1. الحصص الفعلية الأقل من الخطة → نفوتر الفعلي (فرضية §4). ✅/❌؟
2. طالب من غير خطة ومن غير حصص → نتخطّاه؟ (§10)
3. نفعّل `SessionLog.billedSubscriptionId` من دلوقتي ولا نأجّله؟ (§5)

---

## 13. ملفات متأثرة (مبدئي) / Affected files (indicative)

- `packages/db/prisma/schema.prisma` — `SubscriptionOrigin` enum + `origin` field (+ optional `billedSubscriptionId`). **(migration يدوي — بيتسلّم لعبدالله، مش auto)**
- `server/src/modules/subscriptions/subscription.usecase.js` — `generateMonthlyUsageInvoices`, hours compute, freeze, `prepareForNewSubscription` USAGE guard, tag `origin`.
- `server/src/modules/subscriptions/subscription.repo.js` — queries: active students, open USAGE sub lookup, session-sum-per-student-per-month.
- `server/src/modules/subscriptions/subscription.route.js` + controller — `usage-preview` read endpoint.
- `server/src/infra/scheduler/subscriptionScheduler.js` — يستدعي الاسم الجديد.
- `server/src/modules/invoices/invoice.usecase.js` — إعادة استخدام `generateForSubscription`/`send` (غالباً بدون تغيير).
- `web/` — عرض الاشتراك المفتوح + العدّاد الحي في الداشبورد.
- `@aya/shared` message codes (لو فيه رسائل/إشعارات جديدة، بلغتين ar+en — عرف [[feedback-message-codes-bilingual]]).

> **ملاحظة مسارات:** بعد الـ refactor الأخير المسارات بقت: الاشتراكات `server/src/modules/finance/subscriptions/`، الحصص `server/src/modules/sessions/sessionLogs/`.

---

## 14. أمثلة كود (سكتشات إرشادية) / Code sketches (indicative)

> الأكواد دي **سكتشات** مطابقة للـ patterns الحالية في الكود — مش نسخة نهائية. الأسماء والتوقيعات بتتبع الموجود (class methods، `{ ...args, client }`، ثوابت `@aya/shared`، `AppError`/`badRequest`، `priceFromHours`، `settingsUsecase.getEffective`).

### 14.1 Schema — `packages/db/prisma/schema.prisma`

```prisma
enum SubscriptionOrigin {
  MANUAL // المسار الحالي: prepaid / plan-pick / renew
  USAGE  // متولّد من استهلاك الحصص (الفوترة بأثر رجعي)
}

model Subscription {
  // ... الحقول الحالية زي ما هي ...
  origin  SubscriptionOrigin @default(MANUAL)
  // additive + default → مفيش backfill: كل الصفوف الحالية تبقى MANUAL

  @@index([studentId, status, origin]) // للاستعلام السريع عن اشتراك USAGE المفتوح
}

// اختياري (hardening، يمكن تأجيله للـ MVP):
model SessionLog {
  // ... الحقول الحالية ...
  billedSubscriptionId Int?
  billedSubscription   Subscription? @relation("UsageBilledSessions", fields: [billedSubscriptionId], references: [id], onDelete: SetNull)
}
```

وثابت مطابق في `@aya/shared` (عرف enum-constant sync):

```js
// packages/shared/.../subscription.constants.js
export const SUBSCRIPTION_ORIGINS = Object.freeze({
  MANUAL: "MANUAL",
  USAGE: "USAGE",
});
```

### 14.2 Repo — `finance/subscriptions/subscription.repo.js`

```js
/**
 * مجموع ساعات الحصص الفعلية (PRESENT فقط) لكل طالب خلال نطاق شهر.
 * groupBy + _sum → استعلام واحد لكل الطلاب (مفيش N+1).
 * بيرجّع Map<studentId, number>.
 */
async sumUsageHoursByStudent({ gte, lt }) {
  const rows = await prisma.sessionLog.groupBy({
    by: ["studentId"],
    where: {
      sessionDate: { gte, lt },
      attendance: "PRESENT", // ATTENDANCE.PRESENT من @aya/shared
    },
    _sum: { durationHours: true },
  });
  return new Map(
    rows.map((r) => [r.studentId, Number(r._sum.durationHours ?? 0)]),
  );
}

/** الاشتراك USAGE المفتوح (UPCOMING) لطالب في نطاق شهر دفع بعينه، أو null. */
async findOpenUsageSubscription({ studentId, paymentStart, client }) {
  const row = await (client ?? prisma).subscription.findFirst({
    where: {
      studentId,
      origin: SUBSCRIPTION_ORIGINS.USAGE,
      startDate: paymentStart, // 1/(M+1)
    },
    select: subscriptionSelect,
  });
  return toSubscription(row);
}

/** كل الطلاب النشطين (اللي المفروض يتفوترولهم الشهر ده) + خطتهم الحالية للـ fallback. */
async listActiveStudentsWithPlan(now = new Date()) {
  const subs = await prisma.subscription.findMany({
    where: activeSubscriptionWhere(now), // من @aya/shared
    select: { studentId: true, plan: { select: { hours: true } } },
    distinct: ["studentId"],
  });
  return subs.map((s) => ({
    studentId: s.studentId,
    planHours: s.plan?.hours ?? null,
  }));
}
```

### 14.3 فتح الاشتراك عند أول حصة — hook خفيف في `sessionLog.usecase.create`

```js
// بعد ما تتسجّل الحصة بنجاح (best-effort، مايفشلش الطلب):
try {
  await subscriptionUsecase.ensureOpenUsageSubscription({
    studentId: created.studentId,
    sessionDate: created.sessionDate,
  });
} catch {
  // swallow — فتح الاشتراك المفتوح best-effort
}
```

```js
// finance/subscriptions/subscription.usecase.js
/**
 * يضمن وجود اشتراك USAGE مفتوح (UPCOMING) لشهر الدفع (M+1) لطالب.
 * بيتنده أول ما تتسجّل حصة في الشهر M. رقم الساعات مايتكتبش هنا — محسوب/derived
 * وبيتجمّد بس عند القفل. idempotent: لو موجود، مايعملش تاني.
 */
async ensureOpenUsageSubscription({ studentId, sessionDate }) {
  const paymentStart = firstOfNextMonth(sessionDate); // 1/(M+1)
  const existing = await subscriptionRepo.findOpenUsageSubscription({
    studentId,
    paymentStart,
  });
  if (existing) return existing;

  const paymentEnd = endOfMonth(paymentStart);
  return subscriptionRepo.createSubscription({
    origin: SUBSCRIPTION_ORIGINS.USAGE,
    status: SUBSCRIPTION_STATUSES.UPCOMING, // future-dated = مفتوح/بيتجمّع
    billingPeriod: BILLING_PERIODS.MONTHLY,
    startDate: paymentStart,
    endDate: paymentEnd,
    subsHours: null,      // يتجمّد عند القفل
    remainingHours: null,
    priceCharged: null,
    student: { connect: { id: studentId } },
  });
}
```

### 14.4 قفل الشهر — استبدال الـ stub `autoRenewSubscriptions`

```js
// finance/subscriptions/subscription.usecase.js
/**
 * فوترة الاستهلاك الشهرية — بينده من الكرون آخر يوم في الشهر.
 * لكل طالب نشط: احسب ساعات الشهر (أو الخطة لو صفر) → جمّد الاشتراك المفتوح (M+1)
 * → ولّد + ابعت الفاتورة → اقفل اشتراك الشهر M. idempotent.
 */
async generateMonthlyUsageInvoices(now = new Date()) {
  const consumption = monthRange(now);              // [1/M, 1/(M+1))  ← الشهر اللي بيقفل
  const paymentStart = consumption.lt;              // 1/(M+1)
  const paymentEnd = endOfMonth(paymentStart);
  const { hourlyRate } = await settingsUsecase.getEffective();

  const usageByStudent = await subscriptionRepo.sumUsageHoursByStudent(consumption);
  const activeStudents = await subscriptionRepo.listActiveStudentsWithPlan(now);

  let invoiced = 0;
  let skipped = 0;

  for (const { studentId, planHours } of activeStudents) {
    const usageHours = usageByStudent.get(studentId) ?? 0;
    const subsHours = usageHours > 0 ? usageHours : planHours;

    // طالب من غير حصص ومن غير خطة → يتخطّى (قرار مفتوح §12).
    if (!subsHours || subsHours <= 0) {
      skipped += 1;
      continue;
    }

    const priceCharged = priceFromHours(subsHours, Number(hourlyRate));

    const sub = await prisma.$transaction(async (tx) => {
      // لاقي/اعمل الاشتراك المفتوح (M+1) — الحالة صفر-حصص ممكن يكون لسه متعملش.
      let open = await subscriptionRepo.findOpenUsageSubscription({
        studentId,
        paymentStart,
        client: tx,
      });
      if (!open) {
        open = await subscriptionRepo.createSubscription(
          {
            origin: SUBSCRIPTION_ORIGINS.USAGE,
            status: SUBSCRIPTION_STATUSES.PENDING,
            billingPeriod: BILLING_PERIODS.MONTHLY,
            startDate: paymentStart,
            endDate: paymentEnd,
            student: { connect: { id: studentId } },
          },
          tx,
        );
      }
      // freeze: اكتب الرقم النهائي + السعر + حوّل PENDING.
      return subscriptionRepo.updateSubscription(
        open.id,
        {
          subsHours,
          remainingHours: subsHours,
          priceCharged,
          status: SUBSCRIPTION_STATUSES.PENDING,
        },
        tx,
      );
    });

    await this.ensureInvoice(sub);                          // موجودة
    await invoiceUsecase.sendForSubscription?.(sub.id);     // اختياري: أوتو-send
    invoiced += 1;
  }

  return { invoiced, skipped };
}
```

والكرون يتحدّث بس ليندَه الاسم الجديد — `subscriptionScheduler.js`:

```js
subscriptionUsecase.generateMonthlyUsageInvoices(now).catch((err) => { ... });
```

### 14.5 حارس التعايش في `prepareForNewSubscription`

```js
// المسار المانيوال لازم يتجاهل اشتراكات USAGE (ماياخدش مكانها ولا يحذفها).
async prepareForNewSubscription(studentId, tx) {
  const activeIds = await this.getCurrentlySubscribedStudentIds([studentId]);
  if (activeIds.has(studentId)) {
    throw new AppError({ statusCode: 409, code: subscriptionMessagesCodes.SUBSCRIPTION_STILL_ACTIVE, ... });
  }
  const pendings = await subscriptionRepo.findPendingSubscriptionsByStudent({ studentId });
  for (const p of pendings) {
    if (p.origin === SUBSCRIPTION_ORIGINS.USAGE) continue; // ← جديد: ماتحذفش فواتير الاستهلاك
    if (p.couponId) await couponRepo.decrementCouponRedemption(p.couponId, tx);
    await subscriptionRepo.deleteSubscription({ id: p.id, client: tx });
  }
}
```

> `findPendingSubscriptionsByStudent` لازم يضيف `origin` للـ `select`.
> وبالمثل `activeSubscriptionWhere`/`getCurrentlySubscribedStudentIds`: اشتراك USAGE مجمّد (PENDING، تاريخه مستقبلي) مش هيتحسب ACTIVE — فمفيش تعارض مع "اشتراك ACTIVE واحد".

### 14.6 العرض الحي — `GET /subscriptions/:id/usage-preview`

```js
// usecase: المجموع الحي لاشتراك USAGE مفتوح (derived، من غير freeze).
async usagePreview({ authUser, id }) {
  const sub = await subscriptionRepo.getById(id);
  if (!sub || sub.origin !== SUBSCRIPTION_ORIGINS.USAGE) {
    throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
  }
  await this.assertCanViewSubscription(authUser, sub); // object-scope زي باقي المسارات

  // شهر الاستهلاك = الشهر اللي قبل شهر دفع الاشتراك (startDate).
  const consumption = monthRange(previousMonth(sub.startDate));
  const hoursMap = await subscriptionRepo.sumUsageHoursByStudent(consumption);
  const usageHours = hoursMap.get(sub.studentId) ?? 0;
  const { hourlyRate } = await settingsUsecase.getEffective();

  return {
    usageHours,
    projectedPrice: priceFromHours(usageHours, Number(hourlyRate)),
    currency: sub.currency,
    frozen: sub.status !== SUBSCRIPTION_STATUSES.UPCOMING,
  };
}
```

```js
// route (guarded زي باقي المسارات):
router.get("/:id/usage-preview", authMiddleware.requireAuth,
  requireAnyPermission([PERMISSIONS.SUBSCRIPTION.READ, PERMISSIONS.SUBSCRIPTION.REQUEST]),
  subscriptionController.usagePreview);
```

### 14.7 هيلبرز التواريخ (utility)

```js
// shared/utility/dates.js — UTC-safe، متسق مع parseMonthRange في sessionLog.repo.
function monthRange(date) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth();
  return { gte: new Date(Date.UTC(y, m, 1)), lt: new Date(Date.UTC(y, m + 1, 1)) };
}
function firstOfNextMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}
function endOfMonth(firstOfMonth) {
  return new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0, 23, 59, 59));
}
function previousMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
}
```

---

## 15. الواجهة الأمامية / Frontend

### 15.1 التحوّل الجوهري / The core UI shift

**عربي:** النظام القديم كان بيفترض **اشتراك واحد نشط لكل طفل**، فكل الكروت والملخّصات بتلخّص الطفل في `activeSubscription` واحد + `latestSubscriptionId` واحد. الموديل الجديد بيدّي الطفل **مجموعة اشتراكات دايماً**:
- **الشهر الحالي** (ACTIVE، بيتدفع) —
- **الشهر القادم** (USAGE + UPCOMING = "بيتجمّع"، عدّاد حي) —
- **تاريخ** (EXPIRED/مدفوع).

فالمطلوب frontend: نبطّل الـ "single-sub collapse" في الأماكن دي، ونعرض الاتنين (الحالي + الجاي بيتجمّع) صراحةً، والتاريخ ورا "عرض الكل".

**EN:** Move every parent/teacher summary from a single-sub scalar (`activeSubscription`, `latestSubscriptionId`, `subscriptionState`) to a **collection view**: show the current (ACTIVE) sub + the accumulating next-month (USAGE/UPCOMING) sub side-by-side, with history behind a "view all". The standalone/embedded **SubscriptionsPage list is already multi-sub-ready** — reuse it for history.

> **قائمة الأماكن اللي بتفترض اشتراك واحد** (كلها لازم تتغيّر): `parentOverview/ChildCard.jsx` (الأثقل)، `ParentOverview.jsx:49`، `children/ChildrenPage.jsx:57-68`، `userDetail/UserDetailPage.jsx:154-174`، `userDetail/ParentChildrenTab.jsx:54-61`، `StudentOverview.jsx` + `StudentHero.jsx`، وأعلام الـ gating اللي بتقرا `user.hasActiveSubscription`.

### 15.2 هيلبر مشترك موحّد + Chip مشترك / Shared view-resolver + chip

حالياً **مفيش StatusChip مشترك** — كل سطح بيعمل inline لـ `<Chip color={STATUS_COLOR[...]} .../>`. بما إننا بنضيف مفهوم بصري جديد ("بيتجمّع/open")، بنعمل **مصدر واحد** للمنطق ده:

```js
// web/src/features/subscriptions/config/subscriptionView.js
import { SUBSCRIPTION_ORIGINS } from "@aya/shared";

/**
 * يحوّل (origin, status) لعرض بصري موحّد يستعمله كل سطح (كروت/chips/CTAs).
 * phase: accumulating | awaitingPayment | active | ended
 */
export function resolveSubscriptionView(sub) {
  const isUsage = sub.origin === SUBSCRIPTION_ORIGINS.USAGE;

  if (isUsage && sub.status === "UPCOMING") {
    return { kind: "usage", phase: "accumulating", color: "info", isOpen: true };
  }
  if (sub.status === "PENDING") {
    return { kind: isUsage ? "usage" : "manual", phase: "awaitingPayment", color: "warning" };
  }
  if (sub.status === "ACTIVE") {
    return { kind: isUsage ? "usage" : "manual", phase: "active", color: "success" };
  }
  return { kind: isUsage ? "usage" : "manual", phase: "ended", color: "default" };
}
```

```jsx
// web/src/shared/components/SubscriptionStatusChip.jsx
import { Chip } from "@mui/material";
import { resolveSubscriptionView } from "@/features/subscriptions/config/subscriptionView";

// txt = من useSubscriptionsText()؛ المفاتيح الجديدة في §15.8
export default function SubscriptionStatusChip({ sub, txt, size = "small" }) {
  const view = resolveSubscriptionView(sub);
  return <Chip size={size} color={view.color} label={txt.phase[view.phase]} variant="outlined" />;
}
```

### 15.3 كارت العدّاد الحي / Live usage meter (open USAGE sub)

كومبوننت جديد بيقرا `GET /subscriptions/:id/usage-preview` (§14.6) ويعرض "هتدفع كام الشهر الجاي" وهو بيكبر:

```jsx
// web/src/features/subscriptionDetail/components/UsageMeterCard.jsx
import { Card, CardContent, Typography, Stack, Skeleton } from "@mui/material";
import { useRequest } from "@/hooks/request/useRequest";
import { formatMoney, formatHours } from "@/shared/lib/money";
import { SUBSCRIPTIONS_URL } from "@/features/subscriptions/config/constant";

export default function UsageMeterCard({ subscriptionId, txt }) {
  const { data, isLoading } = useRequest({
    url: `${SUBSCRIPTIONS_URL}/${subscriptionId}/usage-preview`,
    method: "get",
    autoFetch: true,
  });

  if (isLoading) return <Skeleton variant="rounded" height={140} />;

  return (
    <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
      <CardContent>
        <Typography variant="overline" color="info.main">
          {txt.accumulatingTitle /* "فاتورة الشهر القادم (بتتجمّع)" */}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h4">{formatHours(data?.usageHours ?? 0)}</Typography>
          <Typography variant="h6" color="text.secondary">
            ≈ {formatMoney(data?.projectedPrice ?? 0, data?.currency)}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {data?.frozen ? txt.frozenHint : txt.liveHint /* "بيتحدّث مع كل حصة" */}
        </Typography>
      </CardContent>
    </Card>
  );
}
```

### 15.4 كارت الطفل لولي الأمر — من scalar لـ collection / ChildCard redesign

المطلوب: بدل ما يلخّص الطفل في حالة واحدة، يعرض **صفّين**: الحالي + الجاي (بيتجمّع)، و CTA للتاريخ.

```jsx
// web/src/features/dashboard/components/parentOverview/ChildCard.jsx  (المفهوم الجديد)
// child.subscriptions = [] مرتّبة؛ الـ backend يرجّع current + open + عدد التاريخ.
const current = child.subscriptions.find((s) => s.status === "ACTIVE");
const open = child.subscriptions.find(
  (s) => s.origin === "USAGE" && s.status === "UPCOMING",
);

return (
  <Card>
    <CardContent>
      <Typography variant="h6">{child.name}</Typography>

      {/* الشهر الحالي */}
      {current ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <SubscriptionStatusChip sub={current} txt={txt} />
          <Typography variant="body2">
            {txt.remainingHours}: {formatHours(current.remainingHours)}
          </Typography>
        </Stack>
      ) : (
        <Chip size="small" label={txt.noCurrent} />
      )}

      {/* الشهر القادم — العدّاد الحي */}
      {open && <UsageMeterCard subscriptionId={open.id} txt={txt} />}

      <Button component={Link} href={`/dashboard/subscriptions?studentId=${child.id}`}>
        {txt.viewAll /* "كل الاشتراكات" */}
      </Button>
    </CardContent>
  </Card>
);
```

> `dashboard/parent` (الـ backend endpoint، `getParentDashboard`) لازم يرجّع لكل طفل `subscriptions: [current, open, ...]` بدل `activeSubscription`/`subscriptionState`/`latestSubscriptionId` المفردة. نفس التعديل بيصلّح `ParentOverview.jsx:49` (`activeSubs = children.filter(c => c.subscriptions.some(s => s.status === "ACTIVE")).length`).

### 15.5 قائمة الاشتراكات — عمود origin + منطق renew / Subscriptions list

القائمة **جاهزة أصلاً للـ multi-sub** (بتعرض كل اشتراكات الطالب). التعديلات:

```js
// features/subscriptions/config/subscriptionsColumns.js — عمود جديد للنوع
{
  field: "origin",
  headerName: txt.origin,
  renderCell: ({ row }) => (
    <Chip size="small" variant="outlined"
      label={row.origin === "USAGE" ? txt.originUsage : txt.originManual} />
  ),
},
// وعمود الحالة يستعمل الـ chip المشترك بدل الـ inline:
{ field: "status", renderCell: ({ row }) => <SubscriptionStatusChip sub={row} txt={txt} /> },
```

```js
// subscriptionsColumns.js — الأكشنز: اشتراك USAGE مش بيتعمله renew يدوي (النظام بيولّده)
const isUsage = row.origin === "USAGE";
const showRenew = can.renew && !isUsage &&
  (row.status === "EXPIRED" || row.status === "CANCELLED");
const showEditHours = can.editHours && (!isUsage || row.status !== "UPCOMING");
// UPCOMING/USAGE = بيتجمّع → ساعاته derived، التعديل اليدوي يتفتح بس بعد القفل (freeze)
```

فلتر النوع في `subscriptionsFilters.js`:

```js
{ name: "origin", label: txt.origin, type: "select",
  options: [
    { value: "MANUAL", label: txt.originManual },
    { value: "USAGE", label: txt.originUsage },
  ] },
```

### 15.6 SubscriptionActions للـ USAGE / Actions bar

اشتراك USAGE **مُدار بالنظام** — بنخفي renew/changePlan ونوضّح ده:

```jsx
// subscriptionDetail/components/SubscriptionActions.jsx
const isUsage = subscription.origin === "USAGE";
const isAccumulating = isUsage && status === "UPCOMING";

// renew/changePlan للمانيوال بس:
const showRenew = !isUsage && subEnded;
const showChangePlan = !isUsage && status !== "ACTIVE" && invoiceUnpaidOrNone;

// شريط توضيحي بدل الأكشنز وهو بيتجمّع:
{isAccumulating && (
  <Alert severity="info">{txt.usageManagedHint /* "بيتحسب تلقائياً من الحصص، ويتقفل آخر الشهر" */}</Alert>
)}
```

وفي صفحة التفاصيل: لو الاشتراك USAGE مفتوح، نعرض `UsageMeterCard` جنب/بدل `SubscriptionCard`:

```jsx
// subscriptionDetail/pages/SubscriptionDetailPage.jsx
{resolveSubscriptionView(subscription).isOpen
  ? <UsageMeterCard subscriptionId={subscription.id} txt={txt} />
  : <SubscriptionCard subscription={subscription} invoice={invoice} />}
```

### 15.7 صفحات التفاصيل / Detail pages (userDetail, ChildrenPage, ParentChildrenTab)

- **`userDetail/UserDetailPage.jsx`** — تاب الاشتراكات (`SubscriptionsPage embedded studentId`) **جاهز، بيعرض المتعدد**. بس نصلّح قفل الطفل غير النشط (`:154-174`) عشان يبطّل يعتمد على `subscriptionState`/`latestSubscriptionId` المفردة → يبص على وجود `ACTIVE` في المجموعة.
- **`children/ChildrenPage.jsx:57-68`** — نشيل الـ "best sub per child" rank collapse؛ الكارت يعرض current + open (نفس مفهوم §15.4).
- **`userDetail/ParentChildrenTab.jsx:54-61`** — عمود الاشتراك من binary (subscribed/notSubscribed) → chip الحالة الحالية + إشارة للعدّاد الجاي.

```jsx
// ParentChildrenTab.jsx — عمود الاشتراك الجديد
{
  field: "subscription",
  renderCell: ({ row }) => {
    const current = row.subscriptions?.find((s) => s.status === "ACTIVE");
    return current
      ? <SubscriptionStatusChip sub={current} txt={txt} />
      : <Chip size="small" label={txt.noCurrent} />;
  },
},
```

### 15.8 i18n — مفاتيح جديدة (ar/en) / New labels

تنضاف لملفات الـ text الموجودة (`subscriptionsText.js`, `subscriptionDetailText.js`, `dashboardText.js`) — كل مفتاح **لازم ar + en** (عرف [[feedback-message-codes-bilingual]]):

```js
// ar
phase: {
  accumulating: "بتتجمّع",
  awaitingPayment: "بانتظار الدفع",
  active: "نشط",
  ended: "منتهي",
},
origin: "النوع",
originUsage: "حسب الحصص",
originManual: "يدوي",
accumulatingTitle: "فاتورة الشهر القادم (بتتجمّع)",
liveHint: "بيتحدّث مع كل حصة",
frozenHint: "اتجمّد — جاهز للفاتورة",
usageManagedHint: "بيتحسب تلقائياً من الحصص، ويتقفل آخر الشهر",
remainingHours: "ساعات متبقية",
noCurrent: "لا يوجد اشتراك حالي",
viewAll: "كل الاشتراكات",
```

```js
// en
phase: { accumulating: "Accumulating", awaitingPayment: "Awaiting payment", active: "Active", ended: "Ended" },
origin: "Type", originUsage: "Usage-based", originManual: "Manual",
accumulatingTitle: "Next month's bill (building up)",
liveHint: "Updates with every session",
frozenHint: "Frozen — ready to invoice",
usageManagedHint: "Auto-computed from sessions; closes at month end",
remainingHours: "Remaining hours", noCurrent: "No current subscription", viewAll: "All subscriptions",
```

### 15.9 ملفات الواجهة المتأثرة / Affected frontend files

- **جديد:** `features/subscriptions/config/subscriptionView.js`، `shared/components/SubscriptionStatusChip.jsx`، `subscriptionDetail/components/UsageMeterCard.jsx`.
- **تعديل:** `parentOverview/ChildCard.jsx` (الأثقل)، `ParentOverview.jsx`، `children/ChildrenPage.jsx`، `userDetail/UserDetailPage.jsx` + `ParentChildrenTab.jsx`، `StudentOverview.jsx` + `StudentHero.jsx`، `subscriptions/config/{subscriptionsColumns,subscriptionsFilters,subscriptionsText,constant}.js`، `subscriptionDetail/components/SubscriptionActions.jsx` + `pages/SubscriptionDetailPage.jsx` + text.
- **backend مصاحب:** `getParentDashboard` + children/parent DTOs يرجّعوا `subscriptions: []` (current + open + history-count) بدل الحقول المفردة (`activeSubscription`/`subscriptionState`/`latestSubscriptionId`).
