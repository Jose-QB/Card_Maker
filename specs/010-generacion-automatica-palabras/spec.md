# Spec 010 — Generación automática de mazos de palabras

**Estado:** aprobada  
**Tipo:** cambio de comportamiento  
**Specs relacionadas:** `specs/008-mazos-de-palabras/spec.md`,
`specs/009-rediseño-funcional/spec.md`

## Objetivo

Eliminar la dependencia de una acción manual para generar cartas de palabras.
Cuando el usuario confirme un cambio en la configuración o en las listas, la
aplicación debe recalcular automáticamente las cartas y actualizar la
previsualización con el resultado válido más reciente.

## Decisiones de producto

- La generación automática se dispara al confirmar cambios (`change`, añadir o
  eliminar una lista, editar una lista, importar CSV o elegir un color), no en
  cada pulsación intermedia de un campo de texto.
- La generación es síncrona y local; no requiere indicador de carga ni botón de
  confirmación adicional.
- Cada cambio válido produce una nueva distribución aleatoria sin modificar la
  configuración introducida.
- Una configuración inválida limpia las cartas generadas y muestra el error
  visible y accesible correspondiente; nunca conserva una previsualización
  obsoleta como si fuera válida.
- El modo de imágenes conserva su flujo actual y no adopta esta generación
  automática.
- El botón específico `Generar mazo` deja de ser necesario y no se muestra en
  el modo de palabras. La previsualización y el resumen comunican que el mazo se
  actualiza automáticamente.

## Requisitos funcionales

### RF-100 — Regeneración por configuración

Cuando el usuario cambie tamaño de carta, palabras por carta, papel, márgenes u
otra configuración que afecte al layout del modo palabras, la aplicación debe
validar y regenerar automáticamente las cartas si la configuración es válida.

### RF-101 — Regeneración por listas

Cuando el usuario añada, elimine, reordene o modifique una lista, concepto,
palabra o color, la aplicación debe regenerar automáticamente las cartas de
palabras y conservar los datos que no fueron modificados.

### RF-102 — Regeneración por CSV

Cuando se importe un CSV válido, la aplicación debe reemplazar las listas según
las reglas aprobadas y regenerar automáticamente el mazo. Si el CSV es inválido,
debe conservar la configuración anterior y no generar un resultado nuevo.

### RF-103 — Estado inválido sin resultado obsoleto

Cuando un cambio deje el modo palabras sin listas válidas, con palabras por
carta inválidas o con dimensiones imposibles, la aplicación debe limpiar las
cartas generadas, mostrar el diagnóstico y ocultar la composición como resultado
válido.

### RF-104 — Eliminación de acción manual

En el modo palabras no debe mostrarse un botón cuya única función sea generar el
mazo. La interfaz debe indicar junto a la previsualización que las cartas se
actualizan automáticamente al modificar la configuración.

### RF-105 — Aislamiento del modo imágenes

Los cambios de esta spec no deben modificar la generación, selección, cantidades
ni flujo de exportación del modo de imágenes.

## Casos límite

- El usuario deja temporalmente vacío un campo antes de confirmar el cambio.
- Se elimina la última lista válida.
- Se importa un CSV inválido después de tener un mazo generado.
- Se cambia repetidamente entre imágenes y palabras.
- Se modifica una lista cuando hay varias páginas de previsualización.
- Se cambia el color sin cambiar el texto de las palabras.
- Se actualiza una configuración válida que produce cero cartas.

## Accesibilidad y errores

- La actualización automática debe anunciarse con una región `aria-live="polite"`
  sin robar el foco del control editado.
- Los errores deben permanecer asociados a los controles existentes y anunciarse
  como errores, sin mensajes ambiguos de “generación” cuando la causa sea el
  campo inválido.
- La ausencia del botón no puede eliminar una indicación textual del estado del
  mazo.

## Fuera de alcance

- Generación automática del modo de imágenes.
- Cambiar el algoritmo de distribución o equilibrio de palabras.
- Generar mientras el usuario escribe cada carácter sin confirmar el campo.
- Sincronizar el mazo con servicios externos.

## Criterios de aceptación

- Al cambiar una configuración válida del modo palabras, las cartas y la
  previsualización se actualizan sin pulsar “Generar mazo”.
- Al modificar listas, conceptos, palabras, colores o CSV válido, el resultado
  se regenera y conserva las asociaciones correctas.
- Un cambio inválido limpia el resultado obsoleto y deja un error visible.
- El modo imágenes conserva su flujo y comportamiento actual.
- La actualización no mueve el foco del control editado.
- La previsualización y el PDF siguen derivándose del mismo layout.

## Clarificación QA resuelta

- La generación automática se activa al confirmar cambios de controles y
  operaciones de listas; no se ejecuta por cada pulsación intermedia.
