import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createConfig, validateConfig } from '../src/utils/config.js';
import { calculateLayout } from '../src/utils/layout.js';
import { groupCardsBySize } from '../src/utils/card-sizes.js';

function createSharedConfig(overrides = {}) {
  return createConfig({
    paper: { width: 100, height: 100 },
    card: { width: 20, height: 20 },
    margins: 5,
    ...overrides
  });
}

test('la configuración nueva usa dimensiones compartidas y alineación centro-centro por defecto', () => {
  const config = createSharedConfig();

  assert.equal(config.dimensionsMode, 'shared');
  assert.deepEqual(config.sharedCardSize, { width: 20, height: 20 });
  assert.deepEqual(config.alignment, { horizontal: 'center', vertical: 'center' });
});

test('valida el encaje usando la misma precisión física que el layout', () => {
  const result = validateConfig({
    paper: { width: 20, height: 20 },
    card: { width: 20.04, height: 20 }
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.config.card, { width: 20, height: 20 });
});

test('las dimensiones por tipo válidas se resuelven para todas sus copias', () => {
  const config = createSharedConfig({
    dimensionsMode: 'perType',
    cardTypes: [
      { id: 'small', size: { width: 10, height: 15 } },
      { id: 'large', size: { width: 25, height: 30 } }
    ]
  });

  const groups = groupCardsBySize([
    { id: 'small', quantity: 2 },
    { id: 'large', quantity: 1 }
  ], config, 'normal');

  assert.deepEqual(groups.map((group) => group.cardSize), [
    { width: 10, height: 15 },
    { width: 25, height: 30 }
  ]);
  assert.deepEqual(groups.map((group) => group.items.map((item) => item.id)), [
    ['small', 'small'],
    ['large']
  ]);
});

test('las dimensiones por tipo inválidas producen diagnósticos', () => {
  const result = validateConfig({
    dimensionsMode: 'perType',
    cardTypes: [
      { id: 'empty', size: { width: 0, height: 15 } },
      { id: 'missing', size: { width: 10 } },
      { id: 'negative', size: { width: -1, height: 10 } }
    ]
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /empty|ancho|mayor que cero/i.test(error)));
});

test('los grupos por tamaño redondean la clave con precisión de 0.1 milímetros', () => {
  const config = createSharedConfig({
    dimensionsMode: 'perType',
    cardTypes: [
      { id: 'one', size: { width: 10.04, height: 20.06 } },
      { id: 'two', size: { width: 10.049, height: 20.059 } },
      { id: 'three', size: { width: 10.16, height: 20.06 } }
    ]
  });

  const groups = groupCardsBySize([
    { id: 'one', quantity: 1 },
    { id: 'two', quantity: 1 },
    { id: 'three', quantity: 1 }
  ], config);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].cardSize, { width: 10, height: 20.1 });
  assert.deepEqual(groups.map((group) => group.items.map((item) => item.id)), [
    ['one', 'two'],
    ['three']
  ]);
});

test('los órdenes normal e intercalado se conservan dentro de cada grupo', () => {
  const config = createSharedConfig({
    dimensionsMode: 'perType',
    cardTypes: [
      { id: 'a', size: { width: 10, height: 10 } },
      { id: 'b', size: { width: 20, height: 20 } },
      { id: 'c', size: { width: 10, height: 10 } }
    ]
  });

  const normal = groupCardsBySize([
    { id: 'a', quantity: 2 },
    { id: 'b', quantity: 1 },
    { id: 'c', quantity: 1 }
  ], config, 'normal');
  const interleaved = groupCardsBySize([
    { id: 'a', quantity: 2 },
    { id: 'b', quantity: 1 },
    { id: 'c', quantity: 1 }
  ], config, 'interleaved');

  assert.deepEqual(normal[0].items.map(({ id, copyNumber }) => `${id}-${copyNumber}`), ['a-1', 'a-2', 'c-1']);
  assert.deepEqual(interleaved[0].items.map(({ id, copyNumber }) => `${id}-${copyNumber}`), ['a-1', 'c-1', 'a-2']);
});

test('calcula los nueve offsets de alineación en el área imprimible', () => {
  const expectedX = { left: 5, center: 10, right: 15 };
  const expectedY = { top: 5, center: 10, bottom: 15 };

  for (const horizontal of ['left', 'center', 'right']) {
    for (const vertical of ['top', 'center', 'bottom']) {
      const layout = calculateLayout({
        config: createSharedConfig({ alignment: { horizontal, vertical } }),
        cards: [{ id: 'one', quantity: 1 }]
      });
      assert.deepEqual(
        { x: layout.pages[0][0].x, y: layout.pages[0][0].y },
        { x: expectedX[horizontal], y: expectedY[vertical] }
      );
    }
  }
});

test('el layout multipágina separa tamaños y expone tamaño y offset por página', () => {
  const config = createSharedConfig({
    paper: { width: 55, height: 55 },
    dimensionsMode: 'perType',
    cardTypes: [
      { id: 'small', size: { width: 20, height: 20 } },
      { id: 'large', size: { width: 30, height: 30 } }
    ],
    alignment: { horizontal: 'right', vertical: 'bottom' }
  });
  const layout = calculateLayout({
    config,
    cards: [
      { id: 'small', quantity: 5 },
      { id: 'large', quantity: 2 }
    ]
  });

  assert.equal(layout.valid, true);
  assert.equal(layout.pages.length, 4);
  assert.deepEqual(layout.pages.map((page) => page.cardSize), [
    { width: 20, height: 20 },
    { width: 20, height: 20 },
    { width: 30, height: 30 },
    { width: 30, height: 30 }
  ]);
  assert.deepEqual(layout.pages[0].offset, { x: 5, y: 5 });
  assert.deepEqual(layout.pages[0][0].item.id, 'small');
  assert.deepEqual(layout.pages[3][0].item.id, 'large');
});

test('reinicia el índice por página y mantiene las coordenadas dentro del área', () => {
  const config = createSharedConfig({
    paper: { width: 50, height: 50 },
    card: { width: 20, height: 20 },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  const layout = calculateLayout({ config, cards: [{ id: 'one', quantity: 10 }] });

  assert.equal(layout.pages.length, 3);
  assert.deepEqual(layout.pages.map((page) => page[0].index), [0, 0, 0]);
  for (const page of layout.pages) {
    for (const position of page) {
      assert.ok(position.x >= 5 && position.x + position.width <= 45);
      assert.ok(position.y >= 5 && position.y + position.height <= 45);
    }
  }
});
