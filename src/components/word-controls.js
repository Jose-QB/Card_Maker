import { chooseConceptColor, CONCEPT_COLORS, normalizeWordKey } from '../utils/word-decks.js';
import { createConceptCsvTemplate, parseConceptCsv } from '../utils/word-csv.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function duplicateWords(lists) {
  const counts = new Map();
  for (const list of lists) {
    for (const word of list.words ?? []) {
      const key = normalizeWordKey(String(word).trim());
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([word]) => word);
}

export function renderDeckTabs(root, model, dispatch) {
  root.insertAdjacentHTML('afterbegin', `
    <div class="deck-tabs" role="tablist" aria-label="Tipo de mazo">
      <button type="button" role="tab" data-deck-type="image" aria-selected="${model.state.deckType === 'image'}">Mazos con imágenes</button>
      <button type="button" role="tab" data-deck-type="word" aria-selected="${model.state.deckType === 'word'}">Mazos de palabras</button>
    </div>`);
  root.querySelectorAll('[data-deck-type]').forEach((button) => {
    button.addEventListener('click', () => dispatch({ type: 'set-deck-type', deckType: button.dataset.deckType }));
  });
}

export function renderWordDeckControls(root, model, dispatch) {
  const input = model.state.wordDeckInput;
  const active = model.state.deckType === 'word';
  const duplicates = duplicateWords(input.lists);
  const selectedIndex = Math.max(0, Math.min(model.state.selectedWordListIndex ?? 0, input.lists.length - 1));
  const selectedList = input.lists[selectedIndex] ?? null;
  root.insertAdjacentHTML('afterbegin', `
    <section class="word-deck-controls" ${active ? '' : 'hidden'} aria-labelledby="word-deck-title">
      <h3 id="word-deck-title">Configuración del mazo de palabras</h3>
      <label for="words-per-card">Palabras por carta
        <input id="words-per-card" type="number" min="1" step="1" value="${escapeHtml(input.wordsPerCard)}">
      </label>
      <div class="word-list-carousel" aria-label="Navegación de listas">
        <button type="button" data-word-list-nav="previous" aria-label="Lista anterior" ${selectedIndex <= 0 ? 'disabled' : ''}>←</button>
        <span aria-live="polite">${selectedList ? `Lista ${selectedIndex + 1} de ${input.lists.length}` : 'No hay listas'}</span>
        <button type="button" data-word-list-nav="next" aria-label="Lista siguiente" ${selectedIndex >= input.lists.length - 1 ? 'disabled' : ''}>→</button>
      </div>
      <div class="word-lists">
        ${selectedList ? `
          <fieldset class="word-list" data-word-list="${selectedIndex}">
            <legend>Lista ${selectedIndex + 1}</legend>
            <label for="word-concept-${selectedIndex}">Concepto
              <input id="word-concept-${selectedIndex}" data-word-concept="${selectedIndex}" value="${escapeHtml(selectedList.concept)}">
            </label>
            <details class="concept-color-picker">
              <summary><span class="color-swatch color-swatch-summary" style="--swatch-color:${selectedList.color ?? CONCEPT_COLORS[selectedIndex % CONCEPT_COLORS.length]}"></span> Color del concepto</summary>
              <div class="concept-color-swatches" role="radiogroup" aria-label="Color para ${escapeHtml(selectedList.concept || `lista ${selectedIndex + 1}`)}">
                ${CONCEPT_COLORS.map((color) => `<button type="button" class="color-swatch" data-word-color="${selectedIndex}" data-color-value="${color}" aria-label="Seleccionar color ${color}" aria-pressed="${(selectedList.color ?? CONCEPT_COLORS[selectedIndex % CONCEPT_COLORS.length]) === color}" style="--swatch-color:${color}"></button>`).join('')}
              </div>
            </details>
            <label for="word-values-${selectedIndex}">Palabras (una por línea)
              <textarea id="word-values-${selectedIndex}" data-word-values="${selectedIndex}" rows="8">${escapeHtml((selectedList.words ?? []).join('\n'))}</textarea>
            </label>
            <button type="button" data-remove-word-list="${selectedIndex}">Eliminar lista</button>
          </fieldset>` : '<p class="empty-state">Añade una lista para comenzar.</p>'}
      </div>
      <button type="button" data-add-word-list="true">Añadir lista</button>
      <div class="csv-tools" aria-labelledby="csv-tools-title">
        <h4 id="csv-tools-title">Carga desde Excel</h4>
        <button type="button" data-download-word-template="true">Descargar plantilla CSV</button>
        <label for="word-csv-input">Importar CSV
          <input id="word-csv-input" type="file" accept=".csv,text/csv">
        </label>
        <p class="field-help">La primera fila define los conceptos y cada columna contiene sus palabras.</p>
      </div>
      ${duplicates.length > 0 ? `<p class="word-duplicates" role="status"><strong>Palabras repetidas:</strong> ${duplicates.map(escapeHtml).join(', ')}</p>` : ''}
      <p class="auto-generation-note" role="status">Las cartas se actualizan automáticamente al modificar la configuración o las listas.</p>
    </section>`);

  const updateInput = (changes) => dispatch({ type: 'set-word-config', changes });
  root.querySelector('#words-per-card')?.addEventListener('change', (event) => updateInput({ wordsPerCard: Number(event.target.value) }));
  root.querySelector('[data-word-list-nav="previous"]')?.addEventListener('click', () => dispatch({ type: 'set-word-list', index: selectedIndex - 1 }));
  root.querySelector('[data-word-list-nav="next"]')?.addEventListener('click', () => dispatch({ type: 'set-word-list', index: selectedIndex + 1 }));
  root.querySelectorAll('[data-word-concept], [data-word-values]').forEach((field) => {
    field.addEventListener('change', () => {
      const index = Number(field.dataset.wordConcept ?? field.dataset.wordColor ?? field.dataset.wordValues);
      const lists = input.lists.map((list, listIndex) => listIndex === index
        ? {
          ...list,
          ...(field.dataset.wordConcept !== undefined ? { concept: field.value } : {}),
          ...(field.dataset.wordColor !== undefined ? { color: field.value } : {}),
          ...(field.dataset.wordValues !== undefined ? { words: field.value.split('\n') } : {})
        }
        : list);
      updateInput({ lists });
    });
  });
  root.querySelectorAll('[data-word-color]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.wordColor);
    updateInput({ lists: input.lists.map((list, listIndex) => listIndex === index
      ? { ...list, color: button.dataset.colorValue }
      : list) });
  }));
  root.querySelector('[data-add-word-list]')?.addEventListener('click', () => {
    updateInput({ lists: [...input.lists, {
      concept: '',
      color: chooseConceptColor(input.lists.map((list) => list.color).filter(Boolean)),
      words: ['']
    }] });
    dispatch({ type: 'set-word-list', index: input.lists.length });
  });
  root.querySelector('[data-download-word-template]')?.addEventListener('click', () => {
    const csv = createConceptCsvTemplate(input.lists.map((list) => list.concept).filter(Boolean));
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-mazo-palabras.csv';
    link.click();
    URL.revokeObjectURL(url);
  });
  root.querySelector('#word-csv-input')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const lists = parseConceptCsv(await file.text());
      updateInput({ lists });
    } catch (error) {
      dispatch({ type: 'set-diagnostics', messages: [error instanceof Error ? error.message : 'No se pudo leer el CSV.'] });
    } finally {
      event.target.value = '';
    }
  });
  root.querySelectorAll('[data-remove-word-list]').forEach((button) => button.addEventListener('click', () => {
    updateInput({ lists: input.lists.filter((_, index) => index !== Number(button.dataset.removeWordList)) });
  }));
}
