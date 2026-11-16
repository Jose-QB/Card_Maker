# Spec 009 — Rediseño funcional de la experiencia

**Estado:** aprobada  
**Tipo:** mejora transversal de interfaz y flujo  
**Specs relacionadas:** `specs/001-Mejora-funcionalidad/spec.md`,
`specs/002-dimensiones-alineacion/spec.md`,
`specs/003-respaldos/spec.md`,
`specs/005-carrusel-y-distribucion/spec.md`,
`specs/006-editor-carta-seleccionada/spec.md`,
`specs/007-alineacion-respaldos-duplex/spec.md`,
`specs/008-mazos-de-palabras/spec.md`

## Objetivo

Mejorar el diseño funcional de toda la página para que una persona pueda
configurar un mazo, detectar errores, revisar la composición y exportar un PDF
sin perder contexto ni tener que descubrir el orden correcto de los controles.
La mejora debe conservar las capacidades existentes de mazos de imágenes,
mazos de palabras, respaldos, dimensiones, paginación, previsualización y PDF.

## Decisiones de producto

- Se conserva la identidad cromática azul/naranja, con mayor contraste,
  jerarquía y consistencia entre estados.
- La experiencia se organiza como un flujo visible de cuatro etapas:
  `Configurar`, `Preparar cartas`, `Revisar` y `Exportar`.
- El tipo de mazo se elige al principio y sus controles permanecen aislados.
- La configuración principal debe estar agrupada por tarea: papel y tamaño,
  contenido del mazo, distribución, respaldos y salida.
- La previsualización debe permanecer visible en escritorio junto al contexto
  de configuración; en pantallas pequeñas aparece después de los controles.
- Debe existir un resumen persistente de estado con tipo de mazo, cantidad de
  cartas, tamaño de papel, páginas, errores y estado de exportación.
- Las acciones principales deben ser inequívocas: `Generar mazo`,
  `Previsualizar` y `Exportar PDF`; los estados inválidos deben explicar cómo
  corregirlos.
- Se conservan los carruseles existentes cuando son necesarios, pero siempre
  se ofrece alternativa de botones y teclado.
- No se añade un framework de UI ni se modifica la geometría de dominio salvo
  cuando sea necesario para presentar mejor el mismo modelo calculado.

## Requisitos funcionales

### RF-90 — Jerarquía global de la página

La página debe mostrar un encabezado breve, el selector de tipo de mazo, el
flujo de configuración, el resumen de estado y la previsualización en un orden
que permita entender qué hacer a continuación sin leer instrucciones externas.

### RF-91 — Flujo por etapas

La interfaz debe identificar visualmente las etapas `Configurar`, `Preparar
cartas`, `Revisar` y `Exportar`, indicando la etapa activa y los bloqueos que
impiden avanzar. La indicación no debe depender únicamente del color.

### RF-92 — Resumen persistente

Mientras el usuario configura el mazo, la interfaz debe mostrar un resumen con
el tipo de mazo, cantidad de cartas o palabras, tamaño de carta, papel,
capacidad por página, páginas calculadas y estado de validez. El resumen debe
actualizarse sin perder el foco del control editado.

### RF-93 — Agrupación funcional de controles

Los controles deben agruparse por decisiones del usuario y no por detalles de
implementación. En el modo de imágenes deben mantenerse el editor de cartas,
dimensiones, orden, respaldos y salida. En el modo de palabras deben mantenerse
listas, colores, CSV, palabras por carta, generación y reverso general.

### RF-94 — Acciones principales y estado

Cada modo de mazo debe tener una acción primaria visible y contextual para
generar o preparar el resultado. Las acciones no disponibles deben indicar la
causa. Durante operaciones asíncronas se debe comunicar progreso, éxito o error
sin bloquear silenciosamente la página.

### RF-95 — Errores accionables

Los errores de campos y de generación deben aparecer junto al control o grupo
que requiere corrección, incluir el siguiente paso y anunciarse mediante el
canal accesible correspondiente. Un error no debe producir una previsualización
ni un PDF parcialmente válido.

### RF-96 — Previsualización contextual

La previsualización debe mostrar claramente frente o reverso, página actual,
total de páginas, tamaño de papel y estado de la composición. Debe conservar la
derivación desde el mismo layout usado por el PDF.

### RF-97 — Responsive y densidad

La interfaz debe ser utilizable con teclado y puntero en móvil, tablet y
escritorio. En móvil los controles deben apilarse en orden lógico, los botones
principales deben seguir siendo localizables y ningún contenido debe requerir
desplazamiento horizontal accidental.

### RF-98 — Accesibilidad visual e interacción

Todos los controles deben conservar nombres asociados, foco visible, estados
de selección y mensajes anunciables. Las acciones disponibles mediante arrastre,
carrusel o color deben tener alternativa textual y de teclado. Las imágenes
deben conservar texto alternativo o declararse decorativas cuando corresponda.

### RF-99 — Conservación funcional

El rediseño no debe cambiar las reglas existentes de dimensiones en milímetros,
validación, orden normal/intercalado, alineación, respaldos dúplex, paginación,
listas de palabras, importación CSV, privacidad local ni exportación PDF.

## Casos límite

- Estado inicial sin cartas ni listas.
- Configuración inválida en una sección mientras otra contiene datos válidos.
- Cambio repetido entre mazos de imágenes y palabras.
- Nombres de cartas, conceptos o archivos muy largos.
- Muchas cartas, listas extensas o varias páginas de previsualización.
- Error al cargar una imagen, leer CSV, generar layout o exportar PDF.
- Ventana estrecha, zoom del navegador y navegación solo con teclado.
- Usuario que intenta exportar antes de tener una composición válida.

## Accesibilidad y errores

- Se debe preservar el enlace para saltar al contenido y la jerarquía de
  encabezados.
- Los estados de etapa, selección, carga, error y éxito deben exponerse a
  tecnologías de asistencia.
- Los botones de icono deben tener nombre accesible y las acciones destructivas
  deben conservar confirmación o recuperación cuando aplique.
- Los textos deben usar instrucciones concretas y mensajes con solución.
- Se debe respetar `prefers-reduced-motion` y mantener el foco dentro del
  viewport cuando cambie la estructura visual.

## Fuera de alcance

- Cambiar el algoritmo de distribución, imposición o generación de PDF.
- Añadir cuentas, sincronización, almacenamiento remoto o telemetría.
- Sustituir HTML/CSS/JavaScript por un framework de UI.
- Crear un sistema de temas completo o un modo oscuro, salvo ajustes mínimos
  necesarios para contraste.
- Rediseñar el contenido visual de las imágenes cargadas por el usuario.

## Criterios de aceptación

- Una persona nueva puede identificar el tipo de mazo y el siguiente paso sin
  leer documentación adicional.
- Todas las funciones aprobadas en las specs relacionadas siguen disponibles.
- El resumen refleja el estado real de configuración, layout y exportación.
- Los errores indican qué corregir y no dejan una salida parcial válida.
- La previsualización y el PDF siguen usando el mismo layout.
- La página funciona en viewport estrecho y con teclado, con foco visible.
- La revisión manual en navegador documenta cualquier pendiente visual.
- `npm run check` se ejecuta dentro del harness autorizado antes de declarar
  terminado el cambio.

## Clarificación QA resuelta

- Las etapas funcionan como indicador visual y anclas de navegación; no ocultan
  configuraciones existentes ni convierten el flujo en un asistente bloqueante.
- El resumen puede permanecer sticky en escritorio, siempre que no cubra un
  control enfocado ni reduzca la previsualización a un estado inutilizable.
- La acción principal se denomina `Preparar mazo` en imágenes y `Generar mazo`
  en palabras.
