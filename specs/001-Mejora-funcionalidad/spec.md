# Spec 001 — Flujo imprimible de barajas

**Estado:** aprobada  
**Propósito:** mejorar el flujo completo de carga, acomodo, previsualización y exportación
de cartas para que el usuario pueda obtener una hoja imprimible sin cálculos manuales.

## Contexto

El prototipo actual permite cargar imágenes y generar un PDF, pero concentra todo el
comportamiento en `index.html` y no define con suficiente precisión qué ocurre cuando el
layout no es posible, cuando se cambian las dimensiones o cuando las imágenes tienen
formatos y proporciones diferentes.

La primera versión mejorada debe convertir la herramienta en un flujo confiable:

1. el usuario carga y administra sus cartas;
2. define papel, orientación, tamaño y márgenes;
3. el sistema calcula automáticamente la imposición;
4. el usuario revisa las páginas resultantes;
5. el sistema genera un PDF coherente con esa revisión.

## Decisiones asumidas para esta versión

- Las dimensiones físicas se introducen en milímetros.
- Cada imagen representa un tipo de carta y tiene una cantidad configurable.
- El sistema soporta orden normal e intercalado.
- El acomodo es automático y regular en filas y columnas; no se permite mover cartas
  individualmente en esta versión.
- La previsualización representa la hoja completa y permite navegar entre páginas.
- El PDF se genera localmente y no requiere subir imágenes.
- Se conservan los modos actuales de carta con margen/padding y de imagen a sangre.
- El PDF debe aceptar imágenes JPEG y PNG sin depender de que el formato original sea
  convertido manualmente por el usuario.

## Requisitos funcionales

### RF-01 — Carga de imágenes

Cuando el usuario seleccione o arrastre archivos, el sistema debe aceptar imágenes JPEG,
PNG y formatos de imagen soportados por el navegador, crear una entrada por imagen válida
y mostrar una previsualización identificable de cada entrada.

### RF-02 — Rechazo de archivos inválidos

Cuando el usuario cargue un archivo que no sea una imagen válida o no pueda leerse, el
sistema debe rechazarlo, conservar las entradas válidas y mostrar un mensaje comprensible
sin interrumpir el flujo.

### RF-03 — Gestión de cartas

Cuando exista una entrada cargada, el usuario debe poder cambiar su nombre, cambiar su
cantidad a un entero positivo y eliminarla; cada cambio debe reflejarse en las estadísticas,
la previsualización y el PDF siguiente.

### RF-04 — Configuración física

Cuando el usuario configure papel, orientación, márgenes de hoja, ancho y alto de carta,
el sistema debe recalcular cuántas cartas caben horizontal y verticalmente usando
milímetros y debe mostrar las dimensiones y capacidad resultantes.

### RF-05 — Validación de layout imposible

Cuando una carta no quepa en el área imprimible o la configuración contenga dimensiones
inválidas, el sistema debe bloquear la previsualización imprimible y la generación del PDF,
explicar el problema y no producir páginas infinitas, divisiones por cero ni un archivo
parcial.

### RF-06 — Orden de copias

Cuando el usuario elija orden normal, el sistema debe colocar todas las copias de cada
tipo consecutivamente; cuando elija orden intercalado, debe colocar una copia de cada tipo
por ronda hasta agotar sus cantidades, conservando el orden de carga.

### RF-07 — Tratamiento visual de la carta

Cuando el usuario use el modo normal, el sistema debe respetar el área de carta, el
padding y el borde configurados; cuando use el modo a sangre, la imagen debe ocupar el
contenedor completo de la carta, incluidos los márgenes definidos para ese modo.

### RF-08 — Previsualización paginada

Cuando haya cartas y un layout válido, el sistema debe mostrar la hoja a escala, las cartas
en sus posiciones calculadas, el número de página actual, el total de páginas y la
capacidad por página; los controles anterior y siguiente deben quedar deshabilitados en
los extremos.

En cada página, la primera carta debe ocupar la posición `(row: 0, column: 0)` dentro de la
cuadrícula de esa página. Las filas, columnas y coordenadas de una página no deben depender
del número de cartas colocadas en páginas anteriores. La secuencia global de copias debe
conservarse, pero el índice espacial debe reiniciarse por página.

### RF-09 — Sincronía entre configuración y preview

Cuando cambie cualquier configuración que afecte al layout, a las cantidades o al orden,
el sistema debe recalcular la previsualización y conservar una página actual válida.

### RF-10 — Generación del PDF

Cuando el usuario solicite exportar con al menos una carta y un layout válido, el sistema
debe generar y descargar un PDF con el papel, orientación, páginas, posiciones, márgenes,
bordes e imágenes equivalentes a la previsualización.

### RF-11 — Errores de exportación

Cuando una imagen no pueda incorporarse al PDF, el sistema debe informar el error y evitar
presentar la exportación como válida; las demás cartas no deben corromper silenciosamente
el documento.

### RF-12 — Privacidad local

Durante la carga, previsualización y exportación, el sistema no debe enviar imágenes ni
datos de cartas a un servidor; los archivos producidos deben descargarse únicamente al
dispositivo del usuario.

### RF-13 — Accesibilidad básica

Cuando el usuario opere la herramienta con teclado o tecnologías de asistencia, todos los
controles deben tener nombre accesible, relación explícita con su etiqueta, foco visible y
mensajes de error perceptibles sin depender solamente del color.

## Casos límite

- No hay cartas cargadas.
- Se cargan simultáneamente archivos válidos e inválidos.
- La misma imagen se carga más de una vez.
- La cantidad se deja vacía, es decimal, negativa o supera el límite permitido.
- El ancho o alto de carta es cero, negativo, no numérico o mayor que el papel.
- Los márgenes consumen toda el área del papel.
- Una configuración válida cambia a otra que ya no cabe.
- Se elimina una carta mientras la página actual es la última.
- Se cambia el orden con varias cantidades distintas.
- Una cantidad de cartas que supere la capacidad de una página debe colocar la primera carta
  de cada página en la esquina superior izquierda del área imprimible, sin desplazamiento
  acumulado desde páginas anteriores.
- Una imagen es PNG, JPEG, muy grande o tiene una proporción distinta a la carta.
- El usuario intenta exportar mientras no hay una configuración válida.
- La generación de PDF falla parcialmente.
- El navegador no permite leer un archivo o bloquea la descarga.

## Fuera de alcance

- Edición gráfica del contenido de una carta.
- Recorte manual, rotación individual o reposicionamiento libre.
- Impresión directa desde la aplicación.
- Alineación dúplex con reversos independientes.
- Guardado de proyectos en cuentas o sincronización en la nube.
- Catálogo de juegos, plantillas visuales o base de datos de cartas.
- Colocación de marcas de corte avanzadas, sangrado profesional o perfiles de color ICC.
- Colaboración multiusuario.

## Criterios de aceptación

- Una persona puede cargar varias imágenes, cambiar cantidades y obtener el total correcto
  de cartas y páginas.
- El cambio entre orden normal e intercalado produce secuencias verificablemente distintas
  y correctas.
- El cambio de papel, orientación, tamaño o márgenes actualiza el número de columnas,
  filas, capacidad y páginas sin dejar la vista en una página inexistente.
- Una configuración imposible se explica y no permite descargar un PDF engañoso.
- El PDF contiene todas las páginas y cartas que muestra la previsualización, respetando
  el formato de imagen y las dimensiones físicas configuradas.
- Las imágenes permanecen en el dispositivo del usuario.
- Los flujos principales pueden operarse por teclado y los errores son legibles.
- La lógica de cálculo puede probarse sin DOM ni navegador.
- Con una capacidad de una o más cartas por página, todas las páginas deben reutilizar la
  misma cuadrícula: la primera carta de cada página debe tener la misma posición `(row,
  column, x, y)` que la primera carta de la primera página, y las cartas restantes deben
  ocupar posiciones válidas dentro de esa página.
