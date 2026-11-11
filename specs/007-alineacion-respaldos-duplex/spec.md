# Spec 007 — Alineación dúplex de respaldos

**Estado:** aprobada  
**Specs relacionadas:** `specs/003-respaldos/spec.md`,
`specs/002-dimensiones-alineacion/spec.md`

## Decisión

Los respaldos se preparan para impresión a doble cara con reflejo horizontal. La
carta que está a la izquierda del frente aparecerá a la derecha del reverso al
voltear la hoja, conservando la coincidencia al recortar.

## Requisitos funcionales

### RF-70 — Reflejo horizontal

Cada posición de respaldo usa `x = anchoDelPapel - xDelFrente - anchoDeCarta` y
conserva `y`, ancho, alto, página y tamaño de carta.

### RF-71 — Aplicación a todos los respaldos

El reflejo aplica por igual a respaldos globales, por tamaño y específicos. La
imagen global sigue cubriendo toda la hoja; solo se reflejan las posiciones de
cartas que reciben una imagen de reverso.

### RF-72 — Compatibilidad

No cambia el orden de copias, la distribución del frente, alineación del bloque,
dimensiones físicas, privacidad local ni la exportación de frentes antes que
respaldos.

## Criterios de aceptación

- Una carta izquierda se refleja a la derecha y viceversa.
- Una carta central conserva su eje cuando corresponde.
- Varias filas conservan la misma coordenada vertical.
- Las posiciones reflejadas permanecen dentro del papel.
- Preview y PDF consumen las mismas posiciones reflejadas.

