import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@aya/shared";

export function paginate({ page, limit }) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(limit) || DEFAULT_PAGE_SIZE),
  );
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

export function paginatedResult(items, total, page, pageSize) {
  return { items, total, page, pageSize };
}
