import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createConfig, validateConfig } from '../src/utils/config.js';
import { calculateLayout } from '../src/utils/layout.js';
import { expandCards } from '../src/utils/order.js';
import { clampPage, paginateItems } from '../src/utils/pagination.js';

const cards = [
  { id: 'warrior', name: 'Guerrero', quantity: 2 },
  { id: 'mage', name: 'Maga', quantity: 1 },
  { id: 'rogue', name: 'Pícaro', quantity: 3 }
];

function createTestConfig(overrides = {}) {
  return createConfig({
    paper: { width: 100, height: 100 },
    card: { width: 20, height: 30 },
    margins: 0,
    ...overrides
  });
}

test('una lista vacía no produce copias ni páginas', () => {
  assert.deepEqual(expandCards([]), []);

  const layout = calculateLayout({
    config: createTestConfig(),
    cards: []
  });

  assert.equal(layout.valid, true);
  assert.equal(layout.capacity, 15);
  assert.deepEqual(layout.pages, []);
  assert.equal(layout.totalPages, 0);
  assert.equal(layout.currentPage, 0);
});

test('el orden normal conserva bloques y cantidades distintas', () => {
  const expanded = expandCards(cards, { order: 'normal' });

  assert.deepEqual(expanded.map(({ id, copyNumber }) => `${id}-${copyNumber}`), [
    'warrior-1', 'warrior-2',
    'mage-1',
    'rogue-1', 'rogue-2', 'rogue-3'
  ]);
});

test('el orden intercalado recorre rondas y conserva el orden de carga', () => {
  const expanded = expandCards(cards, { order: 'interleaved' });

  assert.deepEqual(expanded.map(({ id, copyNumber }) => `${id}-${copyNumber}`), [
    'warrior-1', 'mage-1', 'rogue-1',
    'warrior-2', 'rogue-2',
    'rogue-3'
  ]);
});

test('el layout calcula filas, columnas, capacidad y posiciones deterministas', () => {
  const config = createTestConfig({
    card: { width: 20, height: 30 },
    margins: { top: 5, right: 10, bottom: 5, left: 10 },
    padding: 2
  });

  const layout = calculateLayout({
    config,
    cards: [{ id: 'one', quantity: 2 }]
  });

  assert.equal(layout.rows, 3);
  assert.equal(layout.columns, 4);
  assert.equal(layout.capacity, 12);
  assert.deepEqual(layout.pages[0].map((position) => ({
    id: position.item.id,
    row: position.row,
    column: position.column,
    x: position.x,
    y: position.y,
    contentX: position.contentX,
    contentY: position.contentY
  })), [
    { id: 'one', row: 0, column: 0, x: 10, y: 5, contentX: 12, contentY: 7 },
    { id: 'one', row: 0, column: 1, x: 30, y: 5, contentX: 32, contentY: 7 }
  ]);
});

test('una carta que no cabe produce un layout inválido sin capacidad cero utilizable', () => {
  const result = validateConfig({
    paper: { width: 40, height: 40 },
    card: { width: 50, height: 20 }
  });

  assert.equal(result.valid, false);

  const layout = calculateLayout({
    config: result.config,
    cards: [{ id: 'too-big', quantity: 1 }]
  });

  assert.equal(layout.valid, false);
  assert.equal(layout.capacity, 0);
  assert.deepEqual(layout.pages, []);
  assert.ok(layout.errors.some((error) => /configuración|carta|imprimible/i.test(error)));
});

test('la paginación divide la secuencia y no crea páginas infinitas', () => {
  const items = Array.from({ length: 5 }, (_, index) => ({ id: index }));

  assert.deepEqual(paginateItems(items, 2), [
    [{ id: 0 }, { id: 1 }],
    [{ id: 2 }, { id: 3 }],
    [{ id: 4 }]
  ]);
  assert.deepEqual(paginateItems([], 2), []);
  assert.throws(() => paginateItems(items, 0), /capacidad.*mayor que cero/i);
  assert.throws(() => paginateItems(items, Infinity), /capacidad.*finita/i);
});

test('la página actual se ajusta a los límites y a la ausencia de páginas', () => {
  assert.equal(clampPage(-4, 3), 1);
  assert.equal(clampPage(1.9, 3), 1);
  assert.equal(clampPage(4, 3), 3);
  assert.equal(clampPage(99, 0), 0);
});

test('el layout conserva una página válida cuando la página solicitada queda fuera de rango', () => {
  const layout = calculateLayout({
    config: createTestConfig(),
    cards: [{ id: 'one', quantity: 16 }],
    currentPage: 99
  });

  assert.equal(layout.totalPages, 2);
  assert.equal(layout.currentPage, 2);
  assert.equal(layout.pages[layout.currentPage - 1].length, 1);
});

test('reinicia la cuadrícula al comenzar cada página', () => {
  const config = createTestConfig({
    paper: { width: 50, height: 50 },
    card: { width: 20, height: 20 },
    margins: 5
  });

  const layout = calculateLayout({
    config,
    cards: [{ id: 'one', quantity: 10 }]
  });

  assert.equal(layout.capacity, 4);
  assert.equal(layout.totalPages, 3);
  assert.deepEqual(layout.pages.map((page) => page[0]).map(({ row, column, x, y }) => ({ row, column, x, y })), [
    { row: 0, column: 0, x: 5, y: 5 },
    { row: 0, column: 0, x: 5, y: 5 },
    { row: 0, column: 0, x: 5, y: 5 }
  ]);
  assert.deepEqual(layout.pages.flat().map(({ item }) => item.copyNumber), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const page of layout.pages) {
    for (const position of page) {
      assert.ok(position.row >= 0 && position.row < layout.rows);
      assert.ok(position.column >= 0 && position.column < layout.columns);
    }
  }
});
