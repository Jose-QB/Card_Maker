# Tareas de implementación — 003 Respaldos de cartas

## T1 — Modelo y prioridad de respaldos

**Archivos:** `src/utils/back-design.js`, `test/back-design.test.js`

Pruebas primero para fuentes globales, por tamaño, específicas, prioridad, fallback,
repetición por copias y ausencia de fuentes. Implementar lógica pura y determinista.

## T2 — Layout de respaldos

**Archivos:** `src/utils/back-layout.js`, `test/back-layout.test.js`

Probar que se reutilizan páginas, posiciones, tamaños, papel y orden del layout frontal.
Implementar `backPages` sin recalcular geometría.

## T3 — Estado y controles accesibles

**Archivos:** `src/app.js`, `src/components/back-controls.js`,
`src/components/card-list.js`, `test/back-controls.test.js`

Añadir carga/reemplazo/eliminación global, por tamaño y por tipo, con errores locales,
labels, foco, teclado y explicación de prioridad.

## T4 — Preview y PDF

**Archivos:** `src/components/preview.js`, `src/services/pdf-exporter.js`, `test/`

Probar alternancia frontal/respaldo, fondos, posiciones específicas y orden de exportación
frentes-primero/respaldos-después. Bloquear salidas inválidas.

## T5 — Validación integral

Ejecutar suite directa, harness aislado cuando Docker esté disponible, revisión de privacidad,
accesibilidad y verificación manual de navegador/PDF.

