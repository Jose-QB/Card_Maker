function csvError(message) {
  const error = new Error(message);
  error.name = 'WordCsvValidationError';
  return error;
}

function parseRows(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw csvError('El archivo CSV está vacío.');
  }

  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (character === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n') {
      row.push(value.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw csvError('El archivo CSV contiene comillas sin cerrar.');
  row.push(value.replace(/\r$/, ''));
  if (row.some((cell) => cell.length > 0) || rows.length === 0) rows.push(row);
  return rows;
}

function escapeCsvValue(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function parseConceptCsv(source) {
  const rows = parseRows(source.replace(/^\uFEFF/, ''));
  const headers = rows[0].map((header) => header.trim());
  if (headers.length === 0 || headers.some((header) => !header)) {
    throw csvError('La primera fila debe contener un título válido por columna.');
  }

  const lists = headers.map((concept, column) => ({
    concept,
    words: rows.slice(1)
      .map((row) => String(row[column] ?? '').trim())
      .filter(Boolean)
  }));
  if (!lists.some((list) => list.words.length > 0)) {
    throw csvError('El archivo CSV debe contener al menos una palabra.');
  }
  return lists;
}

export function createConceptCsvTemplate(concepts = ['Concepto 1', 'Concepto 2']) {
  const headers = concepts.length > 0 ? concepts : ['Concepto 1', 'Concepto 2'];
  return `${headers.map(escapeCsvValue).join(',')}\n${headers.map(() => '').join(',')}\n`;
}
