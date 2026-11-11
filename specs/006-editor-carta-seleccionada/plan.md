# Plan de implementación — Editor y carrusel compacto

## Alcance

Implementar RF-60 a RF-64 sin modificar el resultado del `LayoutModel` ni la
exportación PDF.

## Diseño técnico

1. Añadir `selectedCardId` al estado y funciones de selección/normalización para
   conservar una selección válida al reemplazar o eliminar cartas.
2. Separar `card-list.js` en un editor detallado de la carta seleccionada y un
   carrusel compacto navegable. Reutilizar los listeners existentes solo para el
   editor activo.
3. Mantener el scroll de ambos carruseles al cambiar datos.
4. Reubicar diagnósticos, estadísticas y acciones al panel izquierdo mediante áreas
   CSS, dejando Cartas → Previsualización → Respaldos en la columna derecha.
5. Añadir contratos de selección, estado accesible y casos de eliminación.

## Verificación

- `node --test test/*.test.js`.
- Revisión estática de `aria-selected`, teclado, foco, labels y estados vacíos.
- Pasada manual en navegador pendiente de un servidor local verificable.

