import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('RF-01 expone una zona accesible de arrastre con feedback visual y de estado', async () => {
  const [cards, html] = await Promise.all([read('../src/components/card-list.js'), read('../index.html')]);

  assert.match(cards, /id="image-dropzone"/);
  assert.match(cards, /role="button"/);
  assert.match(cards, /tabindex="0"/);
  assert.match(cards, /id="image-drop-status"/);
  assert.match(cards, /classList\.add\('is-dragging'\)/);
  assert.match(cards, /classList\.remove\('is-dragging'\)/);
  assert.match(html, /\.upload-control\.is-dragging\s*\{/);
});

test('RF-01 previene la navegación nativa y procesa DataTransfer.files por la misma ruta', async () => {
  const cards = await read('../src/components/card-list.js');

  assert.match(cards, /root\.addEventListener\('dragover'/);
  assert.match(cards, /root\.addEventListener\('drop'/);
  assert.match(cards, /event\.preventDefault\(\)/);
  assert.match(cards, /event\.dataTransfer\?\.files/);
  assert.match(cards, /loadImageFiles\(files\)/);
  assert.match(cards, /fileInput\.addEventListener\('change'/);
  assert.match(cards, /await processFiles\(event\.target\.files\)/);
});

test('RF-01 conserva el resultado mixto y comunica aceptadas y rechazadas', async () => {
  const cards = await read('../src/components/card-list.js');

  assert.match(cards, /result\.accepted/);
  assert.match(cards, /result\.rejected/);
  assert.match(cards, /archivos rechazados/);
  assert.match(cards, /set-diagnostics/);
});
