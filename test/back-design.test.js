import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveBackImage, hasBackDesign } from '../src/utils/back-design.js';
import { deriveBackPages } from '../src/utils/back-layout.js';

const image = (name) => ({ dataUrl: `data:image/png;base64,${name}`, mimeType: 'image/png', name });

function createLayout() {
  const first = { item: { id: 'one', copyNumber: 1 }, x: 5, y: 7, width: 20, height: 30 };
  const second = { item: { id: 'two', copyNumber: 1 }, x: 30, y: 7, width: 20, height: 30 };
  return {
    valid: true,
    config: { paper: { width: 100, height: 100 }, orientation: 'portrait' },
    pages: [[first, second]],
    totalPages: 1
  };
}

test('resuelve respaldo específico, por tamaño y global en ese orden', () => {
  const design = {
    global: image('global'),
    bySize: { '20.0x30.0': image('size') },
    byCard: { one: image('specific') }
  };
  const position = { item: { id: 'one' }, sizeKey: '20.0x30.0' };

  assert.deepEqual(resolveBackImage(position, design), { image: design.byCard.one, source: 'specific' });
  assert.deepEqual(resolveBackImage({ item: { id: 'two' }, sizeKey: position.sizeKey }, design), { image: design.bySize['20.0x30.0'], source: 'size' });
  assert.deepEqual(resolveBackImage({ item: { id: 'other' }, sizeKey: 'x' }, design), { image: design.global, source: 'global' });
});

test('deriva respaldos con coordenadas reflejadas horizontalmente', () => {
  const layout = createLayout();
  layout.pages[0][0].sizeKey = '20.0x30.0';
  layout.pages[0][1].sizeKey = '20.0x30.0';
  const design = { global: image('global'), bySize: {}, byCard: { two: image('two') } };
  const result = deriveBackPages(layout, design);

  assert.equal(result.hasBacks, true);
  assert.equal(result.pages.length, layout.pages.length);
  assert.equal(result.pages[0].background, design.global);
  assert.deepEqual(result.pages[0].map(({ x, y, width, height, backImage, source }) => ({ x, y, width, height, backImage, source })), [
    { x: 75, y: 7, width: 20, height: 30, backImage: null, source: 'global' },
    { x: 50, y: 7, width: 20, height: 30, backImage: design.byCard.two, source: 'specific' }
  ]);
});

test('refleja respaldos por tamaño y conserva metadatos de la página', () => {
  const layout = createLayout();
  layout.pages = [
    [{ ...layout.pages[0][0], sizeKey: '20.0x30.0', pageMarker: 'first' }],
    [{ ...layout.pages[0][1], x: 30, y: 42, sizeKey: '20.0x30.0', pageMarker: 'second' }]
  ];
  layout.totalPages = 2;
  layout.pages[0].cardSize = { width: 20, height: 30 };
  layout.pages[0].offset = { x: 5, y: 7 };
  layout.pages[0].rows = 1;
  layout.pages[0].columns = 2;
  layout.pages[1].cardSize = { width: 20, height: 30 };
  layout.pages[1].offset = { x: 5, y: 42 };
  layout.pages[1].rows = 1;
  layout.pages[1].columns = 2;
  const bySize = image('size');

  const result = deriveBackPages(layout, { global: null, bySize: { '20.0x30.0': bySize }, byCard: {} });

  assert.deepEqual(result.pages.map((page) => page[0].x), [75, 50]);
  assert.deepEqual(result.pages.map((page) => page[0].y), [7, 42]);
  assert.deepEqual(result.pages.map((page) => ({
    pageIndex: page.pageIndex,
    cardSize: page.cardSize,
    offset: page.offset,
    rows: page.rows,
    columns: page.columns
  })), [
    { pageIndex: 0, cardSize: { width: 20, height: 30 }, offset: { x: 5, y: 7 }, rows: 1, columns: 2 },
    { pageIndex: 1, cardSize: { width: 20, height: 30 }, offset: { x: 5, y: 42 }, rows: 1, columns: 2 }
  ]);
  assert.equal(result.pages[0][0].backImage, bySize);
});

test('el reflejo conserva la fila y mantiene las posiciones dentro del papel', () => {
  const layout = createLayout();
  layout.pages[0].push({ item: { id: 'three' }, x: 75, y: 42, width: 20, height: 30, sizeKey: '20.0x30.0' });
  const result = deriveBackPages(layout, { global: image('global'), bySize: {}, byCard: {} });

  assert.deepEqual(result.pages[0].map(({ x, y, width, height }) => ({ x, y, width, height })), [
    { x: 75, y: 7, width: 20, height: 30 },
    { x: 50, y: 7, width: 20, height: 30 },
    { x: 5, y: 42, width: 20, height: 30 }
  ]);
});

test('un diseño vacío no genera páginas de respaldo', () => {
  assert.equal(hasBackDesign({ global: null, bySize: {}, byCard: {} }), false);
  assert.deepEqual(deriveBackPages(createLayout(), { global: null, bySize: {}, byCard: {} }), { hasBacks: false, pages: [] });
});

test('una posición sin imagen de respaldo conserva su coordenada frontal', () => {
  const layout = createLayout();
  layout.pages[0][0].sizeKey = '20.0x30.0';
  const result = deriveBackPages(layout, { global: null, bySize: {}, byCard: { two: image('specific') } });

  assert.equal(result.pages[0][0].source, 'none');
  assert.equal(result.pages[0][0].x, 5);
  assert.equal(result.pages[0][1].source, 'specific');
  assert.equal(result.pages[0][1].x, 50);
});

test('un respaldo específico se repite en todas las copias del tipo', () => {
  const layout = {
    valid: true,
    config: { paper: { width: 100, height: 100 }, orientation: 'portrait' },
    pages: [[
      { item: { id: 'one', copyNumber: 1 }, sizeKey: '20.0x30.0', x: 5, y: 7, width: 20, height: 30 },
      { item: { id: 'one', copyNumber: 2 }, sizeKey: '20.0x30.0', x: 30, y: 7, width: 20, height: 30 }
    ]],
    totalPages: 1
  };
  const specific = image('specific');
  const result = deriveBackPages(layout, { global: null, bySize: {}, byCard: { one: specific } });

  assert.deepEqual(result.pages[0].map(({ backImage, source }) => ({ backImage, source })), [
    { backImage: specific, source: 'specific' },
    { backImage: specific, source: 'specific' }
  ]);
});
