# Plan de implementación — 002 Dimensiones por tipo y alineación

**Estado:** aprobado para ejecución  
**Spec de referencia:** `spec.md`

## Modelo

Extender la entrada con `dimensionsMode: shared|perType`, dimensiones compartidas,
dimensiones por tipo y `alignment.horizontal/vertical`. El `LayoutModel` conservará
tamaño de papel, área imprimible, tamaño de grupo, filas, columnas, capacidad, tamaño del
bloque, offset y páginas con posiciones absolutas. Preview y PDF no recalcularán offsets.

## Algoritmo

1. Validar papel, márgenes, padding, modo, dimensiones y alineación.
2. Resolver tamaño efectivo por tipo.
3. Expandir copias conservando el orden normal/intercalado.
4. Agrupar por tamaño normalizado en orden de primera aparición.
5. Para cada grupo calcular cuadrícula, bloque y sobrantes.
6. Aplicar `offsetX`/`offsetY`: left/top 0, center sobrante/2, right/bottom sobrante.
7. Paginar reiniciando el índice espacial por página.
8. Entregar un único layout a preview y PDF.

## Responsabilidades

- `src/utils/config.js`: modo, dimensiones, alineación y validación.
- `src/utils/order.js`/`src/utils/pagination.js`: grupos y orden.
- `src/utils/layout.js`: geometría, offsets y páginas.
- `src/components/controls.js`/`card-list.js`: controles accesibles.
- `src/components/preview.js`: consumir posiciones calculadas.
- `src/services/pdf-exporter.js`: consumir las mismas posiciones.
- `src/app.js`: estado, recálculo y página actual.

## Pruebas

Cubrir defaults, validación, resolución por tipo, grupos, las nueve alineaciones,
capacidades distintas, paginación sin mezcla, reinicio de índices, clamping, preview/PDF,
accesibilidad y regresión completa de la Spec 001. Las pruebas UI manuales se anotarán
separadamente.

## Validación manual pendiente

Verificar en navegador cambio de modos, edición por tipo, las nueve alineaciones,
navegación entre grupos, preview, PDF, foco, teclado y mensajes de error.

