"use client";

// Body for DataTable, extracted verbatim: first-load skeleton rows, the error
// state, the empty / filtered-zero state, and the populated rows.

import { Skeleton, TableBody, TableCell, TableRow } from "@mui/material";
import EmptyState from "../../display/EmptyState.jsx";
import { renderCellContent } from "./DataTableCell.jsx";

export function DataTableBody({
  columns,
  rows,
  isFirstLoad,
  error,
  hasRows,
  hasActiveFilters,
  colSpan,
  td,
  onRetry,
  onCreate,
  createLabel,
  clearFilters,
}) {
  return (
    <TableBody>
      {isFirstLoad &&
        Array.from({ length: 5 }).map((_, r) => (
          <TableRow key={`sk-${r}`}>
            {columns.map((col) => (
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
            {columns.map((col) => (
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
  );
}

export default DataTableBody;
