import {
  normalizeMillimeters,
  normalizeNonNegativeMillimeters
} from './units.js';

export const PAPER_SIZES = Object.freeze({
  a4: Object.freeze({ width: 210, height: 297 }),
  letter: Object.freeze({ width: 215.9, height: 279.4 }),
  legal: Object.freeze({ width: 215.9, height: 355.6 }),
  a3: Object.freeze({ width: 297, height: 420 })
});

export const CARD_PRESETS = Object.freeze({
  poker: Object.freeze({ label: 'Poker / Standard', width: 63.5, height: 88.9 }),
  bridge: Object.freeze({ label: 'Bridge', width: 57.1, height: 88.9 }),
  standardEuropean: Object.freeze({ label: 'Standard European', width: 59, height: 92 }),
  miniEuropean: Object.freeze({ label: 'Mini European', width: 44.5, height: 69.9 }),
  miniAmerican: Object.freeze({ label: 'Mini American', width: 41, height: 63 }),
  tarot: Object.freeze({ label: 'Tarot', width: 69.9, height: 120.7 }),
  euroPoker: Object.freeze({ label: 'Euro Poker', width: 63.5, height: 95.3 }),
  square70: Object.freeze({ label: 'Cuadrada 70 × 70', width: 70, height: 70 })
});

const DEFAULTS = Object.freeze({
  paper: 'a4',
  orientation: 'portrait',
  card: Object.freeze({ width: 63, height: 88 }),
  dimensionsMode: 'shared',
  alignment: Object.freeze({ horizontal: 'center', vertical: 'center' }),
  margins: Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 }),
  padding: 0,
  visualMode: 'normal'
});

const ORIENTATIONS = new Set(['portrait', 'landscape']);
const VISUAL_MODES = new Set(['normal', 'bleed']);
const DIMENSIONS_MODES = new Set(['shared', 'perType']);
const HORIZONTAL_ALIGNMENTS = new Set(['left', 'center', 'right']);
const VERTICAL_ALIGNMENTS = new Set(['top', 'center', 'bottom']);
const MARGIN_KEYS = ['top', 'right', 'bottom', 'left'];

function addError(errors, callback) {
  try {
    return callback();
  } catch (error) {
    errors.push(error.message);
    return null;
  }
}

function normalizeCardMillimeters(value, name) {
  const normalized = normalizeMillimeters(value, { name });
  return Math.round((normalized + Number.EPSILON) * 10) / 10;
}

function normalizeBox(value, { name, allowZero, fallback, errors }) {
  const source = value === undefined ? fallback : value;
  const normalize = allowZero ? normalizeNonNegativeMillimeters : normalizeMillimeters;

  if (typeof source === 'number' || typeof source === 'string') {
    const normalized = addError(errors, () => normalize(source, { name }));
    return Object.fromEntries(MARGIN_KEYS.map((key) => [key, normalized ?? 0]));
  }

  if (source === null || typeof source !== 'object' || Array.isArray(source)) {
    errors.push(`${name} debe ser un número o un objeto con lados.`);
    return Object.fromEntries(MARGIN_KEYS.map((key) => [key, 0]));
  }

  return Object.fromEntries(MARGIN_KEYS.map((key) => [
    key,
    addError(errors, () => normalize(source[key] ?? 0, { name: `${name} ${key}` })) ?? 0
  ]));
}

function normalizePaper(value, orientation, errors) {
  const paperValue = value ?? DEFAULTS.paper;
  let dimensions;

  if (typeof paperValue === 'string' && PAPER_SIZES[paperValue]) {
    dimensions = PAPER_SIZES[paperValue];
  } else if (
    paperValue &&
    typeof paperValue === 'object' &&
    !Array.isArray(paperValue)
  ) {
    const width = addError(errors, () => normalizeMillimeters(paperValue.width, { name: 'El ancho del papel' }));
    const height = addError(errors, () => normalizeMillimeters(paperValue.height, { name: 'El alto del papel' }));
    dimensions = width && height ? { width, height } : { width: 0, height: 0 };
  } else {
    errors.push('El papel debe ser un tamaño conocido o dimensiones físicas válidas.');
    dimensions = { width: 0, height: 0 };
  }

  if (orientation === 'landscape') {
    return { width: dimensions.height, height: dimensions.width };
  }

  return { ...dimensions };
}

function normalizeOrientation(value, errors) {
  const orientation = value ?? DEFAULTS.orientation;
  if (!ORIENTATIONS.has(orientation)) {
    errors.push('La orientación debe ser portrait o landscape.');
    return DEFAULTS.orientation;
  }
  return orientation;
}

function normalizeVisualMode(value, errors) {
  const visualMode = value ?? DEFAULTS.visualMode;
  if (!VISUAL_MODES.has(visualMode)) {
    errors.push('El modo visual debe ser normal o bleed.');
    return DEFAULTS.visualMode;
  }
  return visualMode;
}

function normalizeDimensionsMode(value, errors) {
  const mode = value ?? DEFAULTS.dimensionsMode;
  if (!DIMENSIONS_MODES.has(mode)) {
    errors.push('El modo de dimensiones debe ser shared o perType.');
    return DEFAULTS.dimensionsMode;
  }
  return mode;
}

function normalizeAlignment(value, errors) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const horizontal = source.horizontal ?? DEFAULTS.alignment.horizontal;
  const vertical = source.vertical ?? DEFAULTS.alignment.vertical;
  const normalized = {
    horizontal: HORIZONTAL_ALIGNMENTS.has(horizontal) ? horizontal : DEFAULTS.alignment.horizontal,
    vertical: VERTICAL_ALIGNMENTS.has(vertical) ? vertical : DEFAULTS.alignment.vertical
  };
  if (!HORIZONTAL_ALIGNMENTS.has(horizontal)) {
    errors.push('La alineación horizontal debe ser left, center o right.');
  }
  if (!VERTICAL_ALIGNMENTS.has(vertical)) {
    errors.push('La alineación vertical debe ser top, center o bottom.');
  }
  return normalized;
}

function normalizeCardTypes(value, errors) {
  const entries = Array.isArray(value)
    ? value.map((cardType) => [cardType?.id, cardType?.size])
    : value && typeof value === 'object'
      ? Object.entries(value).map(([id, cardType]) => [id, cardType?.size ?? cardType])
      : [];

  return entries.map(([id, size]) => {
    const typeId = typeof id === 'string' ? id.trim() : '';
    if (!typeId) {
      errors.push('Cada tipo de carta debe tener una identidad no vacía.');
    }
    const width = addError(errors, () => normalizeCardMillimeters(size?.width, {
      name: `El ancho de la carta ${typeId || 'sin identidad'}`
    }));
    const height = addError(errors, () => normalizeCardMillimeters(size?.height, {
      name: `El alto de la carta ${typeId || 'sin identidad'}`
    }));
    return {
      id: typeId,
      size: width && height ? { width, height } : null
    };
  });
}

function buildConfig(input = {}) {
  const errors = [];
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const orientation = normalizeOrientation(source.orientation, errors);
  const visualMode = normalizeVisualMode(source.visualMode, errors);
  const dimensionsMode = normalizeDimensionsMode(source.dimensionsMode, errors);
  const alignment = normalizeAlignment(source.alignment, errors);
  const paperSize = typeof source.paper === 'string' ? source.paper : null;
  const paper = normalizePaper(source.paper, orientation, errors);
  const cardSource = source.card ?? DEFAULTS.card;

  const card = {
    width: addError(errors, () => normalizeCardMillimeters(cardSource.width, 'El ancho de la carta')) ?? 0,
    height: addError(errors, () => normalizeCardMillimeters(cardSource.height, 'El alto de la carta')) ?? 0
  };
  const sharedCardSize = { ...card };
  const cardTypes = normalizeCardTypes(source.cardTypes, errors);

  const margins = normalizeBox(source.margins, {
    name: 'El margen',
    allowZero: true,
    fallback: DEFAULTS.margins,
    errors
  });

  const requestedPadding = normalizeBox(source.padding, {
    name: 'El padding',
    allowZero: true,
    fallback: DEFAULTS.padding,
    errors
  });
  const padding = visualMode === 'bleed'
    ? { top: 0, right: 0, bottom: 0, left: 0 }
    : requestedPadding;

  const printableArea = {
    width: paper.width - margins.left - margins.right,
    height: paper.height - margins.top - margins.bottom
  };

  if (printableArea.width <= 0 || printableArea.height <= 0) {
    errors.push('El área imprimible debe ser positiva después de restar los márgenes.');
  }

  const sizesToValidate = dimensionsMode === 'perType'
    ? cardTypes.map((cardType) => cardType.size).filter(Boolean)
    : [card];
  if (sizesToValidate.some((size) => size.width > printableArea.width || size.height > printableArea.height)) {
    errors.push('La carta no cabe en el área imprimible configurada.');
  }

  const config = {
    paperSize,
    orientation,
    paper,
    card,
    dimensionsMode,
    sharedCardSize,
    cardTypes,
    alignment,
    margins,
    padding,
    visualMode,
    printableArea,
    isPrintable: errors.length === 0
  };

  return { config, errors };
}

export function validateConfig(input = {}) {
  const { config, errors } = buildConfig(input);
  return {
    valid: errors.length === 0,
    errors,
    config: errors.length === 0 ? config : null
  };
}

export function createConfig(input = {}) {
  const result = validateConfig(input);
  if (!result.valid) {
    const error = new Error(`Configuración inválida: ${result.errors.join(' ')}`);
    error.name = 'ConfigValidationError';
    error.errors = result.errors;
    throw error;
  }
  return result.config;
}
