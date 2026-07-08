"use client";

// Pagination footer for DataTable, extracted verbatim. MUI is 0-based; the
// useRequest contract is 1-based, so we translate at the boundary.

import { TablePagination } from "@mui/material";
import { PAGE_SIZE_OPTIONS } from "../../../../utils/constant.js";

export function DataTablePagination({
  total,
  page,
  rowsPerPage,
  setPage,
  setRowsPerPage,
  td,
}) {
  return (
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
  );
}

export default DataTablePagination;
