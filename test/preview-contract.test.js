import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  createPreviewViewModel,
  renderPreview
} from '../src/components/preview.js';
import { renderPagination } from '../src/components/pagination.js';

function createLayout(overrides = {}) {
  return {
    valid: true,
    config: {
      paper: { width: 210, height: 297 },
      card: { width: 63, height: 88 }
    },
    currentPositions: [],
    currentPage: 1,
    totalPages: 0,
    capacity: 9,
    pages: [],
    ...overrides
  };
}

test('la preview vacía no simula una hoja imprimible', () => {
  const view = createPreviewViewModel({ layout: createLayout(), totalCards: 0 });

  assert.equal(view.kind, 'empty');
  assert.match(view.message, /cargar.*carta/i);
  assert.equal(view.showSheet, false);
});

test('la preview inválida muestra diagnóstico y no dibuja hoja', () => {
  const view = createPreviewViewModel({
    layout: createLayout({ valid: false, errors: ['La carta no cabe.'] }),
    totalCards: 2
  });

  assert.equal(view.kind, 'invalid');
  assert.match(view.message, /carta no cabe/i);
  assert.equal(view.showSheet, false);
});

test('la preview válida expone página, capacidad, total y posiciones del LayoutModel', () => {
  const positions = [{
    item: { id: 'card-1', name: 'Guerrero', image: { dataUrl: 'data:image/png;base64,AA==' } },
    x: 0,
    y: 0,
    width: 63,
    height: 88,
    contentX: 2,
    contentY: 2,
    contentWidth: 59,
    contentHeight: 84
  }];
  const view = createPreviewViewModel({
    layout: createLayout({ currentPositions: positions, currentPage: 2, totalPages: 3 }),
    totalCards: 20
  });

  assert.deepEqual(view, {
    kind: 'ready',
    message: '',
    showSheet: true,
    page: 2,
    totalPages: 3,
    capacity: 9,
    totalCards: 20,
    paper: { width: 210, height: 297 },
    positions
  });
});

test('la preview de respaldo usa el rectángulo completo de la carta', () => {
  const backImage = { dataUrl: 'data:image/png;base64,BB==', mimeType: 'image/png' };
  const position = {
    item: { id: 'card-1', name: 'Guerrero', image: { dataUrl: 'data:image/png;base64,AA==' } },
    x: 10, y: 12, width: 63, height: 88, contentX: 12, contentY: 14,
    contentWidth: 59, contentHeight: 84, backImage
  };
  const view = createPreviewViewModel({
    layout: createLayout({ pages: [[position]], currentPage: 1, totalPages: 1 }),
    totalCards: 1,
    backPages: [[position]],
    viewMode: 'back'
  });

  assert.equal(view.viewMode, 'back');
  const root = { innerHTML: '' };
  renderPreview(root, { layout: createLayout({ pages: [[position]], currentPage: 1, totalPages: 1 }), totalCards: 1, backPages: [[position]], viewMode: 'back' });
  assert.match(root.innerHTML, /left:0%;top:0%;width:100%;height:100%/);
});

test('la paginación deshabilita anterior y siguiente en los extremos', () => {
  const root = { innerHTML: '' };
  renderPagination(root, { currentPage: 1, totalPages: 3 }, () => {});
  assert.match(root.innerHTML, /data-action="previous"[^>]*disabled/);
  assert.doesNotMatch(root.innerHTML, /data-action="next"[^>]*disabled/);

  renderPagination(root, { currentPage: 3, totalPages: 3 }, () => {});
  assert.doesNotMatch(root.innerHTML, /data-action="previous"[^>]*disabled/);
  assert.match(root.innerHTML, /data-action="next"[^>]*disabled/);
});

test('los controles de paginación exponen navegación accesible y estado de página', () => {
  const root = { innerHTML: '' };
  renderPagination(root, { currentPage: 2, totalPages: 4 }, () => {});

  assert.match(root.innerHTML, /aria-label="Paginación de la previsualización"/);
  assert.match(root.innerHTML, /Página 2 de 4/);
  assert.match(root.innerHTML, /data-action="previous"/);
  assert.match(root.innerHTML, /data-action="next"/);
});

test('los componentes T5 consumen el LayoutModel y se integran en la aplicación', async () => {
  const [previewSource, paginationSource, appSource, html] = await Promise.all([
    readFile(new URL('../src/components/preview.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/pagination.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.js', import.meta.url), 'utf8'),
    readFile(new URL('../index.html', import.meta.url), 'utf8')
  ]);

  assert.match(previewSource, /currentPositions/);
  assert.match(previewSource, /config\?\.paper/);
  assert.match(previewSource, /showSheet/);
  assert.match(paginationSource, /disabled/);
  assert.match(appSource, /renderPreview/);
  assert.match(appSource, /renderPagination/);
  assert.match(appSource, /preview-root/);
});

test('el render de preview omite hoja para estados vacío e inválido', () => {
  const root = { innerHTML: '' };
  renderPreview(root, { layout: createLayout(), totalCards: 0 });
  assert.doesNotMatch(root.innerHTML, /class="preview-sheet"/);

  renderPreview(root, {
    layout: createLayout({ valid: false, errors: ['Dimensiones inválidas.'] }),
    totalCards: 1
  });
  assert.doesNotMatch(root.innerHTML, /class="preview-sheet"/);
  assert.match(root.innerHTML, /Dimensiones inválidas/);
});
