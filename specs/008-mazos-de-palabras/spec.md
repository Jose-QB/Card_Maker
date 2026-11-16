# Spec 008 — Mazos de palabras

**Estado:** aprobada  
**Tipo:** nueva funcionalidad de dominio  
**Specs relacionadas:** `specs/002-dimensiones-alineacion/spec.md`,
`specs/005-carrusel-y-distribucion/spec.md`, `specs/006-editor-carta-seleccionada/spec.md`

## Objetivo

Permitir crear un tipo de mazo basado en listas de palabras agrupadas por
concepto, para generar cartas imprimibles que muestren cada concepto junto con
la palabra que le corresponde.

## Decisiones de producto

- El usuario define el tamaño físico de la carta usando las unidades del producto.
- El usuario introduce una o más listas de palabras y un concepto para cada lista.
- El usuario define cuántas palabras contiene cada carta.
- El número total de cartas se calcula a partir del total de palabras y la cantidad
  de palabras por carta; no se introduce manualmente.
- Cada palabra se usa una vez en el mazo generado, excepto las repeticiones que
  hagan falta para completar la última carta.
- La distribución es aleatoria en cada generación.
- La generación prioriza combinar conceptos distintos dentro de cada carta.
  Cuando no sea posible combinar más conceptos, se permiten varias palabras del
  mismo concepto.
- Las repeticiones de la última carta se eligen de forma equilibrada entre los
  conceptos y palabras disponibles: se priorizan los conceptos menos
  representados hasta igualar el reparto lo máximo posible.
- Las listas con el mismo texto de concepto se mantienen como listas
  independientes, aunque compartan la etiqueta visible.
- Cada nueva generación produce otra distribución aleatoria sin modificar la
  configuración introducida por el usuario.
- Cada elemento mostrado en una carta conserva la relación entre su concepto y
  su palabra.
- Las palabras repetidas dentro de las listas se conservan y se resaltan para que
  el usuario pueda identificarlas antes de generar el mazo.
- La interfaz ofrece una pestaña para mazos de imágenes y otra para mazos de
  palabras. La pestaña de imágenes es la seleccionada inicialmente y conserva
  el flujo predefinido existente.
- Los mazos de palabras admiten un reverso general aplicado a toda la plancha,
  igual para todas sus cartas.
- En el modo de palabras no se muestra una lista o carrusel de cartas generadas;
  el resultado se consulta únicamente en la previsualización de la plancha.
- El editor de palabras organiza sus controles en una secuencia clara: tipo de
  mazo, tamaño de carta, palabras por carta, listas conceptuales y generación.
- Las cartas de palabras usan una composición visual legible y consistente:
  concepto destacado, palabra con mayor jerarquía y separación clara entre
  entradas.
- Cada lista puede elegir un color de concepto desde una paleta cerrada de
  colores predefinidos que se usa como resaltado visual consistente.
- Las listas nuevas reciben automáticamente un color aleatorio de esa paleta,
  procurando no repetir los colores ya usados mientras haya opciones.
- El editor muestra una sola lista activa mediante un carrusel; editar controles
  solo modifica esa lista.
- El modo de palabras ofrece una plantilla CSV compatible con Excel: cada columna
  representa un concepto, la primera fila contiene sus títulos y las filas
  siguientes contienen palabras.
- El usuario puede descargar la plantilla e importar un CSV local para crear o
  reemplazar las listas del editor.

## Requisitos funcionales

### RF-80 — Selección del tipo de mazo

Cuando el usuario elija el tipo de mazo de palabras, la aplicación debe mostrar
los controles para configurar dimensiones de carta, listas de palabras,
conceptos y palabras por carta, sin exigir imágenes de cartas.

### RF-81 — Configuración de listas conceptuales

Cuando el usuario agregue una lista, la aplicación debe permitir asociarle un
concepto y una colección ordenada de palabras. Cada palabra debe permanecer
asociada al concepto de su lista durante la generación, la previsualización y la
exportación.

### RF-81a — Resaltado de palabras repetidas

Cuando una palabra aparezca más de una vez en las listas configuradas, la
aplicación debe conservar sus ocurrencias y resaltarlas de forma visible y
accesible antes de generar el mazo. El resaltado debe permitir distinguir que la
repetición existe sin romper la asociación de cada ocurrencia con su concepto.

### RF-81b — Selección por pestañas

Cuando el usuario abra el editor, la aplicación debe mostrar dos pestañas para
seleccionar el tipo de mazo: imágenes y palabras. La pestaña de imágenes debe
estar seleccionada inicialmente y sus tarjetas deben seguir siendo las
predefinidas del producto. Al cambiar a palabras, deben mostrarse los controles
específicos de este tipo sin mezclar configuraciones ni datos de imágenes.

### RF-81c — Consulta exclusiva en previsualización

Cuando el usuario esté en el modo de mazo de palabras, la aplicación no debe
mostrar la lista, carrusel o editor de las cartas generadas. La composición
generada debe consultarse en el panel de previsualización, con paginación cuando
ocupe varias planchas.

### RF-81d — Organización del editor de palabras

Cuando el usuario seleccione el modo de palabras, la aplicación debe presentar
los controles específicos agrupados en un orden comprensible: selección del tipo
de mazo, dimensiones físicas, cantidad de palabras por carta, listas con sus
conceptos y palabras, y acción de generación. La agrupación debe conservar
labels, foco visible, navegación por teclado y errores asociados.

### RF-81e — Color por concepto

Cuando el usuario edite una lista de palabras, la aplicación debe ofrecer un
selector de color con opciones predefinidas asociado a su concepto. El color
elegido debe conservarse con la lista y aplicarse a todas sus palabras sin romper
la asociación concepto-palabra. Al añadir una lista nueva, debe asignarse un
  color aleatorio de la paleta disponible. La paleta contiene veinte colores y
  se presenta dentro de un selector desplegable, no como un campo de color libre.

### RF-81f — Plantilla CSV de conceptos

Cuando el usuario solicite la plantilla de palabras, la aplicación debe descargar
un archivo `.csv` compatible con Excel cuya primera fila contenga los títulos de
los conceptos y cuyas filas posteriores representen palabras por columna.

### RF-81g — Importación local de CSV

Cuando el usuario seleccione un archivo `.csv` con una primera fila de títulos,
la aplicación debe leerlo localmente, convertir cada columna en una lista cuyo
concepto sea su título y añadir las celdas no vacías como palabras en el mismo
orden. Las celdas vacías deben ignorarse y los datos no deben enviarse a
servicios externos.

### RF-81h — CSV inválido

Cuando el archivo no tenga extensión CSV, no pueda leerse, no tenga títulos
válidos o no contenga ninguna palabra, la aplicación debe mostrar un error
visible y accesible y conservar las listas configuradas anteriormente.

### RF-82 — Cálculo del número de cartas

Cuando exista al menos una palabra válida y una cantidad positiva de palabras por
carta, la aplicación debe calcular el número de cartas como el entero superior
del total de palabras dividido entre palabras por carta.

### RF-83 — Distribución de palabras

Cuando el usuario genere el mazo, la aplicación debe distribuir las palabras de
forma aleatoria entre las cartas calculadas, usando cada palabra una vez salvo
las repeticiones necesarias para completar la última carta.

### RF-84 — Diversidad de conceptos

Cuando una carta contenga más de una palabra y haya suficientes conceptos
disponibles, la aplicación debe priorizar que sus palabras pertenezcan a
conceptos distintos. Cuando no haya suficientes conceptos o palabras para
mantener esa diversidad, debe permitir repetir concepto dentro de la carta.

### RF-85 — Relleno equilibrado de la última carta

Cuando la última carta tenga menos palabras que la cantidad configurada, la
aplicación debe completarla repitiendo palabras del conjunto generado y debe
equilibrar la selección entre los conceptos y palabras disponibles, sin alterar
las cartas ya completas.

### RF-86 — Presentación de concepto y palabra

Cuando una carta se muestre en la previsualización o se exporte, cada palabra
debe aparecer junto con el concepto que la define, de forma que la relación
concepto-palabra sea inequívoca.

### RF-86a — Diseño de cartas de palabras

Cuando una carta de palabras se muestre en la previsualización o se exporte, el
concepto debe tener una jerarquía visual secundaria pero distinguible, la palabra
debe ser el elemento principal de cada entrada y las entradas deben separarse
sin depender únicamente del color.

### RF-86b — Resaltado cromático del concepto

Cuando una carta de palabras se muestre en la previsualización, el concepto debe
usar su color configurado como resaltado secundario, manteniendo contraste y una
identificación textual para que la información no dependa únicamente del color.

### RF-87 — Compatibilidad con impresión

Cuando el usuario genere la composición imprimible, las cartas de palabras deben
usar el tamaño físico configurado, respetar los márgenes y reglas de imposición
existentes, y derivar la previsualización y el PDF del mismo resultado de layout.

### RF-88 — Validación visible

Cuando la configuración no permita generar un mazo válido, la aplicación debe
mostrar un error visible y accesible, no generar cartas parciales ni producir un
PDF ambiguo.

### RF-89 — Privacidad local

Cuando el usuario introduzca listas y palabras, esos datos deben procesarse
localmente en el navegador y no enviarse a servicios externos.

### RF-87a — Reverso general de mazo de palabras

Cuando el usuario configure un reverso para un mazo de palabras, la aplicación
debe aplicar una única imagen de reverso general a toda la plancha de ese mazo,
manteniendo la correspondencia con las cartas del frente según las reglas de
impresión a doble cara existentes.

## Casos límite

- No hay listas.
- Hay una lista sin concepto.
- Hay una lista vacía.
- Hay palabras vacías, compuestas solo por espacios o duplicadas.
- Una palabra repetida pertenece a listas con conceptos iguales o distintos y
  todas sus ocurrencias deben permanecer identificables.
- Hay conceptos repetidos entre listas.
- Hay menos conceptos que palabras por carta.
- Hay menos palabras totales que palabras por carta.
- El total de palabras es divisible exactamente entre palabras por carta.
- La última carta requiere una o varias repeticiones.
- Solo existe una palabra o un solo concepto.
- Las dimensiones de carta son cero, negativas, no numéricas o no caben en el papel.
- El número de palabras por carta es cero, negativo o no entero.
- La distribución aleatoria no debe producir cartas infinitas, divisiones por cero ni
  asociaciones concepto-palabra incorrectas.
- El usuario cambia repetidamente entre las pestañas de imágenes y palabras sin
  perder ni mezclar configuraciones.
- Un mazo de palabras tiene reverso general y varias páginas de plancha.
- El modo de palabras tiene cero cartas generadas o cambia su configuración
  después de una generación; no debe quedar una lista de cartas visible ni una
  previsualización obsoleta.

## Accesibilidad y errores

- Cada lista, concepto, colección de palabras y control de generación debe tener
  un nombre accesible y ser usable con teclado.
- Los errores deben estar asociados al control correspondiente y anunciarse a
  tecnologías de asistencia.
- La diversidad de conceptos y el estado de generación no deben comunicarse solo
  mediante color.

## Fuera de alcance

- Sugerir o generar palabras automáticamente.
- Sincronizar listas con servicios externos.
- Editar texto de las palabras directamente sobre el PDF generado.
- Definir reglas de juego adicionales sobre cómo deben usarse las cartas.
- Garantizar una distribución matemáticamente óptima de conceptos más allá de
  priorizar diversidad y equilibrar el relleno indicado en esta spec.

## Criterios de aceptación

- El usuario puede seleccionar el tipo de mazo de palabras y configurar tamaño,
  listas conceptuales y palabras por carta.
- El usuario puede cambiar entre las pestañas de imágenes y palabras; imágenes es
  la pestaña inicial y conserva las tarjetas predefinidas.
- Las palabras repetidas se resaltan antes de generar y sus ocurrencias conservan
  sus conceptos.
- El modo de palabras no muestra un listado o carrusel de cartas; la única
  consulta del resultado generado es la previsualización paginada.
- Los controles del modo de palabras aparecen agrupados en el orden definido y
  las cartas presentan una jerarquía legible entre concepto y palabra.
- Cada lista permite seleccionar un color y el color se refleja en el resaltado
  del concepto dentro de la previsualización.
- Las listas se navegan con un carrusel y solo la lista seleccionada muestra sus
  controles de edición.
- El usuario puede descargar una plantilla CSV e importar un CSV válido para
  poblar las listas de conceptos y palabras.
- Un CSV inválido no borra ni reemplaza la configuración existente.
- El número de cartas se calcula automáticamente y coincide con el entero superior
  del cociente de palabras totales entre palabras por carta.
- Las palabras aparecen una sola vez salvo el relleno requerido de la última carta.
- Las cartas combinan conceptos distintos cuando hay suficientes opciones y permiten
  repetirlos cuando no las hay.
- El relleno de la última carta es equilibrado y no modifica cartas completas.
- Cada palabra se presenta con su concepto correcto en preview y PDF.
- Un reverso general puede aplicarse a toda la plancha de un mazo de palabras y
  mantiene la correspondencia dúplex existente.
- Una configuración inválida produce un error visible y no produce un PDF válido.
- Los datos de listas y palabras permanecen locales.
- La funcionalidad conserva las reglas existentes de dimensiones, márgenes,
  imposición, accesibilidad y derivación común entre preview y PDF.

## Impacto posterior

- `plan.md` deberá actualizar responsabilidades de componentes, flujo de
  previsualización y decisiones de diseño visual.
- `tasks.md` deberá añadir tareas de prueba y código para ocultar el listado,
  reorganizar el menú y revisar visualmente las cartas en navegador.

## Preguntas pendientes para clarificación QA

- Las palabras duplicadas dentro de una misma lista se conservan y se resaltan;
  no se descartan automáticamente.
- Los conceptos duplicados entre listas se mantienen como listas independientes
  con el mismo texto visible.
- El equilibrio prioriza los conceptos menos representados hasta igualar el
  reparto lo máximo posible.
- Cada generación puede producir una distribución aleatoria nueva sin modificar
  la configuración actual.
