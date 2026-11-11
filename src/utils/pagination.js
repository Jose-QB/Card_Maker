function assertCapacity(capacity) {
  if (!Number.isFinite(capacity)) {
    throw new RangeError('La capacidad debe ser finita.');
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new RangeError('La capacidad debe ser un entero mayor que cero.');
  }
}

export function paginateItems(items = [], capacity) {
  if (!Array.isArray(items)) {
    throw new TypeError('La lista de elementos debe ser un arreglo.');
  }

  if (items.length === 0) {
    return [];
  }

  assertCapacity(capacity);

  const pages = [];
  for (let start = 0; start < items.length; start += capacity) {
    pages.push(items.slice(start, start + capacity));
  }

  return pages;
}

export function clampPage(page, totalPages) {
  if (!Number.isFinite(totalPages) || totalPages <= 0) {
    return 0;
  }

  const normalizedTotalPages = Math.floor(totalPages);
  const normalizedPage = Number.isFinite(page) ? Math.trunc(page) : 1;
  return Math.min(Math.max(normalizedPage, 1), normalizedTotalPages);
}

export { assertCapacity };
