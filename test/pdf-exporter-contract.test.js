import assert from 'node:assert/strict';
import { test } from 'node:test';

import { exportLayoutToPdf, getImageFormat } from '../src/services/pdf-exporter.js';
import { createConfig } from '../src/utils/config.js';
import { calculateLayout } from '../src/utils/layout.js';
import { deriveBackPages } from '../src/utils/back-layout.js';

function createLayout(overrides = {}) {
  const position = {
    item: {
      id: 'card-1',
      name: 'Guerrero',
      image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' }
    },
    x: 10,
    y: 12,
    width: 63,
    height: 88,
    contentX: 12,
    contentY: 14,
    contentWidth: 59,
    contentHeight: 84
  };

  return {
    valid: true,
    config: {
      paper: { width: 210, height: 297 },
      orientation: 'portrait',
      card: { width: 63, height: 88 },
      visualMode: 'normal'
    },
    items: [position.item],
    pages: [[position]],
    totalPages: 1,
    ...overrides
  };
}

function createPdfDouble() {
  const calls = [];
  let saves = 0;
  return {
    calls,
    get saves() { return saves; },
    factory(options) {
      calls.push(['constructor', options]);
      return {
        addPage(format, orientation) { calls.push(['addPage', format, orientation]); },
        setDrawColor(...args) { calls.push(['setDrawColor', ...args]); },
        setLineWidth(value) { calls.push(['setLineWidth', value]); },
        rect(...args) { calls.push(['rect', ...args]); },
        addImage(...args) { calls.push(['addImage', ...args]); },
        save(filename) { saves += 1; calls.push(['save', filename]); }
      };
    }
  };
}

test('la exportación válida usa todas las páginas, posiciones, bordes e imágenes', () => {
  const pdf = createPdfDouble();
  const result = exportLayoutToPdf(createLayout(), { jsPDFFactory: pdf.factory });

  assert.equal(result.filename, 'mazo-imprimible.pdf');
  assert.equal(pdf.saves, 1);
  assert.deepEqual(pdf.calls[0], ['constructor', {
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 297]
  }]);
  assert.ok(pdf.calls.some((call) => call[0] === 'rect' && call.slice(1).join(',') === '10,12,63,88'));
  assert.ok(pdf.calls.some((call) => call[0] === 'addImage' && call[2] === 'PNG'));
  assert.deepEqual(pdf.calls.at(-1), ['save', 'mazo-imprimible.pdf']);
});

test('la exportación crea una página PDF por cada página del LayoutModel', () => {
  const pdf = createPdfDouble();
  const firstPage = createLayout().pages[0];
  exportLayoutToPdf(createLayout({ pages: [firstPage, firstPage], totalPages: 2, items: [firstPage[0].item, firstPage[0].item] }), {
    jsPDFFactory: pdf.factory
  });

  assert.equal(pdf.calls.filter((call) => call[0] === 'addPage').length, 1);
  assert.equal(pdf.saves, 1);
});

test('cero cartas bloquea la descarga sin crear un documento falso', () => {
  const pdf = createPdfDouble();

  assert.throws(
    () => exportLayoutToPdf(createLayout({ items: [], pages: [], totalPages: 0 }), { jsPDFFactory: pdf.factory }),
    /cargar.*carta/i
  );
  assert.equal(pdf.calls.length, 0);
  assert.equal(pdf.saves, 0);
});

test('un LayoutModel inválido bloquea la descarga antes de inicializar jsPDF', () => {
  const pdf = createPdfDouble();

  assert.throws(
    () => exportLayoutToPdf(createLayout({ valid: false, errors: ['La carta no cabe.'] }), { jsPDFFactory: pdf.factory }),
    /carta no cabe/i
  );
  assert.equal(pdf.calls.length, 0);
});

test('PNG y JPEG conservan el formato declarado al agregarse al PDF', () => {
  assert.equal(getImageFormat({ mimeType: 'image/png', dataUrl: 'data:image/png;base64,AA==' }), 'PNG');
  assert.equal(getImageFormat({ mimeType: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,AA==' }), 'JPEG');

  const pdf = createPdfDouble();
  const layout = createLayout({
    pages: [[{
      ...createLayout().pages[0][0],
      item: { ...createLayout().pages[0][0].item, image: { dataUrl: 'data:image/jpeg;base64,AA==', mimeType: 'image/jpeg' } }
    }]]
  });
  exportLayoutToPdf(layout, { jsPDFFactory: pdf.factory });
  assert.ok(pdf.calls.some((call) => call[0] === 'addImage' && call[2] === 'JPEG'));
});

test('error de dependencia o de imagen no anuncia una descarga exitosa', () => {
  const dependencyPdf = createPdfDouble();
  assert.throws(
    () => exportLayoutToPdf(createLayout(), { jsPDFFactory: () => { throw new Error('jsPDF no disponible'); } }),
    /jsPDF no disponible/
  );
  assert.equal(dependencyPdf.saves, 0);

  const imagePdf = createPdfDouble();
  const invalidImageLayout = createLayout({
    pages: [[{
      ...createLayout().pages[0][0],
      item: { ...createLayout().pages[0][0].item, image: { dataUrl: '', mimeType: 'image/png' } }
    }]]
  });
  assert.throws(
    () => exportLayoutToPdf(invalidImageLayout, { jsPDFFactory: imagePdf.factory }),
    /imagen.*válida|datos locales/i
  );
  assert.equal(imagePdf.saves, 0);
});

test('la exportación consume un layout generado con varios grupos de tamaño', () => {
  const pdf = createPdfDouble();
  const config = createConfig({
    paper: { width: 55, height: 55 },
    dimensionsMode: 'perType',
    cardTypes: [
      { id: 'small', size: { width: 20, height: 20 } },
      { id: 'large', size: { width: 30, height: 30 } }
    ],
    alignment: { horizontal: 'right', vertical: 'bottom' }
  });
  const image = { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' };
  const layout = calculateLayout({
    config,
    cards: [
      { id: 'small', quantity: 2, image },
      { id: 'large', quantity: 1, image }
    ]
  });

  exportLayoutToPdf(layout, { jsPDFFactory: pdf.factory });
  assert.equal(pdf.calls.filter((call) => call[0] === 'addImage').length, 3);
  assert.ok(pdf.calls.some((call) => call[0] === 'rect' && call[1] === 25 && call[2] === 25));
  assert.equal(pdf.saves, 1);
});

test('la exportación coloca todos los frentes antes que los respaldos', () => {
  const pdf = createPdfDouble();
  const layout = createLayout();
  const backImage = { dataUrl: 'data:image/jpeg;base64,AA==', mimeType: 'image/jpeg' };
  const backPages = [[{
    ...layout.pages[0][0],
    backImage,
    source: 'specific'
  }]];

  exportLayoutToPdf(layout, { jsPDFFactory: pdf.factory, backPages });
  const imageCalls = pdf.calls.filter((call) => call[0] === 'addImage');
  assert.equal(imageCalls.length, 2);
  assert.equal(imageCalls[0][1], layout.pages[0][0].item.image.dataUrl);
  assert.equal(imageCalls[1][1], backImage.dataUrl);
});

test('la exportación consume las coordenadas reflejadas por el layout de respaldos', () => {
  const pdf = createPdfDouble();
  const layout = createLayout();
  const backImage = { dataUrl: 'data:image/png;base64,BB==', mimeType: 'image/png' };
  const backPages = deriveBackPages(layout, { global: null, bySize: {}, byCard: { 'card-1': backImage } }).pages;

  exportLayoutToPdf(layout, { jsPDFFactory: pdf.factory, backPages });

  const backCall = pdf.calls.find((call) => call[0] === 'addImage' && call[1] === backImage.dataUrl);
  assert.deepEqual(backCall.slice(3), [137, 12, 63, 88]);
});

test('la exportación valida respaldos antes de crear el documento', () => {
  const calls = [];
  const layout = createLayout();
  const invalidBackPages = [[{ ...layout.pages[0][0], backImage: { dataUrl: 'data:image/gif;base64,AA==', mimeType: 'image/gif' } }]];

  assert.throws(
    () => exportLayoutToPdf(layout, { backPages: invalidBackPages, jsPDFFactory: (options) => { calls.push(options); return createPdfDouble().factory(options); } }),
    /PNG o JPEG/i
  );
  assert.equal(calls.length, 0);
});
