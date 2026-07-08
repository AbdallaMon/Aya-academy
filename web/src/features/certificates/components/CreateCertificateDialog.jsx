"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Box, Divider, Grid } from "@mui/material";
import {
  FormDialog,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { useCertificatesText } from "../config/certificatesText.js";
import {
  CERTIFICATES_URL,
  CERTIFICATE_TEMPLATES_URL,
  BADGES_URL,
  STUDENTS_PICKER_URL,
  STUDENTS_PICKER_PARAMS,
} from "../config/constant.js";
import {
  FORM_ID,
  EMPTY_VALUES,
  buildThemeJson,
} from "./createCertificateDialog/constants.js";
import ContentSection from "./createCertificateDialog/ContentSection.jsx";
import StyleSection from "./createCertificateDialog/StyleSection.jsx";
import LayoutSection from "./createCertificateDialog/LayoutSection.jsx";
import BrandingSection from "./createCertificateDialog/BrandingSection.jsx";
import FooterSection from "./createCertificateDialog/FooterSection.jsx";
import PreviewPanel from "./createCertificateDialog/PreviewPanel.jsx";

export default function CreateCertificateDialog({
  open,
  onClose,
  onSuccess,
  // When set, the student is fixed (e.g. opened from a student-detail page): the
  // picker is hidden and this student is preselected/locked.
  lockedStudentId,
  lockedStudentName,
}) {
  const txt = useCertificatesText();
  const { lng } = useTranslation();

  const { control, handleSubmit, reset, watch, setValue, setError } = useForm({
    defaultValues: EMPTY_VALUES,
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      reset({
        ...EMPTY_VALUES,
        studentId: lockedStudentId ? String(lockedStudentId) : "",
      });
    }
  }, [open, reset, lockedStudentId]);

  // Student picker — admin only endpoint. Fetched lazily when the dialog opens.
  // Skipped entirely when the student is locked (we already know who it is).
  const studentsReq = useRequest({
    url: STUDENTS_PICKER_URL,
    method: "get",
    isPaginated: true,
    autoFetch: open && !lockedStudentId,
    syncToUrl: false,
    initialParams: STUDENTS_PICKER_PARAMS,
  });
  const students = useMemo(() => studentsReq.data || [], [studentsReq.data]);

  // Template picker — admin certificate templates.
  const templatesReq = useRequest({
    url: CERTIFICATE_TEMPLATES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: open,
    syncToUrl: false,
    initialParams: { limit: 100 },
  });
  // GAME templates are auto-applied to game certificates only — never offered in
  // the manual picker.
  const templates = useMemo(
    () => (templatesReq.data || []).filter((t) => t.type !== "GAME"),
    [templatesReq.data],
  );

  // Default-select the isDefault template (if any) once per open, after the
  // templates load. A ref guard keeps this from clobbering a manual choice.
  const defaultedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      defaultedRef.current = false;
      return;
    }
    if (defaultedRef.current || templates.length === 0) return;
    defaultedRef.current = true;
    const def = templates.find((t) => t.isDefault && t.isActive !== false);
    if (def) setValue("templateId", String(def.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templates]);

  // Active-badge picker — only used when the admin toggles "Award a badge?".
  // Fetched lazily when the dialog opens (mirrors AwardBadgeDialog).
  const badgesReq = useRequest({
    url: BADGES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: open,
    syncToUrl: false,
    initialParams: { limit: 100, isActive: true },
  });
  const badges = useMemo(() => badgesReq.data || [], [badgesReq.data]);

  const { fetchData: createCertificate, isLoading: isCreating } = useRequest({
    url: CERTIFICATES_URL,
    method: "post",
    shouldAutoToast: true,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          studentId: txt.studentLabel,
          titleAr: txt.titleArLabel,
          titleEn: txt.titleEnLabel,
          bodyAr: txt.bodyArLabel,
          bodyEn: txt.bodyEnLabel,
          reasonAr: txt.reasonAr,
          reasonEn: txt.reasonEn,
          badgeId: txt.selectBadge,
        },
      }),
  });

  const values = watch();
  const selectedStudent = useMemo(() => {
    if (lockedStudentId) {
      return (
        students.find((s) => String(s.id) === String(lockedStudentId)) || {
          id: lockedStudentId,
          name: lockedStudentName,
        }
      );
    }
    return students.find((s) => String(s.id) === String(values.studentId));
  }, [students, values.studentId, lockedStudentId, lockedStudentName]);
  const selectedTemplate = useMemo(
    () => templates.find((t) => String(t.id) === String(values.templateId)),
    [templates, values.templateId],
  );
  const usingTemplate = Boolean(selectedTemplate);
  const selectedBadge = useMemo(
    () => badges.find((b) => String(b.id) === String(values.badgeId)),
    [badges, values.badgeId],
  );

  // The certificate always uses the student's own saved photo (avatar) — it is
  // pulled automatically, never uploaded into the certificate.
  const previewPhoto = selectedStudent?.avatar || null;

  // Live preview object shaped exactly like the API certificate.
  const previewCertificate = useMemo(() => {
    const base = {
      studentName: selectedStudent?.name || txt.studentPlaceholder,
      issuedAt: new Date().toISOString(),
    };
    if (usingTemplate) {
      return {
        ...base,
        templateId: selectedTemplate.id,
        reasonAr: values.reasonAr,
        reasonEn: values.reasonEn,
        titleAr: values.titleAr,
        titleEn: values.titleEn,
        photo: previewPhoto?.url ? { url: previewPhoto.url } : undefined,
        student: selectedStudent?.avatar ? { avatar: selectedStudent.avatar } : undefined,
        template: {
          headingAr: selectedTemplate.headingAr,
          headingEn: selectedTemplate.headingEn,
          introAr: selectedTemplate.introAr,
          introEn: selectedTemplate.introEn,
          bodyAr: selectedTemplate.bodyAr,
          bodyEn: selectedTemplate.bodyEn,
          congratsAr: selectedTemplate.congratsAr,
          congratsEn: selectedTemplate.congratsEn,
          thanksAr: selectedTemplate.thanksAr,
          thanksEn: selectedTemplate.thanksEn,
          signatureName: selectedTemplate.signatureName,
          signatureTitleAr: selectedTemplate.signatureTitleAr,
          signatureTitleEn: selectedTemplate.signatureTitleEn,
          themeJson: selectedTemplate.themeJson,
        },
      };
    }
    return {
      ...base,
      titleAr: values.titleAr,
      titleEn: values.titleEn,
      bodyAr: values.bodyAr,
      bodyEn: values.bodyEn,
      templateKey: values.templateKey,
      themeJson: buildThemeJson(values),
    };
  }, [values, selectedStudent, selectedTemplate, usingTemplate, previewPhoto, txt.studentPlaceholder]);

  async function submit(v) {
    // Only grant a badge when the toggle is on AND a badge is picked.
    const badgeId =
      v.awardBadge && v.badgeId ? Number(v.badgeId) : undefined;
    if (usingTemplate) {
      const payload = {
        studentId: Number(v.studentId),
        templateId: Number(v.templateId),
        reasonAr: v.reasonAr || undefined,
        reasonEn: v.reasonEn || undefined,
        // Optional title override shown on the certificate alongside the
        // template heading.
        titleAr: v.titleAr || undefined,
        titleEn: v.titleEn || undefined,
        badgeId,
      };
      await createCertificate(null, payload);
      return;
    }
    const payload = {
      studentId: Number(v.studentId),
      titleAr: v.titleAr || undefined,
      titleEn: v.titleEn || undefined,
      bodyAr: v.bodyAr || undefined,
      bodyEn: v.bodyEn || undefined,
      templateKey: v.templateKey,
      themeJson: buildThemeJson(v),
      badgeId,
    };
    await createCertificate(null, payload);
  }

  // At least one title (ar OR en) is required for the free-form (no-template)
  // path. When a template is selected the fixed copy comes from the template, so
  // the title requirement does not apply. RHF passes the current value + the
  // whole form values object to a validate fn.
  const requireTitle = (_value, formValues) =>
    Boolean(formValues.templateId) ||
    Boolean(formValues.titleAr?.trim()) ||
    Boolean(formValues.titleEn?.trim()) ||
    txt.titleRequired;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.createTitle}
      maxWidth="lg"
      loading={isCreating}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <Grid container spacing={3}>
        {/* ── Form ─────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box component="form" id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
            <ContentSection
              control={control}
              values={values}
              setValue={setValue}
              txt={txt}
              lng={lng}
              lockedStudentId={lockedStudentId}
              lockedStudentName={lockedStudentName}
              selectedStudent={selectedStudent}
              students={students}
              templates={templates}
              badges={badges}
              selectedBadge={selectedBadge}
              usingTemplate={usingTemplate}
              requireTitle={requireTitle}
            />

            {!usingTemplate && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <StyleSection
                  control={control}
                  values={values}
                  setValue={setValue}
                  txt={txt}
                />

                <Divider sx={{ my: 2.5 }} />
                <LayoutSection control={control} txt={txt} />

                <Divider sx={{ my: 2.5 }} />
                <BrandingSection control={control} values={values} txt={txt} />

                <Divider sx={{ my: 2.5 }} />
                <FooterSection control={control} values={values} txt={txt} />
              </>
            )}
          </Box>
        </Grid>

        {/* ── Live preview ─────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <PreviewPanel previewCertificate={previewCertificate} txt={txt} />
        </Grid>
      </Grid>
    </FormDialog>
  );
}
