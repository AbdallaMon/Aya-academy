"use client";

import { useEffect, useMemo, useState } from "react";
import { Grid } from "@mui/material";
import { useForm } from "react-hook-form";
import { FormDialog } from "../../../shared/components/index.js";
import useDebounce from "../../../hooks/useDebounce.js";
import { FORM_ID } from "./templateFormDialog/constants.js";
import { emptyValues, fromTemplate, buildThemeJson } from "./templateFormDialog/formModel.js";
import TemplateTextsSection from "./templateFormDialog/TemplateTextsSection.jsx";
import TemplateSignatureSection from "./templateFormDialog/TemplateSignatureSection.jsx";
import TemplateStyleSection from "./templateFormDialog/TemplateStyleSection.jsx";
import TemplateMoreSection from "./templateFormDialog/TemplateMoreSection.jsx";
import TemplatePreview from "./templateFormDialog/TemplatePreview.jsx";

/**
 * Create / edit a certificate template (all fixed texts + style), with a live
 * CertificateCard preview fed a synthetic template-driven certificate.
 *   POST certificate-templates  /  PATCH certificate-templates/:id
 */
export default function TemplateFormDialog({ open, onClose, template, txt, loading, onSubmit }) {
  const isEditing = Boolean(template?.id);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: emptyValues(txt),
  });
  const [error, setError] = useState("");

  // Reset the form whenever the dialog (re)opens or targets a new template, so
  // the inputs are seeded from the edited template (or fresh defaults).
  const openKey = open ? String(template?.id ?? "new") : "__closed__";
  useEffect(() => {
    if (!open) return;
    reset(template ? fromTemplate(template, txt) : emptyValues(txt));
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey, reset]);

  // Inputs stay instant; the (heavy) live preview follows a debounced copy so
  // dragging the color pickers / typing never janks. Watch every value and feed
  // a debounced snapshot into the preview (220ms — at most ~4 re-renders/sec).
  const watched = watch();
  const debounced = useDebounce(JSON.stringify(watched), 220);
  const debouncedValues = useMemo(() => {
    try {
      return JSON.parse(debounced);
    } catch {
      return watched;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // `showSeal` / `showWatermark` gate the seal-text input + watermark slider —
  // watch them so the disabled state reacts as the toggles change.
  const showSeal = watch("showSeal");
  const showWatermark = watch("showWatermark");
  const type = watch("type");

  function submit(values) {
    setError("");
    if (!values.key.trim() || !values.nameAr.trim() || !values.nameEn.trim()) {
      setError(txt.required);
      return;
    }
    const payload = {
      key: values.key.trim(),
      type: values.type,
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn.trim(),
      headingAr: values.headingAr.trim() || undefined,
      headingEn: values.headingEn.trim() || undefined,
      introAr: values.introAr.trim() || undefined,
      introEn: values.introEn.trim() || undefined,
      bodyAr: values.bodyAr.trim() || undefined,
      bodyEn: values.bodyEn.trim() || undefined,
      congratsAr: values.congratsAr.trim() || undefined,
      congratsEn: values.congratsEn.trim() || undefined,
      thanksAr: values.thanksAr.trim() || undefined,
      thanksEn: values.thanksEn.trim() || undefined,
      signatureName: values.signatureName.trim() || undefined,
      signatureTitleAr: values.signatureTitleAr.trim() || undefined,
      signatureTitleEn: values.signatureTitleEn.trim() || undefined,
      themeJson: buildThemeJson(values),
      isActive: Boolean(values.isActive),
      isDefault: Boolean(values.isDefault),
    };
    onSubmit(payload, isEditing);
  }

  // Synthetic certificate for the live preview (template-driven path). Built
  // from the DEBOUNCED values so the heavy card re-renders at most ~4×/sec.
  const previewCertificate = useMemo(
    () => ({
      studentName: txt.previewStudent,
      issuedAt: new Date().toISOString(),
      reasonAr: txt.previewReason,
      reasonEn: txt.previewReason,
      template: {
        headingAr: debouncedValues.headingAr,
        headingEn: debouncedValues.headingEn,
        introAr: debouncedValues.introAr,
        introEn: debouncedValues.introEn,
        bodyAr: debouncedValues.bodyAr,
        bodyEn: debouncedValues.bodyEn,
        congratsAr: debouncedValues.congratsAr,
        congratsEn: debouncedValues.congratsEn,
        thanksAr: debouncedValues.thanksAr,
        thanksEn: debouncedValues.thanksEn,
        signatureName: debouncedValues.signatureName,
        signatureTitleAr: debouncedValues.signatureTitleAr,
        signatureTitleEn: debouncedValues.signatureTitleEn,
        themeJson: buildThemeJson(debouncedValues),
      },
    }),
    [debouncedValues, txt.previewStudent, txt.previewReason],
  );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEditing ? txt.editTitle : txt.createTitle}
      maxWidth="lg"
      loading={loading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Grid container spacing={3}>
          {/* ── Form ── */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TemplateTextsSection control={control} txt={txt} type={type} error={error} />
            <TemplateSignatureSection control={control} txt={txt} />
            <TemplateStyleSection control={control} txt={txt} />
            <TemplateMoreSection
              control={control}
              txt={txt}
              showSeal={showSeal}
              showWatermark={showWatermark}
            />
          </Grid>

          {/* ── Live preview ── */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TemplatePreview txt={txt} previewCertificate={previewCertificate} />
          </Grid>
        </Grid>
      </form>
    </FormDialog>
  );
}
