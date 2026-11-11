import { groupCardsBySize } from './card-sizes.js';
import { clampPage, paginateItems } from './pagination.js';

const FLOAT_EPSILON = 1e-9;

function invalidLayout(errors) {
  return { valid: false, errors, rows: 0, columns: 0, capacity: 0, items: [], groups: [], pages: [], totalPages: 0, currentPage: 0, currentPositions: [] };
}

function isPositiveFinite(value) { return Number.isFinite(value) && value > 0; }

function getGrid(config, cardSize) {
  const { printableArea } = config;
  const columns = Math.floor((printableArea.width + FLOAT_EPSILON) / cardSize.width);
  const rows = Math.floor((printableArea.height + FLOAT_EPSILON) / cardSize.height);
  return { columns, rows, capacity: columns > 0 && rows > 0 ? columns * rows : 0 };
}

function validateLayoutConfig(config) {
  if (!config || config.isPrintable !== true) return ['La configuración física no es imprimible.'];
  if (!config.printableArea || !isPositiveFinite(config.printableArea.width) || !isPositiveFinite(config.printableArea.height) || !config.margins || !config.padding) {
    return ['La configuración física contiene dimensiones inválidas.'];
  }
  return [];
}

function alignmentOffset(config, cardSize, grid) {
  const blockWidth = grid.columns * cardSize.width;
  const blockHeight = grid.rows * cardSize.height;
  const freeX = config.printableArea.width - blockWidth;
  const freeY = config.printableArea.height - blockHeight;
  const horizontal = config.alignment?.horizontal ?? 'center';
  const vertical = config.alignment?.vertical ?? 'center';
  const x = horizontal === 'left' ? 0 : horizontal === 'right' ? freeX : freeX / 2;
  const y = vertical === 'top' ? 0 : vertical === 'bottom' ? freeY : freeY / 2;
  return { x, y, blockWidth, blockHeight, freeX, freeY };
}

function createPosition(item, index, config, cardSize, columns, offset) {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const x = config.margins.left + offset.x + column * cardSize.width;
  const y = config.margins.top + offset.y + row * cardSize.height;
  const padding = config.padding;
  return { item, index, row, column, x, y, width: cardSize.width, height: cardSize.height, contentX: x + padding.left, contentY: y + padding.top, contentWidth: Math.max(0, cardSize.width - padding.left - padding.right), contentHeight: Math.max(0, cardSize.height - padding.top - padding.bottom) };
}

function positionPages(itemPages, config, cardSize, grid, offset) {
  return itemPages.map((items) => {
    const page = items.map((item, index) => createPosition(item, index, config, cardSize, grid.columns, offset));
    page.cardSize = { ...cardSize };
    page.offset = { x: offset.x, y: offset.y };
    page.rows = grid.rows;
    page.columns = grid.columns;
    page.capacity = grid.capacity;
    page.blockSize = { width: offset.blockWidth, height: offset.blockHeight };
    return page;
  });
}

function calculateGroup(group, config) {
  const grid = getGrid(config, group.cardSize);
  if (grid.columns === 0 || grid.rows === 0) throw new RangeError('La carta no cabe en el área imprimible configurada.');
  const offset = alignmentOffset(config, group.cardSize, grid);
  const pages = positionPages(paginateItems(group.items, grid.capacity), config, group.cardSize, grid, offset);
  pages.forEach((page) => page.forEach((position) => { position.sizeKey = group.key; }));
  return { ...group, rows: grid.rows, columns: grid.columns, capacity: grid.capacity, offset: { x: offset.x, y: offset.y }, blockSize: { width: offset.blockWidth, height: offset.blockHeight }, pages };
}

export function calculateLayout({ config, cards = [], order = 'normal', currentPage = 1 } = {}) {
  const errors = validateLayoutConfig(config);
  if (errors.length > 0) return invalidLayout(errors);
  let groups;
  try {
    groups = groupCardsBySize(cards, config, order).map((group) => calculateGroup(group, config));
  } catch (error) {
    return invalidLayout([error.message]);
  }
  const pages = groups.flatMap((group) => group.pages);
  const items = groups.flatMap((group) => group.items);
  const firstGroup = groups[0];
  const emptyGrid = firstGroup ? null : getGrid(config, config.sharedCardSize);
  const totalPages = pages.length;
  const pageNumber = clampPage(currentPage, totalPages);
  return { valid: true, errors: [], config, rows: firstGroup?.rows ?? emptyGrid.rows, columns: firstGroup?.columns ?? emptyGrid.columns, capacity: firstGroup?.capacity ?? emptyGrid.capacity, cardSize: firstGroup ? { ...firstGroup.cardSize } : { ...config.sharedCardSize }, offset: firstGroup ? { ...firstGroup.offset } : { x: 0, y: 0 }, items, groups, pages, totalPages, currentPage: pageNumber, currentPositions: pageNumber === 0 ? [] : pages[pageNumber - 1] };
}

export { alignmentOffset, getGrid, positionPages };
