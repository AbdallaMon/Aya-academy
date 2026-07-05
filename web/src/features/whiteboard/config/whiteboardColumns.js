import { Chip } from "@mui/material";
import { WHITEBOARD_STATUS, WHITEBOARD_VISIBILITY } from "./constant.js";

// Column builder for the whiteboard sessions list. `txt` is useWhiteboardText().
export function buildWhiteboardColumns(txt) {
  const statusColor = (s) => (s === WHITEBOARD_STATUS.ACTIVE ? "success" : "default");
  const visColor = (v) => (v === WHITEBOARD_VISIBILITY.PUBLIC ? "info" : "default");

  return [
    { field: "title", headerName: txt.titleLabel, width: 260 },
    {
      field: "status",
      headerName: txt.status,
      width: 130,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color={statusColor(row.status)}
          label={txt.statusLabels[row.status] ?? row.status}
        />
      ),
    },
    {
      field: "visibility",
      headerName: txt.visibility,
      width: 120,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          variant="outlined"
          color={visColor(row.visibility)}
          label={txt.visibilityLabels[row.visibility] ?? row.visibility}
        />
      ),
    },
    {
      field: "students",
      headerName: txt.studentsCount,
      width: 110,
      renderCell: ({ row }) => row?._count?.students ?? 0,
    },
  ];
}
