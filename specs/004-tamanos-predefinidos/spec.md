# Spec 004 — Tamaños predefinidos y tamaño personalizado

**Estado:** aprobada  
**Specs relacionadas:** `specs/001-Mejora-funcionalidad/spec.md`,
`specs/002-dimensiones-alineacion/spec.md`

## Decisiones

- La interfaz ofrecerá presets en milímetros: Poker/Standard 63.5 × 88.9, Bridge
  57.1 × 88.9, Standard European 59 × 92, Mini European 44.5 × 69.9, Mini American
  41 × 63, Tarot 69.9 × 120.7, Euro Poker 63.5 × 95.3 y Cuadrada 70 × 70.
- Las medidas son referencias de tamaño de carta, no de funda; pueden variar ligeramente
  entre fabricantes.
- El tamaño personalizado se habilita con una checkbox y revela ancho/alto en mm.
- Al elegir un preset se desactiva el modo personalizado y se actualizan las dimensiones.
- Al activar personalizado se conservan las dimensiones actuales para editarlas.
- El tamaño personalizado usa las validaciones y precisión de 0.1 mm existentes.
- La opción aplica al modo de dimensiones compartidas. El modo por tipo conserva sus
  dimensiones individuales y puede editarse desde cada fila.

## Requisitos funcionales

### RF-40 — Presets

El usuario puede seleccionar un tamaño predefinido con nombre, ancho y alto visibles.

### RF-41 — Personalizado

Una checkbox habilita los campos de ancho y alto personalizados. Desmarcarla vuelve a
usar el preset seleccionado y oculta los campos editables.

### RF-42 — Recálculo y validación

Cada cambio de preset o dimensión recalcula capacidad, layout, preview, respaldos y PDF.
Los valores inválidos bloquean las salidas y muestran errores accesibles.

### RF-43 — Compatibilidad

Los presets no alteran el orden, alineación, grupos de tamaño, respaldos ni privacidad.
Las dimensiones siguen expresándose en milímetros.

## Fuentes de investigación

- BoardGameGeek registra formatos comunes como Mini American, Mini European, Bridge,
  Standard European, Standard Card Game y Tarot: `https://boardgamegeek.com/wiki/page/Card%20Sleeves`.
- Chitmunk identifica Poker y Bridge como opciones muy populares y lista tamaños de
  prototipado: `https://chitmunk.com/card-sizes`.
- Gamegenic distingue tamaños de carta y funda para formatos Standard, Mini European y
  Tarot: `https://www.gamegenic.com/wp-content/uploads/Gamegenic_Sleeve-Size-Guide.pdf`.

