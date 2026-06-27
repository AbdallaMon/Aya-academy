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

import {
  Container,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import NextLink from "next/link";
import { MdVisibility } from "react-icons/md";
import { useMemo } from "react";
import { useTranslation } from "../../../i18n/client.js";
import { PAGE_SIZE_OPTIONS } from "../../../utils/constant.js";
import LoadingOverlay from "../feedback/LoadingOverlay.jsx";
import EmptyState from "../display/EmptyState.jsx";
import FilterBar from "./FilterBar.jsx";
import IdCell from "./IdCell.jsx";

function resolveHeader(col, translator) {
  return translator[col.headerName] || col.headerName || col.field;
}

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

  function renderCellContent(col, row) {
    const value = row?.[col.field];
    if (typeof col.renderCell === "function") return col.renderCell({ row, value });
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "✓" : "—";
    return String(value);
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
          <TableHead>
            <TableRow>
              {effectiveColumns.map((col) => (
                <TableCell
                  key={col.field}
                  align={col.align || (col.type === "actions" ? "center" : "inherit")}
                  sx={{ width: col.width, fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  {resolveHeader(col, translator)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isFirstLoad &&
              Array.from({ length: 5 }).map((_, r) => (
                <TableRow key={`sk-${r}`}>
                  {effectiveColumns.map((col) => (
                    <TableCell key={col.field}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isFirstLoad && error && (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <EmptyState
                    title={td.errorTitle}
                    body={td.errorBody}
                    actionLabel={td.retry}
                    onAction={onRetry}
                  />
                </TableCell>
              </TableRow>
            )}

            {!isFirstLoad && !error && !hasRows && (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <EmptyState
                    title={hasActiveFilters ? td.filteredZero : td.noData}
                    actionLabel={
                      hasActiveFilters ? td.clearFilters : onCreate ? createLabel || td.create : undefined
                    }
                    onAction={hasActiveFilters ? clearFilters : onCreate}
                  />
                </TableCell>
              </TableRow>
            )}

            {!isFirstLoad &&
              !error &&
              hasRows &&
              rows.map((row, idx) => (
                <TableRow hover key={row.id ?? idx}>
                  {effectiveColumns.map((col) => (
                    <TableCell
                      key={col.field}
                      align={col.align || (col.type === "actions" ? "center" : "inherit")}
                    >
                      {renderCellContent(col, row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        // MUI is 0-based; useRequest is 1-based.
        page={Math.max(0, (page || 1) - 1)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={PAGE_SIZE_OPTIONS}
        onPageChange={(_, newPage) => setPage && setPage(newPage + 1)}
        onRowsPerPageChange={(e) => {
          if (setRowsPerPage) setRowsPerPage(parseInt(e.target.value, 10));
          if (setPage) setPage(1);
        }}
        labelRowsPerPage={td.rowsPerPage || "Rows per page"}
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
