"use client";

// Sticky header row for DataTable, extracted verbatim.

import { TableCell, TableHead, TableRow } from "@mui/material";

function resolveHeader(col, translator) {
  return translator[col.headerName] || col.headerName || col.field;
}

export function DataTableHead({ columns, translator }) {
  return (
    <TableHead>
      <TableRow>
        {columns.map((col) => (
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
  );
}

export default DataTableHead;
