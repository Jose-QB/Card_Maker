# Spec 002 — Dimensiones por tipo y alineación de hojas

**Estado:** aprobada  
**Spec relacionada:** `specs/001-Mejora-funcionalidad/spec.md`  
**Propósito:** permitir dimensiones compartidas o específicas por tipo de carta y
alinear cada bloque dentro del área imprimible.

## Decisiones de producto

- El modo predeterminado es `shared`: un ancho y un alto para todas las cartas.
- El modo `perType` permite un ancho y un alto por tipo; todas sus copias los conservan.
- No se mezclan tamaños distintos en una misma página. Cada página usa una cuadrícula
  regular de un solo tamaño.
- Los grupos se ordenan por la primera aparición de su tamaño y se completan antes de
  iniciar el siguiente grupo. Tipos con dimensiones iguales comparten grupo.
- Las dimensiones se normalizan y comparan con precisión de 0.1 mm.
- El padding sigue siendo global y conserva la semántica de la Spec 001.
- Al cambiar de modo se conservan los valores compartidos y los valores por tipo.
- La alineación afecta al bloque completo dentro del área imprimible: horizontal
  `left|center|right` y vertical `top|center|bottom`. El valor predeterminado es
  `center|center`.
- Preview y PDF consumen el mismo `LayoutModel`; las dimensiones físicas siguen en mm.

## Requisitos funcionales

### RF-14 — Modo de dimensiones

El usuario puede seleccionar dimensiones compartidas o dimensiones por tipo. El modo
compartido aparece seleccionado inicialmente.

### RF-15 — Dimensiones compartidas

En modo compartido se muestran un único ancho y alto y se aplican a todas las cartas y
copias. Cambiarlos recalcula capacidad, posiciones, páginas, preview y PDF.

### RF-16 — Dimensiones por tipo

En modo `perType` cada tipo muestra y valida su propio ancho y alto. Cambiar un tipo no
modifica los demás.

### RF-17 — Páginas sin tamaños mezclados

Las páginas se agrupan por tamaño normalizado y nunca contienen dos tamaños distintos.
Cada grupo usa su propia capacidad y cuadrícula, conservando el orden aprobado.

Cuando existan varios tamaños independientes, la interfaz debe avisar de forma visible y
accesible que esos tamaños se imprimirán en hojas separadas y no pueden convivir en una
misma hoja. Si el usuario selecciona orden intercalado, el aviso debe explicar que el
intercalado solo se conserva dentro de cada grupo de tamaño.

### RF-18 — Geometría de bloque

El layout calcula por grupo filas, columnas, capacidad, tamaño del bloque, espacio libre
y origen del bloque. Los índices `row`, `column` e `index` son relativos a cada página.

### RF-19 — Alineación horizontal

`left` inicia el bloque al borde izquierdo imprimible, `center` reparte el sobrante y
`right` termina el bloque al borde derecho imprimible.

### RF-20 — Alineación vertical

`top` inicia el bloque arriba, `center` reparte el sobrante y `bottom` termina el bloque
abajo dentro del área imprimible.

### RF-21 — Predeterminados

La configuración ausente de modo o alineación se interpreta como `shared` y
`center|center`.

### RF-22 — Consistencia

Las páginas del mismo grupo reutilizan la misma cuadrícula y origen. La primera carta de
cada página ocupa la misma posición local y el mismo desplazamiento de alineación.

### RF-23 — Orden

El orden normal e intercalado de la Spec 001 se conserva dentro de la secuencia de tipos;
los grupos se emiten por primera aparición de tamaño y se completan antes del siguiente.

### RF-24 — Sincronía

Cambiar modo, dimensiones, alineación, papel, orientación, márgenes, padding, cantidades
u orden recalcula layout, estadísticas, preview y PDF, y corrige la página actual.

### RF-25 — Validación

Se rechazan valores vacíos, no numéricos, cero, negativos, no finitos o que no quepan en
el área imprimible. Un layout inválido muestra error y bloquea preview/PDF sin páginas
infinitas, divisiones por cero ni PDF parcial.

### RF-26 — Accesibilidad

Los controles nuevos tienen labels, foco visible, operación por teclado y errores
asociados y perceptibles.

## Casos límite

- Cambio entre modos con cartas cargadas y conservación de valores.
- Tipos con dimensiones iguales o diferentes por 0.1 mm.
- Tipo sin dimensiones propias o con dimensiones inválidas.
- Grupo que cabe una vez por página o que no cabe ninguna vez.
- Sobras horizontales/verticales pares, impares o cero.
- Cambio de alineación con la última página seleccionada.
- Varios grupos con capacidades y número de páginas diferentes.
- Papel u orientación cambiados después de definir tamaños únicos.
- Sin cartas y exportación durante un layout inválido.

## Fuera de alcance

No se mezclan tamaños en una página, no hay empaquetado libre, rotación individual,
alineación por carta, escalado automático, márgenes por tipo ni dúplex independiente.

## Criterios de aceptación

- El modo compartido funciona por defecto y mantiene la compatibilidad existente.
- El modo por tipo aplica el tamaño a todas sus copias sin mezclarlo en otras páginas.
- Las nueve combinaciones de alineación producen offsets deterministas dentro del área
  imprimible.
- La interfaz avisa cuando los tamaños independientes requieren hojas separadas y
  explica la limitación del orden intercalado.
- Preview y PDF muestran las mismas posiciones y grupos.
- El orden de copias y la primera carta de cada página conservan sus invariantes.
- Los errores de dimensiones son visibles, accesibles y bloquean salidas inválidas.
- La geometría se prueba sin DOM, reloj ni navegador.

