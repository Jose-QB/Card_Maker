# Plan — Spec 009: Rediseño funcional de la experiencia

**Spec:** `specs/009-rediseño-funcional/spec.md`  
**Estado:** listo para implementación tras aprobación de este plan  
**Alcance:** reorganización funcional, accesibilidad y responsive de la interfaz; no
se modifica el algoritmo de dominio ni se amplía la funcionalidad aprobada.

## Objetivo técnico

Reestructurar la interfaz para que el tipo de mazo, el siguiente paso, el estado de
la configuración, la composición y la exportación sean comprensibles en una sola
vista. La aplicación conservará un único estado de aplicación y seguirá derivando
preview y PDF del mismo `LayoutModel` ya existente.

## Decisiones de arquitectura

1. **Estado único, presentación derivada.** `src/app.js` seguirá siendo el orquestador
   del estado y las transiciones. El resumen, el flujo de etapas y los mensajes no
   tendrán estado duplicado: se derivarán de configuración, validación, layout,
   generación y exportación.
2. **Componentes por responsabilidad.** Se crearán componentes de interfaz para
   encabezado/etapas, resumen y mensajes de estado si la responsabilidad no cabe
   limpiamente en los componentes actuales. `controls.js`, `word-controls.js`,
   `card-list.js`, `back-controls.js`, `preview.js` y `pagination.js` conservarán la
   lógica de sus dominios visuales y recibirán datos/eventos explícitos.
3. **Layout de página por CSS.** La composición escritorio de dos columnas y la
   adaptación móvil/tablet vivirán en CSS del shell/componentes, sin usar mediciones
   del DOM para calcular cartas. Las dimensiones físicas y el layout de impresión
   seguirán en milímetros y en las utilidades puras existentes.
4. **Etapas como navegación, no como asistente bloqueante.** Las cuatro etapas serán
   anclas semánticas (`Configurar`, `Preparar cartas`, `Revisar`, `Exportar`) con etapa
   activa y bloqueos explícitos. No ocultarán controles ni cambiarán el orden de
   generación aprobado.
5. **Contrato único de estado visible.** Un modelo de estado de interfaz, derivado
   en `app.js` o en una utilidad pura pequeña, expondrá: tipo, cantidad, tamaño de
   carta, papel, capacidad, páginas, validez, etapa y estado de exportación. Los
   componentes no recalcularán estos datos por separado.
6. **Accesibilidad nativa.** Se usarán HTML semántico, `fieldset/legend`, labels
   asociados, `aria-current`, `aria-selected`, `aria-invalid`, `aria-describedby`,
   regiones `role=status`/`role=alert` y foco visible. Carruseles y acciones de
   icono mantendrán botones con nombres accesibles y alternativa de teclado.
7. **Errores bloqueantes centralizados.** Las validaciones existentes seguirán siendo
   la fuente de verdad. La interfaz asociará cada error al grupo responsable y la
   acción principal consultará el estado válido antes de preparar, previsualizar o
   exportar. Nunca se renderizará un PDF o preview parcial como éxito.
8. **Sin dependencia nueva.** Se mantendrán HTML/CSS/JavaScript, Vite, `node:test`
   y jsPDF ya aprobados. No se incorpora framework, librería de UI ni telemetría.

## Responsabilidades por archivo/componente

### Shell y orquestación

- `index.html`: shell mínimo, landmarks, skip link, encabezado, contenedores de
  etapas, configuración, estado, preview y exportación; sin lógica de negocio.
- `src/app.js`: estado único, selección de modo, navegación a etapas, composición de
  datos derivados, actualización del resumen, focus management y conexión de eventos.
- `src/components/flow-steps.js` (nuevo, si se confirma la separación): renderiza las
  cuatro etapas, etapa activa, bloqueos y anclas; no calcula layout.
- `src/components/status-summary.js` (nuevo): renderiza el resumen persistente y
  estados de validez, páginas y exportación; no muta configuración.
- `src/components/status-messages.js` (nuevo, si hace falta): mensajes de progreso,
  éxito y error con regiones accesibles y asociación al grupo correspondiente.

### Configuración y contenido

- `src/components/controls.js`: papel, orientación, dimensiones compartidas/por tipo,
  alineación, márgenes, padding, orden y acciones del modo de imágenes; conservar
  labels, validaciones y controles actuales.
- `src/components/card-list.js`: editor de carta seleccionada y carrusel compacto;
  conserva selección, carga local, teclado, cantidades, dimensiones por tipo,
  respaldos específicos y eliminación.
- `src/components/back-controls.js`: respaldos globales/por tamaño/específicos y
  explicación visible de prioridad y correspondencia dúplex.
- `src/components/word-controls.js`: listas, conceptos, colores, palabras por carta,
  CSV, generación y reverso general; no mostrará un carrusel de cartas generadas.
- `src/components/preview.js`: vista contextual frente/reverso, papel, página,
  composición y estado; consume el layout ya calculado.
- `src/components/pagination.js`: paginación y controles anterior/siguiente con
  límites, nombres accesibles y conservación de página válida.

### Dominio y servicios que no deben cambiar de contrato

- `src/utils/{units,config,card-sizes,cards,order,layout,pagination,back-layout,back-design,word-decks,word-csv}.js`:
  reglas puras de dimensiones, orden, distribución, páginas, respaldos y palabras;
  solo se tocarán si una prueba demuestra que falta un dato ya exigido por la spec.
- `src/services/image-loader.js`: lectura local y errores de archivos.
- `src/services/pdf-exporter.js`: exportación desde el mismo modelo de layout, sin
  cambios de geometría ni de privacidad.

### Pruebas y verificación

- `test/`: contratos de shell, accesibilidad estructural, flujo derivado, responsive
  declarado y regresión de funciones existentes; las pruebas de geometría existentes
  seguirán siendo la evidencia del dominio.
- `specs/009-rediseño-funcional/`: solo artefactos SDD de esta spec y, al final, la
  evidencia de revisión si el flujo del proyecto la crea. No se editarán otras specs.

## Flujo y algoritmo de presentación

1. Inicializar el estado con imágenes como modo seleccionado y los valores
   predeterminados de las specs relacionadas.
2. Derivar un `uiSnapshot` de modo, configuración, cartas/listas, errores, layout,
   página actual, vista frente/reverso y exportación.
3. Derivar la etapa activa: configuración mientras faltan decisiones básicas;
   preparación mientras se cargan/validan cartas o listas; revisión cuando existe un
   resultado válido; exportación mientras el resultado está listo o se procesa.
   Si hay un error bloqueante, conservar la etapa relevante y mostrar el bloqueo,
   sin fingir avance.
4. Renderizar el resumen y los bloqueos desde `uiSnapshot`, preservando el foco del
   control que originó el cambio.
5. Para cada cambio de configuración, reutilizar el cálculo actual de layout y
   corregir la página actual al rango válido. Preview y PDF reciben el mismo objeto,
   incluyendo grupos por tamaño y respaldos reflejados.
6. En acciones asíncronas, anunciar inicio, progreso, éxito o error; deshabilitar solo
   la acción afectada y restaurar el foco cuando finalice.
7. En viewport estrecho, CSS apila configuración, estado, cartas y preview en ese
   orden; los controles principales permanecen accesibles sin desplazamiento
   horizontal accidental. El carrusel conserva su región horizontal con botones y
   teclado.

## Estrategia de pruebas antes de código

Cada tarea de implementación comienza por una prueba o guardarraíl que falla por la
ausencia del comportamiento y termina con la prueba verde. La suite se ejecutará con
el harness autorizado; no se declarará éxito si el contenedor no puede verificarlo.

1. **Contratos estáticos del shell:** comprobar landmarks, skip link, encabezados,
   regiones del flujo, resumen, nombres de acciones y ausencia de lógica de dominio
   en `index.html`.
2. **Contratos de estado derivado:** probar con `node:test` la etapa activa, bloqueos,
   resumen, conteos, páginas, validez y transición de exportación para imágenes y
   palabras, incluyendo cero datos y errores.
3. **Contratos de accesibilidad:** comprobar labels asociados, estados ARIA, foco
   visible declarado, mensajes asociados y alternativas de teclado para carrusel,
   tabs, paginación y botones de icono.
4. **Regresión de dominio:** ejecutar las pruebas existentes de unidades, dimensiones,
   orden, paginación, respaldos, palabras, CSV y exportador; no sustituirlas por
   pruebas de snapshots de UI.
5. **Contratos responsive:** validar mediante estructura/CSS que el orden de regiones,
   breakpoints, overflow y controles principales están declarados. La apariencia
   final requiere navegador y no se considerará cubierta por `node --test`.
6. **Validación manual:** usar navegador para teclado, focus, viewport móvil/tablet/
   escritorio, zoom, carga/arrastre, modos, errores, preview frente/reverso y PDF
   real. Registrar resultado por RF y pendientes antes del cierre.

## Riesgos y mitigaciones

- **Regresión por mezclar UI y dominio:** limitar cambios a contratos de componentes,
  añadir pruebas de regresión y revisar que las utilidades no cambien.
- **Resumen desincronizado:** usar una sola función de snapshot derivado y probar
  cambios cruzados de modo, dimensiones, cantidades y página.
- **Foco perdido al re-renderizar:** capturar el identificador del control activo,
  actualizar de forma incremental cuando sea posible y restaurar foco verificando
  que siga visible.
- **Sticky inutilizable o overflow horizontal:** límites CSS, pruebas en viewport
  estrecho y revisión manual con zoom.
- **Apariencia correcta pero semántica incorrecta:** pruebas de contratos ARIA y
  recorrido manual solo con teclado/lector de pantalla.
- **Harness no disponible:** distinguir claramente pruebas no ejecutadas de pruebas
  fallidas; no ejecutar comandos inventados ni usar fallback en el host.

## Criterios de salida del plan

- Cada RF-90–RF-99 tiene una tarea y evidencia prevista.
- Las funciones de specs 001–008 tienen pruebas de regresión asignadas.
- Las tareas están ordenadas: guardarraíles, estado derivado, shell, componentes,
  responsive, accesibilidad, regresión y validación manual.
- No se autoriza implementación hasta aprobar este plan y `tasks.md`.
