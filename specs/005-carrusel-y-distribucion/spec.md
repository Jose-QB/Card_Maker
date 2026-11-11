# Spec 005 — Carrusel de cartas y distribución de la interfaz

**Estado:** aprobada  
**Specs relacionadas:** `specs/001-Mejora-funcionalidad/spec.md`,
`specs/002-dimensiones-alineacion/spec.md`, `specs/003-respaldos/spec.md`,
`specs/004-tamanos-predefinidos/spec.md`

## Objetivo

Reducir el desplazamiento vertical y aprovechar el espacio disponible en pantallas
grandes mostrando las cartas en un carrusel horizontal. La previsualización debe
quedar visible junto a la configuración principal, sin cambiar el resultado del
layout ni el PDF.

## Decisiones propuestas

- En escritorio la aplicación usará dos columnas: configuración a la izquierda y
  cartas/previsualización/respaldos a la derecha.
- La previsualización será estática y aparecerá inmediatamente debajo del carrusel;
  el estado del documento ocupará una fila completa al final.
- La lista de cartas será una región horizontal con desplazamiento y ajuste visual
  por tarjeta. Cada carta conservará sus campos actuales: imagen, nombre, cantidad,
  dimensiones por tipo, respaldo específico y eliminar.
- El carrusel tendrá botones anterior y siguiente, además de desplazamiento táctil,
  rueda y teclado. Los botones se deshabilitarán en los extremos.
- La carga de imágenes permanecerá al inicio de la sección Cartas y seguirá aceptando
  selección múltiple, arrastre y teclado.
- En pantallas medianas o pequeñas las zonas volverán a una sola columna; el
  carrusel conservará desplazamiento horizontal y la previsualización aparecerá
  después de las entradas.

## Requisitos funcionales

### RF-50 — Carrusel de cartas

Las cartas agregadas se muestran en una lista horizontal desplazable, sin perder
ninguno de los controles existentes ni el orden de las cartas.

### RF-51 — Navegación accesible

La región del carrusel tiene nombre accesible, foco visible, botones anterior/siguiente
operables con teclado y estado deshabilitado en los extremos. El desplazamiento no
debe depender exclusivamente del arrastre.

### RF-52 — Previsualización debajo del carrusel

En escritorio la previsualización aparece inmediatamente debajo del carrusel, antes
de los respaldos, aprovechando la columna derecha. Los cambios de configuración,
cartas, respaldos y paginación actualizan la misma previsualización existente.

### RF-53 — Diseño responsivo

La composición se adapta sin desbordamiento horizontal accidental de la página. El
desbordamiento horizontal permitido queda limitado al carrusel de cartas.

### RF-54 — Compatibilidad funcional

El cambio visual no altera dimensiones físicas, alineación, orden normal/intercalado,
separación de tamaños independientes, respaldos, validación, privacidad local ni
exportación PDF.

## Casos límite

- Cero cartas: se muestra el estado vacío dentro de la región del carrusel.
- Una carta: ambos botones de navegación quedan deshabilitados.
- Muchas cartas: la página no crece indefinidamente en vertical por la lista.
- Una carta con campos inválidos conserva sus mensajes accesibles dentro de la tarjeta.
- El modo por tipo y el respaldo específico deben seguir siendo editables sin perder
  el contexto de la carta.

## Criterios de aceptación

- En escritorio, la previsualización aparece inmediatamente debajo del carrusel y no
  añade una tercera columna.
- La lista permite llegar a cualquier carta mediante teclado y botones.
- La suite existente permanece verde y se añaden pruebas estructurales para el
  carrusel, su navegación y los puntos de ruptura responsivos.
- Debe realizarse una pasada manual en navegador y anotarse su resultado antes de
  cerrar la spec.

