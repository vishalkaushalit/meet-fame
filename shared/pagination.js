export function paginate(items, requestedPage = 1, size = 10) {
  const pageSize = Number.isInteger(size) && size > 0 ? size : 10;
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(
    pages,
    Math.max(1, Math.floor(Number(requestedPage) || 1)),
  );
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pages,
    total,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + pageSize, total),
  };
}

export function paginationNumbers(page, pages) {
  const values = new Set([1, pages]);
  for (let n = Math.max(1, page - 1); n <= Math.min(pages, page + 1); n++)
    values.add(n);
  if (page <= 3) for (let n = 1; n <= Math.min(5, pages); n++) values.add(n);
  if (page >= pages - 2)
    for (let n = Math.max(1, pages - 4); n <= pages; n++) values.add(n);
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.flatMap((value, index) =>
    index && value - sorted[index - 1] > 1
      ? ['ellipsis-' + value, value]
      : [value],
  );
}
