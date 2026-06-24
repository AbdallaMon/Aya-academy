// Feature-local text for the Backups screen.
//
// Kept inside the feature (NOT registered in the shared i18n barrels) so this
// port does not touch any shared locale file. Two tables:
//   - backupMessages : backend message CODE -> { ar, en } string (toast text).
//   - backupsData     : UI strings for the 3 tabs (read via useBackupsText()).
//
// Mirrors C:\coding\asmaa\web\src\shared\data\messages\domain\backupMessages.js.

import { backupMessagesCodes } from "@aya/shared";

export const backupMessages = {
  ar: {
    // backup + restore
    [backupMessagesCodes.NOT_FOUND]: "النسخة الاحتياطية غير موجودة.",
    [backupMessagesCodes.CREATED]: "تم إنشاء النسخة الاحتياطية بنجاح.",
    [backupMessagesCodes.FAILED]: "فشل إنشاء النسخة الاحتياطية.",
    [backupMessagesCodes.FILE_MISSING]:
      "ملف النسخة الاحتياطية غير متوفّر على الجهاز.",
    [backupMessagesCodes.RESTORE_DONE]: "تم استرجاع قاعدة البيانات بنجاح.",
    [backupMessagesCodes.RESTORE_FAILED]: "فشل استرجاع قاعدة البيانات.",
    [backupMessagesCodes.RESTORE_CONFIRM_REQUIRED]:
      "هذه عملية مدمّرة — يجب تأكيدها صراحةً قبل التنفيذ.",
    [backupMessagesCodes.DB_CONNECT_FAILED]:
      "تعذّر الاتصال بقاعدة البيانات لإنشاء النسخة الاحتياطية — تأكّد من تشغيل MySQL وصحّة DATABASE_URL.",
    [backupMessagesCodes.RESTORE_DB_CONNECT_FAILED]:
      "تعذّر الاتصال بقاعدة البيانات لاسترجاع النسخة — تأكّد من تشغيل MySQL وصحّة DATABASE_URL.",
    [backupMessagesCodes.OPERATION_IN_PROGRESS]:
      "توجد عملية نسخ أو استرجاع جارية — انتظر حتى تنتهي ثم أعد المحاولة.",
    [backupMessagesCodes.RESTORE_SOURCE_UNAVAILABLE]:
      "لا توجد نسخة قابلة للاسترجاع (الملف مفقود محليًا وعلى Drive).",
    [backupMessagesCodes.DELETED]: "تم حذف النسخة الاحتياطية.",

    // per-row restore-blocked reasons
    [backupMessagesCodes.FILE_MISSING_LOCAL]:
      "الملف المحلي لهذه النسخة محذوف ولا يوجد حساب Drive مرتبط لاستعادته.",
    [backupMessagesCodes.NO_LINKED_ACCOUNT]:
      "لا يوجد حساب Google Drive مرتبط ومتصل بهذه النسخة لاستعادة ملفها.",
    [backupMessagesCodes.STORAGE_KEY_MISSING]:
      "لا يوجد مرجع تخزين لهذه النسخة — لا يمكن تحديد موضع ملفها.",
    [backupMessagesCodes.NOT_SUCCESSFUL]:
      "هذه النسخة لم تكتمل بنجاح — لا يوجد ملف قابل للاسترجاع.",

    // schema check + external restore
    [backupMessagesCodes.RESTORE_SCHEMA_MISMATCH]:
      "بنية الملف لا تطابق قاعدة البيانات الحالية — لا يمكن الاسترجاع.",
    [backupMessagesCodes.RESTORE_EXTERNAL_INVALID_KEY]:
      "مفتاح التشفير غير صالح (يجب أن يكون 32 بايت بعد فكّ base64).",
    [backupMessagesCodes.RESTORE_EXTERNAL_DECRYPT_FAILED]:
      "تعذّر فكّ تشفير الملف — مفتاح خاطئ أو ملف تالف.",
    [backupMessagesCodes.RESTORE_EXTERNAL_CHECKED]: "تم فحص الملف بنجاح.",
    [backupMessagesCodes.EXTERNAL_CHECK_TOKEN_INVALID]:
      "انتهت صلاحية جلسة الفحص — أعد رفع الملف وافحصه من جديد.",
    [backupMessagesCodes.EXTERNAL_FILE_REQUIRED]:
      "يجب اختيار ملف النسخة (.enc) أولًا.",
    [backupMessagesCodes.EXTERNAL_FILE_INVALID_TYPE]:
      "صيغة الملف غير مدعومة — يجب ملف بامتداد .enc.",
    [backupMessagesCodes.EXTERNAL_FILE_TOO_LARGE]:
      "حجم الملف كبير جدًا (الحدّ الأقصى 200 ميجابايت).",

    // Google Drive (multi-account) + S3
    [backupMessagesCodes.DRIVE_NOT_CONFIGURED]:
      "لم يتم ضبط بيانات Google Drive (Client ID/Secret) في الإعدادات.",
    [backupMessagesCodes.DRIVE_NOT_CONNECTED]:
      "حساب Google Drive غير مربوط — اربط الحساب أولًا.",
    [backupMessagesCodes.DRIVE_AUTH_FAILED]:
      "فشلت مصادقة Google Drive — أعد ربط الحساب.",
    [backupMessagesCodes.DRIVE_STATE_MISMATCH]:
      "تعذّر التحقّق من طلب ربط Google Drive (state غير مطابق) — أعد المحاولة من زر الربط.",
    [backupMessagesCodes.DRIVE_UPLOAD_FAILED]:
      "فشل رفع النسخة على Google Drive.",
    [backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND]: "الحساب غير موجود.",
    [backupMessagesCodes.DRIVE_ACCOUNT_HAS_BACKUPS]:
      "لا يمكن حذف الحساب لوجود نسخ مرتبطة به.",
    [backupMessagesCodes.DRIVE_RECONNECT_REQUIRED]:
      "يتطلّب إعادة الاتصال بحساب Google Drive المرتبط بهذه النسخة ثم المحاولة مجددًا.",
    [backupMessagesCodes.DRIVE_RECONNECT_IDENTITY_MISMATCH]:
      "الحساب الذي صرّحت به يختلف عن الحساب المطلوب إعادة ربطه.",
    [backupMessagesCodes.DRIVE_ACCOUNT_REMOVED]: "تم حذف حساب Google Drive.",
    [backupMessagesCodes.DRIVE_ACCOUNT_ACTIVATED]:
      "تم تعيين الحساب كحساب مُفعّل للرفع.",
    [backupMessagesCodes.DRIVE_ACCOUNT_DISCONNECTED]:
      "تم فصل حساب Google Drive.",
    [backupMessagesCodes.DRIVE_ACCOUNT_CHECKED]: "تم فحص حالة الاتصال.",
    [backupMessagesCodes.STORAGE_UPLOAD_FAILED]:
      "فشل رفع النسخة إلى وجهة التخزين.",

    // encryption keys (EncryptionKey) stored on Drive
    [backupMessagesCodes.ENCRYPTION_KEY_NOT_FOUND]: "مفتاح التشفير غير موجود.",
    [backupMessagesCodes.ENCRYPTION_KEY_GENERATED]: "تم توليد مفتاح تشفير جديد.",
    [backupMessagesCodes.ENCRYPTION_KEY_SAVED]:
      "تم حفظ مفتاح التشفير على Google Drive.",
    [backupMessagesCodes.ENCRYPTION_KEY_DELETED]: "تم حذف مفتاح التشفير.",
    [backupMessagesCodes.ENCRYPTION_KEY_PRIMARY_SET]:
      "تم تعيين المفتاح الأساسي للنسخ التلقائية.",
    [backupMessagesCodes.ENCRYPTION_KEY_INVALID]:
      "مفتاح التشفير غير صالح (يجب أن يكون 32 بايت بعد فكّ base64).",
    [backupMessagesCodes.KEY_FILE_MISSING]:
      "ملف المفتاح مفقود على Drive — لا يمكن الاسترجاع بهذا المفتاح.",
    [backupMessagesCodes.KEY_FINGERPRINT_MISMATCH]:
      "بصمة ملف المفتاح لا تطابق المتوقّع — المفتاح غير صحيح.",
    [backupMessagesCodes.NO_PRIMARY_KEY]:
      "لا يوجد مفتاح تشفير أساسي — أنشئ مفتاحًا وعيّنه أساسيًّا أولًا.",

    // account types + connection state
    [backupMessagesCodes.ACCOUNT_TYPE_LOCKED]:
      "نوع الحساب مُثبَّت لوجود بيانات مرتبطة به — لا يمكن تغييره.",
    [backupMessagesCodes.KEY_ACCOUNT_REQUIRED]:
      "هذا الإجراء يتطلّب حساب مفاتيح (KEY).",
    [backupMessagesCodes.DB_ACCOUNT_REQUIRED]:
      "هذا الإجراء يتطلّب حساب نسخ (DB).",
    [backupMessagesCodes.KEY_ACCOUNT_DISCONNECTED]:
      "حساب المفتاح مفصول — أعد ربطه ثم أعد المحاولة.",
    [backupMessagesCodes.DB_ACCOUNT_DISCONNECTED]:
      "حساب النسخ (DB) مفصول — أعد ربطه ثم أعد المحاولة.",
    [backupMessagesCodes.ACCOUNTS_RECONNECT_REQUIRED]:
      "يتطلّب الاسترجاع إعادة ربط حساب أو أكثر ثم إعادة المحاولة.",
  },
  en: {
    // Backup + restore
    [backupMessagesCodes.NOT_FOUND]: "Backup not found.",
    [backupMessagesCodes.CREATED]: "Backup created successfully.",
    [backupMessagesCodes.FAILED]: "Backup creation failed.",
    [backupMessagesCodes.FILE_MISSING]:
      "The backup file is not available on this machine.",
    [backupMessagesCodes.RESTORE_DONE]: "Database restored successfully.",
    [backupMessagesCodes.RESTORE_FAILED]: "Database restore failed.",
    [backupMessagesCodes.RESTORE_CONFIRM_REQUIRED]:
      "This is a destructive operation — it must be explicitly confirmed before running.",
    [backupMessagesCodes.DB_CONNECT_FAILED]:
      "Could not connect to the database to create the backup — make sure MySQL is running and DATABASE_URL is correct.",
    [backupMessagesCodes.RESTORE_DB_CONNECT_FAILED]:
      "Could not connect to the database to restore the backup — make sure MySQL is running and DATABASE_URL is correct.",
    [backupMessagesCodes.OPERATION_IN_PROGRESS]:
      "A backup or restore operation is already in progress — wait for it to finish and try again.",
    [backupMessagesCodes.RESTORE_SOURCE_UNAVAILABLE]:
      "No restorable backup is available (the file is missing both locally and on Drive).",
    [backupMessagesCodes.DELETED]: "Backup deleted.",

    // Reasons a restore is unavailable (per row)
    [backupMessagesCodes.FILE_MISSING_LOCAL]:
      "The local file for this backup was deleted and there is no linked Drive account to restore it from.",
    [backupMessagesCodes.NO_LINKED_ACCOUNT]:
      "No connected Google Drive account is linked to this backup to restore its file.",
    [backupMessagesCodes.STORAGE_KEY_MISSING]:
      "This backup has no storage reference — its file location cannot be determined.",
    [backupMessagesCodes.NOT_SUCCESSFUL]:
      "This backup did not complete successfully — there is no restorable file.",

    // Schema check + external restore
    [backupMessagesCodes.RESTORE_SCHEMA_MISMATCH]:
      "The file structure does not match the current database — restore is not possible.",
    [backupMessagesCodes.RESTORE_EXTERNAL_INVALID_KEY]:
      "Invalid encryption key (it must be 32 bytes after base64 decoding).",
    [backupMessagesCodes.RESTORE_EXTERNAL_DECRYPT_FAILED]:
      "Could not decrypt the file — wrong key or corrupted file.",
    [backupMessagesCodes.RESTORE_EXTERNAL_CHECKED]: "File checked successfully.",
    [backupMessagesCodes.EXTERNAL_CHECK_TOKEN_INVALID]:
      "The check session expired — re-upload the file and check it again.",
    [backupMessagesCodes.EXTERNAL_FILE_REQUIRED]:
      "Please choose the backup file (.enc) first.",
    [backupMessagesCodes.EXTERNAL_FILE_INVALID_TYPE]:
      "Unsupported file format — a file with a .enc extension is required.",
    [backupMessagesCodes.EXTERNAL_FILE_TOO_LARGE]:
      "The file is too large (maximum 200 MB).",

    // Google Drive (multi-account) + S3
    [backupMessagesCodes.DRIVE_NOT_CONFIGURED]:
      "Google Drive credentials (Client ID/Secret) are not configured in settings.",
    [backupMessagesCodes.DRIVE_NOT_CONNECTED]:
      "No Google Drive account is connected — connect an account first.",
    [backupMessagesCodes.DRIVE_AUTH_FAILED]:
      "Google Drive authentication failed — reconnect the account.",
    [backupMessagesCodes.DRIVE_STATE_MISMATCH]:
      "Could not verify the Google Drive connection request (state mismatch) — try again from the connect button.",
    [backupMessagesCodes.DRIVE_UPLOAD_FAILED]:
      "Failed to upload the backup to Google Drive.",
    [backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND]: "Account not found.",
    [backupMessagesCodes.DRIVE_ACCOUNT_HAS_BACKUPS]:
      "The account cannot be deleted because backups are linked to it.",
    [backupMessagesCodes.DRIVE_RECONNECT_REQUIRED]:
      "Reconnect the Google Drive account linked to this backup, then try again.",
    [backupMessagesCodes.DRIVE_RECONNECT_IDENTITY_MISMATCH]:
      "The account you authorized differs from the account to be reconnected.",
    [backupMessagesCodes.DRIVE_ACCOUNT_REMOVED]: "Google Drive account removed.",
    [backupMessagesCodes.DRIVE_ACCOUNT_ACTIVATED]:
      "The account is now set as the active upload account.",
    [backupMessagesCodes.DRIVE_ACCOUNT_DISCONNECTED]:
      "Google Drive account disconnected.",
    [backupMessagesCodes.DRIVE_ACCOUNT_CHECKED]: "Connection status checked.",
    [backupMessagesCodes.STORAGE_UPLOAD_FAILED]:
      "Failed to upload the backup to the storage destination.",

    // Encryption keys (EncryptionKey) stored on Drive
    [backupMessagesCodes.ENCRYPTION_KEY_NOT_FOUND]: "Encryption key not found.",
    [backupMessagesCodes.ENCRYPTION_KEY_GENERATED]:
      "A new encryption key was generated.",
    [backupMessagesCodes.ENCRYPTION_KEY_SAVED]:
      "Encryption key saved to Google Drive.",
    [backupMessagesCodes.ENCRYPTION_KEY_DELETED]: "Encryption key deleted.",
    [backupMessagesCodes.ENCRYPTION_KEY_PRIMARY_SET]:
      "Primary key for automatic backups was set.",
    [backupMessagesCodes.ENCRYPTION_KEY_INVALID]:
      "Invalid encryption key (it must be 32 bytes after base64 decoding).",
    [backupMessagesCodes.KEY_FILE_MISSING]:
      "The key file is missing on Drive — this backup cannot be restored with this key.",
    [backupMessagesCodes.KEY_FINGERPRINT_MISMATCH]:
      "The key file fingerprint does not match the expected one — wrong key.",
    [backupMessagesCodes.NO_PRIMARY_KEY]:
      "There is no primary encryption key — create one and set it as primary first.",

    // Account types + connection state
    [backupMessagesCodes.ACCOUNT_TYPE_LOCKED]:
      "The account type is locked because data is linked to it — it cannot be changed.",
    [backupMessagesCodes.KEY_ACCOUNT_REQUIRED]:
      "This action requires a key account (KEY).",
    [backupMessagesCodes.DB_ACCOUNT_REQUIRED]:
      "This action requires a backup account (DB).",
    [backupMessagesCodes.KEY_ACCOUNT_DISCONNECTED]:
      "The key account is disconnected — reconnect it and try again.",
    [backupMessagesCodes.DB_ACCOUNT_DISCONNECTED]:
      "The backup (DB) account is disconnected — reconnect it and try again.",
    [backupMessagesCodes.ACCOUNTS_RECONNECT_REQUIRED]:
      "Restore requires reconnecting one or more accounts, then retrying.",
  },
};

// ===========================================================================
// backupsData — UI strings for the Backups screen (3 tabs: backups/accounts/keys).
// These are interface strings (not backend codes). Read in the feature via
// useBackupsText(), which picks backupsData[lng]. Kept feature-local (not
// registered in the shared i18n barrels).
// ===========================================================================
export const backupsData = {
  ar: {
    pageTitle: "النسخ الاحتياطية",
    pageDescription:
      "تشغيل نسخة فورية، متابعة حالة النظام، إدارة حسابات Google Drive ومفاتيح التشفير، واسترجاع قاعدة البيانات.",

    // tabs
    tabBackups: "النسخ والاسترجاع",
    tabAccounts: "الحسابات",
    tabKeys: "المفاتيح",

    // no-primary-key warning (backups tab)
    noPrimaryKeyWarning:
      "لا يوجد مفتاح تشفير أساسي — ستُتخطّى النسخ التلقائية المجدولة. عيّن مفتاحًا أساسيًّا من تبويب «المفاتيح».",
    noKeysWarning:
      "لا توجد مفاتيح تشفير — ستُتخطّى النسخ التلقائية المجدولة. أنشئ مفتاحًا وعيّنه أساسيًّا من تبويب «المفاتيح».",
    goToKeysAction: "الذهاب إلى المفاتيح",

    // status card
    statusTitle: "حالة النظام",
    lastSuccessful: "آخر نسخة ناجحة",
    lastSuccessfulFile: "ملف آخر نسخة",
    scheduledTime: "موعد النسخ المجدول",
    activeAccount: "الحساب المُفعّل للرفع",
    accountsCount: "عدد الحسابات",
    noBackupsYet: "لا توجد نسخة ناجحة بعد.",
    noActiveAccount: "لا يوجد حساب مُفعّل.",
    noScheduledTime: "غير مجدول.",
    refresh: "تحديث",

    // run now
    runNowTitle: "تشغيل نسخة احتياطية الآن",
    runNowHint:
      "تُنشئ نسخة فورية وتُرفع إلى وجهة التخزين المُفعّلة. قد تستغرق بعض الوقت.",
    runNowButton: "تشغيل نسخة الآن",
    runNowConfirmTitle: "تشغيل نسخة احتياطية",
    runNowConfirmBody: "سيتم إنشاء نسخة احتياطية جديدة الآن. هل تريد المتابعة؟",
    runNowConfirm: "تشغيل",

    // choose key for a manual backup
    runNowKeyTitle: "اختر مفتاح التشفير",
    runNowKeyHint:
      "تُشفّر النسخة بالمفتاح المختار. تُتاح المفاتيح التي حسابها متّصل فقط.",
    runNowKeyChoose: "المفتاح",
    runNowNoKeys: "لا توجد مفاتيح تشفير. أنشئ مفتاحًا من تبويب «المفاتيح» أولًا.",
    runNowGoToKeys: "الذهاب إلى المفاتيح",
    runNowKeyDisconnectedTip: "أعد ربط الحساب",
    runNowSelectKey: "اختر مفتاحًا",
    primaryBadge: "أساسي",

    // history table
    historyTitle: "سجل النسخ",
    createdAt: "التاريخ",
    fileName: "اسم الملف",
    trigger: "النوع",
    status: "الحالة",
    provider: "الوجهة",
    location: "التواجد",
    keyColumn: "المفتاح",
    dbAccountColumn: "حساب النسخ",
    colActions: "إجراءات",
    actions: "إجراءات",
    noData: "لا توجد نسخ احتياطية.",
    view: "عرض",
    noKey: "بلا مفتاح",
    noAccount: "—",

    // enum values: status/trigger/provider/presence
    SUCCESS: "ناجحة",
    FAILED: "فاشلة",
    MANUAL: "يدوية",
    AUTO: "تلقائية",
    drive: "Google Drive",
    local: "محلّي",
    s3: "تخزين سحابي",
    presentLocal: "محلّي",
    presentDrive: "على Drive",
    deleted: "محذوفة",

    // table filters
    statusFilter: "الحالة",
    locationFilter: "التواجد",
    allStatuses: "كل الحالات",
    locationAll: "الكل",
    locationLocal: "محلّي",
    locationDrive: "على Drive",
    locationDeleted: "محذوفة",

    // restore from a row
    restore: "استرجاع",
    restoreTitle: "استرجاع قاعدة البيانات",
    restoreWarning:
      "تحذير: الاسترجاع عملية مدمّرة — سيتم استبدال البيانات الحالية بالكامل بمحتوى هذه النسخة. لا يمكن التراجع.",
    restoreConfirmCheckbox: "أفهم أن هذه العملية مدمّرة وأؤكّد المتابعة.",
    restoreConfirm: "استرجاع الآن",
    restoreUnavailable: "هذه النسخة غير متاحة للاسترجاع (الملف مفقود).",

    // reconnect accounts before restore
    reconnectTitle: "إعادة ربط الحسابات",
    reconnectBody:
      "يتطلّب استرجاع هذه النسخة إعادة ربط الحساب (الحسابات) التالية ثم إعادة المحاولة:",
    reconnectAccount: "إعادة ربط",
    retryRestore: "إعادة محاولة الاسترجاع",
    typeKey: "مفاتيح",
    typeDb: "نسخ",

    // delete a backup
    deleteBackup: "حذف النسخة",
    deleteBackupTitle: "حذف النسخة الاحتياطية",
    deleteBackupBody:
      "سيتم حذف هذه النسخة وملفها (محليًا وعلى Drive إن أمكن) نهائيًا. لا يمكن التراجع. هل تريد المتابعة؟",
    deleteBackupConfirm: "حذف",

    // Drive accounts
    driveTitle: "حسابات Google Drive",
    driveHint:
      "اربط حسابات النسخ (DB) وحسابات المفاتيح (KEY). الحساب المُستخدم للنسخ التلقائي هو وجهة رفع النسخ المجدولة تلقائيًّا.",
    connectDrive: "ربط حساب جديد",
    connectChooseType: "اختر نوع الحساب",
    connectTypeKey: "حساب مفاتيح (KEY)",
    connectTypeDb: "حساب نسخ (DB)",
    connectTypeKeyHint: "يخزّن ملفات مفاتيح التشفير على Drive.",
    connectTypeDbHint: "يخزّن ملفات النسخ الاحتياطية على Drive.",
    accountEmail: "البريد",
    accountLabel: "التسمية",
    accountStatus: "الحالة",
    connected: "متصل",
    disconnected: "يتطلّب إعادة ربط",
    activeBadge: "الحساب المستخدم للنسخ التلقائي",
    setActive: "تعيين كحساب النسخ التلقائي",
    checkConnection: "فحص الاتصال",
    disconnect: "فصل",
    reconnect: "إعادة ربط",
    deleteAccount: "حذف الحساب",
    deleteAccountTitle: "حذف حساب Drive",
    deleteAccountBody: "سيتم حذف هذا الحساب نهائيًا. هل تريد المتابعة؟",
    deleteAccountConfirm: "حذف",
    noAccounts: "لا توجد حسابات مربوطة بعد.",
    driveConnected: "تم ربط حساب Google Drive بنجاح.",
    driveError: "تعذّر ربط حساب Google Drive.",
    accountsSearchPlaceholder: "ابحث بالبريد أو التسمية…",
    accountsTypeFilter: "النوع",
    accountsTypeAll: "الكل",
    noAccountsFiltered: "لا توجد حسابات مطابقة للبحث.",

    // external restore
    externalTitle: "استرجاع من ملف خارجي (.enc)",
    externalHint:
      "ارفع ملف نسخة احتياطية مشفّر (.enc) وزوّدنا بالمفتاح (نصًّا أو بملف .pem). سنفحص توافقه مع قاعدة البيانات قبل السماح بالاسترجاع.",
    pickFile: "اختيار ملف .enc",
    selectedFile: "الملف المختار",
    keyChoice: "طريقة إدخال المفتاح",
    keyTyped: "كتابة المفتاح",
    keyPem: "رفع ملف مفتاح (.pem)",
    externalKey: "المفتاح (base64، 32 بايت)",
    pickPemFile: "اختيار ملف .pem",
    pemLoaded: "تم تحميل المفتاح من الملف.",
    pemReadError: "تعذّر قراءة ملف المفتاح.",
    checkFile: "فحص الملف",
    checkResultTitle: "نتيجة الفحص",
    schemaOk: "بنية الملف متوافقة مع قاعدة البيانات.",
    schemaMismatch: "بنية الملف لا تطابق قاعدة البيانات — لا يمكن الاسترجاع.",
    missingTables: "جداول ناقصة",
    extraTables: "جداول زائدة",
    columnDiffs: "اختلافات في الأعمدة",
    externalRestoreWarning:
      "تحذير: الاسترجاع من ملف خارجي عملية مدمّرة — سيتم استبدال البيانات الحالية بالكامل. لا يمكن التراجع.",
    externalCommit: "استرجاع من هذا الملف",
    externalCommitConfirm: "استرجاع الآن",
    externalReset: "إلغاء واختيار ملف آخر",

    // keys (tab)
    keysTitle: "مفاتيح التشفير",
    keysHint:
      "تُولَّد المفاتيح وتُحفظ على حساب مفاتيح (KEY) على Drive. لا نخزّن مادة المفتاح في النظام — احفظها بنفسك.",
    generateKey: "توليد مفتاح",
    generateKeyTitle: "توليد مفتاح تشفير جديد",
    generatedKeyLabel: "المفتاح المولّد (base64)",
    copyKey: "نسخ المفتاح",
    keyCopied: "تم نسخ المفتاح.",
    generateWarning:
      "احفظ هذا المفتاح في مكان آمن — لن يظهر مرة أخرى بعد إغلاق النافذة.",
    saveKeyTitle: "حفظ المفتاح على حساب Drive",
    saveKeyName: "اسم المفتاح",
    saveKeyKey: "المفتاح (base64)",
    saveKeyAccount: "حساب المفاتيح (KEY)",
    saveKeySelectAccount: "اختر حساب مفاتيح متّصل",
    saveKeyNoAccounts:
      "لا يوجد حساب مفاتيح (KEY) متّصل. اربط حساب مفاتيح من تبويب «الحسابات» أولًا.",
    saveKeySubmit: "حفظ المفتاح",
    generateAndSave: "توليد ثم حفظ مفتاح",
    keyNameColumn: "الاسم",
    keyAccountColumn: "حساب المفتاح",
    keyFingerprintColumn: "البصمة",
    keyStatusColumn: "الحالة",
    setPrimary: "تعيين كأساسي",
    setPrimaryConfirmBody:
      "سيصبح هذا المفتاح الأساسي للنسخ التلقائية المجدولة (مفتاح أساسي واحد فقط). هل تريد المتابعة؟",
    deleteKey: "حذف المفتاح",
    deleteKeyTitle: "حذف مفتاح التشفير",
    deleteKeyBody:
      "سيتم حذف سجل المفتاح ومحاولة حذف ملفه على Drive. النسخ المشفّرة بهذا المفتاح قد تصبح غير قابلة للاسترجاع. هل تريد المتابعة؟",
    deleteKeyConfirm: "حذف",
    noKeys: "لا توجد مفاتيح تشفير بعد.",
    keyBadgeAccount: "مفاتيح",
  },
  en: {
    pageTitle: "Backups",
    pageDescription:
      "Run an immediate backup, monitor system status, manage Google Drive accounts and encryption keys, and restore the database.",

    // Page tabs
    tabBackups: "Backups & restore",
    tabAccounts: "Accounts",
    tabKeys: "Keys",

    // No-primary-key warning (Backups tab)
    noPrimaryKeyWarning:
      "There is no primary encryption key — scheduled automatic backups will be skipped. Set a primary key from the Keys tab.",
    noKeysWarning:
      "There are no encryption keys — scheduled automatic backups will be skipped. Create a key and set it as primary from the Keys tab.",
    goToKeysAction: "Go to Keys",

    statusTitle: "System status",
    lastSuccessful: "Last successful backup",
    lastSuccessfulFile: "Last backup file",
    scheduledTime: "Scheduled backup time",
    activeAccount: "Active upload account",
    accountsCount: "Accounts",
    noBackupsYet: "No successful backup yet.",
    noActiveAccount: "No active account.",
    noScheduledTime: "Not scheduled.",
    refresh: "Refresh",

    runNowTitle: "Run a backup now",
    runNowHint:
      "Creates an immediate backup and uploads it to the active storage destination. May take a while.",
    runNowButton: "Run backup now",
    runNowConfirmTitle: "Run backup",
    runNowConfirmBody: "A new backup will be created now. Continue?",
    runNowConfirm: "Run",

    runNowKeyTitle: "Choose an encryption key",
    runNowKeyHint:
      "The backup is encrypted with the chosen key. Only keys whose account is connected are selectable.",
    runNowKeyChoose: "Key",
    runNowNoKeys: "No encryption keys. Create one from the Keys tab first.",
    runNowGoToKeys: "Go to Keys",
    runNowKeyDisconnectedTip: "Reconnect the account",
    runNowSelectKey: "Select a key",
    primaryBadge: "Primary",

    historyTitle: "Backup history",
    createdAt: "Date",
    fileName: "File name",
    trigger: "Type",
    status: "Status",
    provider: "Destination",
    location: "Presence",
    keyColumn: "Key",
    dbAccountColumn: "Backup account",
    colActions: "Actions",
    actions: "Actions",
    noData: "No backups.",
    view: "View",
    noKey: "No key",
    noAccount: "—",

    SUCCESS: "Successful",
    FAILED: "Failed",
    MANUAL: "Manual",
    AUTO: "Automatic",
    drive: "Google Drive",
    local: "Local",
    s3: "Cloud storage",
    presentLocal: "Local",
    presentDrive: "On Drive",
    deleted: "Deleted",

    statusFilter: "Status",
    locationFilter: "Presence",
    allStatuses: "All statuses",
    locationAll: "All",
    locationLocal: "Local",
    locationDrive: "On Drive",
    locationDeleted: "Deleted",

    restore: "Restore",
    restoreTitle: "Restore database",
    restoreWarning:
      "Warning: restore is a destructive operation — current data will be fully replaced by this backup's contents. This cannot be undone.",
    restoreConfirmCheckbox:
      "I understand this is destructive and confirm I want to proceed.",
    restoreConfirm: "Restore now",
    restoreUnavailable: "This backup is not restorable (file is missing).",

    // Reconnect accounts before restore
    reconnectTitle: "Reconnect accounts",
    reconnectBody:
      "Restoring this backup requires reconnecting the following account(s), then retrying:",
    reconnectAccount: "Reconnect",
    retryRestore: "Retry restore",
    typeKey: "Key",
    typeDb: "DB",

    // Delete a backup from history
    deleteBackup: "Delete backup",
    deleteBackupTitle: "Delete backup",
    deleteBackupBody:
      "This backup and its file (locally and on Drive where possible) will be permanently deleted. This cannot be undone. Continue?",
    deleteBackupConfirm: "Delete",

    driveTitle: "Google Drive accounts",
    driveHint:
      "Connect backup (DB) and key (KEY) accounts. The auto-backup account is the destination for scheduled automatic backups.",
    connectDrive: "Connect new account",
    connectChooseType: "Choose account type",
    connectTypeKey: "Key account (KEY)",
    connectTypeDb: "Backup account (DB)",
    connectTypeKeyHint: "Stores encryption key files on Drive.",
    connectTypeDbHint: "Stores backup files on Drive.",
    accountEmail: "Email",
    accountLabel: "Label",
    accountStatus: "Status",
    connected: "Connected",
    disconnected: "Needs reconnect",
    activeBadge: "Auto-backup account",
    setActive: "Use for automatic backups",
    checkConnection: "Check connection",
    disconnect: "Disconnect",
    reconnect: "Reconnect",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete Drive account",
    deleteAccountBody: "This account will be permanently deleted. Continue?",
    deleteAccountConfirm: "Delete",
    noAccounts: "No connected accounts yet.",
    driveConnected: "Google Drive account connected successfully.",
    driveError: "Could not connect the Google Drive account.",
    accountsSearchPlaceholder: "Search by email or label…",
    accountsTypeFilter: "Type",
    accountsTypeAll: "All",
    noAccountsFiltered: "No accounts match the search.",

    externalTitle: "Restore from external file (.enc)",
    externalHint:
      "Upload an encrypted backup file (.enc) and provide the key (typed or via a .pem file). We will verify it matches the database before allowing a restore.",
    pickFile: "Choose .enc file",
    selectedFile: "Selected file",
    keyChoice: "Key input method",
    keyTyped: "Type the key",
    keyPem: "Upload key file (.pem)",
    externalKey: "Key (base64, 32 bytes)",
    pickPemFile: "Choose .pem file",
    pemLoaded: "Key loaded from file.",
    pemReadError: "Could not read the key file.",
    checkFile: "Check file",
    checkResultTitle: "Check result",
    schemaOk: "The file structure matches the database.",
    schemaMismatch:
      "The file structure does not match the database — restore is not possible.",
    missingTables: "Missing tables",
    extraTables: "Extra tables",
    columnDiffs: "Column differences",
    externalRestoreWarning:
      "Warning: restoring from an external file is destructive — current data will be fully replaced. This cannot be undone.",
    externalCommit: "Restore from this file",
    externalCommitConfirm: "Restore now",
    externalReset: "Cancel and pick another file",

    // Keys (tab)
    keysTitle: "Encryption keys",
    keysHint:
      "Keys are generated and stored on a key (KEY) account on Drive. We never store key material in the system — keep a copy yourself.",
    generateKey: "Generate key",
    generateKeyTitle: "Generate a new encryption key",
    generatedKeyLabel: "Generated key (base64)",
    copyKey: "Copy key",
    keyCopied: "Key copied.",
    generateWarning:
      "Save this key somewhere safe — it will not be shown again once this dialog is closed.",
    saveKeyTitle: "Save key to a Drive account",
    saveKeyName: "Key name",
    saveKeyKey: "Key (base64)",
    saveKeyAccount: "Key account (KEY)",
    saveKeySelectAccount: "Choose a connected key account",
    saveKeyNoAccounts:
      "No connected key (KEY) account. Connect one from the Accounts tab first.",
    saveKeySubmit: "Save key",
    generateAndSave: "Generate & save key",
    keyNameColumn: "Name",
    keyAccountColumn: "Key account",
    keyFingerprintColumn: "Fingerprint",
    keyStatusColumn: "Status",
    setPrimary: "Set primary",
    setPrimaryConfirmBody:
      "This key will become the primary key for scheduled automatic backups (only one primary key). Continue?",
    deleteKey: "Delete key",
    deleteKeyTitle: "Delete encryption key",
    deleteKeyBody:
      "The key record will be deleted and its Drive file deletion attempted. Backups encrypted with this key may become unrestorable. Continue?",
    deleteKeyConfirm: "Delete",
    noKeys: "No encryption keys yet.",
    keyBadgeAccount: "Key",
  },
};
