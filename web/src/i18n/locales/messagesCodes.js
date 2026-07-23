// messagesCodes — the code → localized string table consumed by the toast
// resolver (see useRequest). The resolver tries, in order:
//   table[translationKey][code] -> table[code] -> table.generalMessages[code] -> raw code
//
// Keys are grouped by the @aya/shared `messagesNames` namespace values
// (e.g. "auth-messages", "general-messages", "user-messages").
//
// EVERY message code thrown by the backend must have an entry in BOTH `ar`
// and `en` below, so the user never sees a raw SCREAMING_SNAKE_CASE code.

import {
  authMessagesCodes,
  generalMessagesCodes,
  userMessagesCodes,
  backupMessagesCodes,
  planMessagesCodes,
  couponMessagesCodes,
  subscriptionMessagesCodes,
  gameMessagesCodes,
  reportMessagesCodes,
  sessionLogMessagesCodes,
  quizMessagesCodes,
  certificateMessagesCodes,
  rewardMessagesCodes,
  dashboardMessagesCodes,
  notificationMessagesCodes,
  badgeMessagesCodes,
  pointMessagesCodes,
  attachmentMessagesCodes,
  invoiceMessagesCodes,
  paymentTemplateMessagesCodes,
  settingsMessagesCodes,
  whiteboardMessagesCodes,
  messagesNames,
} from '@aya/shared';

const ar = {
  // ── general-messages ──────────────────────────────────────────────────────
  [messagesNames.generalMessages]: {
    [generalMessagesCodes.OK]: 'تمت العملية بنجاح',
    [generalMessagesCodes.CREATED]: 'تم الإنشاء بنجاح',
    [generalMessagesCodes.UPDATED]: 'تم التحديث بنجاح',
    [generalMessagesCodes.DELETED]: 'تم الحذف بنجاح',
    [generalMessagesCodes.NOT_FOUND]: 'العنصر غير موجود',
    [generalMessagesCodes.BAD_REQUEST]: 'طلب غير صالح',
    [generalMessagesCodes.VALIDATION_ERROR]: 'بيانات غير صحيحة',
    [generalMessagesCodes.UNAUTHORIZED]: 'يجب تسجيل الدخول',
    [generalMessagesCodes.FORBIDDEN]: 'ليس لديك صلاحية للقيام بهذا الإجراء',
    [generalMessagesCodes.CONFLICT]: 'تعارض في البيانات',
    [generalMessagesCodes.TOO_MANY_REQUESTS]: 'محاولات كثيرة جداً، حاول لاحقاً',
    [generalMessagesCodes.INTERNAL_SERVER_ERROR]: 'حدث خطأ في الخادم',
    [generalMessagesCodes.UNEXPECTED_ERROR]: 'حدث خطأ غير متوقع',
    [generalMessagesCodes.FILE_TOO_LARGE]: 'حجم الملف كبير جداً',
    [generalMessagesCodes.TOO_MANY_FILES]: 'عدد الملفات كبير جداً',
    [generalMessagesCodes.FILE_UPLOAD_ERROR]: 'فشل رفع الملف',
  },
  // ── auth-messages ─────────────────────────────────────────────────────────
  [messagesNames.authMessages]: {
    [authMessagesCodes.REGISTERED_SUCCESS]: 'تم إنشاء الحساب بنجاح',
    [authMessagesCodes.ENROLLED_SUCCESS]:
      'تم التسجيل بنجاح، يمكنك تسجيل الدخول الآن',
    [authMessagesCodes.LOGIN_SUCCESS]: 'تم تسجيل الدخول بنجاح',
    [authMessagesCodes.LOGOUT_SUCCESS]: 'تم تسجيل الخروج',
    [authMessagesCodes.TOKEN_REFRESHED]: 'تم تحديث الجلسة',
    [authMessagesCodes.INVALID_CREDENTIALS]:
      'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    [authMessagesCodes.EMAIL_ALREADY_EXISTS]: 'البريد الإلكتروني مستخدم بالفعل',
    [authMessagesCodes.USERNAME_ALREADY_EXISTS]: 'اسم المستخدم مستخدم بالفعل',
    [authMessagesCodes.ACCOUNT_INACTIVE]: 'الحساب غير مفعّل',
    [authMessagesCodes.UNAUTHORIZED]: 'انتهت الجلسة، يرجى تسجيل الدخول',
    [authMessagesCodes.FORBIDDEN]: 'ليس لديك صلاحية',
    [authMessagesCodes.TOKEN_EXPIRED]: 'انتهت صلاحية الجلسة',
    [authMessagesCodes.INVALID_TOKEN]: 'جلسة غير صالحة',
    [authMessagesCodes.NAME_REQUIRED]: 'الاسم مطلوب',
    [authMessagesCodes.EMAIL_REQUIRED]: 'البريد الإلكتروني مطلوب',
    [authMessagesCodes.INVALID_EMAIL]: 'بريد إلكتروني غير صالح',
    [authMessagesCodes.PASSWORD_REQUIRED]: 'كلمة المرور مطلوبة',
    [authMessagesCodes.PASSWORD_TOO_SHORT]: 'كلمة المرور قصيرة جداً',
    [authMessagesCodes.PHONE_REQUIRED]: 'رقم الهاتف مطلوب',
    [authMessagesCodes.INVALID_PHONE]: 'رقم هاتف غير صالح',
    [authMessagesCodes.RESET_EMAIL_SENT]:
      'إذا كان لديك حساب، فقد أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك',
    [authMessagesCodes.PASSWORD_RESET_SUCCESS]:
      'تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن',
    [authMessagesCodes.RESET_TOKEN_INVALID]:
      'رابط إعادة التعيين غير صالح أو منتهي الصلاحية',
    [authMessagesCodes.RESET_TOKEN_REQUIRED]: 'رمز إعادة التعيين مطلوب',
    [authMessagesCodes.RESET_RATE_LIMITED]:
      'محاولات كثيرة، برجاء المحاولة بعد قليل',
    [authMessagesCodes.BACK_TO_LOGIN]: 'العودة لتسجيل الدخول',
    [authMessagesCodes.BACK_TO_DASHBOARD]: 'العودة للوحة التحكم',
    [authMessagesCodes.GO_TO_LOGIN]: 'الذهاب لتسجيل الدخول',
    [authMessagesCodes.CHILD_EMAIL_DUPLICATE]:
      'هناك بريد إلكتروني مكرر بين الأبناء في نفس الطلب',
    [authMessagesCodes.CHILD_EMAIL_EXISTS]:
      'البريد الإلكتروني لأحد الأبناء مستخدم بالفعل',
    [authMessagesCodes.NO_CHILDREN]: 'يجب إضافة ابن واحد على الأقل',
    [authMessagesCodes.PLAN_REQUIRED]: 'يجب اختيار خطة لكل ابن',
    [authMessagesCodes.COUPON_INVALID_FOR_PLAN]:
      'الكوبون غير صالح للخطة أو الدورة المختارة',
  },
  // ── user-messages ─────────────────────────────────────────────────────────
  [messagesNames.userMessages]: {
    [userMessagesCodes.USER_NOT_FOUND]: 'المستخدم غير موجود',
    [userMessagesCodes.USER_NAME_REQUIRED]: 'اسم المستخدم مطلوب',
    [userMessagesCodes.USER_EMAIL_REQUIRED]: 'البريد الإلكتروني مطلوب',
    [userMessagesCodes.INVALID_EMAIL]: 'بريد إلكتروني غير صالح',
    [userMessagesCodes.USER_ROLE_REQUIRED]: 'الدور مطلوب',
    [userMessagesCodes.USER_PASSWORD_REQUIRED]: 'كلمة المرور مطلوبة',
    [userMessagesCodes.EMAIL_ALREADY_EXISTS]: 'البريد الإلكتروني مستخدم بالفعل',
    [userMessagesCodes.CANNOT_ACCESS_USER]: 'لا يمكنك الوصول لهذا المستخدم',
    [userMessagesCodes.CANNOT_MODIFY_USER]: 'لا يمكنك تعديل هذا المستخدم',
    [userMessagesCodes.CANNOT_LINK_STUDENT]: 'لا يمكن ربط الطالب',
    [userMessagesCodes.STUDENT_ALREADY_LINKED]: 'الطالب مرتبط بالفعل',
    [userMessagesCodes.PARENT_REQUIRED]: 'ولي الأمر مطلوب',
    [userMessagesCodes.STUDENT_REQUIRED]: 'الطالب مطلوب',
    [userMessagesCodes.PARENT_NOT_FOUND]: 'ولي الأمر غير موجود',
    [userMessagesCodes.CANNOT_VIEW_CHILDREN]:
      'لا يمكنك عرض أبناء ولي الأمر هذا',
    [userMessagesCodes.USER_CHILDREN_FETCHED]: 'تم جلب الأبناء',
    [userMessagesCodes.INVALID_STUDENT_LEVEL]: 'المستوى غير صالح',
    [userMessagesCodes.NOT_A_STUDENT]: 'هذا المستخدم ليس طالبًا',
    [userMessagesCodes.LEVEL_UPDATED]: 'تم تحديث مستوى الطالب',
    [userMessagesCodes.CANNOT_BAN_SELF]: 'لا يمكنك حظر نفسك',
    [userMessagesCodes.CANNOT_BAN_ADMIN]: 'لا يمكن حظر حساب مسؤول',
    [userMessagesCodes.USER_BANNED]: 'تم حظر الحساب',
    [userMessagesCodes.USER_UNBANNED]: 'تم رفع الحظر عن الحساب',
  },
  // ── plan-messages ─────────────────────────────────────────────────────────
  [messagesNames.planMessages]: {
    [planMessagesCodes.PLAN_NOT_FOUND]: 'الباقة غير موجودة',
    [planMessagesCodes.PLAN_TITLE_REQUIRED]: 'عنوان الباقة مطلوب',
    [planMessagesCodes.PLAN_HOURS_REQUIRED]: 'عدد الساعات مطلوب',
    [planMessagesCodes.PLAN_RATE_REQUIRED]: 'سعر الباقة مطلوب',
    [planMessagesCodes.PLAN_BILLING_PERIOD_REQUIRED]: 'فترة الفوترة مطلوبة',
    [planMessagesCodes.DISCOUNT_NOT_FOUND]: 'الخصم غير موجود',
    [planMessagesCodes.DISCOUNT_TYPE_REQUIRED]: 'نوع الخصم مطلوب',
    [planMessagesCodes.DISCOUNT_VALUE_REQUIRED]: 'قيمة الخصم مطلوبة',
    [planMessagesCodes.DISCOUNT_CONSTRAINT_REQUIRED]: 'شرط الخصم مطلوب',
  },
  // ── coupon-messages ───────────────────────────────────────────────────────
  [messagesNames.couponMessages]: {
    [couponMessagesCodes.COUPON_NOT_FOUND]: 'الكوبون غير موجود',
    [couponMessagesCodes.COUPON_CODE_REQUIRED]: 'كود الكوبون مطلوب',
    [couponMessagesCodes.COUPON_INVALID]: 'كوبون غير صالح',
    [couponMessagesCodes.COUPON_EXPIRED]: 'انتهت صلاحية الكوبون',
    [couponMessagesCodes.COUPON_NOT_ACTIVE_YET]: 'الكوبون لم يبدأ بعد',
    [couponMessagesCodes.COUPON_USAGE_LIMIT_REACHED]:
      'انتهى عدد الاستخدامات المتاح لهذا الكوبون',
    [couponMessagesCodes.COUPON_ALREADY_USED_BY_STUDENT]:
      'تم استخدام هذا الكوبون لهذا الطالب من قبل، ولا يمكن استخدامه مرة أخرى',
    [couponMessagesCodes.COUPON_NOT_APPLICABLE]: 'لا يمكن تطبيق هذا الكوبون',
    [couponMessagesCodes.COUPON_CODE_TAKEN]: 'كود الكوبون مستخدم بالفعل',
    [couponMessagesCodes.COUPON_MAX_BELOW_USAGE]:
      'أقصى عدد للاستخدامات لا يمكن أن يقل عن عدد مرات الاستخدام الحالية',
  },
  // ── subscription-messages ─────────────────────────────────────────────────
  [messagesNames.subscriptionMessages]: {
    [subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND]: 'الاشتراك غير موجود',
    [subscriptionMessagesCodes.STUDENT_REQUIRED]: 'الطالب مطلوب',
    [subscriptionMessagesCodes.INVALID_DATE_RANGE]: 'نطاق التاريخ غير صالح',
    [subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION]:
      'لا يمكنك الوصول لهذا الاشتراك',
    [subscriptionMessagesCodes.PLAN_REQUIRED]: 'الباقة مطلوبة',
    [subscriptionMessagesCodes.PLAN_NOT_FOUND]: 'الباقة غير موجودة',
    [subscriptionMessagesCodes.STUDENT_NOT_LINKED]: 'الطالب غير مرتبط بحسابك',
    [subscriptionMessagesCodes.NOT_PENDING]: 'الاشتراك ليس قيد الانتظار',
    [subscriptionMessagesCodes.COUPON_INVALID]: 'كوبون غير صالح',
    [subscriptionMessagesCodes.CANNOT_CANCEL]: 'لا يمكن إلغاء هذا الاشتراك',
    [subscriptionMessagesCodes.SUBSCRIPTION_CANCELLED]:
      'تم إلغاء الاشتراك وفاتورته غير المدفوعة. إضافة حصة للشهر السابق ستنشئ اشتراكاً جديداً للشهر التالي.',
    [subscriptionMessagesCodes.SUBSCRIPTION_STILL_ACTIVE]:
      'يوجد اشتراك مفعّل حالياً — يجب إلغاء تفعيله أولاً قبل إنشاء اشتراك جديد',
    [subscriptionMessagesCodes.SUBSCRIPTION_RENEWED]: 'تم تجديد الاشتراك',
    [subscriptionMessagesCodes.PLAN_CHANGED]: 'تم تغيير الخطة',
    [subscriptionMessagesCodes.SUBSCRIPTION_ACTIVATED]: 'تم تفعيل الاشتراك',
    [subscriptionMessagesCodes.CANNOT_CHANGE_PLAN_PAID]:
      'لا يمكن تغيير الخطة بعد دفع الفاتورة',
    [subscriptionMessagesCodes.USAGE_SUBSCRIPTION_EXISTS]:
      'يوجد اشتراك بالاستخدام لهذا الطالب في هذا الشهر بالفعل',
    [subscriptionMessagesCodes.ACTIVATION_TOO_EARLY]:
      'لا يمكن تفعيل الاشتراك قبل بداية شهره (يفتح التفعيل من آخر الشهر السابق)',
    [subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE]:
      'انتهى الاشتراك أو غير مفعّل',
    [subscriptionMessagesCodes.NO_EDITABLE_FIELDS]:
      'هذا الحقل لا يمكن تعديله من التعديل العام. استخدم الإجراء المخصص له.',
    [subscriptionMessagesCodes.REMAINING_EXCEEDS_TOTAL]:
      'الدقائق المتبقية لا يمكن أن تتجاوز إجمالي دقائق الاشتراك',
    [subscriptionMessagesCodes.SUBSCRIPTION_UPDATED]:
      'تم تحديث بيانات الاشتراك',
    [subscriptionMessagesCodes.SUBSCRIPTION_CREATED]:
      'تم إنشاء الاشتراك والفاتورة بنجاح',
    [subscriptionMessagesCodes.SUBSCRIPTION_REJECTED]:
      'تم رفض الاشتراك وإلغاء فاتورته غير المدفوعة',
    [subscriptionMessagesCodes.COUPON_UPDATED]:
      'تم تحديث الكوبون والسعر والفاتورة',
    [subscriptionMessagesCodes.USAGE_SUBSCRIPTION_SYNCED]:
      'تم تحديث اشتراك الشهر القادم من الحصص',
  },
  // ── game-messages ─────────────────────────────────────────────────────────
  [messagesNames.gameMessages]: {
    [gameMessagesCodes.GAME_NOT_FOUND]: 'اللعبة غير موجودة',
    [gameMessagesCodes.GAME_NOT_ACTIVE]: 'اللعبة غير مفعّلة',
    [gameMessagesCodes.FREE_GAME_NOT_FOUND]: 'لا توجد لعبة مجانية محددة حاليًا',
    [gameMessagesCodes.FREE_GAME_UPDATED]: 'تم تحديد اللعبة المجانية بنجاح',
    [gameMessagesCodes.FREE_GAME_RATE_LIMITED]:
      'لقد جرّبت اللعبة كثيرًا! انتظر قليلًا ثم عُد للّعب مرة أخرى 😊',
    [gameMessagesCodes.CANNOT_ACCESS_GAME]: 'لا يمكنك الوصول لهذه اللعبة',
    [gameMessagesCodes.STUDENT_IDS_REQUIRED]: 'يجب تحديد الطلاب',
    [gameMessagesCodes.STUDENT_ID_INVALID]: 'معرّف الطالب غير صالح',
    [gameMessagesCodes.ATTEMPT_CORRECT_COUNT_INVALID]:
      'عدد الإجابات الصحيحة غير صالح',
    [gameMessagesCodes.ATTEMPT_TOTAL_QUESTIONS_INVALID]:
      'إجمالي عدد الأسئلة غير صالح',
    [gameMessagesCodes.ONLY_STUDENT_CAN_ATTEMPT]: 'الطالب فقط يمكنه اللعب',
    [gameMessagesCodes.ASSIGNMENT_NOT_FOUND]: 'التكليف غير موجود',
    [gameMessagesCodes.BADGE_ID_INVALID]: 'معرّف الوسام غير صالح',
    [gameMessagesCodes.GAME_BADGE_LINKED]: 'تم ربط الوسام باللعبة',
    [gameMessagesCodes.GAME_BADGE_UNLINKED]: 'تم إلغاء ربط الوسام باللعبة',
  },
  // ── report-messages ───────────────────────────────────────────────────────
  [messagesNames.reportMessages]: {
    [reportMessagesCodes.REPORT_NOT_FOUND]: 'التقرير غير موجود',
    [reportMessagesCodes.REPORT_TITLE_REQUIRED]: 'عنوان التقرير مطلوب',
    [reportMessagesCodes.REPORT_BODY_REQUIRED]: 'محتوى التقرير مطلوب',
    [reportMessagesCodes.STUDENTS_REQUIRED]: 'يجب تحديد الطلاب',
    [reportMessagesCodes.CANNOT_ACCESS_REPORT]: 'لا يمكنك الوصول لهذا التقرير',
  },

  // ── session-log-messages ──────────────────────────────────────────────────
  [messagesNames.sessionLogMessages]: {
    [sessionLogMessagesCodes.SESSION_LOG_NOT_FOUND]: 'سجل الحصة غير موجود',
    [sessionLogMessagesCodes.STUDENT_REQUIRED]: 'يجب اختيار الطالب',
    [sessionLogMessagesCodes.STUDENT_NOT_FOUND]: 'الطالب غير موجود',
    [sessionLogMessagesCodes.SUBJECTS_REQUIRED]:
      'يجب اختيار مادة دراسية واحدة على الأقل',
    [sessionLogMessagesCodes.INVALID_SUBJECT]: 'مادة دراسية غير صالحة',
    [sessionLogMessagesCodes.DURATION_REQUIRED]: 'عدد ساعات الحصة مطلوب',
    [sessionLogMessagesCodes.DURATION_INVALID]: 'عدد ساعات الحصة غير صالح',
    [sessionLogMessagesCodes.SESSION_DATE_REQUIRED]: 'تاريخ الحصة مطلوب',
    [sessionLogMessagesCodes.ATTENDANCE_INVALID]: 'حالة الحضور غير صالحة',
    [sessionLogMessagesCodes.RATING_INVALID]: 'تقييم غير صالح',
    [sessionLogMessagesCodes.TEACHER_NOT_FOUND]: 'المعلم غير موجود',
    [sessionLogMessagesCodes.NO_ADMIN_AVAILABLE]:
      'لا يوجد معلم متاح لتسجيل الحصة',
    [sessionLogMessagesCodes.CANNOT_ACCESS_SESSION_LOG]:
      'لا يمكنك الوصول لسجل هذه الحصة',
  },
  // ── quiz-messages ─────────────────────────────────────────────────────────
  [messagesNames.quizMessages]: {
    [quizMessagesCodes.CATEGORY_NOT_FOUND]: 'التصنيف غير موجود',
    [quizMessagesCodes.CATEGORY_NAME_REQUIRED]: 'اسم التصنيف مطلوب',
    [quizMessagesCodes.CATEGORY_HAS_QUESTIONS]:
      'لا يمكن حذف تصنيف يحتوي على أسئلة',
    [quizMessagesCodes.QUESTION_NOT_FOUND]: 'السؤال غير موجود',
    [quizMessagesCodes.QUESTION_TEXT_REQUIRED]: 'نص السؤال مطلوب',
    [quizMessagesCodes.QUESTION_OPTIONS_MIN]: 'يجب إضافة خيارين على الأقل',
    [quizMessagesCodes.QUESTION_OPTION_LABEL_REQUIRED]: 'نص الخيار مطلوب',
    [quizMessagesCodes.QUESTION_NEEDS_CORRECT_OPTION]:
      'يجب تحديد إجابة صحيحة واحدة على الأقل',
    [quizMessagesCodes.INVITE_NOT_FOUND]: 'الدعوة غير موجودة',
    [quizMessagesCodes.INVITE_PARENT_REQUIRED]: 'ولي الأمر مطلوب',
    [quizMessagesCodes.INVITE_PARENT_INVALID]: 'ولي الأمر غير صالح',
    [quizMessagesCodes.INVITE_QUESTIONS_REQUIRED]: 'الأسئلة مطلوبة',
    [quizMessagesCodes.INVITE_QUESTIONS_INVALID]: 'الأسئلة غير صالحة',
    [quizMessagesCodes.INVITE_BADGE_INVALID]: 'الوسام غير صالح',
    [quizMessagesCodes.INVITE_EXPIRED]: 'انتهت صلاحية الدعوة',
    [quizMessagesCodes.INVITE_ALREADY_BUILT]:
      'تم إنشاء الاختبار من هذه الدعوة بالفعل',
    [quizMessagesCodes.CANNOT_ACCESS_INVITE]: 'لا يمكنك الوصول لهذه الدعوة',
    [quizMessagesCodes.QUIZ_TITLE_REQUIRED]: 'عنوان الاختبار مطلوب',
    [quizMessagesCodes.QUIZ_PASS_THRESHOLD_INVALID]: 'درجة النجاح غير صالحة',
    [quizMessagesCodes.QUIZ_ITEMS_REQUIRED]: 'أسئلة الاختبار مطلوبة',
    [quizMessagesCodes.QUIZ_ITEM_SOURCE_INVALID]: 'مصدر السؤال غير صالح',
    [quizMessagesCodes.QUIZ_ITEM_NOT_EXPOSED]: 'السؤال غير متاح',
    [quizMessagesCodes.QUIZ_ITEM_OPTIONS_MIN]: 'يجب إضافة خيارين على الأقل',
    [quizMessagesCodes.QUIZ_ITEM_NEEDS_CORRECT_OPTION]:
      'يجب تحديد إجابة صحيحة واحدة على الأقل',
    [quizMessagesCodes.QUIZ_PARTICIPANTS_REQUIRED]: 'المشاركون مطلوبون',
    [quizMessagesCodes.QUIZ_PARTICIPANTS_INVALID]: 'المشاركون غير صالحين',
    [quizMessagesCodes.QUIZ_NOT_FOUND]: 'الاختبار غير موجود',
    [quizMessagesCodes.CANNOT_ACCESS_QUIZ]: 'لا يمكنك الوصول لهذا الاختبار',
    [quizMessagesCodes.QUIZ_NOT_PARTICIPANT]: 'لست مشاركاً في هذا الاختبار',
    [quizMessagesCodes.QUIZ_ANSWERS_REQUIRED]: 'الإجابات مطلوبة',
  },
  // ── certificate-messages ──────────────────────────────────────────────────
  [messagesNames.certificateMessages]: {
    [certificateMessagesCodes.CERTIFICATE_NOT_FOUND]: 'الشهادة غير موجودة',
    [certificateMessagesCodes.CANNOT_ACCESS_CERTIFICATE]:
      'لا يمكنك الوصول لهذه الشهادة',
    [certificateMessagesCodes.CERTIFICATE_STUDENT_NOT_FOUND]:
      'الطالب غير موجود',
    [certificateMessagesCodes.CERTIFICATE_STUDENT_REQUIRED]: 'الطالب مطلوب',
    [certificateMessagesCodes.CERTIFICATE_TITLE_REQUIRED]:
      'عنوان الشهادة مطلوب',
    [certificateMessagesCodes.CERTIFICATE_BADGE_NOT_FOUND]: 'الوسام غير موجود',
    [certificateMessagesCodes.TEMPLATE_NOT_FOUND]: 'القالب غير موجود',
    [certificateMessagesCodes.TEMPLATE_KEY_REQUIRED]: 'مُعرّف القالب مطلوب',
    [certificateMessagesCodes.TEMPLATE_KEY_EXISTS]:
      'مُعرّف القالب مستخدم بالفعل',
    [certificateMessagesCodes.TEMPLATE_NAME_REQUIRED]: 'اسم القالب مطلوب',
  },
  // ── reward-messages ───────────────────────────────────────────────────────
  [messagesNames.rewardMessages]: {
    [rewardMessagesCodes.REWARD_NOT_FOUND]: 'المكافأة غير موجودة',
    [rewardMessagesCodes.CANNOT_ACCESS_REWARD]: 'لا يمكنك الوصول لهذه المكافأة',
    [rewardMessagesCodes.REWARD_ALREADY_CLAIMED]: 'تم استلام المكافأة بالفعل',
  },
  // ── dashboard-messages ────────────────────────────────────────────────────
  [messagesNames.dashboardMessages]: {
    [dashboardMessagesCodes.DASHBOARD_FORBIDDEN]:
      'ليس لديك صلاحية الوصول للوحة التحكم',
    [dashboardMessagesCodes.NOT_A_PARENT]: 'هذا الحساب ليس حساب ولي أمر',
    [dashboardMessagesCodes.NOT_A_STUDENT]: 'هذا الحساب ليس حساب طالب',
  },
  // ── notification-messages ─────────────────────────────────────────────────
  [messagesNames.notificationMessages]: {
    [notificationMessagesCodes.NOTIFICATION_NOT_FOUND]: 'الإشعار غير موجود',
    [notificationMessagesCodes.CANNOT_ACCESS_NOTIFICATION]:
      'لا يمكنك الوصول لهذا الإشعار',
  },
  [messagesNames.badgeMessages]: {
    [badgeMessagesCodes.BADGE_NOT_FOUND]: 'الوسام غير موجود',
    [badgeMessagesCodes.BADGE_NAME_REQUIRED]: 'اسم الوسام مطلوب',
    [badgeMessagesCodes.BADGE_CODE_REQUIRED]: 'كود الوسام مطلوب',
    [badgeMessagesCodes.BADGE_CODE_EXISTS]: 'كود الوسام مستخدم بالفعل',
    [badgeMessagesCodes.INVALID_SCORE]: 'النقاط غير صالحة',
    [badgeMessagesCodes.STUDENT_REQUIRED]: 'الطالب مطلوب',
    [badgeMessagesCodes.NOT_A_STUDENT]: 'هذا المستخدم ليس طالبًا',
    [badgeMessagesCodes.ALREADY_AWARDED]: 'الطالب حاصل على هذا الوسام بالفعل',
    [badgeMessagesCodes.NOT_AWARDED]: 'الطالب لا يملك هذا الوسام',
    [badgeMessagesCodes.BADGE_AWARDED]: 'تم منح الوسام',
    [badgeMessagesCodes.BADGE_REVOKED]: 'تم سحب الوسام',
    [badgeMessagesCodes.CANNOT_ACCESS_BADGE]: 'لا يمكنك الوصول لهذا الوسام',
  },
  [messagesNames.pointMessages]: {
    [pointMessagesCodes.STUDENT_REQUIRED]: 'الطالب مطلوب',
    [pointMessagesCodes.NOT_A_STUDENT]: 'هذا المستخدم ليس طالبًا',
    [pointMessagesCodes.INVALID_AMOUNT]: 'عدد النقاط غير صالح',
    [pointMessagesCodes.CANNOT_ACCESS_POINTS]:
      'لا يمكنك الوصول لنقاط هذا الطالب',
    [pointMessagesCodes.POINTS_GRANTED]: 'تم منح النقاط',
  },
  [messagesNames.attachmentMessages]: {
    [attachmentMessagesCodes.NO_FILE]: 'لم يتم اختيار ملف',
    [attachmentMessagesCodes.FILE_TOO_LARGE]: 'حجم الملف كبير جدًا',
    [attachmentMessagesCodes.UNSUPPORTED_TYPE]: 'نوع الملف غير مدعوم',
    [attachmentMessagesCodes.UPLOAD_FAILED]: 'فشل رفع الملف',
    [attachmentMessagesCodes.ATTACHMENT_NOT_FOUND]: 'الملف غير موجود',
    [attachmentMessagesCodes.CANNOT_SET_AVATAR]: 'لا يمكنك تعيين هذه الصورة',
    [attachmentMessagesCodes.AVATAR_UPDATED]: 'تم تحديث الصورة',
  },
  [messagesNames.invoiceMessages]: {
    [invoiceMessagesCodes.INVOICE_NOT_FOUND]: 'الفاتورة غير موجودة',
    [invoiceMessagesCodes.CANNOT_ACCESS_INVOICE]:
      'لا يمكنك الوصول لهذه الفاتورة',
    [invoiceMessagesCodes.SUBSCRIPTION_NOT_FOUND]: 'الاشتراك غير موجود',
    [invoiceMessagesCodes.SUBSCRIPTION_NOT_PRICED]:
      'الاشتراك لا يحتوي على مبلغ محدد',
    [invoiceMessagesCodes.INVOICE_GENERATED]: 'تم إنشاء الفاتورة',
    [invoiceMessagesCodes.INVOICE_REGENERATED]: 'تم إعادة توليد الفاتورة',
    [invoiceMessagesCodes.INVOICE_REBILLED_AND_SUBSCRIPTION_PAUSED]:
      'تمت إعادة حساب الحصص والفاتورة، وأصبح الاشتراك بانتظار الدفع والتفعيل',
    [invoiceMessagesCodes.INVOICE_UPDATED]: 'تم تحديث الفاتورة',
    [invoiceMessagesCodes.INVALID_STATUS_TRANSITION]:
      'لا يمكن تغيير حالة الفاتورة بهذا الشكل',
    [invoiceMessagesCodes.INVOICE_SENT]: 'تم إرسال الفاتورة',
    [invoiceMessagesCodes.INVOICE_SEND_FAILED]: 'فشل إرسال الفاتورة',
    [invoiceMessagesCodes.NO_PARENT_LINKED]:
      'فشل إرسال الفاتورة: لا يوجد ولي أمر مرتبط بالطالب',
    [invoiceMessagesCodes.CANNOT_SEND_INVOICE]: 'لا تملك صلاحية إرسال الفاتورة',
    [invoiceMessagesCodes.WHATSAPP_NOT_CONFIGURED]: 'إعدادات واتساب غير مكتملة',
  },
  [messagesNames.paymentTemplateMessages]: {
    [paymentTemplateMessagesCodes.PAYMENT_TEMPLATE_UPDATED]:
      'تم حفظ إعدادات قالب الفاتورة',
  },
  [messagesNames.settingsMessages]: {
    [settingsMessagesCodes.SETTINGS_UPDATED]: 'تم حفظ الإعدادات',
    [settingsMessagesCodes.INVALID_CURRENCY]: 'عملة غير صالحة',
    [settingsMessagesCodes.INVALID_HOURLY_RATE]: 'سعر ساعة غير صالح',
    [settingsMessagesCodes.INVALID_RETENTION_DAYS]:
      'عدد أيام الاحتفاظ بالصور غير صالح (من 1 إلى 180 يوم)',
  },
  // ── backup-messages ───────────────────────────────────────────────────────
  [messagesNames.backupMessages]: {
    // backup + restore
    [backupMessagesCodes.NOT_FOUND]: 'النسخة الاحتياطية غير موجودة.',
    [backupMessagesCodes.CREATED]: 'تم إنشاء النسخة الاحتياطية بنجاح.',
    [backupMessagesCodes.FAILED]: 'فشل إنشاء النسخة الاحتياطية.',
    [backupMessagesCodes.FILE_MISSING]:
      'ملف النسخة الاحتياطية غير متوفّر على الجهاز.',
    [backupMessagesCodes.RESTORE_DONE]: 'تم استرجاع قاعدة البيانات بنجاح.',
    [backupMessagesCodes.RESTORE_FAILED]: 'فشل استرجاع قاعدة البيانات.',
    [backupMessagesCodes.RESTORE_CONFIRM_REQUIRED]:
      'هذه عملية مدمّرة — يجب تأكيدها صراحةً قبل التنفيذ.',
    [backupMessagesCodes.DB_CONNECT_FAILED]:
      'تعذّر الاتصال بقاعدة البيانات لإنشاء النسخة الاحتياطية — تأكّد من تشغيل MySQL وصحّة DATABASE_URL.',
    [backupMessagesCodes.RESTORE_DB_CONNECT_FAILED]:
      'تعذّر الاتصال بقاعدة البيانات لاسترجاع النسخة — تأكّد من تشغيل MySQL وصحّة DATABASE_URL.',
    [backupMessagesCodes.OPERATION_IN_PROGRESS]:
      'توجد عملية نسخ أو استرجاع جارية — انتظر حتى تنتهي ثم أعد المحاولة.',
    [backupMessagesCodes.RESTORE_SOURCE_UNAVAILABLE]:
      'لا توجد نسخة قابلة للاسترجاع (الملف مفقود محليًا وعلى Drive).',
    [backupMessagesCodes.DELETED]: 'تم حذف النسخة الاحتياطية.',

    // per-row restore-blocked reasons
    [backupMessagesCodes.FILE_MISSING_LOCAL]:
      'الملف المحلي لهذه النسخة محذوف ولا يوجد حساب Drive مرتبط لاستعادته.',
    [backupMessagesCodes.NO_LINKED_ACCOUNT]:
      'لا يوجد حساب Google Drive مرتبط ومتصل بهذه النسخة لاستعادة ملفها.',
    [backupMessagesCodes.STORAGE_KEY_MISSING]:
      'لا يوجد مرجع تخزين لهذه النسخة — لا يمكن تحديد موضع ملفها.',
    [backupMessagesCodes.NOT_SUCCESSFUL]:
      'هذه النسخة لم تكتمل بنجاح — لا يوجد ملف قابل للاسترجاع.',

    // schema check + external restore
    [backupMessagesCodes.RESTORE_SCHEMA_MISMATCH]:
      'بنية الملف لا تطابق قاعدة البيانات الحالية — لا يمكن الاسترجاع.',
    [backupMessagesCodes.RESTORE_EXTERNAL_INVALID_KEY]:
      'مفتاح التشفير غير صالح (يجب أن يكون 32 بايت بعد فكّ base64).',
    [backupMessagesCodes.RESTORE_EXTERNAL_DECRYPT_FAILED]:
      'تعذّر فكّ تشفير الملف — مفتاح خاطئ أو ملف تالف.',
    [backupMessagesCodes.RESTORE_EXTERNAL_CHECKED]: 'تم فحص الملف بنجاح.',
    [backupMessagesCodes.EXTERNAL_CHECK_TOKEN_INVALID]:
      'انتهت صلاحية جلسة الفحص — أعد رفع الملف وافحصه من جديد.',
    [backupMessagesCodes.EXTERNAL_FILE_REQUIRED]:
      'يجب اختيار ملف النسخة (.enc) أولًا.',
    [backupMessagesCodes.EXTERNAL_FILE_INVALID_TYPE]:
      'صيغة الملف غير مدعومة — يجب ملف بامتداد .enc.',
    [backupMessagesCodes.EXTERNAL_FILE_TOO_LARGE]:
      'حجم الملف كبير جدًا (الحدّ الأقصى 200 ميجابايت).',

    // Google Drive (multi-account) + S3
    [backupMessagesCodes.DRIVE_NOT_CONFIGURED]:
      'لم يتم ضبط بيانات Google Drive (Client ID/Secret) في الإعدادات.',
    [backupMessagesCodes.DRIVE_NOT_CONNECTED]:
      'حساب Google Drive غير مربوط — اربط الحساب أولًا.',
    [backupMessagesCodes.DRIVE_AUTH_FAILED]:
      'فشلت مصادقة Google Drive — أعد ربط الحساب.',
    [backupMessagesCodes.DRIVE_STATE_MISMATCH]:
      'تعذّر التحقّق من طلب ربط Google Drive (state غير مطابق) — أعد المحاولة من زر الربط.',
    [backupMessagesCodes.DRIVE_UPLOAD_FAILED]:
      'فشل رفع النسخة على Google Drive.',
    [backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND]: 'الحساب غير موجود.',
    [backupMessagesCodes.DRIVE_ACCOUNT_HAS_BACKUPS]:
      'لا يمكن حذف الحساب لوجود نسخ مرتبطة به.',
    [backupMessagesCodes.DRIVE_RECONNECT_REQUIRED]:
      'يتطلّب إعادة الاتصال بحساب Google Drive المرتبط بهذه النسخة ثم المحاولة مجددًا.',
    [backupMessagesCodes.DRIVE_RECONNECT_IDENTITY_MISMATCH]:
      'الحساب الذي صرّحت به يختلف عن الحساب المطلوب إعادة ربطه.',
    [backupMessagesCodes.DRIVE_ACCOUNT_REMOVED]: 'تم حذف حساب Google Drive.',
    [backupMessagesCodes.DRIVE_ACCOUNT_ACTIVATED]:
      'تم تعيين الحساب كحساب مُفعّل للرفع.',
    [backupMessagesCodes.DRIVE_ACCOUNT_DISCONNECTED]:
      'تم فصل حساب Google Drive.',
    [backupMessagesCodes.DRIVE_ACCOUNT_CHECKED]: 'تم فحص حالة الاتصال.',
    [backupMessagesCodes.STORAGE_UPLOAD_FAILED]:
      'فشل رفع النسخة إلى وجهة التخزين.',

    // encryption keys (EncryptionKey) stored on Drive
    [backupMessagesCodes.ENCRYPTION_KEY_NOT_FOUND]: 'مفتاح التشفير غير موجود.',
    [backupMessagesCodes.ENCRYPTION_KEY_GENERATED]:
      'تم توليد مفتاح تشفير جديد.',
    [backupMessagesCodes.ENCRYPTION_KEY_SAVED]:
      'تم حفظ مفتاح التشفير على Google Drive.',
    [backupMessagesCodes.ENCRYPTION_KEY_DELETED]: 'تم حذف مفتاح التشفير.',
    [backupMessagesCodes.ENCRYPTION_KEY_PRIMARY_SET]:
      'تم تعيين المفتاح الأساسي للنسخ التلقائية.',
    [backupMessagesCodes.ENCRYPTION_KEY_INVALID]:
      'مفتاح التشفير غير صالح (يجب أن يكون 32 بايت بعد فكّ base64).',
    [backupMessagesCodes.KEY_FILE_MISSING]:
      'ملف المفتاح مفقود على Drive — لا يمكن الاسترجاع بهذا المفتاح.',
    [backupMessagesCodes.KEY_FINGERPRINT_MISMATCH]:
      'بصمة ملف المفتاح لا تطابق المتوقّع — المفتاح غير صحيح.',
    [backupMessagesCodes.NO_PRIMARY_KEY]:
      'لا يوجد مفتاح تشفير أساسي — أنشئ مفتاحًا وعيّنه أساسيًّا أولًا.',

    // account types + connection state
    [backupMessagesCodes.ACCOUNT_TYPE_LOCKED]:
      'نوع الحساب مُثبَّت لوجود بيانات مرتبطة به — لا يمكن تغييره.',
    [backupMessagesCodes.KEY_ACCOUNT_REQUIRED]:
      'هذا الإجراء يتطلّب حساب مفاتيح (KEY).',
    [backupMessagesCodes.DB_ACCOUNT_REQUIRED]:
      'هذا الإجراء يتطلّب حساب نسخ (DB).',
    [backupMessagesCodes.KEY_ACCOUNT_DISCONNECTED]:
      'حساب المفتاح مفصول — أعد ربطه ثم أعد المحاولة.',
    [backupMessagesCodes.DB_ACCOUNT_DISCONNECTED]:
      'حساب النسخ (DB) مفصول — أعد ربطه ثم أعد المحاولة.',
    [backupMessagesCodes.ACCOUNTS_RECONNECT_REQUIRED]:
      'يتطلّب الاسترجاع إعادة ربط حساب أو أكثر ثم إعادة المحاولة.',
  },
  // ── whiteboard-messages ───────────────────────────────────────────────────
  [messagesNames.whiteboardMessages]: {
    [whiteboardMessagesCodes.SESSION_NOT_FOUND]: 'الجلسة غير موجودة',
    [whiteboardMessagesCodes.SESSION_CREATED]: 'تم إنشاء الجلسة',
    [whiteboardMessagesCodes.SESSION_DELETED]: 'تم حذف الجلسة',
    [whiteboardMessagesCodes.SESSION_ACTIVATED]: 'تم فتح الجلسة',
    [whiteboardMessagesCodes.SESSION_ENDED]: 'تم إنهاء الجلسة',
    [whiteboardMessagesCodes.SESSION_MADE_PUBLIC]: 'الجلسة أصبحت عامة',
    [whiteboardMessagesCodes.SESSION_MADE_PRIVATE]: 'الجلسة أصبحت خاصة',
    [whiteboardMessagesCodes.STUDENT_ADDED]: 'تمت إضافة الطالب',
    [whiteboardMessagesCodes.STUDENT_REMOVED]: 'تمت إزالة الطالب',
    [whiteboardMessagesCodes.STUDENT_ALREADY_ADDED]: 'الطالب مضاف بالفعل',
    [whiteboardMessagesCodes.STUDENT_NOT_IN_SESSION]:
      'الطالب غير موجود في الجلسة',
    [whiteboardMessagesCodes.NOT_A_STUDENT]: 'الحساب المختار ليس طالبًا',
    [whiteboardMessagesCodes.TITLE_REQUIRED]: 'عنوان الجلسة مطلوب',
    [whiteboardMessagesCodes.STUDENT_ID_INVALID]: 'معرّف الطالب غير صالح',
    [whiteboardMessagesCodes.IMAGE_NOT_FOUND]: 'الصورة غير موجودة',
    [whiteboardMessagesCodes.IMAGE_REQUIRED]: 'الصورة مطلوبة',
    [whiteboardMessagesCodes.IMAGE_FORBIDDEN]: 'لا يمكنك الوصول لهذه الصورة',
    [whiteboardMessagesCodes.BOARD_DATA_SAVED]: 'تم حفظ بيانات السبورة',
    [whiteboardMessagesCodes.LIBRARY_LOADED]: 'تم تحميل مكتبة السبورة',
    [whiteboardMessagesCodes.LIBRARY_SAVED]: 'تم حفظ مكتبة السبورة',
    [whiteboardMessagesCodes.LIBRARY_ITEMS_INVALID]:
      'محتوى مكتبة السبورة غير صالح',
  },
};

const en = {
  [messagesNames.generalMessages]: {
    [generalMessagesCodes.OK]: 'Operation successful',
    [generalMessagesCodes.CREATED]: 'Created successfully',
    [generalMessagesCodes.UPDATED]: 'Updated successfully',
    [generalMessagesCodes.DELETED]: 'Deleted successfully',
    [generalMessagesCodes.NOT_FOUND]: 'Not found',
    [generalMessagesCodes.BAD_REQUEST]: 'Bad request',
    [generalMessagesCodes.VALIDATION_ERROR]: 'Invalid data',
    [generalMessagesCodes.UNAUTHORIZED]: 'You must be logged in',
    [generalMessagesCodes.FORBIDDEN]: "You don't have permission to do this",
    [generalMessagesCodes.CONFLICT]: 'Data conflict',
    [generalMessagesCodes.TOO_MANY_REQUESTS]:
      'Too many requests, try again later',
    [generalMessagesCodes.INTERNAL_SERVER_ERROR]: 'Server error',
    [generalMessagesCodes.UNEXPECTED_ERROR]: 'An unexpected error occurred',
    [generalMessagesCodes.FILE_TOO_LARGE]: 'File is too large',
    [generalMessagesCodes.TOO_MANY_FILES]: 'Too many files',
    [generalMessagesCodes.FILE_UPLOAD_ERROR]: 'File upload failed',
  },
  [messagesNames.authMessages]: {
    [authMessagesCodes.REGISTERED_SUCCESS]: 'Account created successfully',
    [authMessagesCodes.ENROLLED_SUCCESS]:
      'Registered successfully — you can sign in now',
    [authMessagesCodes.LOGIN_SUCCESS]: 'Logged in successfully',
    [authMessagesCodes.LOGOUT_SUCCESS]: 'Logged out',
    [authMessagesCodes.TOKEN_REFRESHED]: 'Session refreshed',
    [authMessagesCodes.INVALID_CREDENTIALS]: 'Email or password is incorrect',
    [authMessagesCodes.EMAIL_ALREADY_EXISTS]: 'Email already in use',
    [authMessagesCodes.USERNAME_ALREADY_EXISTS]: 'Username already in use',
    [authMessagesCodes.ACCOUNT_INACTIVE]: 'Account is inactive',
    [authMessagesCodes.UNAUTHORIZED]: 'Session expired, please log in',
    [authMessagesCodes.FORBIDDEN]: "You don't have permission",
    [authMessagesCodes.TOKEN_EXPIRED]: 'Session expired',
    [authMessagesCodes.INVALID_TOKEN]: 'Invalid session',
    [authMessagesCodes.NAME_REQUIRED]: 'Name is required',
    [authMessagesCodes.EMAIL_REQUIRED]: 'Email is required',
    [authMessagesCodes.INVALID_EMAIL]: 'Invalid email',
    [authMessagesCodes.PASSWORD_REQUIRED]: 'Password is required',
    [authMessagesCodes.PASSWORD_TOO_SHORT]: 'Password is too short',
    [authMessagesCodes.PHONE_REQUIRED]: 'Phone number is required',
    [authMessagesCodes.INVALID_PHONE]: 'Invalid phone number',
    [authMessagesCodes.RESET_EMAIL_SENT]:
      "If you have an account, we've sent a password reset link to your email",
    [authMessagesCodes.PASSWORD_RESET_SUCCESS]:
      'Your password has been changed — you can sign in now',
    [authMessagesCodes.RESET_TOKEN_INVALID]:
      'This reset link is invalid or has expired',
    [authMessagesCodes.RESET_TOKEN_REQUIRED]: 'Reset token is required',
    [authMessagesCodes.RESET_RATE_LIMITED]:
      'Too many attempts, please try again shortly',
    [authMessagesCodes.BACK_TO_LOGIN]: 'Back to login',
    [authMessagesCodes.BACK_TO_DASHBOARD]: 'Back to dashboard',
    [authMessagesCodes.GO_TO_LOGIN]: 'Go to login',
    [authMessagesCodes.CHILD_EMAIL_DUPLICATE]:
      'A child email is duplicated within the same request',
    [authMessagesCodes.CHILD_EMAIL_EXISTS]:
      'A child email is already registered',
    [authMessagesCodes.NO_CHILDREN]: 'Add at least one child',
    [authMessagesCodes.PLAN_REQUIRED]: 'Select a plan for each child',
    [authMessagesCodes.COUPON_INVALID_FOR_PLAN]:
      'The coupon is not valid for the chosen plan or cycle',
  },
  [messagesNames.userMessages]: {
    [userMessagesCodes.USER_NOT_FOUND]: 'User not found',
    [userMessagesCodes.USER_NAME_REQUIRED]: 'User name is required',
    [userMessagesCodes.USER_EMAIL_REQUIRED]: 'Email is required',
    [userMessagesCodes.INVALID_EMAIL]: 'Invalid email',
    [userMessagesCodes.USER_ROLE_REQUIRED]: 'Role is required',
    [userMessagesCodes.USER_PASSWORD_REQUIRED]: 'Password is required',
    [userMessagesCodes.EMAIL_ALREADY_EXISTS]: 'Email already in use',
    [userMessagesCodes.CANNOT_ACCESS_USER]: 'You cannot access this user',
    [userMessagesCodes.CANNOT_MODIFY_USER]: 'You cannot modify this user',
    [userMessagesCodes.CANNOT_LINK_STUDENT]: 'Student cannot be linked',
    [userMessagesCodes.STUDENT_ALREADY_LINKED]: 'Student is already linked',
    [userMessagesCodes.PARENT_REQUIRED]: 'Parent is required',
    [userMessagesCodes.STUDENT_REQUIRED]: 'Student is required',
    [userMessagesCodes.PARENT_NOT_FOUND]: 'Parent not found',
    [userMessagesCodes.CANNOT_VIEW_CHILDREN]:
      "You cannot view this parent's children",
    [userMessagesCodes.USER_CHILDREN_FETCHED]: 'Children loaded',
    [userMessagesCodes.INVALID_STUDENT_LEVEL]: 'Invalid level',
    [userMessagesCodes.NOT_A_STUDENT]: 'This user is not a student',
    [userMessagesCodes.LEVEL_UPDATED]: 'Student level updated',
    [userMessagesCodes.CANNOT_BAN_SELF]: 'You cannot ban yourself',
    [userMessagesCodes.CANNOT_BAN_ADMIN]: 'An admin account cannot be banned',
    [userMessagesCodes.USER_BANNED]: 'Account banned',
    [userMessagesCodes.USER_UNBANNED]: 'Account unbanned',
  },
  [messagesNames.planMessages]: {
    [planMessagesCodes.PLAN_NOT_FOUND]: 'Plan not found',
    [planMessagesCodes.PLAN_TITLE_REQUIRED]: 'Plan title is required',
    [planMessagesCodes.PLAN_HOURS_REQUIRED]: 'Number of hours is required',
    [planMessagesCodes.PLAN_RATE_REQUIRED]: 'Plan price is required',
    [planMessagesCodes.PLAN_BILLING_PERIOD_REQUIRED]:
      'Billing period is required',
    [planMessagesCodes.DISCOUNT_NOT_FOUND]: 'Discount not found',
    [planMessagesCodes.DISCOUNT_TYPE_REQUIRED]: 'Discount type is required',
    [planMessagesCodes.DISCOUNT_VALUE_REQUIRED]: 'Discount value is required',
    [planMessagesCodes.DISCOUNT_CONSTRAINT_REQUIRED]:
      'Discount constraint is required',
  },
  [messagesNames.couponMessages]: {
    [couponMessagesCodes.COUPON_NOT_FOUND]: 'Coupon not found',
    [couponMessagesCodes.COUPON_CODE_REQUIRED]: 'Coupon code is required',
    [couponMessagesCodes.COUPON_INVALID]: 'Invalid coupon',
    [couponMessagesCodes.COUPON_EXPIRED]: 'Coupon has expired',
    [couponMessagesCodes.COUPON_NOT_ACTIVE_YET]:
      'This coupon is not active yet',
    [couponMessagesCodes.COUPON_USAGE_LIMIT_REACHED]:
      'This coupon has reached its total usage limit',
    [couponMessagesCodes.COUPON_ALREADY_USED_BY_STUDENT]:
      'This coupon has already been used for this student',
    [couponMessagesCodes.COUPON_NOT_APPLICABLE]: 'Coupon is not applicable',
    [couponMessagesCodes.COUPON_CODE_TAKEN]: 'Coupon code already in use',
    [couponMessagesCodes.COUPON_MAX_BELOW_USAGE]:
      "Max redemptions can't be lower than the number of times already used",
  },
  [messagesNames.subscriptionMessages]: {
    [subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND]:
      'Subscription not found',
    [subscriptionMessagesCodes.STUDENT_REQUIRED]: 'Student is required',
    [subscriptionMessagesCodes.INVALID_DATE_RANGE]: 'Invalid date range',
    [subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION]:
      'You cannot access this subscription',
    [subscriptionMessagesCodes.PLAN_REQUIRED]: 'Plan is required',
    [subscriptionMessagesCodes.PLAN_NOT_FOUND]: 'Plan not found',
    [subscriptionMessagesCodes.STUDENT_NOT_LINKED]:
      'Student is not linked to your account',
    [subscriptionMessagesCodes.NOT_PENDING]: 'Subscription is not pending',
    [subscriptionMessagesCodes.COUPON_INVALID]: 'Invalid coupon',
    [subscriptionMessagesCodes.CANNOT_CANCEL]:
      'This subscription cannot be cancelled',
    [subscriptionMessagesCodes.SUBSCRIPTION_CANCELLED]:
      "Subscription and its unpaid invoice were cancelled. Logging a session in the prior month creates a new subscription for the following month.",
    [subscriptionMessagesCodes.SUBSCRIPTION_STILL_ACTIVE]:
      'There is an active subscription — cancel it first before creating a new one',
    [subscriptionMessagesCodes.SUBSCRIPTION_RENEWED]: 'Subscription renewed',
    [subscriptionMessagesCodes.PLAN_CHANGED]: 'Plan changed',
    [subscriptionMessagesCodes.SUBSCRIPTION_ACTIVATED]:
      'Subscription activated',
    [subscriptionMessagesCodes.CANNOT_CHANGE_PLAN_PAID]:
      'Cannot change the plan after the invoice is paid',
    [subscriptionMessagesCodes.ACTIVATION_TOO_EARLY]:
      "Can't activate the subscription before its month begins (activation opens from the last day of the previous month)",
    [subscriptionMessagesCodes.USAGE_SUBSCRIPTION_EXISTS]:
      'A usage subscription already exists for this student in this month',
    [subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE]:
      'Subscription expired or inactive',
    [subscriptionMessagesCodes.NO_EDITABLE_FIELDS]:
      'This workflow field cannot be changed by the generic edit action.',
    [subscriptionMessagesCodes.REMAINING_EXCEEDS_TOTAL]:
      'Remaining minutes cannot exceed the subscription total.',
    [subscriptionMessagesCodes.SUBSCRIPTION_UPDATED]:
      'Subscription details updated',
    [subscriptionMessagesCodes.SUBSCRIPTION_CREATED]:
      'Subscription and invoice created successfully',
    [subscriptionMessagesCodes.SUBSCRIPTION_REJECTED]:
      'Subscription rejected and its unpaid invoice voided',
    [subscriptionMessagesCodes.COUPON_UPDATED]:
      'Coupon, price, and invoice updated',
    [subscriptionMessagesCodes.USAGE_SUBSCRIPTION_SYNCED]:
      "Next month's subscription was updated from sessions",
  },
  [messagesNames.gameMessages]: {
    [gameMessagesCodes.GAME_NOT_FOUND]: 'Game not found',
    [gameMessagesCodes.GAME_NOT_ACTIVE]: 'Game is not active',
    [gameMessagesCodes.FREE_GAME_NOT_FOUND]: 'No free game is set right now',
    [gameMessagesCodes.FREE_GAME_UPDATED]: 'Free game updated successfully',
    [gameMessagesCodes.FREE_GAME_RATE_LIMITED]:
      "You've played a lot! Take a short break and come back soon 😊",
    [gameMessagesCodes.CANNOT_ACCESS_GAME]: 'You cannot access this game',
    [gameMessagesCodes.STUDENT_IDS_REQUIRED]: 'Students are required',
    [gameMessagesCodes.STUDENT_ID_INVALID]: 'Invalid student ID',
    [gameMessagesCodes.ATTEMPT_CORRECT_COUNT_INVALID]:
      'Invalid correct answers count',
    [gameMessagesCodes.ATTEMPT_TOTAL_QUESTIONS_INVALID]:
      'Invalid total questions count',
    [gameMessagesCodes.ONLY_STUDENT_CAN_ATTEMPT]: 'Only a student can play',
    [gameMessagesCodes.ASSIGNMENT_NOT_FOUND]: 'Assignment not found',
    [gameMessagesCodes.BADGE_ID_INVALID]: 'Invalid badge ID',
    [gameMessagesCodes.GAME_BADGE_LINKED]: 'Badge linked to the game',
    [gameMessagesCodes.GAME_BADGE_UNLINKED]: 'Badge unlinked from the game',
  },
  [messagesNames.reportMessages]: {
    [reportMessagesCodes.REPORT_NOT_FOUND]: 'Report not found',
    [reportMessagesCodes.REPORT_TITLE_REQUIRED]: 'Report title is required',
    [reportMessagesCodes.REPORT_BODY_REQUIRED]: 'Report body is required',
    [reportMessagesCodes.STUDENTS_REQUIRED]: 'Students are required',
    [reportMessagesCodes.CANNOT_ACCESS_REPORT]: 'You cannot access this report',
  },

  // ── session-log-messages ──────────────────────────────────────────────────
  [messagesNames.sessionLogMessages]: {
    [sessionLogMessagesCodes.SESSION_LOG_NOT_FOUND]: 'Session log not found',
    [sessionLogMessagesCodes.STUDENT_REQUIRED]: 'A student is required',
    [sessionLogMessagesCodes.STUDENT_NOT_FOUND]: 'Student not found',
    [sessionLogMessagesCodes.SUBJECTS_REQUIRED]:
      'At least one subject is required',
    [sessionLogMessagesCodes.INVALID_SUBJECT]: 'Invalid subject',
    [sessionLogMessagesCodes.DURATION_REQUIRED]: 'Session duration is required',
    [sessionLogMessagesCodes.DURATION_INVALID]: 'Session duration is invalid',
    [sessionLogMessagesCodes.SESSION_DATE_REQUIRED]: 'Session date is required',
    [sessionLogMessagesCodes.ATTENDANCE_INVALID]: 'Invalid attendance status',
    [sessionLogMessagesCodes.RATING_INVALID]: 'Invalid rating',
    [sessionLogMessagesCodes.TEACHER_NOT_FOUND]: 'Teacher not found',
    [sessionLogMessagesCodes.NO_ADMIN_AVAILABLE]:
      'No teacher available to log the session',
    [sessionLogMessagesCodes.CANNOT_ACCESS_SESSION_LOG]:
      'You cannot access this session log',
  },
  [messagesNames.quizMessages]: {
    [quizMessagesCodes.CATEGORY_NOT_FOUND]: 'Category not found',
    [quizMessagesCodes.CATEGORY_NAME_REQUIRED]: 'Category name is required',
    [quizMessagesCodes.CATEGORY_HAS_QUESTIONS]:
      'Cannot delete a category that has questions',
    [quizMessagesCodes.QUESTION_NOT_FOUND]: 'Question not found',
    [quizMessagesCodes.QUESTION_TEXT_REQUIRED]: 'Question text is required',
    [quizMessagesCodes.QUESTION_OPTIONS_MIN]:
      'At least two options are required',
    [quizMessagesCodes.QUESTION_OPTION_LABEL_REQUIRED]:
      'Option label is required',
    [quizMessagesCodes.QUESTION_NEEDS_CORRECT_OPTION]:
      'At least one correct answer is required',
    [quizMessagesCodes.INVITE_NOT_FOUND]: 'Invite not found',
    [quizMessagesCodes.INVITE_PARENT_REQUIRED]: 'Parent is required',
    [quizMessagesCodes.INVITE_PARENT_INVALID]: 'Invalid parent',
    [quizMessagesCodes.INVITE_QUESTIONS_REQUIRED]: 'Questions are required',
    [quizMessagesCodes.INVITE_QUESTIONS_INVALID]: 'Invalid questions',
    [quizMessagesCodes.INVITE_BADGE_INVALID]: 'Invalid badge',
    [quizMessagesCodes.INVITE_EXPIRED]: 'Invite has expired',
    [quizMessagesCodes.INVITE_ALREADY_BUILT]:
      'Quiz already built from this invite',
    [quizMessagesCodes.CANNOT_ACCESS_INVITE]: 'You cannot access this invite',
    [quizMessagesCodes.QUIZ_TITLE_REQUIRED]: 'Quiz title is required',
    [quizMessagesCodes.QUIZ_PASS_THRESHOLD_INVALID]: 'Invalid pass threshold',
    [quizMessagesCodes.QUIZ_ITEMS_REQUIRED]: 'Quiz items are required',
    [quizMessagesCodes.QUIZ_ITEM_SOURCE_INVALID]: 'Invalid question source',
    [quizMessagesCodes.QUIZ_ITEM_NOT_EXPOSED]: 'Question is not available',
    [quizMessagesCodes.QUIZ_ITEM_OPTIONS_MIN]:
      'At least two options are required',
    [quizMessagesCodes.QUIZ_ITEM_NEEDS_CORRECT_OPTION]:
      'At least one correct answer is required',
    [quizMessagesCodes.QUIZ_PARTICIPANTS_REQUIRED]: 'Participants are required',
    [quizMessagesCodes.QUIZ_PARTICIPANTS_INVALID]: 'Invalid participants',
    [quizMessagesCodes.QUIZ_NOT_FOUND]: 'Quiz not found',
    [quizMessagesCodes.CANNOT_ACCESS_QUIZ]: 'You cannot access this quiz',
    [quizMessagesCodes.QUIZ_NOT_PARTICIPANT]:
      'You are not a participant in this quiz',
    [quizMessagesCodes.QUIZ_ANSWERS_REQUIRED]: 'Answers are required',
  },
  [messagesNames.certificateMessages]: {
    [certificateMessagesCodes.CERTIFICATE_NOT_FOUND]: 'Certificate not found',
    [certificateMessagesCodes.CANNOT_ACCESS_CERTIFICATE]:
      'You cannot access this certificate',
    [certificateMessagesCodes.CERTIFICATE_STUDENT_NOT_FOUND]:
      'Student not found',
    [certificateMessagesCodes.CERTIFICATE_STUDENT_REQUIRED]:
      'Student is required',
    [certificateMessagesCodes.CERTIFICATE_TITLE_REQUIRED]:
      'Certificate title is required',
    [certificateMessagesCodes.CERTIFICATE_BADGE_NOT_FOUND]: 'Badge not found',
    [certificateMessagesCodes.TEMPLATE_NOT_FOUND]: 'Template not found',
    [certificateMessagesCodes.TEMPLATE_KEY_REQUIRED]:
      'Template key is required',
    [certificateMessagesCodes.TEMPLATE_KEY_EXISTS]:
      'Template key already in use',
    [certificateMessagesCodes.TEMPLATE_NAME_REQUIRED]:
      'Template name is required',
  },
  [messagesNames.rewardMessages]: {
    [rewardMessagesCodes.REWARD_NOT_FOUND]: 'Reward not found',
    [rewardMessagesCodes.CANNOT_ACCESS_REWARD]: 'You cannot access this reward',
    [rewardMessagesCodes.REWARD_ALREADY_CLAIMED]: 'Reward already claimed',
  },
  [messagesNames.dashboardMessages]: {
    [dashboardMessagesCodes.DASHBOARD_FORBIDDEN]:
      "You don't have access to this dashboard",
    [dashboardMessagesCodes.NOT_A_PARENT]:
      'This account is not a parent account',
    [dashboardMessagesCodes.NOT_A_STUDENT]:
      'This account is not a student account',
  },
  [messagesNames.notificationMessages]: {
    [notificationMessagesCodes.NOTIFICATION_NOT_FOUND]:
      'Notification not found',
    [notificationMessagesCodes.CANNOT_ACCESS_NOTIFICATION]:
      'You cannot access this notification',
  },
  [messagesNames.badgeMessages]: {
    [badgeMessagesCodes.BADGE_NOT_FOUND]: 'Badge not found',
    [badgeMessagesCodes.BADGE_NAME_REQUIRED]: 'Badge name is required',
    [badgeMessagesCodes.BADGE_CODE_REQUIRED]: 'Badge code is required',
    [badgeMessagesCodes.BADGE_CODE_EXISTS]: 'Badge code already in use',
    [badgeMessagesCodes.INVALID_SCORE]: 'Invalid score',
    [badgeMessagesCodes.STUDENT_REQUIRED]: 'Student is required',
    [badgeMessagesCodes.NOT_A_STUDENT]: 'This user is not a student',
    [badgeMessagesCodes.ALREADY_AWARDED]: 'Student already has this badge',
    [badgeMessagesCodes.NOT_AWARDED]: 'Student does not have this badge',
    [badgeMessagesCodes.BADGE_AWARDED]: 'Badge awarded',
    [badgeMessagesCodes.BADGE_REVOKED]: 'Badge revoked',
    [badgeMessagesCodes.CANNOT_ACCESS_BADGE]: 'You cannot access this badge',
  },
  [messagesNames.pointMessages]: {
    [pointMessagesCodes.STUDENT_REQUIRED]: 'Student is required',
    [pointMessagesCodes.NOT_A_STUDENT]: 'This user is not a student',
    [pointMessagesCodes.INVALID_AMOUNT]: 'Invalid points amount',
    [pointMessagesCodes.CANNOT_ACCESS_POINTS]:
      "You cannot access this student's points",
    [pointMessagesCodes.POINTS_GRANTED]: 'Points granted',
  },
  [messagesNames.invoiceMessages]: {
    [invoiceMessagesCodes.INVOICE_NOT_FOUND]: 'Invoice not found',
    [invoiceMessagesCodes.CANNOT_ACCESS_INVOICE]:
      'You cannot access this invoice',
    [invoiceMessagesCodes.SUBSCRIPTION_NOT_FOUND]: 'Subscription not found',
    [invoiceMessagesCodes.SUBSCRIPTION_NOT_PRICED]:
      'The subscription has no price set',
    [invoiceMessagesCodes.INVOICE_GENERATED]: 'Invoice generated',
    [invoiceMessagesCodes.INVOICE_REGENERATED]: 'Invoice regenerated',
    [invoiceMessagesCodes.INVOICE_REBILLED_AND_SUBSCRIPTION_PAUSED]:
      'Sessions and invoice recalculated; the subscription is awaiting payment and activation',
    [invoiceMessagesCodes.INVOICE_UPDATED]: 'Invoice updated',
    [invoiceMessagesCodes.INVALID_STATUS_TRANSITION]:
      "This invoice status change isn't allowed",
    [invoiceMessagesCodes.INVOICE_SENT]: 'Invoice sent',
    [invoiceMessagesCodes.INVOICE_SEND_FAILED]: 'Failed to send the invoice',
    [invoiceMessagesCodes.NO_PARENT_LINKED]:
      'Failed to send the invoice: the student has no linked parent',
    [invoiceMessagesCodes.CANNOT_SEND_INVOICE]:
      'You are not allowed to send this invoice',
    [invoiceMessagesCodes.WHATSAPP_NOT_CONFIGURED]:
      'WhatsApp is not configured',
  },
  [messagesNames.paymentTemplateMessages]: {
    [paymentTemplateMessagesCodes.PAYMENT_TEMPLATE_UPDATED]:
      'Invoice template settings saved',
  },
  [messagesNames.settingsMessages]: {
    [settingsMessagesCodes.SETTINGS_UPDATED]: 'Settings saved',
    [settingsMessagesCodes.INVALID_CURRENCY]: 'Invalid currency',
    [settingsMessagesCodes.INVALID_HOURLY_RATE]: 'Invalid hourly rate',
    [settingsMessagesCodes.INVALID_RETENTION_DAYS]:
      'Invalid image retention days (1 to 180)',
  },
  [messagesNames.attachmentMessages]: {
    [attachmentMessagesCodes.NO_FILE]: 'No file selected',
    [attachmentMessagesCodes.FILE_TOO_LARGE]: 'File is too large',
    [attachmentMessagesCodes.UNSUPPORTED_TYPE]: 'Unsupported file type',
    [attachmentMessagesCodes.UPLOAD_FAILED]: 'File upload failed',
    [attachmentMessagesCodes.ATTACHMENT_NOT_FOUND]: 'File not found',
    [attachmentMessagesCodes.CANNOT_SET_AVATAR]: 'You cannot set this image',
    [attachmentMessagesCodes.AVATAR_UPDATED]: 'Image updated',
  },
  // ── backup-messages ───────────────────────────────────────────────────────
  [messagesNames.backupMessages]: {
    // Backup + restore
    [backupMessagesCodes.NOT_FOUND]: 'Backup not found.',
    [backupMessagesCodes.CREATED]: 'Backup created successfully.',
    [backupMessagesCodes.FAILED]: 'Backup creation failed.',
    [backupMessagesCodes.FILE_MISSING]:
      'The backup file is not available on this machine.',
    [backupMessagesCodes.RESTORE_DONE]: 'Database restored successfully.',
    [backupMessagesCodes.RESTORE_FAILED]: 'Database restore failed.',
    [backupMessagesCodes.RESTORE_CONFIRM_REQUIRED]:
      'This is a destructive operation — it must be explicitly confirmed before running.',
    [backupMessagesCodes.DB_CONNECT_FAILED]:
      'Could not connect to the database to create the backup — make sure MySQL is running and DATABASE_URL is correct.',
    [backupMessagesCodes.RESTORE_DB_CONNECT_FAILED]:
      'Could not connect to the database to restore the backup — make sure MySQL is running and DATABASE_URL is correct.',
    [backupMessagesCodes.OPERATION_IN_PROGRESS]:
      'A backup or restore operation is already in progress — wait for it to finish and try again.',
    [backupMessagesCodes.RESTORE_SOURCE_UNAVAILABLE]:
      'No restorable backup is available (the file is missing both locally and on Drive).',
    [backupMessagesCodes.DELETED]: 'Backup deleted.',

    // Reasons a restore is unavailable (per row)
    [backupMessagesCodes.FILE_MISSING_LOCAL]:
      'The local file for this backup was deleted and there is no linked Drive account to restore it from.',
    [backupMessagesCodes.NO_LINKED_ACCOUNT]:
      'No connected Google Drive account is linked to this backup to restore its file.',
    [backupMessagesCodes.STORAGE_KEY_MISSING]:
      'This backup has no storage reference — its file location cannot be determined.',
    [backupMessagesCodes.NOT_SUCCESSFUL]:
      'This backup did not complete successfully — there is no restorable file.',

    // Schema check + external restore
    [backupMessagesCodes.RESTORE_SCHEMA_MISMATCH]:
      'The file structure does not match the current database — restore is not possible.',
    [backupMessagesCodes.RESTORE_EXTERNAL_INVALID_KEY]:
      'Invalid encryption key (it must be 32 bytes after base64 decoding).',
    [backupMessagesCodes.RESTORE_EXTERNAL_DECRYPT_FAILED]:
      'Could not decrypt the file — wrong key or corrupted file.',
    [backupMessagesCodes.RESTORE_EXTERNAL_CHECKED]:
      'File checked successfully.',
    [backupMessagesCodes.EXTERNAL_CHECK_TOKEN_INVALID]:
      'The check session expired — re-upload the file and check it again.',
    [backupMessagesCodes.EXTERNAL_FILE_REQUIRED]:
      'Please choose the backup file (.enc) first.',
    [backupMessagesCodes.EXTERNAL_FILE_INVALID_TYPE]:
      'Unsupported file format — a file with a .enc extension is required.',
    [backupMessagesCodes.EXTERNAL_FILE_TOO_LARGE]:
      'The file is too large (maximum 200 MB).',

    // Google Drive (multi-account) + S3
    [backupMessagesCodes.DRIVE_NOT_CONFIGURED]:
      'Google Drive credentials (Client ID/Secret) are not configured in settings.',
    [backupMessagesCodes.DRIVE_NOT_CONNECTED]:
      'No Google Drive account is connected — connect an account first.',
    [backupMessagesCodes.DRIVE_AUTH_FAILED]:
      'Google Drive authentication failed — reconnect the account.',
    [backupMessagesCodes.DRIVE_STATE_MISMATCH]:
      'Could not verify the Google Drive connection request (state mismatch) — try again from the connect button.',
    [backupMessagesCodes.DRIVE_UPLOAD_FAILED]:
      'Failed to upload the backup to Google Drive.',
    [backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND]: 'Account not found.',
    [backupMessagesCodes.DRIVE_ACCOUNT_HAS_BACKUPS]:
      'The account cannot be deleted because backups are linked to it.',
    [backupMessagesCodes.DRIVE_RECONNECT_REQUIRED]:
      'Reconnect the Google Drive account linked to this backup, then try again.',
    [backupMessagesCodes.DRIVE_RECONNECT_IDENTITY_MISMATCH]:
      'The account you authorized differs from the account to be reconnected.',
    [backupMessagesCodes.DRIVE_ACCOUNT_REMOVED]:
      'Google Drive account removed.',
    [backupMessagesCodes.DRIVE_ACCOUNT_ACTIVATED]:
      'The account is now set as the active upload account.',
    [backupMessagesCodes.DRIVE_ACCOUNT_DISCONNECTED]:
      'Google Drive account disconnected.',
    [backupMessagesCodes.DRIVE_ACCOUNT_CHECKED]: 'Connection status checked.',
    [backupMessagesCodes.STORAGE_UPLOAD_FAILED]:
      'Failed to upload the backup to the storage destination.',

    // Encryption keys (EncryptionKey) stored on Drive
    [backupMessagesCodes.ENCRYPTION_KEY_NOT_FOUND]: 'Encryption key not found.',
    [backupMessagesCodes.ENCRYPTION_KEY_GENERATED]:
      'A new encryption key was generated.',
    [backupMessagesCodes.ENCRYPTION_KEY_SAVED]:
      'Encryption key saved to Google Drive.',
    [backupMessagesCodes.ENCRYPTION_KEY_DELETED]: 'Encryption key deleted.',
    [backupMessagesCodes.ENCRYPTION_KEY_PRIMARY_SET]:
      'Primary key for automatic backups was set.',
    [backupMessagesCodes.ENCRYPTION_KEY_INVALID]:
      'Invalid encryption key (it must be 32 bytes after base64 decoding).',
    [backupMessagesCodes.KEY_FILE_MISSING]:
      'The key file is missing on Drive — this backup cannot be restored with this key.',
    [backupMessagesCodes.KEY_FINGERPRINT_MISMATCH]:
      'The key file fingerprint does not match the expected one — wrong key.',
    [backupMessagesCodes.NO_PRIMARY_KEY]:
      'There is no primary encryption key — create one and set it as primary first.',

    // Account types + connection state
    [backupMessagesCodes.ACCOUNT_TYPE_LOCKED]:
      'The account type is locked because data is linked to it — it cannot be changed.',
    [backupMessagesCodes.KEY_ACCOUNT_REQUIRED]:
      'This action requires a key account (KEY).',
    [backupMessagesCodes.DB_ACCOUNT_REQUIRED]:
      'This action requires a backup account (DB).',
    [backupMessagesCodes.KEY_ACCOUNT_DISCONNECTED]:
      'The key account is disconnected — reconnect it and try again.',
    [backupMessagesCodes.DB_ACCOUNT_DISCONNECTED]:
      'The backup (DB) account is disconnected — reconnect it and try again.',
    [backupMessagesCodes.ACCOUNTS_RECONNECT_REQUIRED]:
      'Restore requires reconnecting one or more accounts, then retrying.',
  },
  // ── whiteboard-messages ───────────────────────────────────────────────────
  [messagesNames.whiteboardMessages]: {
    [whiteboardMessagesCodes.SESSION_NOT_FOUND]: 'Session not found',
    [whiteboardMessagesCodes.SESSION_CREATED]: 'Session created',
    [whiteboardMessagesCodes.SESSION_DELETED]: 'Session deleted',
    [whiteboardMessagesCodes.SESSION_ACTIVATED]: 'Session opened',
    [whiteboardMessagesCodes.SESSION_ENDED]: 'Session ended',
    [whiteboardMessagesCodes.SESSION_MADE_PUBLIC]: 'Session is now public',
    [whiteboardMessagesCodes.SESSION_MADE_PRIVATE]: 'Session is now private',
    [whiteboardMessagesCodes.STUDENT_ADDED]: 'Student added',
    [whiteboardMessagesCodes.STUDENT_REMOVED]: 'Student removed',
    [whiteboardMessagesCodes.STUDENT_ALREADY_ADDED]: 'Student already added',
    [whiteboardMessagesCodes.STUDENT_NOT_IN_SESSION]:
      'Student is not in the session',
    [whiteboardMessagesCodes.NOT_A_STUDENT]:
      'Selected account is not a student',
    [whiteboardMessagesCodes.TITLE_REQUIRED]: 'Session title is required',
    [whiteboardMessagesCodes.STUDENT_ID_INVALID]: 'Invalid student id',
    [whiteboardMessagesCodes.IMAGE_NOT_FOUND]: 'Image not found',
    [whiteboardMessagesCodes.IMAGE_REQUIRED]: 'Image is required',
    [whiteboardMessagesCodes.IMAGE_FORBIDDEN]: 'You cannot access this image',
    [whiteboardMessagesCodes.BOARD_DATA_SAVED]: 'Board data saved',
    [whiteboardMessagesCodes.LIBRARY_LOADED]: 'Whiteboard library loaded',
    [whiteboardMessagesCodes.LIBRARY_SAVED]: 'Whiteboard library saved',
    [whiteboardMessagesCodes.LIBRARY_ITEMS_INVALID]:
      'The whiteboard library data is invalid',
  },
};

export const messagesCodes = { ar, en };
