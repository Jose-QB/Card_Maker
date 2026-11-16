# Tareas — Spec 009: Rediseño funcional de la experiencia

**Prerequisito:** spec aprobada y `plan.md` aprobado.  
**Regla de ejecución:** una tarea por vez; primero prueba/guardarraíl, después código;
verificar la tarea antes de marcarla terminada.

## Preparación y guardarraíles

- [ ] **T01 — Inventario de contratos de UI.** Documentar en una prueba o matriz
  verificable el shell actual, puntos de montaje y eventos de `app.js`, sin cambiar
  implementación. Resultado: lista de contratos que deben preservarse y prueba base
  ejecutable con el harness autorizado.
- [ ] **T02 — Guardarraíl del shell accesible.** Añadir primero pruebas para skip link,
  landmarks, encabezados, regiones principales y acciones con nombre; después ajustar
  `index.html` al shell mínimo. Verificar que el shell no contiene algoritmos de
  dominio ni llamadas de exportación.
- [ ] **T03 — Contrato de no regresión.** Seleccionar y ejecutar las pruebas existentes
  de unidades, layout, páginas, respaldos, palabras, CSV y PDF; registrar bloqueos del
  entorno sin modificar pruebas para ocultar fallos.

## Estado derivado y flujo

- [ ] **T04 — Pruebas del snapshot de interfaz.** Crear pruebas `node:test` para un
  snapshot puro con modo, cantidad, dimensiones, papel, capacidad, páginas, validez,
  etapa, vista y exportación, cubriendo cero datos, errores y layouts válidos.
- [ ] **T05 — Implementar snapshot y etapas.** Extraer la derivación en `app.js` o una
  utilidad pequeña con nombres en inglés; conectar etapas, bloqueos y anclas sin
  cambiar las reglas de layout. Verificar foco y transición en cambios de modo.
- [ ] **T06 — Pruebas del resumen persistente.** Cubrir que el resumen refleja datos
  reales tras cambiar cantidad, papel, dimensiones, orden, páginas, respaldos y modo
  de palabras, sin perder el control enfocado.
- [ ] **T07 — Implementar resumen y mensajes.** Crear `status-summary.js` y, si se
  necesita, `status-messages.js`; renderizar estado válido/inválido, progreso, éxito y
  error con asociación accesible. Verificar que exportar antes de validar queda bloqueado.
- [ ] **T08 — Implementar indicador de etapas.** Crear `flow-steps.js` si la separación
  mejora el contrato; añadir estado activo/bloqueado/completado, texto explicativo y
  navegación por teclado. Verificar que no oculta controles existentes.

## Reorganización de componentes

- [ ] **T09 — Pruebas del modo de imágenes.** Cubrir el orden Configurar → Preparar
  cartas → Revisar → Exportar, editor de carta seleccionada, carrusel, respaldos,
  acciones primarias y conservación de datos al cambiar de modo.
- [ ] **T10 — Reorganizar controles de imágenes.** Ajustar `controls.js`, `card-list.js`
  y `back-controls.js` para agrupar por tarea, conservar selección y mantener todas las
  validaciones y alternativas de teclado. Verificar que no se altera el modelo de
  copias, dimensiones, respaldos ni orden.
- [ ] **T11 — Pruebas del modo de palabras.** Cubrir pestaña inicial de imágenes,
  aislamiento de configuración, orden de controles, ausencia de lista de cartas
  generadas, CSV, colores, generación y reverso general.
- [ ] **T12 — Reorganizar controles de palabras.** Ajustar `word-controls.js` para el
  flujo definido, mensajes accionables y estado de generación; preservar listas,
  duplicados, asociaciones concepto-palabra y privacidad local.
- [ ] **T13 — Pruebas de preview contextual.** Cubrir etiquetas frente/reverso, página,
  total, papel, capacidad, composición inválida, paginación y uso del mismo layout que
  PDF para imágenes y palabras.
- [ ] **T14 — Ajustar preview y paginación.** Actualizar `preview.js` y
  `pagination.js` con contexto visible, controles accesibles y límites; verificar que
  los respaldos usan posiciones dúplex existentes y que no aparecen páginas parciales.
- [ ] **T15 — Pruebas de acciones y estados asíncronos.** Cubrir `Preparar mazo`,
  `Generar mazo`, `Previsualizar` y `Exportar PDF`, estados ocupados, éxito, error y
  reintento; comprobar que cada acción explica por qué está deshabilitada.
- [ ] **T16 — Integrar acciones y focus management.** Conectar estados de progreso y
  restauración de foco en `app.js` y componentes; no cambiar el servicio PDF ni la
  geometría. Verificar errores locales y globales con `aria-live`/`role=alert`.

## Responsive y accesibilidad

- [ ] **T17 — Pruebas estructurales responsive.** Añadir guardarraíles para orden de
  regiones, dos columnas en escritorio, apilado en móvil/tablet, overflow del carrusel
  y localización de acciones principales.
- [ ] **T18 — Implementar composición visual responsive.** Aplicar CSS del shell y
  componentes para densidad, sticky seguro del resumen, jerarquía azul/naranja,
  contraste, foco visible y `prefers-reduced-motion`. Verificar que no se usan
  dimensiones del DOM para el layout físico.
- [ ] **T19 — Auditoría de accesibilidad de controles.** Añadir/ajustar labels,
  fieldsets, estados ARIA, texto alternativo, navegación de tabs/carrusel/paginación,
  mensajes asociados y recuperación de foco. Verificar teclado sin depender de color,
  arrastre o puntero.

## Integración y verificación

- [ ] **T20 — Regresión completa antes del cierre.** Ejecutar `npm run check` dentro del
  harness autorizado y revisar que no cambian reglas de mm, distribución, grupos,
  alineación, respaldos, CSV, palabras, privacidad ni PDF. Si el harness no está
  disponible, dejarlo explícitamente como pendiente y no declarar aprobación.
- [ ] **T21 — Revisión manual en navegador.** Recorrer una baraja de imágenes y una de
  palabras en escritorio, tablet y móvil; usar teclado, zoom, carga inválida, CSV
  inválido, cero datos, varias páginas, frente/reverso y exportación real. Registrar
  evidencia y pendientes por RF-90–RF-99 en la carpeta de esta spec.
- [ ] **T22 — Revisión QA final.** El rol reviewer debe comenzar con `VEREDICTO:
  APROBADO` o `VEREDICTO: CAMBIOS NECESARIOS`, mapear cada RF a evidencia, separar
  bloqueos de recomendaciones y confirmar que no se modificaron otras specs.
