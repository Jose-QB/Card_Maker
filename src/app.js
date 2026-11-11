import { loadImageFiles } from './services/image-loader.js';
import { addCard, removeCard, updateCard } from './utils/cards.js';
import { createConfig, validateConfig } from './utils/config.js';
import { calculateLayout } from './utils/layout.js';
import { renderCardList } from './components/card-list.js';
import { renderControls } from './components/controls.js';
import { renderPagination } from './components/pagination.js';
import { renderPreview } from './components/preview.js';
import { exportLayoutToPdf } from './services/pdf-exporter.js';
import { createBackDesign } from './utils/back-design.js';
import { deriveBackPages } from './utils/back-layout.js';
import { renderBackControls } from './components/back-controls.js';

const DEFAULT_CONFIG_INPUT = Object.freeze({
  paper: 'a4',
  orientation: 'portrait',
  card: Object.freeze({ width: 63, height: 88 }),
  cardPreset: 'custom',
  lastCardPreset: 'poker',
  customCardEnabled: true,
  dimensionsMode: 'shared',
  alignment: Object.freeze({ horizontal: 'center', vertical: 'center' }),
  cardTypes: Object.freeze({}),
  margins: Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 }),
  padding: 0,
  visualMode: 'normal'
});

function mergeConfigInput(current, changes = {}) {
  return {
    ...current,
    ...changes,
    card: { ...current.card, ...(changes.card ?? {}) },
    alignment: { ...current.alignment, ...(changes.alignment ?? {}) },
    cardTypes: { ...current.cardTypes, ...(changes.cardTypes ?? {}) },
    margins: { ...current.margins, ...(changes.margins ?? {}) }
  };
}

function syncCardTypes(configInput, cards) {
  const cardTypes = { ...configInput.cardTypes };
  for (const card of cards) {
    cardTypes[card.id] ??= { ...configInput.card };
  }
  return { ...configInput, cardTypes };
}

function resolveSelectedCardId(selectedCardId, cards) {
  return cards.some((card) => card.id === selectedCardId)
    ? selectedCardId
    : cards[0]?.id ?? null;
}

export function createInitialState() {
  return {
    cards: [],
    configInput: structuredClone(DEFAULT_CONFIG_INPUT),
    order: 'normal',
    currentPage: 1,
    diagnostics: [],
    exportStatus: null,
    uploadStatus: null,
    backDesign: createBackDesign(),
    backErrors: {},
    backSpecificEnabled: {},
    previewMode: 'front',
    cardCarouselScrollLeft: 0,
    selectedCardId: null
  };
}

export function updateAppState(state, action) {
  switch (action?.type) {
    case 'set-config':
      return {
        ...state,
        configInput: mergeConfigInput(state.configInput, action.changes),
        currentPage: 1,
        diagnostics: []
      };
    case 'set-config-and-diagnostics':
      return {
        ...state,
        configInput: mergeConfigInput(state.configInput, action.changes),
        currentPage: 1,
        diagnostics: [...action.messages]
      };
    case 'set-order':
      return { ...state, order: action.order === 'interleaved' ? 'interleaved' : 'normal', currentPage: 1 };
    case 'set-page':
      return { ...state, currentPage: action.page };
    case 'set-selected-card':
      return {
        ...state,
        selectedCardId: resolveSelectedCardId(action.id, state.cards),
        cardCarouselScrollLeft: Number.isFinite(action.carouselScrollLeft)
          ? Math.max(0, action.carouselScrollLeft)
          : state.cardCarouselScrollLeft
      };
    case 'replace-cards':
      return {
        ...state,
        cards: [...action.cards],
        configInput: syncCardTypes(state.configInput, action.cards),
        selectedCardId: resolveSelectedCardId(state.selectedCardId, action.cards),
        currentPage: 1,
        diagnostics: []
      };
    case 'add-card':
      {
        const cards = addCard(state.cards, action.image, action.options);
        return {
          ...state,
          cards,
          configInput: syncCardTypes(state.configInput, cards),
          selectedCardId: resolveSelectedCardId(state.selectedCardId, cards),
          currentPage: 1
        };
      }
    case 'update-card':
      return {
        ...state,
        cards: updateCard(state.cards, action.id, action.changes),
        currentPage: 1,
        cardCarouselScrollLeft: Number.isFinite(action.carouselScrollLeft)
          ? Math.max(0, action.carouselScrollLeft)
          : state.cardCarouselScrollLeft
      };
    case 'remove-card':
      {
        const removedIndex = state.cards.findIndex((card) => card.id === action.id);
        const cards = removeCard(state.cards, action.id);
        const fallbackId = cards[removedIndex]?.id ?? cards[removedIndex - 1]?.id ?? null;
        return {
          ...state,
          cards,
          selectedCardId: state.selectedCardId === action.id
            ? fallbackId
            : resolveSelectedCardId(state.selectedCardId, cards),
          currentPage: 1
        };
      }
    case 'set-diagnostics':
      return { ...state, diagnostics: [...action.messages] };
    case 'set-upload-status':
      return { ...state, uploadStatus: action.status ?? null };
    case 'set-back-design':
      return {
        ...state,
        backDesign: {
          ...state.backDesign,
          ...action.changes,
          bySize: { ...state.backDesign.bySize, ...(action.changes?.bySize ?? {}) },
          byCard: { ...state.backDesign.byCard, ...(action.changes?.byCard ?? {}) }
        },
        backSpecificEnabled: Object.fromEntries(Object.entries({
          ...state.backSpecificEnabled,
          ...Object.fromEntries(Object.entries(action.changes?.byCard ?? {}).map(([id, image]) => [id, Boolean(image)]))
        })),
        currentPage: 1
      };
    case 'set-back-specific-enabled':
      return {
        ...state,
        backSpecificEnabled: { ...state.backSpecificEnabled, [action.id]: Boolean(action.enabled) },
        backDesign: action.enabled ? state.backDesign : {
          ...state.backDesign,
          byCard: { ...state.backDesign.byCard, [action.id]: null }
        },
        currentPage: 1
      };
    case 'set-back-error':
      return { ...state, backErrors: { ...state.backErrors, ...action.errors } };
    case 'set-preview-mode':
      return { ...state, previewMode: action.mode === 'back' ? 'back' : 'front' };
    case 'set-export-status':
      return { ...state, exportStatus: action.status ?? null };
    default:
      return state;
  }
}

function getConfigModel(configInput) {
  const result = validateConfig(configInput);
  return { config: result.config, errors: result.errors };
}

export function deriveAppModel(state) {
  const { config, errors } = getConfigModel(state.configInput);
  const layout = calculateLayout({
    config,
    cards: state.cards,
    order: state.order,
    currentPage: state.currentPage
  });
  const sizeNotice = config?.dimensionsMode === 'perType' && layout.groups.length > 1
    ? state.order === 'interleaved'
      ? 'Las cartas con tamaños independientes se imprimirán en hojas separadas; no pueden convivir en una misma hoja. El orden intercalado se conserva dentro de cada grupo de tamaño.'
      : 'Las cartas con tamaños independientes se imprimirán en hojas separadas; no pueden convivir en una misma hoja.'
    : null;
  const diagnostics = [...new Set([...errors, ...layout.errors, ...state.diagnostics, ...(sizeNotice ? [sizeNotice] : [])])];
  const totalCards = layout.items.length;
  const effectiveBackDesign = {
    ...state.backDesign,
    byCard: Object.fromEntries(Object.entries(state.backDesign.byCard).filter(([id]) => state.backSpecificEnabled[id]))
  };
  const backModel = deriveBackPages(layout, effectiveBackDesign);

  return {
    state,
    config,
    layout,
    backDesign: effectiveBackDesign,
    backPages: backModel.pages,
    hasBacks: backModel.hasBacks,
    diagnostics,
    stats: {
      capacity: layout.capacity,
      capacityLabel: layout.groups.length > 1 ? 'Varía por tamaño' : String(layout.capacity),
      totalCards,
      totalPages: layout.totalPages,
      rows: layout.rows,
      columns: layout.columns,
      distributionLabel: layout.groups.length > 1 ? 'Varía por tamaño' : `${layout.columns} × ${layout.rows}`
    },
    actions: {
      canPreview: layout.valid && totalCards > 0,
      canExport: layout.valid && totalCards > 0
    }
  };
}

function createShell(root) {
  root.innerHTML = `
    <header class="app-header">
      <p class="eyebrow">Herramienta local para prototipos</p>
      <h1 id="page-title">Generador de hojas de cartas</h1>
      <p>Configura tus cartas y prepara una composición física para imprimir.</p>
    </header>
    <div class="app-grid">
      <section class="panel config-panel" aria-labelledby="config-title">
        <h2 id="config-title">Configuración física</h2>
        <div id="controls-root"></div>
        <section class="document-status" aria-labelledby="diagnostics-title">
          <h3 id="diagnostics-title">Estado del documento</h3>
          <div id="diagnostics" aria-live="assertive" role="alert"></div>
          <div id="stats" aria-live="polite"></div>
          <div id="output-actions"></div>
        </section>
      </section>
      <section class="panel cards-panel" aria-labelledby="cards-title">
        <h2 id="cards-title">Cartas</h2>
        <div id="cards-root"></div>
      </section>
      <section class="panel backs-panel" aria-labelledby="backs-title">
        <h2 id="backs-title">Respaldos</h2>
        <div id="back-controls-root"></div>
      </section>
      <section class="panel preview-panel" aria-labelledby="preview-title">
        <h2 id="preview-title">Previsualización</h2>
        <div id="preview-mode-root"></div>
        <div id="preview-root"></div>
        <div id="pagination-root"></div>
      </section>
      </div>`;
}

function renderApp(root, state, setState) {
  const model = deriveAppModel(state);
  const controlsRoot = root.querySelector('#controls-root');
  const cardsRoot = root.querySelector('#cards-root');
  const backControlsRoot = root.querySelector('#back-controls-root');
  const diagnostics = root.querySelector('#diagnostics');
  const stats = root.querySelector('#stats');
  const outputActions = root.querySelector('#output-actions');
  const previewRoot = root.querySelector('#preview-root');
  const previewModeRoot = root.querySelector('#preview-mode-root');
  const paginationRoot = root.querySelector('#pagination-root');

  renderControls(controlsRoot, model, setState);
  renderCardList(cardsRoot, model, setState);
  renderBackControls(backControlsRoot, model, setState);
  previewModeRoot.innerHTML = model.hasBacks ? `
    <div class="preview-mode" role="group" aria-label="Vista de impresión">
      <button type="button" data-preview-mode="front" aria-pressed="${state.previewMode === 'front'}">Frentes</button>
      <button type="button" data-preview-mode="back" aria-pressed="${state.previewMode === 'back'}">Respaldos</button>
      <span class="help-text">El PDF coloca los frentes antes que los respaldos.</span>
    </div>` : '';
  previewModeRoot.querySelectorAll('[data-preview-mode]').forEach((button) => {
    button.addEventListener('click', () => setState({ type: 'set-preview-mode', mode: button.dataset.previewMode }));
  });
  diagnostics.innerHTML = model.diagnostics.length
    ? `<ul>${model.diagnostics.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul>`
    : '<p class="status-ok">La configuración está lista para calcular la hoja.</p>';
  stats.innerHTML = `
    <dl class="stats-grid">
      <div><dt>Cartas por página</dt><dd>${model.stats.capacityLabel}</dd></div>
      <div><dt>Total de cartas</dt><dd>${model.stats.totalCards}</dd></div>
      <div><dt>Páginas totales</dt><dd>${model.stats.totalPages}</dd></div>
      <div><dt>Distribución</dt><dd>${model.stats.distributionLabel}</dd></div>
    </dl>`;
  outputActions.innerHTML = `
    <p class="integration-note">El PDF se genera localmente usando la misma composición de la previsualización.</p>
    <button type="button" data-action="export-pdf" aria-describedby="export-status" ${model.actions.canExport ? '' : 'disabled aria-disabled="true"'}>Generar PDF</button>
    ${state.exportStatus ? `<p id="export-status" role="${state.exportStatus.kind === 'error' ? 'alert' : 'status'}" class="${state.exportStatus.kind === 'error' ? 'status-error' : 'status-ok'}">${escapeHtml(state.exportStatus.message)}</p>` : '<p id="export-status" class="visually-hidden" aria-live="polite"></p>'}`;
  outputActions.querySelector('[data-action="export-pdf"]').addEventListener('click', () => {
    try {
      const result = exportLayoutToPdf(model.layout, { backPages: model.backPages });
      setState({ type: 'set-export-status', status: { kind: 'success', message: `PDF generado: ${result.filename}` } });
    } catch (error) {
      setState({ type: 'set-export-status', status: { kind: 'error', message: error instanceof Error ? error.message : 'No se pudo generar el PDF.' } });
    }
  });
  renderPreview(previewRoot, { ...model, viewMode: state.previewMode });
  renderPagination(paginationRoot, {
    currentPage: model.layout.currentPage,
    totalPages: model.layout.totalPages
  }, setState);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function startApp(root = document.querySelector('#app')) {
  if (!root) return null;
  createShell(root);
  let state = createInitialState();
  const setState = (action) => {
    try {
      state = updateAppState(state, action);
      renderApp(root, state, setState);
    } catch (error) {
      state = updateAppState(state, {
        type: 'set-diagnostics',
        messages: [error instanceof Error ? error.message : 'No se pudo actualizar la aplicación.']
      });
      renderApp(root, state, setState);
    }
  };
  renderApp(root, state, setState);
  return { getState: () => state, dispatch: setState };
}

if (typeof document !== 'undefined') {
  startApp();
}

export { createConfig, loadImageFiles };
