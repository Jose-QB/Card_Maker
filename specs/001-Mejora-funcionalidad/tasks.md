# Tareas de implementación — 001 Mejora funcionalidad

Las tareas se ejecutan en orden. Cada tarea debe comenzar por sus pruebas o guardarraíles,
mantener el alcance de la spec y dejar el repositorio en un estado verificable. Los títulos
de pruebas y textos visibles deben estar en español; identificadores de código, en inglés.

## T0 — Crear el bootstrap del harness ESM

**RF:** soporte técnico para RF-01–RF-13
**Archivos previstos:** `package.json`, `package-lock.json`, `vite.config.js`, `scripts/`, `test/`
**Hecho cuando:** existe un proyecto Node con ESM explícito, lockfile y scripts mínimos para
`npm test`, `npm run build`, `npm run check`, `npm run dev` y `npm run preview`; `node --test`
puede descubrir y ejecutar una prueba estructural mínima sin depender de código de producto;
los scripts rechazan argumentos no autorizados y no inventan resultados; no se implementan
todavía lógica de dominio, interfaz ni exportación.

## T1 — Extraer el modelo de configuración y unidades ✅

**RF:** RF-04, RF-05, RF-07, RF-09  
**Archivos previstos:** `src/utils/units.js`, `src/utils/config.js`, `test/*.test.js`  
**Hecho cuando:** existen funciones puras para normalizar dimensiones en milímetros,
validar números y representar papel, carta, márgenes, padding y modo visual; las pruebas
cubren cero, negativos, no numéricos, márgenes agotados y valores válidos sin depender del
DOM; no cambia aún la interfaz visible. **Completada:** `npm test` y `npm run check`
 pasan con 13 pruebas correctas; no se modificó `index.html` ni se inició T2.

## T2 — Extraer orden, expansión, capacidad y paginación

**RF:** RF-04, RF-05, RF-06, RF-08, RF-09  
**Archivos previstos:** `src/utils/order.js`, `src/utils/layout.js`, `src/utils/pagination.js`, `test/*.test.js`  
**Hecho cuando:** un cálculo determinista produce filas, columnas, capacidad, posiciones,
secuencia normal/intercalada y páginas; las pruebas verifican cantidades distintas, orden
de carga, lista vacía, carta que no cabe y clamp de página; no hay divisiones por cero ni
páginas infinitas. **Completada:** se añadieron `src/utils/order.js`,
`src/utils/layout.js`, `src/utils/pagination.js` y pruebas unitarias para los casos
descritos; `npm test` y `npm run check` pasan con 21 pruebas correctas. No se modificó
`index.html` ni se inició T3.

## T2.1 — Corregir el posicionamiento al cambiar de página

**RF:** RF-08, RF-09, RF-10  
**Archivos previstos:** `src/utils/layout.js`, `test/order-layout-pagination.test.js`

**Objetivo:** corregir el desplazamiento de las cartas a partir de la segunda hoja.

**Pruebas primero:**

- crear una configuración con capacidad reducida y suficientes copias para producir al menos
  dos páginas;
- comprobar que la primera carta de cada página tiene `row: 0` y `column: 0`;
- comprobar que la primera carta de cada página tiene las mismas coordenadas `x` e `y`;
- comprobar que las cartas conservan el orden global esperado entre páginas;
- comprobar que cada posición permanece dentro de la cuadrícula de su propia página.

**Implementación:**

- sustituir el contador global usado por `positionPages()` por un índice reiniciado en cada
  página;
- conservar el orden de `items` y la paginación existentes;
- mantener `position.index` como índice relativo a la página.

**Hecho cuando:**

- la prueba de regresión falla con la implementación actual y pasa con la corrección;
- no cambia el orden normal ni intercalado;
- las posiciones de la primera hoja permanecen iguales;
- Preview y PDF reciben posiciones correctas para todas las páginas;
- no se ejecutan pruebas UI como si fueran pruebas de `node --test`.

## T3 — Construir la capa de carga y gestión local de imágenes

**RF:** RF-01, RF-02, RF-03, RF-12  
**Archivos previstos:** `src/services/image-loader.js`, `src/utils/cards.js`, módulos de UI y pruebas  
**Hecho cuando:** se aceptan imágenes legibles, se rechazan inválidas sin perder las
válidas, cada entrada tiene identidad/nombre/cantidad, se puede editar y eliminar, PNG y
JPEG conservan formato, y no existe código de subida remota; los errores de lectura son
visibles y verificables. **Completada:** se añadieron `src/services/image-loader.js`,
`src/utils/cards.js` y pruebas de contrato en `test/image-cards.test.js`; la carga usa
`FileReader` inyectable y no contiene endpoints ni subida remota; las pruebas cubren
entradas válidas e inválidas, mezcla, identidad/nombre/cantidad, edición, eliminación y
preservación de PNG/JPEG. Como corrección posterior de RF-01, la UI también acepta
arrastrar y soltar mediante `DataTransfer.files`, previene el comportamiento nativo,
muestra feedback visual/accesible y reutiliza `loadImageFiles` para conservar cargas mixtas.
La cobertura contractual está en `test/drag-drop-contract.test.js`.

## T4 — Integrar el estado de aplicación y la configuración física

**RF:** RF-03, RF-04, RF-05, RF-09  
**Archivos previstos:** `index.html`, `src/app.js`, `src/components/controls.js`, `src/components/card-list.js`  
**Hecho cuando:** `index.html` funciona como shell mínimo, los controles actualizan un
estado único, cada cambio recalcula el layout, las estadísticas muestran capacidad y
 páginas, y una configuración inválida bloquea preview/exportación con un mensaje útil.
 **Completada:** se convirtió `index.html` en un shell accesible y se añadieron
 `src/app.js`, `src/components/controls.js`, `src/components/card-list.js` y pruebas
 estructurales/de estado. La aplicación usa un estado único, deriva configuración y
 layout con las utilidades T1–T3, gestiona cartas localmente, muestra diagnósticos y
 estadísticas, y mantiene preview/PDF deshabilitados como puntos de integración para
 T5/T6. `npm test` y `npm run check` pasan con 34 pruebas correctas.

## T5 — Implementar la previsualización paginada

**RF:** RF-07, RF-08, RF-09, RF-13  
**Archivos previstos:** `src/components/preview.js`, `src/components/pagination.js`, estilos y pruebas estructurales  
**Hecho cuando:** se muestra la hoja completa a escala con cartas en las posiciones del
`LayoutModel`, se informa página/capacidad/total, anterior y siguiente se deshabilitan en
los extremos, la página se corrige al cambiar el layout y el estado vacío o inválido no
simula una hoja imprimible. **Completada:** se añadieron `src/components/preview.js`,
`src/components/pagination.js`, integración en `src/app.js`, estilos de hoja escalada y
pruebas contractuales para estados vacío/inválido, LayoutModel, paginación, clamp y
controles accesibles. `npm test` y `npm run check` pasan con 41 pruebas correctas. No se
implementó PDF ni se inició T6.

## T6 — Encapsular la generación de PDF

**RF:** RF-07, RF-10, RF-11, RF-12  
**Archivos previstos:** `src/services/pdf-exporter.js`, integración de dependencia y pruebas de contrato  
**Hecho cuando:** una exportación válida crea un PDF con papel, orientación, páginas,
posiciones, bordes e imágenes equivalentes al preview; PNG y JPEG se incorporan con su
formato correcto; cero cartas, layout inválido, carga de dependencia fallida o imagen no
exportable bloquean la descarga y muestran un error sin archivo parcial anunciado.
**Completada:** se añadió `src/services/pdf-exporter.js`, se fijó `jspdf@3.0.3` en
 `package.json` y `package-lock.json`, y se integró la acción de generación local en
 `src/app.js`. Los contratos cubren exportación válida, múltiples páginas, cero cartas,
 layout inválido, PNG/JPEG y errores sin descarga falsa. `npm test` y `npm run check`
 pasan con 47 pruebas correctas. T7 y T8 no se iniciaron.

## T7 — Completar accesibilidad y validación de interacción

**RF:** RF-02, RF-03, RF-04, RF-05, RF-08, RF-13  
**Archivos previstos:** `index.html`, componentes, estilos, `test/andamiaje.test.js`  
**Hecho cuando:** todos los controles tienen labels/nombres accesibles, foco visible,
orden de teclado razonable, mensajes asociados mediante mecanismos accesibles y no se
depende solo del color; se cubren entradas vacías, decimales, negativos, límites y errores
de descarga con mensajes en español. **Completada:** se añadieron contratos estructurales
para labels, nombres accesibles, foco visible, regiones de error, textos en español y
límites de entrada; los componentes ahora asocian mensajes con `aria-describedby`,
marcan `aria-invalid`, muestran errores visibles y bloquean valores vacíos, negativos,
fuera de rango o no enteros. Los errores de exportación quedan asociados a una región
perceptible y las acciones de salida siguen bloqueadas para layouts inválidos. `npm test`
y `npm run check` pasan con 51 pruebas correctas. Queda pendiente la verificación manual
de teclado y navegador descrita en T9; T8 y T9 no se iniciaron.

## T8 — Aislar y endurecer el harness

**RF:** RF-12 y criterios de calidad de la constitución  
**Archivos previstos:** `Dockerfile`, `scripts/safe-*.mjs`, pruebas de seguridad  
**Hecho cuando:** pruebas y build se ejecutan en contenedor Linux desechable, sin red,
sin montajes del workspace, sin credenciales y como usuario sin privilegios, con versión
de Node fijada; un fallo del contenedor produce fallo visible y no hay fallback silencioso
al host.

**Implementación presente, pendiente de cierre:** se añadieron `Dockerfile`,
`scripts/safe-check.mjs`, `scripts/safe-dev.mjs`, `scripts/container-bridge.mjs` y
`test/t8-harness.test.js`. Las pruebas estáticas pasan 5/5 y los cinco comandos públicos
apuntan a lanzadores aislados. El cierre de T8 requiere ejecutar `npm test` y `npm run check`
con Docker Linux disponible; en este entorno ambos terminan con código 1 y el mensaje
`Docker no está instalado o no está disponible. No existe fallback al host.`. T8 no se marca
como completada hasta obtener esa evidencia.

## T9 — Verificación integral, revisión RF y pasada manual

**RF:** RF-01 a RF-13  
**Archivos previstos:** `Dockerfile`, scripts de aislamiento, artefactos de prueba y
documentación de verificación, sin ampliar la spec
**Hecho cuando:** `npm run check` pasa dentro del harness aislado y reproducible; pruebas y
build corren sin red, sin montajes del workspace, sin credenciales y como usuario sin
privilegios, con versión de Node fijada; un fallo del contenedor es visible y no hay
fallback silencioso al host; el revisor entrega `APROBADO` o `CAMBIOS NECESARIOS`, cada RF
tiene evidencia concreta, se separan bloqueos de recomendaciones y se documenta la pasada
manual en navegador para carga, configuración, teclado, preview y PDF; no se declara
cubierta por `node --test` ninguna prueba de UI.
