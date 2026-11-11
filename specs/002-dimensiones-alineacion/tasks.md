# Tareas de implementación — 002 Dimensiones por tipo y alineación

Las tareas se ejecutan en orden, una por vez, primero pruebas y después código.

## T1 — Configuración y validación

**RF:** RF-14–RF-16, RF-21, RF-25  
**Archivos:** `src/utils/config.js`, `test/config-dimensions.test.js`

Probar defaults, precisión de 0.1 mm, dimensiones compartidas/por tipo, valores ausentes,
inválidos, que no caben y conservación al cambiar de modo. Implementar el modelo y
diagnósticos sin depender del DOM.

## T2 — Resolución y agrupación de tamaños

**RF:** RF-16, RF-17, RF-23  
**Archivos:** `src/utils/card-sizes.js`, `src/utils/order.js`, `src/utils/pagination.js`,
`test/card-size-groups.test.js`

Probar copias del mismo tipo, tamaños iguales, grupos distintos, orden normal/intercalado
y grupos vacíos. Implementar grupos por primera aparición sin mezclar tamaños por página.

## T3 — Geometría y alineación

**RF:** RF-18–RF-22  
**Archivos:** `src/utils/layout.js`, `test/layout-alignment.test.js`

Probar block size, sobrantes, las nueve combinaciones, coordenadas dentro del área y
reinicio por página. Implementar offsets y posiciones absolutas en milímetros.

## T4 — Integración multipágina

**RF:** RF-17, RF-22–RF-24  
**Archivos:** `src/utils/layout.js`, `src/app.js`, `test/multi-size-layout.test.js`

Probar varios grupos, capacidades distintas, clamping y sincronía. Integrar un
`LayoutModel` único conservando la regresión de la Spec 001.

## T5 — Controles accesibles

**RF:** RF-14–RF-16, RF-19, RF-20, RF-26  
**Archivos:** `src/components/controls.js`, `src/components/card-list.js`, `test/`

Probar selector de modo, campos condicionales, dimensiones por tipo, alineaciones, labels,
errores y teclado. Implementar el flujo completo en el estado único.

## T6 — Preview y PDF

**RF:** RF-22, RF-24, RF-25  
**Archivos:** `src/components/preview.js`, `src/services/pdf-exporter.js`, `test/`

Probar que ambos consumen las mismas posiciones, que no mezclan tamaños y que layouts
inválidos bloquean la salida. Mantener contratos PNG/JPEG.

## T7 — Validación integral

**RF:** RF-14–RF-26 y RF-01–RF-13  
**Archivos:** `test/`, documentación de verificación manual

Ejecutar pruebas directas, `npm test`, `npm run build` y `npm run check` en el harness
aislado disponible; revisar accesibilidad manual y documentar bloqueos explícitos.

