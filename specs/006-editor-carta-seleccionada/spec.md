# Spec 006 — Editor de carta seleccionada y carrusel compacto

**Estado:** aprobada  
**Specs relacionadas:** `specs/005-carrusel-y-distribucion/spec.md`,
`specs/003-respaldos/spec.md`

## Objetivo

Separar la selección de cartas de su edición detallada para reducir empalmes y
facilitar el trabajo con barajas grandes.

## Decisiones propuestas

- El panel de Cartas se dividirá en dos zonas: editor de la carta actual a la
  izquierda y carrusel compacto de cartas a la derecha.
- La carta seleccionada conservará todos los controles actuales: imagen, nombre,
  cantidad, dimensiones por tipo, respaldo específico y eliminar.
- El carrusel compacto mostrará solo miniatura, nombre y cantidad; hacer clic o usar
  el teclado seleccionará una carta sin editarla directamente.
- Al agregar la primera carta se seleccionará automáticamente. Al eliminar la carta
  seleccionada se seleccionará la siguiente disponible, o la anterior si era la
  última.
- El estado del documento, estadísticas y acciones de PDF pasarán al panel izquierdo
  debajo de la configuración.
- La vista previa seguirá debajo del panel de Cartas; los respaldos se conservarán
  debajo de la vista previa.

## Requisitos funcionales

### RF-60 — Selección persistente

La aplicación conserva una carta seleccionada y la muestra en el editor detallado.
La selección se mantiene al cambiar cantidad, nombre, dimensiones o respaldo.

### RF-61 — Carrusel compacto

Cada carta aparece como una opción compacta con miniatura, nombre y cantidad. La
opción seleccionada tiene estado visual y accesible; el carrusel permite teclado,
botones y desplazamiento horizontal.

### RF-62 — Edición completa

Los controles detallados solo aparecen para la carta actual y conservan la validación,
los respaldos específicos y todas las funcionalidades existentes.

### RF-63 — Estado en panel izquierdo

El estado del documento, estadísticas, diagnósticos y generación de PDF aparecen en
el panel izquierdo debajo de la configuración.

### RF-64 — Compatibilidad

La selección no altera el orden de copias, layout, alineación, dimensiones físicas,
respaldos globales/por tamaño, privacidad local ni exportación.

## Casos límite

- Cero cartas: el editor muestra un estado vacío y el carrusel no tiene selección.
- Eliminar la única carta deja el editor vacío.
- Eliminar la carta seleccionada no deja una selección inválida.
- Una carta con errores mantiene sus mensajes en el editor detallado.
- Muchas cartas mantienen el desplazamiento del carrusel compacto al seleccionar.

## Criterios de aceptación

- La información detallada de una sola carta no se empalma con las demás.
- Cambiar de carta no modifica sus datos.
- El estado del documento es visible en el panel izquierdo.
- La suite existente permanece verde y se añaden pruebas para selección, eliminación
  y contratos de accesibilidad.

