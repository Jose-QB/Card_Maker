# Spec 003 — Respaldos de cartas

**Estado:** aprobada  
**Specs relacionadas:** `specs/001-Mejora-funcionalidad/spec.md`,
`specs/002-dimensiones-alineacion/spec.md`

## Decisiones de producto

- Se permiten tres fuentes combinables: respaldo global de hoja, respaldo por tamaño y
  respaldo específico por tipo de carta.
- La prioridad por posición es: específico → tamaño → global → ninguno.
- El respaldo específico se repite para todas las copias de su tipo.
- Los respaldos se procesan localmente y aceptan PNG/JPEG válidos.
- El PDF contiene primero todas las páginas frontales y después todas las páginas de
  respaldo, en el mismo orden de páginas.
- Cada respaldo reutiliza exactamente las posiciones, tamaños, papel, orientación,
  márgenes y alineación del `LayoutModel` frontal.
- Los tamaños distintos siguen sin convivir en una misma hoja.
- La ausencia de respaldos conserva el comportamiento actual.
- Un respaldo global puede actuar como fondo y los respaldos más específicos se dibujan
  encima en sus posiciones correspondientes.

## Requisitos funcionales

### RF-27 — Configuración de fuentes

La interfaz permite añadir, reemplazar y eliminar un respaldo global, uno por tamaño
normalizado y uno específico por tipo de carta, sin modificar el frente.

### RF-28 — Respaldo global

El respaldo global cubre la hoja completa de cada página de respaldo y respeta papel y
orientación.

### RF-29 — Respaldo por tamaño

El respaldo por tamaño se repite en todas las posiciones de cartas de ese tamaño y en
todas sus páginas, usando la misma distribución del frente. Tipos del mismo tamaño lo
comparten.

### RF-30 — Respaldo específico por tipo y copias

El usuario asigna una sola imagen al tipo de carta. Esa imagen representa la segunda vista
del tipo y se repite automáticamente en todas sus copias, en la posición exacta de cada
frente. No se crean respaldos independientes por número de copia.

### RF-31 — Prioridad

Cada posición resuelve su imagen con prioridad específico → tamaño → global. Se permite
combinar las tres fuentes.

### RF-32 — Correspondencia

Las páginas de respaldo se derivan del mismo `LayoutModel`, sin recalcular cuadrícula,
filas, columnas, offsets ni alineación. Cada página de frente tiene un respaldo del mismo
índice cuando existe alguna fuente configurada.

### RF-33 — Orden de exportación

El PDF emite todos los frentes primero y todos los respaldos después, manteniendo el mismo
orden de páginas. Sin fuentes no se añaden páginas.

### RF-34 — Preview

La preview permite alternar entre frentes y respaldos, identifica la vista y conserva una
página válida. La vista de respaldos usa las mismas posiciones que el PDF.

### RF-35 — Archivos y errores

Se rechazan archivos no imagen, vacíos, ilegibles o incompatibles con el PDF. El error es
visible y accesible; una exportación inválida queda bloqueada sin PDF parcial.

### RF-36 — Sincronía y privacidad

Cambiar respaldos, dimensiones, alineación, papel, cantidades u orden actualiza preview,
estadísticas y PDF. Ninguna imagen se sube o envía fuera del dispositivo.

### RF-37 — Accesibilidad

Los controles tienen labels, foco visible, teclado, `aria-describedby`, `aria-invalid` y
explicación visible de la prioridad.

## Casos límite y aceptación

Se cubren ausencia de respaldos, combinación de fuentes, prioridad, varias copias,
varios tamaños, cambios de layout, PNG/JPEG, archivos inválidos, preview vacía/inválida,
papel cambiado y fallo de exportación. La aceptación exige que frontales y respaldos tengan
igual número y orden de páginas, posiciones idénticas y que la lógica sea testeable sin DOM.

## Fuera de alcance

Impresión directa, corrección dúplex específica de impresora, mezcla de tamaños en una
hoja, edición/recorte de imágenes, respaldos por copia individual y nube.

