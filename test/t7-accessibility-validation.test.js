import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('T7 declara nombres accesibles, mensajes asociados y foco visible', async () => {
  const [html, controls, cards, app, pagination, preview, backControls] = await Promise.all([
    read('../index.html'),
    read('../src/components/controls.js'),
    read('../src/components/card-list.js'),
    read('../src/app.js'),
    read('../src/components/pagination.js'),
    read('../src/components/preview.js'),
    read('../src/components/back-controls.js')
  ]);

  assert.match(html, /:focus-visible\s*\{/i);
  assert.match(html, /\.visually-hidden\s*\{/i);
  assert.match(controls, /<label for="\$\{id\}">/);
  assert.match(controls, /aria-describedby=/);
  assert.match(controls, /aria-invalid=/);
  assert.match(cards, /aria-describedby=/);
  assert.match(cards, /aria-invalid=/);
  assert.match(cards, /data-role="width"[\s\S]*aria-describedby=/);
  assert.match(cards, /data-role="height"[\s\S]*aria-describedby=/);
  assert.match(cards, /role="alert"/);
  assert.match(app, /role="alert"/);
  assert.match(app, /aria-describedby="export-status"/);
  assert.match(pagination, /aria-label="Paginación de la previsualización"/);
  assert.match(preview, /alt="/);
  assert.match(backControls, /type="file"/);
  assert.match(backControls, /aria-describedby=/);
  assert.match(backControls, /Prioridad/);
});

test('T7 mantiene textos visibles de interacción en español', async () => {
  const sources = await Promise.all([
    read('../index.html'),
    read('../src/components/controls.js'),
    read('../src/components/card-list.js'),
    read('../src/components/pagination.js'),
    read('../src/components/preview.js'),
    read('../src/app.js')
  ]);
  const source = sources.join('\n');

  for (const text of ['Tamaño de papel', 'Orientación', 'Cantidad', 'Eliminar', 'Anterior', 'Siguiente', 'Generar PDF']) {
    assert.match(source, new RegExp(text));
  }
  assert.doesNotMatch(source, />\s*(?:Delete|Next|Previous|Generate PDF)\s*</i);
});

test('T7 expone límites explícitos para entradas físicas y cantidades', async () => {
  const [controls, cards, backControls] = await Promise.all([
    read('../src/components/controls.js'),
    read('../src/components/card-list.js'),
    read('../src/components/back-controls.js')
  ]);

  assert.match(controls, /max = '1000'/);
  assert.match(controls, /step: '0\.1'/);
  assert.match(cards, /min="1"/);
  assert.match(cards, /max="10000"/);
  assert.match(cards, /step="1"/);
  assert.match(cards, /debe ser un entero entre 1 y 10000/);
});

test('la interfaz expone dimensiones por modo y alineación accesibles', async () => {
  const [controls, cards, backControls] = await Promise.all([
    read('../src/components/controls.js'),
    read('../src/components/card-list.js'),
    read('../src/components/back-controls.js')
  ]);

  assert.match(controls, /id="dimensions-mode"/);
  assert.match(controls, /id="alignment-horizontal"/);
  assert.match(controls, /id="alignment-vertical"/);
  assert.match(controls, /id="card-preset"/);
  assert.match(controls, /id="custom-card-enabled"/);
  assert.match(controls, /Usar tamaño personalizado/);
  assert.match(controls, /Tamaño predefinido/);
  assert.match(controls, /Las dimensiones individuales se editan en cada fila/);
  assert.match(controls, /Compartidas/);
  assert.match(controls, /Únicas por carta/);
  assert.match(cards, /data-role="width"/);
  assert.match(cards, /data-role="height"/);
  assert.match(cards, /aria-label="Dimensiones de/);
  assert.match(cards, /data-back-specific="true"/);
  assert.match(cards, /data-back-specific-toggle="true"/);
  assert.match(cards, /Usar respaldo específico/);
  assert.match(cards, /renderSpecificBackControl\(selectedCard/);
  assert.doesNotMatch(backControls, /Respaldos específicos/);
});

test('el carrusel de cartas expone navegación accesible y la previsualización tiene zona propia', async () => {
  const [html, cards] = await Promise.all([
    read('../index.html'),
    read('../src/components/card-list.js')
  ]);

  assert.match(cards, /role="region"/);
  assert.match(cards, /aria-label="Carrusel compacto de cartas"/);
  assert.match(cards, /data-carousel-action="previous"/);
  assert.match(cards, /data-carousel-action="next"/);
  assert.match(cards, /aria-controls="cards-carousel"/);
  assert.match(cards, /aria-label="Carta anterior"/);
  assert.match(cards, /aria-label="Carta siguiente"/);
  assert.match(cards, /class="card-row-header"/);
  assert.match(cards, /class="card-row-identity"/);
  assert.match(cards, /aria-label="Carrusel compacto de cartas"/);
  assert.match(cards, /aria-pressed=/);
  assert.doesNotMatch(cards, /aria-selected=/);
  assert.match(cards, /data-action="select-card"/);
  assert.match(cards, /Carta seleccionada/);
  assert.match(cards, /addEventListener\('wheel'/);
  assert.match(cards, /deltaY/);
  assert.match(cards, /cardCarouselScrollLeft/);
  assert.match(cards, /preserveCarouselPosition/);
  assert.match(cards, /carousel\.scrollLeft = preservedScrollLeft/);
  assert.match(cards, /carouselScrollLeft: carousel\.scrollLeft/);
  assert.match(html, /scroll-snap-type:\s*x/);
  assert.match(html, /grid-template-columns:\s*minmax\(17rem, 21rem\)\s+minmax\(0, 1fr\)/);
  assert.match(html, /grid-template-areas:\s*"config cards"\s+"config preview"\s+"config backs"/);
  assert.match(html, /\.preview-panel[^\n]*grid-area:\s*preview[^\n]*position:\s*static/);
});

test('T7 asocia los errores de descarga con una región perceptible', async () => {
  const app = await read('../src/app.js');
  assert.match(app, /id="export-status"/);
  assert.match(app, /role="\$\{state\.exportStatus\.kind === 'error' \? 'alert' : 'status'\}"/);
  assert.match(app, /No se pudo generar el PDF/);
});
