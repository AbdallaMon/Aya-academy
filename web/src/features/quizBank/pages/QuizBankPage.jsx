"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import { MdCategory } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  DataTable,
  PageHeader,
  useConfirm,
} from "../../../shared/components/index.js";
import { BANK_URL, CATEGORIES_URL } from "../config/constant.js";
import { useQuizBankText } from "../config/quizBankText.js";
import { buildQuizBankColumns } from "../config/quizBankColumns.js";
import { buildQuizBankFilters } from "../config/quizBankFilters.js";
import QuestionFormDialog from "../components/QuestionFormDialog.jsx";
import CategoriesDialog from "../components/CategoriesDialog.jsx";

export default function QuizBankPage() {
  const txt = useQuizBankText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const confirm = useConfirm();

  const canList = hasPermission(PERMISSIONS.QUIZ.LIST_BANK);
  const canCreate = hasPermission(PERMISSIONS.QUIZ.CREATE_BANK);
  const canEdit = hasPermission(PERMISSIONS.QUIZ.EDIT_BANK);
  const canDelete = hasPermission(PERMISSIONS.QUIZ.DELETE_BANK);

  const {
    data,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    filters,
    setFilters,
    triggerRefetch,
  } = useRequest({
    url: BANK_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
  });

  // Categories: loaded once for the filter, the form select, and the manager.
  const categoriesReq = useRequest({
    url: CATEGORIES_URL,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });

  useEffect(() => {
    if (canList) categoriesReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canList]);

  const categories = categoriesReq.data || [];

  const categoryName = useMemo(() => {
    const byId = new Map(categories.map((c) => [String(c.id), c]));
    return (id, embedded) => {
      const c = embedded || (id != null ? byId.get(String(id)) : null);
      if (!c) return null;
      return lng === "en" ? c.nameEn || c.nameAr : c.nameAr || c.nameEn;
    };
  }, [categories, lng]);

  const form = useOpen();
  const categoriesDialog = useOpen();
  const [selected, setSelected] = useState(null);

  const deleteReq = useRequest({
    url: BANK_URL,
    method: "delete",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => triggerRefetch(),
  });

  function onCreate() {
    setSelected(null);
    form.open();
  }
  function onEdit(row) {
    setSelected(row);
    form.open();
  }
  async function onDelete(row) {
    const ok = await confirm({
      title: txt.deleteTitle,
      description: txt.deleteDescription,
      intent: "danger",
      confirmText: txt.deleteConfirm,
    });
    if (!ok) return;
    await deleteReq.fetchData(String(row.id));
  }

  const columns = useMemo(
    () =>
      buildQuizBankColumns({
        txt,
        lng,
        categoryName,
        onEdit,
        onDelete,
        canEdit,
        canDelete,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng, categoryName, canEdit, canDelete],
  );

  const filterConfig = useMemo(
    () => buildQuizBankFilters({ txt, categories }),
    [txt, categories],
  );

  if (!canList) return null;

  return (
    <Box>
      <PageHeader
        title={txt.pageTitle}
        description={txt.pageDescription}
        createLabel={txt.create}
        onCreate={canCreate ? onCreate : undefined}
        renderExtraComponent={
          canCreate
            ? () => (
                <Button
                  variant="outlined"
                  startIcon={<MdCategory />}
                  onClick={categoriesDialog.open}
                >
                  {txt.manageCategories}
                </Button>
              )
            : undefined
        }
      />

      <DataTable
        initialRows={data || []}
        columns={columns}
        total={total}
        page={page}
        rowsPerPage={pageSize}
        setPage={setPage}
        setRowsPerPage={setPageSize}
        loading={isLoading}
        filters={filters}
        setFilters={setFilters}
        filterConfig={filterConfig}
        noContainer
      />

      <QuestionFormDialog
        open={form.isOpen}
        onClose={form.close}
        question={selected}
        categories={categories}
        txt={txt}
        onSuccess={triggerRefetch}
      />

      <CategoriesDialog
        open={categoriesDialog.isOpen}
        onClose={categoriesDialog.close}
        categories={categories}
        txt={txt}
        onChanged={categoriesReq.fetchData}
      />
    </Box>
  );
}
