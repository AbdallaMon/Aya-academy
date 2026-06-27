import { Chip, Typography } from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";
import { formatDate } from "./constant.js";

/**
 * Declarative column factory for the question-bank table.
 * Kept in config/ (the contract) but takes runtime deps (txt, lng, category
 * lookup, handlers, permission flags) so cells can render localized content.
 */
export function buildQuizBankColumns({
  txt,
  lng,
  categoryName,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) {
  const cols = [
    {
      field: "text",
      headerName: txt.text,
      width: 360,
      renderCell: ({ row }) => {
        const text = lng === "en" ? row.textEn || row.textAr : row.textAr || row.textEn;
        return <Typography fontWeight={600}>{text || "—"}</Typography>;
      },
    },
    {
      field: "category",
      headerName: txt.category,
      width: 160,
      renderCell: ({ row }) => {
        const name = categoryName(row.categoryId, row.category);
        return name ? (
          <Chip size="small" variant="outlined" label={name} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {txt.noCategory}
          </Typography>
        );
      },
    },
    {
      field: "options",
      headerName: txt.options,
      width: 100,
      renderCell: ({ row }) => (
        <Chip size="small" label={row.options?.length ?? row._count?.options ?? 0} />
      ),
    },
    {
      field: "isActive",
      headerName: txt.status,
      width: 120,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color={row.isActive ? "success" : "default"}
          label={row.isActive ? txt.active : txt.inactive}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: txt.createdAt,
      width: 140,
      renderCell: ({ row }) => formatDate(row.createdAt, lng),
    },
  ];

  if (canEdit || canDelete) {
    cols.push({
      field: "actions",
      type: "actions",
      headerName: txt.actions,
      width: 80,
      renderCell: ({ row }) => (
        <RowActionsMenu
          actions={[
            {
              label: txt.edit,
              icon: <MdEdit />,
              onClick: () => onEdit(row),
              hidden: !canEdit,
            },
            {
              label: txt.delete,
              icon: <MdDelete />,
              color: "error",
              onClick: () => onDelete(row),
              hidden: !canDelete,
            },
          ]}
        />
      ),
    });
  }

  return cols;
}

export function buildQuizBankFilters({ txt, categories }) {
  const categoryOptions = { ALL: txt.allCategories };
  (categories || []).forEach((c) => {
    categoryOptions[String(c.id)] = c.nameAr || c.nameEn || `#${c.id}`;
  });
  return [
    { type: "search", key: "search", label: txt.searchLabel },
    {
      type: "enum",
      key: "categoryId",
      label: txt.category,
      options: categoryOptions,
    },
    {
      type: "enum",
      key: "isActive",
      label: txt.status,
      options: { ALL: txt.allStatuses, true: txt.active, false: txt.inactive },
    },
  ];
}
