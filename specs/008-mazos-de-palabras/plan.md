# Plan de implementación — Mazos de palabras

## Alcance autorizado

Implementar únicamente los requisitos de `spec.md` para añadir el tipo de mazo
de palabras, conservar el flujo existente de mazos con imágenes y reutilizar el
layout, la paginación, los márgenes, la exportación PDF y las reglas de reverso
ya existentes.

## Decisiones técnicas

- Representar cada entrada como `{ concept, word, sourceListId }` para conservar
  la relación entre concepto y palabra incluso cuando haya textos repetidos.
- Mantener un estado explícito de `deckType` con valores `image` y `word`, y
  separar las configuraciones de ambos tipos.
- Modelar el orden aleatorio mediante una función de aleatoriedad inyectable en
  la lógica pura; las pruebas usarán una fuente controlada y la interfaz usará
  una fuente nueva en cada generación.
- Calcular el número de cartas con `ceil(totalEntries / wordsPerCard)` y rellenar
  únicamente la última carta cuando sea necesario.
- Construir las cartas en dos fases lógicas: distribuir entradas sin repetir y
  seleccionar el relleno restante priorizando el concepto menos representado.
- Priorizar en cada carta entradas de conceptos distintos; permitir repetir
  concepto cuando no haya alternativas suficientes.
- Crear un modelo común de cartas de palabras que consuman tanto preview como PDF;
  el reverso será el respaldo general de plancha ya soportado por la aplicación.
- Detectar palabras repetidas con una comparación normalizada para validación y
  resaltado, pero conservar sus ocurrencias originales y su concepto.
- Conservar un color hexadecimal por lista/concepto, con un valor por defecto
  estable, y pasarlo a cada entrada para el resaltado visual.
- Implementar un parser CSV puro con soporte para comillas y comas dentro de
  valores; la UI solo le entregará texto local y recibirá listas normalizadas.
- Usar controles HTML accesibles para pestañas, listas, conceptos, palabras,
  cantidad por carta y reverso; no depender solo del color para el resaltado.

## Responsabilidades por capa

- `src/utils/`: validación, normalización para detectar repeticiones, mezcla y
  distribución de entradas, cálculo de cartas y metadatos puros.
- `src/components/`: pestañas, editor de listas, indicadores de repetición,
  formulario de palabras y representación visual de concepto + palabra. En modo
  palabras no se renderiza el listado/carrusel de cartas generadas.
- `src/app.js`: estado de tipo de mazo, regeneración, conexión de controles con
  el modelo común y preservación de configuraciones al cambiar de pestaña.
- `src/services/`: adaptar la exportación de cartas de palabras y reverso general
  sin subir datos ni introducir una dependencia nueva.
- `test/`: contratos de shell y pruebas unitarias de distribución, validación,
  accesibilidad estructural y consumo común por preview/PDF.

## Algoritmo funcional

1. Validar dimensiones, listas, conceptos, palabras no vacías y palabras por
   carta.
2. Conservar cada ocurrencia válida como entrada identificable y marcar las
   palabras cuya forma normalizada aparece más de una vez.
3. Calcular el número de cartas con el entero superior del cociente de entradas
   entre palabras por carta.
4. Generar un orden aleatorio controlado de entradas y formar cada carta
   priorizando conceptos que aún no estén presentes en esa carta.
5. Si la última carta queda incompleta, añadir entradas repetidas seleccionadas
   entre los conceptos menos representados, hasta completar su capacidad.
6. Entregar el mismo modelo de cartas a preview y PDF, con concepto y palabra
   en cada entrada y el reverso general de plancha correspondiente.

## Estrategia de pruebas

- Probar la lógica pura sin DOM ni reloj con `node --test`.
- Cubrir una lista, varias listas, conceptos repetidos, palabras repetidas,
  palabras por carta mayor que el total, división exacta y relleno.
- Verificar que la aleatoriedad controlada sea reproducible en pruebas y que no
  se pierdan asociaciones concepto-palabra.
- Verificar que una nueva generación no altere la configuración de entrada.
- Verificar pestañas, estado inicial de imágenes, aislamiento de configuraciones,
  labels, foco y mensajes de error accesibles mediante contratos existentes.
- Verificar que preview y PDF reciban el mismo modelo y que el reverso general
  se aplique a todas las planchas del mazo de palabras.
- Realizar una pasada manual en navegador para los cambios visuales y anotarla
  en la validación final.
- Organizar el editor de palabras por etapas visibles y revisar en navegador la
  jerarquía tipográfica, separación de entradas y legibilidad de la carta.

## Riesgos y límites

- “Equilibrado” se implementará como prioridad al concepto menos representado;
  no se promete una optimización global de todas las combinaciones.
- La comparación para detectar repetidas debe definir explícitamente cómo trata
  mayúsculas y espacios sin cambiar el texto que se imprime.
- No se modifica la geometría existente ni se introduce un editor de PDF.
