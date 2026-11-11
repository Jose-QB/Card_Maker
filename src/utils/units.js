const NUMERIC_STRING_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

export function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseFiniteNumber(value, name) {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim();
    if (NUMERIC_STRING_PATTERN.test(normalizedValue)) {
      const parsedValue = Number(normalizedValue);
      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  throw new TypeError(`${name} debe ser un número finito en milímetros.`);
}

export function normalizeMillimeters(value, { name = 'La dimensión' } = {}) {
  const parsedValue = parseFiniteNumber(value, name);

  if (parsedValue <= 0) {
    throw new RangeError(`${name} debe ser mayor que cero.`);
  }

  return parsedValue;
}

export function normalizeNonNegativeMillimeters(value, { name = 'El valor' } = {}) {
  const parsedValue = parseFiniteNumber(value, name);

  if (parsedValue < 0) {
    throw new RangeError(`${name} debe ser no negativo.`);
  }

  return parsedValue;
}
