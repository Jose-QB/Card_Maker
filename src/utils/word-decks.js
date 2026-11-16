import { normalizeMillimeters } from './units.js';

export const CONCEPT_COLORS = Object.freeze([
  '#f39b48', '#4f9fc4', '#7b61a8', '#4d9a68', '#d46767', '#b38a3e',
  '#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#6d597a', '#355070',
  '#43aa8b', '#577590', '#f94144', '#f3722c', '#90be6d', '#277da1',
  '#9b5de5', '#00b4d8'
]);

function createWordDeckError(message, errors = []) {
  const error = new Error(message);
  error.name = 'WordDeckValidationError';
  error.errors = errors;
  return error;
}

function addError(errors, callback) {
  try {
    return callback();
  } catch (error) {
    errors.push(error.message);
    return null;
  }
}

function normalizeText(value, { name, errors }) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${name} no puede estar vacío.`);
    return '';
  }

  return value.trim();
}

function normalizeColor(value, index, errors) {
  const fallback = CONCEPT_COLORS[index % CONCEPT_COLORS.length];
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) {
    errors.push(`El color de la lista ${index + 1} debe ser hexadecimal.`);
    return fallback;
  }
  return value.toLowerCase();
}

export function chooseConceptColor(usedColors = [], random = Math.random) {
  const available = CONCEPT_COLORS.filter((color) => !usedColors.includes(color));
  const colors = available.length > 0 ? available : CONCEPT_COLORS;
  const randomValue = random();
  const value = Number.isFinite(randomValue) ? Math.min(Math.max(randomValue, 0), 0.999999999) : 0;
  return colors[Math.floor(value * colors.length)];
}

function normalizeCard(card, errors) {
  const source = card && typeof card === 'object' && !Array.isArray(card) ? card : {};
  const width = addError(errors, () => normalizeMillimeters(source.width, { name: 'El ancho de la carta' }));
  const height = addError(errors, () => normalizeMillimeters(source.height, { name: 'El alto de la carta' }));

  return {
    width: width ?? 0,
    height: height ?? 0
  };
}

function normalizeList(list, index, errors) {
  const source = list && typeof list === 'object' && !Array.isArray(list) ? list : {};
  const concept = normalizeText(source.concept, {
    name: `El concepto de la lista ${index + 1}`,
    errors
  });
  const words = Array.isArray(source.words) ? source.words : null;

  if (!words) {
    errors.push(`Las palabras de la lista ${index + 1} deben ser un arreglo.`);
  }

  const normalizedWords = (words ?? []).map((word, wordIndex) => normalizeText(word, {
    name: `La palabra ${wordIndex + 1} de la lista ${index + 1}`,
    errors
  }));

  if (normalizedWords.length === 0) {
    errors.push(`La lista ${index + 1} debe contener al menos una palabra.`);
  }

  return {
    id: `list-${index + 1}`,
    concept,
    color: normalizeColor(source.color, index, errors),
    words: normalizedWords
  };
}

function normalizeWordsPerCard(value, errors) {
  if (!Number.isInteger(value) || value <= 0) {
    errors.push('La cantidad de palabras por carta debe ser un entero positivo.');
    return 0;
  }

  return value;
}

function buildWordDeckConfig(input = {}) {
  const errors = [];
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const card = normalizeCard(source.card, errors);
  const lists = Array.isArray(source.lists) ? source.lists : [];

  if (lists.length === 0) {
    errors.push('Debe existir al menos una lista de palabras.');
  }

  const normalizedLists = lists.map((list, index) => normalizeList(list, index, errors));
  const wordsPerCard = normalizeWordsPerCard(source.wordsPerCard, errors);
  const totalWords = normalizedLists.reduce((total, list) => total + list.words.length, 0);

  if (totalWords === 0) {
    errors.push('Debe existir al menos una palabra válida.');
  }

  return {
    config: {
      card,
      lists: normalizedLists,
      wordsPerCard,
      totalWords
    },
    errors
  };
}

export function validateWordDeckConfig(input = {}) {
  const { config, errors } = buildWordDeckConfig(input);
  return {
    valid: errors.length === 0,
    errors,
    config: errors.length === 0 ? config : null
  };
}

export function createWordDeckConfig(input = {}) {
  const result = validateWordDeckConfig(input);
  if (!result.valid) {
    throw createWordDeckError(
      `Configuración de mazo de palabras inválida: ${result.errors.join(' ')}`,
      result.errors
    );
  }

  return result.config;
}

export function normalizeWordKey(word) {
  return word.trim().toLowerCase();
}

export function createWordEntries(config) {
  if (!config || !Array.isArray(config.lists)) {
    throw createWordDeckError('Se necesita una configuración válida de mazo de palabras.');
  }

  const entries = config.lists.flatMap((list) => list.words.map((word, index) => ({
    id: `${list.id}-word-${index + 1}`,
    concept: list.concept,
    color: list.color,
    word,
    sourceListId: list.id
  })));
  const counts = new Map();

  for (const entry of entries) {
    const key = normalizeWordKey(entry.word);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return entries.map((entry) => ({
    ...entry,
    isRepeated: counts.get(normalizeWordKey(entry.word)) > 1
  }));
}

export function calculateWordCardCount(totalWords, wordsPerCard) {
  if (!Number.isInteger(totalWords) || totalWords <= 0) {
    throw new RangeError('El total de palabras debe ser un entero positivo.');
  }
  if (!Number.isInteger(wordsPerCard) || wordsPerCard <= 0) {
    throw new RangeError('La cantidad de palabras por carta debe ser un entero positivo.');
  }

  return Math.ceil(totalWords / wordsPerCard);
}

function randomIndex(length, random) {
  const value = random();
  const normalized = Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.999999999) : 0;
  return Math.floor(normalized * length);
}

function chooseEntryIndex(remaining, concepts, random) {
  const diverseIndexes = remaining
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !concepts.has(entry.concept))
    .map(({ index }) => index);
  const candidates = diverseIndexes.length > 0
    ? diverseIndexes
    : remaining.map((_, index) => index);

  return candidates[randomIndex(candidates.length, random)];
}

export function distributeWordEntries(entries, wordsPerCard, random = Math.random) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new RangeError('Debe existir al menos una palabra para distribuir.');
  }
  if (!Number.isInteger(wordsPerCard) || wordsPerCard <= 0) {
    throw new RangeError('La cantidad de palabras por carta debe ser un entero positivo.');
  }
  if (typeof random !== 'function') {
    throw new TypeError('La fuente aleatoria debe ser una función.');
  }

  const remaining = [...entries];
  const cards = [];

  while (remaining.length > 0) {
    const card = [];
    const concepts = new Set();

    while (card.length < wordsPerCard && remaining.length > 0) {
      const index = chooseEntryIndex(remaining, concepts, random);
      const [entry] = remaining.splice(index, 1);
      card.push(entry);
      concepts.add(entry.concept);
    }

    cards.push(card);
  }

  const lastCard = cards.at(-1);
  const conceptCounts = new Map();
  for (const card of cards) {
    for (const entry of card) {
      conceptCounts.set(entry.concept, (conceptCounts.get(entry.concept) ?? 0) + 1);
    }
  }
  while (lastCard.length < wordsPerCard) {
    const leastRepresented = Math.min(...entries.map((entry) => conceptCounts.get(entry.concept) ?? 0));
    const candidates = entries.filter((entry) => (conceptCounts.get(entry.concept) ?? 0) === leastRepresented);
    const source = candidates[randomIndex(candidates.length, random)];
    lastCard.push({ ...source, isFillRepeat: true });
    conceptCounts.set(source.concept, (conceptCounts.get(source.concept) ?? 0) + 1);
  }

  return cards;
}
