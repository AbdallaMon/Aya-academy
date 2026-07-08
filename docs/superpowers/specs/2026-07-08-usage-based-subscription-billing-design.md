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
