# Plan de implementación — Carrusel y distribución

## Alcance

Implementar RF-50 a RF-54 sin cambiar el modelo de layout, la exportación ni el
procesamiento local de imágenes.

## Diseño técnico

1. Convertir la lista de cartas en una región horizontal con una tarjeta por carta,
   `scroll-snap`, `overflow-x` local y botones anterior/siguiente.
2. Usar una referencia al contenedor y desplazamiento determinista por el ancho de
   una tarjeta más su separación; si no existe una tarjeta visible, usar el ancho del
   contenedor como fallback.
3. Mantener los controles actuales dentro de cada tarjeta y añadir nombres y estados
   accesibles para la región y los botones.
4. Reorganizar el grid de la shell con áreas CSS: configuración, cartas, respaldos,
   previsualización y estado. En escritorio la previsualización ocupará la columna
   derecha y será sticky; en responsive se apilarán las áreas.
5. Añadir estilos para que el único desbordamiento horizontal permitido sea el
   carrusel.

## Responsabilidades

- `src/components/card-list.js`: marcado, referencias y navegación del carrusel.
- `src/app.js`: clases/áreas de composición de la shell, sin cambiar el modelo.
- `index.html`: grid, tarjetas, controles, responsive y foco visible.
- `test/`: contratos estructurales y casos de cero/una/muchas cartas.

## Verificación

- `node --test test/*.test.js`.
- Revisión estática de labels, roles, `aria-controls`, estados disabled y orden DOM.
- Pasada manual en navegador para escritorio, teclado, móvil y tarjetas con campos
  extendidos.

