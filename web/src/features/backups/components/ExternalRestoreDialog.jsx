"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FiUpload, FiSearch, FiRotateCcw, FiKey } from "react-icons/fi";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { useBackupsText } from "../hooks/useBackupsText.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import {
  BACKUPS_RESTORE_EXTERNAL_CHECK_URL,
  BACKUPS_RESTORE_EXTERNAL_COMMIT_URL,
} from "../config/constant.js";

const ENC_ACCEPT = ".enc";
const PEM_ACCEPT = ".pem,.txt";

/**
 * ExternalRestoreDialog — restore from an external file (.enc) in two steps:
 *   1) check: POST /backups/actions/restore-external/check (multipart: file=.enc, externalKey)
 *      → { token, expiresAt, report:{ ok, missingTables, extraTables, columnDiffs } }
 *   2) commit: POST /backups/actions/restore-external/commit { token, confirm:true } (destructive)
 *
 * The key is required (there is no default system key): either typed base64, or
 * read client-side from a .pem file (FileReader) and sent as externalKey —
 * matching the backend contract. The multipart check goes through useRequest,
 * which routes FormData bodies as multipart POSTs.
 *
 * props: open, onClose, onDone (refresh status/history after a restore)
 */
export default function ExternalRestoreDialog({ open, onClose, onDone }) {
  const { tr } = useBackupsText();
  const { showToast } = useToast();
  const encInputRef = useRef(null);
  const pemInputRef = useRef(null);

  const [file, setFile] = useState(null);
  // Key input method: typed (base64) or pem (we read the file text).
  const [keyMode, setKeyMode] = useState("typed");
  const [externalKey, setExternalKey] = useState("");
  const [pemFileName, setPemFileName] = useState("");
  const [checkResult, setCheckResult] = useState(null); // { token, report }
  const [confirmOpen, setConfirmOpen] = useState(false);

  const checkReq = useRequest({
    url: BACKUPS_RESTORE_EXTERNAL_CHECK_URL,
    method: "post",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: (res) => {
      setCheckResult(res?.data || null);
    },
  });

  const commitReq = useRequest({
    url: BACKUPS_RESTORE_EXTERNAL_COMMIT_URL,
    method: "post",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: () => {
      setConfirmOpen(false);
      resetAll();
      onDone?.();
      onClose?.();
    },
  });

  function resetAll() {
    setFile(null);
    setExternalKey("");
    setKeyMode("typed");
    setPemFileName("");
    setCheckResult(null);
    if (encInputRef.current) encInputRef.current.value = "";
    if (pemInputRef.current) pemInputRef.current.value = "";
  }

  // Closing resets state (don't keep a stale file/check result on re-open).
  function handleClose() {
    if (commitReq.isLoading || checkReq.isLoading) return;
    resetAll();
    onClose?.();
  }

  function pickEncFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setCheckResult(null);
  }

  // Read the .pem file text client-side and use it as externalKey (we don't
  // upload the file itself).
  function pickPemFile(e) {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setPemFileName(f.name);
    setCheckResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setExternalKey(text.trim());
      showToast({ message: tr.pemLoaded, severity: "success" });
    };
    reader.onerror = () => {
      showToast({ message: tr.pemReadError, severity: "error" });
    };
    reader.readAsText(f);
  }

  function runCheck() {
    if (!file || !externalKey) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("externalKey", externalKey);
    checkReq.fetchData(null, fd).catch(() => {});
  }

  function runCommit() {
    if (!checkResult?.token) return;
    commitReq
      .fetchData(null, { token: checkResult.token, confirm: true })
      .catch(() => {});
  }

  const report = checkResult?.report;
  const schemaOk = report?.ok;
  const canCheck = Boolean(file) && Boolean(externalKey) && !checkReq.isLoading;

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title={tr.externalTitle}
      subtitle={tr.externalHint}
      maxWidth="md"
      loading={commitReq.isLoading || checkReq.isLoading}
      actions={null}
    >
      <ConfirmDialog
        open={confirmOpen}
        intent="danger"
        maxWidth="sm"
        title={tr.externalTitle}
        loading={commitReq.isLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runCommit}
        renderActions={() => (
          <Button
            variant="contained"
            color="error"
            onClick={runCommit}
            disabled={commitReq.isLoading}
            startIcon={
              commitReq.isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {tr.externalCommitConfirm}
          </Button>
        )}
      >
        <Alert severity="error" variant="outlined">
          {tr.externalRestoreWarning}
        </Alert>
      </ConfirmDialog>

      <Stack spacing={2}>
        {/* choose .enc file */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <input
            ref={encInputRef}
            type="file"
            accept={ENC_ACCEPT}
            hidden
            onChange={pickEncFile}
          />
          <Button
            variant="outlined"
            startIcon={<FiUpload />}
            onClick={() => encInputRef.current?.click()}
          >
            {tr.pickFile}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {file ? `${tr.selectedFile}: ${file.name}` : "—"}
          </Typography>
        </Stack>

        {/* key input method: type base64 or upload .pem */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {tr.keyChoice}
          </Typography>
          <RadioGroup
            row
            value={keyMode}
            onChange={(e) => {
              setKeyMode(e.target.value);
              setExternalKey("");
              setPemFileName("");
              setCheckResult(null);
              if (pemInputRef.current) pemInputRef.current.value = "";
            }}
          >
            <FormControlLabel value="typed" control={<Radio />} label={tr.keyTyped} />
            <FormControlLabel value="pem" control={<Radio />} label={tr.keyPem} />
          </RadioGroup>

          {keyMode === "typed" ? (
            <TextField
              fullWidth
              size="small"
              label={tr.externalKey}
              value={externalKey}
              onChange={(e) => {
                setExternalKey(e.target.value);
                setCheckResult(null);
              }}
              sx={{ mt: 1, maxWidth: 480 }}
            />
          ) : (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              sx={{ mt: 1 }}
            >
              <input
                ref={pemInputRef}
                type="file"
                accept={PEM_ACCEPT}
                hidden
                onChange={pickPemFile}
              />
              <Button
                variant="outlined"
                startIcon={<FiKey />}
                onClick={() => pemInputRef.current?.click()}
              >
                {tr.pickPemFile}
              </Button>
              <Typography variant="body2" color="text.secondary">
                {pemFileName ? `${tr.selectedFile}: ${pemFileName}` : "—"}
              </Typography>
            </Stack>
          )}
        </Box>

        {/* check button */}
        <Box>
          <Button
            variant="contained"
            startIcon={
              checkReq.isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <FiSearch />
              )
            }
            disabled={!canCheck}
            onClick={runCheck}
          >
            {tr.checkFile}
          </Button>
        </Box>

        {/* check result */}
        {report && (
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              {tr.checkResultTitle}
            </Typography>
            <Alert severity={schemaOk ? "success" : "error"} variant="outlined">
              {schemaOk ? tr.schemaOk : tr.schemaMismatch}
            </Alert>

            {!schemaOk && (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {report.missingTables?.length > 0 && (
                  <DiffRow
                    label={tr.missingTables}
                    items={report.missingTables}
                    color="error"
                  />
                )}
                {report.extraTables?.length > 0 && (
                  <DiffRow
                    label={tr.extraTables}
                    items={report.extraTables}
                    color="warning"
                  />
                )}
                {report.columnDiffs?.length > 0 && (
                  <DiffRow
                    label={tr.columnDiffs}
                    items={report.columnDiffs.map((d) =>
                      typeof d === "string" ? d : JSON.stringify(d),
                    )}
                    color="warning"
                  />
                )}
              </Stack>
            )}

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<FiRotateCcw />}
                disabled={!schemaOk}
                onClick={() => setConfirmOpen(true)}
              >
                {tr.externalCommit}
              </Button>
              <Button variant="outlined" color="inherit" onClick={resetAll}>
                {tr.externalReset}
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </FormDialog>
  );
}

function DiffRow({ label, items, color }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
        {items.map((it, i) => (
          <Chip key={`${it}-${i}`} size="small" color={color} variant="outlined" label={it} />
        ))}
      </Stack>
    </Box>
  );
}
