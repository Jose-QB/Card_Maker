import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const rootUrl = new URL('../', import.meta.url);

async function readProjectFile(relativePath) {
  return readFile(new URL(relativePath, rootUrl), 'utf8');
}

test('el inventario de UI conserva los puntos de montaje del shell', async () => {
  const html = await readProjectFile('index.html');
  const app = await readProjectFile('src/app.js');

  for (const id of ['app', 'status', 'error-status']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `falta el montaje #${id}`);
  }

  for (const id of [
    'controls-root',
    'cards-root',
    'back-controls-root',
    'diagnostics',
    'stats',
    'output-actions',
    'preview-root',
    'preview-mode-root',
    'pagination-root',
    'cards-title'
  ]) {
    assert.match(app, new RegExp(`querySelector\\(['"]#${id}['"]\\)`), `falta el punto de montaje #${id}`);
  }
});

test('el inventario de UI conserva los componentes y eventos públicos actuales', async () => {
  const source = (await Promise.all([
    'src/app.js',
    'src/components/controls.js',
    'src/components/card-list.js',
    'src/components/back-controls.js',
    'src/components/word-controls.js',
    'src/components/preview.js',
    'src/components/pagination.js'
  ].map(readProjectFile))).join('\n');

  for (const renderer of [
    'renderControls',
    'renderDeckTabs',
    'renderWordDeckControls',
    'renderCardList',
    'renderBackControls',
    'renderPreview',
    'renderPagination'
  ]) {
    assert.match(source, new RegExp(`\\b${renderer}\\b`), `falta el contrato ${renderer}`);
  }

  for (const action of [
    'set-deck-type',
    'set-config',
    'set-word-config',
    'replace-cards',
    'set-back-design',
    'set-preview-mode',
    'set-page'
  ]) {
    assert.match(source, new RegExp(`(?:type:|case) ['"]${action}['"]`), `falta el evento ${action}`);
  }

  assert.match(source, /data-action=["']export-pdf["']/);
});

test('el shell mantiene la separación entre presentación y dominio', async () => {
  const html = await readProjectFile('index.html');

  assert.match(html, /<script[^>]+type=["']module["'][^>]+src=["']\/src\/app\.js["']/i);
  assert.doesNotMatch(html, /calculateLayout|exportLayoutToPdf|distributeWordEntries/);
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:/i);
});
