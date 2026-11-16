import { jsPDF } from 'jspdf';

const DEFAULT_FILENAME = 'mazo-imprimible.pdf';

function createExportError(message, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.name = 'PdfExportError';
  return error;
}

function getMimeType(image) {
  const declared = typeof image?.mimeType === 'string' ? image.mimeType.toLowerCase() : '';
  const dataUrl = typeof image?.dataUrl === 'string' ? image.dataUrl.toLowerCase() : '';
  return declared || dataUrl.slice(5, dataUrl.indexOf(';'));
}

function parseHexColor(value, fallback = [243, 155, 72]) {
  const source = typeof value === 'string' ? value.trim().replace(/^#/, '') : '';
  const normalized = source.length === 3
    ? source.split('').map((part) => `${part}${part}`).join('')
    : source;
  if (!/^[\da-f]{6}$/i.test(normalized)) return fallback;
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}

function fitTextFontSize(pdf, text, {
  maxSize,
  minSize,
  maxWidth,
  maxHeight
}) {
  let size = maxSize;
  const value = String(text ?? '');
  while (size > minSize) {
    const measuredWidth = typeof pdf.getTextWidth === 'function'
      ? pdf.getTextWidth(value)
      : (value.length * size * 0.45) / 2.834;
    if (measuredWidth <= maxWidth && size * 1.2 <= maxHeight) return size;
    size -= 0.5;
  }
  return minSize;
}

export function getImageFormat(image) {
  const mimeType = getMimeType(image);
  if (mimeType === 'image/png') return 'PNG';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'JPEG';
  throw createExportError('La imagen debe ser PNG o JPEG para exportarse a PDF.');
}

function assertExportableLayout(layout) {
  if (!layout?.valid) {
    throw createExportError(layout?.errors?.[0] ?? 'La configuración no permite generar el PDF.');
  }
  if (!Array.isArray(layout.items) || layout.items.length === 0 || !Array.isArray(layout.pages) || layout.pages.length === 0) {
    throw createExportError('Cargar al menos una carta para generar el PDF.');
  }
  if (!layout.config?.paper || !Number.isFinite(layout.config.paper.width) || !Number.isFinite(layout.config.paper.height)) {
    throw createExportError('El papel de la configuración no es válido para exportar.');
  }
}

function assertPosition(position) {
  const isWordCard = Array.isArray(position?.item?.wordEntries);
  if (!position || (!position.item?.image?.dataUrl && !isWordCard)) {
    throw createExportError('La carta no contiene una imagen local válida para exportar.');
  }
  for (const key of ['x', 'y', 'width', 'height', 'contentX', 'contentY', 'contentWidth', 'contentHeight']) {
    if (!Number.isFinite(position[key]) || position[key] < 0) {
      throw createExportError('La posición de una carta no es válida para exportar.');
    }
  }
  if (!isWordCard && (position.contentWidth <= 0 || position.contentHeight <= 0)) {
    throw createExportError('El área de imagen de una carta no es válida para exportar.');
  }
  if (!isWordCard) getImageFormat(position.item.image);
}

function assertBackPage(page, paper) {
  if (!Array.isArray(page)) throw createExportError('La página de respaldo no es válida para exportar.');
  if (page.background?.dataUrl) getImageFormat(page.background);
  for (const position of page) {
    if (position.backImage?.dataUrl) {
      if (![position.x, position.y, position.width, position.height].every((value) => Number.isFinite(value) && value >= 0)
        || position.x + position.width > paper.width
        || position.y + position.height > paper.height) {
        throw createExportError('La posición de un respaldo no es válida para exportar.');
      }
      getImageFormat(position.backImage);
    }
  }
}

function drawPage(pdf, page, config, isFirstPage, pageNumber) {
  const paper = config.paper;
  if (!isFirstPage) {
    pdf.addPage([paper.width, paper.height], config.orientation);
  }
  if (typeof pdf.setPage === 'function') pdf.setPage(pageNumber);

  pdf.setDrawColor(24, 33, 43);
  pdf.setLineWidth(0.2);
  for (const position of page) {
    assertPosition(position);
    pdf.rect(position.x, position.y, position.width, position.height);
    if (Array.isArray(position.item.wordEntries)) {
      drawWordCard(pdf, position);
      continue;
    }
    pdf.addImage(
      position.item.image.dataUrl,
      getImageFormat(position.item.image),
      position.contentX,
      position.contentY,
      position.contentWidth,
      position.contentHeight
    );
  }
}

function drawWordCard(pdf, position) {
  const entries = position.item.wordEntries;
  if (entries.length === 0) return;

  const paddingX = position.width * 0.06;
  const paddingY = position.height * 0.06;
  const gap = Math.min(3, position.height * 0.015);
  const rowHeight = Math.max(1, (position.height - paddingY * 2 - gap * (entries.length - 1)) / entries.length);
  const cardScale = Math.max(0.45, Math.min(1, Math.min(position.width / 63, position.height / 88)));
  const entryScale = Math.max(0.45, Math.min(1, 1 / Math.sqrt(entries.length)));
  const textWidth = Math.max(1, position.width - paddingX * 2 - 4);

  entries.forEach((entry, index) => {
    const rowY = position.y + paddingY + index * (rowHeight + gap);
    const color = parseHexColor(entry.color);
    pdf.setFillColor(251, 246, 238);
    pdf.roundedRect(position.x + paddingX, rowY, textWidth + 2, rowHeight, 1, 1, 'F');
    pdf.setFillColor(...color);
    pdf.rect(position.x + paddingX, rowY, 1.2, rowHeight, 'F');
    const concept = String(entry.concept ?? '').toUpperCase();
    const word = String(entry.word ?? '');
    const conceptSize = fitTextFontSize(pdf, concept, {
      maxSize: Math.min(11, 11 * cardScale * Math.max(0.6, entryScale)),
      minSize: 5,
      maxWidth: textWidth,
      maxHeight: rowHeight * 2.834 * 0.26
    });
    const wordSize = fitTextFontSize(pdf, word, {
      maxSize: Math.min(18, 18 * cardScale * Math.max(0.65, entryScale)),
      minSize: 7,
      maxWidth: textWidth,
      maxHeight: rowHeight * 2.834 * 0.48
    });
    pdf.setTextColor(92, 113, 128);
    pdf.setFontSize(conceptSize);
    pdf.text(concept, position.x + paddingX + 3, rowY + Math.min(rowHeight * 0.35, 4));
    pdf.setTextColor(10, 36, 55);
    pdf.setFontSize(wordSize);
    pdf.text(word, position.x + paddingX + 3, rowY + Math.min(rowHeight * 0.72, 8));
  });
}

function drawBackPage(pdf, page, config, pageNumber) {
  const paper = config.paper;
  // Los respaldos siempre van después de todas las páginas de frente,
  // incluida la primera página de respaldos.
  pdf.addPage([paper.width, paper.height], config.orientation);
  if (typeof pdf.setPage === 'function') pdf.setPage(pageNumber);
  assertBackPage(page, paper);
  if (page.background?.dataUrl) {
    pdf.addImage(page.background.dataUrl, getImageFormat(page.background), 0, 0, paper.width, paper.height);
  }
  for (const position of page) {
    if (!position.backImage?.dataUrl) continue;
    pdf.addImage(position.backImage.dataUrl, getImageFormat(position.backImage), position.x, position.y, position.width, position.height);
  }
}

export function exportLayoutToPdf(layout, {
  jsPDFFactory = (options) => new jsPDF(options),
  filename = DEFAULT_FILENAME,
  backPages = []
} = {}) {
  assertExportableLayout(layout);
  layout.pages.forEach((page) => page.forEach(assertPosition));
  backPages.forEach((page) => assertBackPage(page, layout.config.paper));
  if (typeof jsPDFFactory !== 'function') {
    throw createExportError('La dependencia jsPDF no está disponible.');
  }

  const paper = layout.config.paper;
  let pdf;
  try {
    pdf = jsPDFFactory({
      orientation: layout.config.orientation,
      unit: 'mm',
      format: [paper.width, paper.height]
    });
    if (!pdf || typeof pdf.save !== 'function') {
      throw new Error('La instancia de jsPDF no expone save().');
    }
    layout.pages.forEach((page, index) => drawPage(pdf, page, layout.config, index === 0, index + 1));
    if (backPages.length > 0) {
      backPages.forEach((page, index) => drawBackPage(pdf, page, layout.config, layout.pages.length + index + 1));
    }
    const expectedPages = layout.pages.length + backPages.length;
    const actualPages = typeof pdf.getNumberOfPages === 'function'
      ? pdf.getNumberOfPages()
      : pdf.internal?.getNumberOfPages?.();
    if (Number.isFinite(actualPages) && actualPages !== expectedPages) {
      throw createExportError(`El PDF generó ${actualPages} páginas y se esperaban ${expectedPages}.`);
    }
    pdf.save(filename);
  } catch (error) {
    if (error?.name === 'PdfExportError') throw error;
    throw createExportError(error instanceof Error ? error.message : 'No se pudo generar el PDF.', error);
  }

  return { filename, pages: layout.pages.length + backPages.length };
}

export { DEFAULT_FILENAME };
