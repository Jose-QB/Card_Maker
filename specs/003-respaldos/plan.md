# Plan de implementación — 003 Respaldos de cartas

**Estado:** aprobado para ejecución  
**Spec de referencia:** `spec.md`

## Modelo

El estado conservará:

```text
backDesign: {
  global: image | null,
  bySize: { sizeKey: image },
  byCard: { cardTypeId: image }
}
```

El layout derivado conservará `backPages`, cada una con fondo opcional y posiciones de
respaldo que referencian el mismo `x`, `y`, ancho y alto del frente.

## Algoritmo

1. Validar respaldos localmente como PNG/JPEG.
2. Calcular el `LayoutModel` frontal.
3. Resolver por posición específico → tamaño → global.
4. Derivar `backPages` sin recalcular geometría.
5. Preview alterna `front`/`back`.
6. PDF emite `frontPages` y luego `backPages`.
7. Validar todo antes de iniciar la descarga.

## Responsabilidades

- `src/utils/back-design.js`: prioridad y modelo puro.
- `src/utils/back-layout.js`: derivación desde páginas frontales.
- `src/components/back-controls.js`: controles accesibles.
- `src/components/preview.js`: vista frontal/respaldo.
- `src/services/pdf-exporter.js`: orden y dibujo de páginas.
- `src/app.js`: estado y sincronización.

## Pruebas

Primero se probarán prioridad, fallback, repetición por copia, correspondencia de páginas,
coordenadas idénticas, validación local, orden PDF, preview y errores accesibles. Después
se ejecutará la regresión completa de las Specs 001 y 002.

