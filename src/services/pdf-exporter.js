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
  if (!position || !position.item?.image?.dataUrl) {
    throw createExportError('La carta no contiene una imagen local válida para exportar.');
  }
  for (const key of ['x', 'y', 'width', 'height', 'contentX', 'contentY', 'contentWidth', 'contentHeight']) {
    if (!Number.isFinite(position[key]) || position[key] < 0) {
      throw createExportError('La posición de una carta no es válida para exportar.');
    }
  }
  if (position.contentWidth <= 0 || position.contentHeight <= 0) {
    throw createExportError('El área de imagen de una carta no es válida para exportar.');
  }
  getImageFormat(position.item.image);
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

function drawPage(pdf, page, config, isFirstPage) {
  const paper = config.paper;
  if (!isFirstPage) {
    pdf.addPage([paper.width, paper.height], config.orientation);
  }

  pdf.setDrawColor(24, 33, 43);
  pdf.setLineWidth(0.2);
  for (const position of page) {
    assertPosition(position);
    pdf.rect(position.x, position.y, position.width, position.height);
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

function drawBackPage(pdf, page, config, isFirstPage) {
  const paper = config.paper;
  if (!isFirstPage) pdf.addPage([paper.width, paper.height], config.orientation);
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
    layout.pages.forEach((page, index) => drawPage(pdf, page, layout.config, index === 0));
    if (backPages.length > 0) {
      backPages.forEach((page, index) => drawBackPage(pdf, page, layout.config, index === 0));
    }
    pdf.save(filename);
  } catch (error) {
    if (error?.name === 'PdfExportError') throw error;
    throw createExportError(error instanceof Error ? error.message : 'No se pudo generar el PDF.', error);
  }

  return { filename, pages: layout.pages.length };
}

export { DEFAULT_FILENAME };
