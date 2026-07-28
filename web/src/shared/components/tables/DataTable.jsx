"use client";

// Config-driven DataTable.
//
// Columns are declarative (see config/<feature>Columns.js):
//   { field, headerName, width?, align?, renderCell?({ row, value }) }
// Special column types: { type: "actions", renderCell } for a per-row action cell.
//
// Designed to consume useRequest output directly:
//   const { data, total, page, setPage, pageSize, setPageSize, isLoading,
//           filters, setFilters } = useRequest({ url, isPaginated, autoFetch });
//   <DataTable initialRows={data} columns={cols} total={total}
//              page={page} setPage={setPage} rowsPerPage={pageSize}
//              setRowsPerPage={setPageSize} loading={isLoading}
//              filterConfig={cols} filters={filters} setFilters={setFilters} />
//
// This file is a thin composer: the header, body (skeleton/error/empty/rows),
// cell rendering, and pagination live in ./dataTable/*.

import {
  Container,
  IconButton,
  Paper,
  Table,
  TableContainer,
} from "@mui/material";
import NextLink from "next/link";
import { MdVisibility } from "react-icons/md";
import { useMemo } from "react";
import { useTranslation } from "../../../i18n/client.js";
import LoadingOverlay from "../feedback/LoadingOverlay.jsx";
import FilterBar from "./FilterBar.jsx";
import IdCell from "./IdCell.jsx";
import DataTableHead from "./dataTable/DataTableHead.jsx";
import DataTableBody from "./dataTable/DataTableBody.jsx";
import DataTablePagination from "./dataTable/DataTablePagination.jsx";

export function DataTable({
  columns = [],
  initialRows,
  loading = false,
  total = 0,
  page = 1,
  rowsPerPage = 10,
  setPage,
  setRowsPerPage,
  translateKey,
  filterConfig,
  filters,
  setFilters,
  renderViewLink,
  defaultFilters,
  error = null,
  onRetry,
  onCreate,
  createLabel,
  noContainer = false,
  stickyHeader = true,
  // Mandatory leading ID column. On site-wide by default; pass showId={false}
  // for the rare table whose rows have no meaningful id. idField overrides the
  // row property used as the id (e.g. "uuid").
  showId = true,
  idField = "id",
}) {
  const { t } = useTranslation();
  const translator = t(translateKey, { returnObjects: true }) || {};
  const td = t("tableData", { returnObjects: true }) || {};

  const rows = Array.isArray(initialRows) ? initialRows : [];
  const hasRows = rows.length > 0;
  const isFirstLoad = loading && !hasRows;
  const isRefetching = loading && hasRows;

  const hasActiveFilters = useMemo(() => {
    if (!filters) return false;
    return Object.keys(filters).length > 0;
  }, [filters]);

  // Build the effective column set:
  //   1. Prepend the mandatory leading ID column (unless showId is false or the
  //      config already declares an "id" column itself).
  //   2. Append an implicit "view" action column when renderViewLink is provided
  //      and the config doesn't already declare an actions column.
  const effectiveColumns = useMemo(() => {
    let cols = columns;

    const alreadyHasId = columns.some(
      (c) => c.field === "id" || c.field === idField,
    );
    if (showId && !alreadyHasId) {
      const idCol = {
        field: idField,
        headerName: td.id || "ID",
        width: 96,
        align: "inherit",
        renderCell: ({ row }) => <IdCell value={row?.[idField]} />,
      };
      cols = [idCol, ...cols];
    }

    const hasActions = cols.some((c) => c.type === "actions");
    if (renderViewLink && !hasActions) {
      return [
        ...cols,
        {
          field: "__view",
          type: "actions",
          headerName: td.actions || "Actions",
          width: 90,
          renderCell: ({ row }) => (
            <IconButton
              component={NextLink}
              href={renderViewLink(row)}
              size="small"
              aria-label={td.view || "view"}
            >
              <MdVisibility size={18} />
            </IconButton>
          ),
        },
      ];
    }
    return cols;
  }, [columns, renderViewLink, td.actions, td.view, td.id, showId, idField]);

  function clearFilters() {
    if (setFilters) setFilters(defaultFilters ? { ...defaultFilters } : {});
  }

  const colSpan = effectiveColumns.length || 1;

  const body = (
    <Paper sx={{ width: "100%", mb: 2, position: "relative" }}>
      <LoadingOverlay isLoading={isRefetching} type="box" />

      {Array.isArray(filterConfig) && filterConfig.length > 0 && (
        <FilterBar
          filterConfig={filterConfig}
          filters={filters || {}}
          setFilters={setFilters}
          translator={translator}
        />
      )}

      <TableContainer sx={{ maxHeight: "75vh" }}>
        <Table stickyHeader={stickyHeader} aria-label={translateKey || "data-table"}>
          <DataTableHead columns={effectiveColumns} translator={translator} />
          <DataTableBody
            columns={effectiveColumns}
            rows={rows}
            isFirstLoad={isFirstLoad}
            error={error}
            hasRows={hasRows}
            hasActiveFilters={hasActiveFilters}
            colSpan={colSpan}
            td={td}
            onRetry={onRetry}
            onCreate={onCreate}
            createLabel={createLabel}
            clearFilters={clearFilters}
          />
        </Table>
      </TableContainer>

      <DataTablePagination
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        setPage={setPage}
        setRowsPerPage={setRowsPerPage}
        td={td}
      />
    </Paper>
  );

  if (noContainer) return body;
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {body}
    </Container>
  );
}

export default DataTable;
