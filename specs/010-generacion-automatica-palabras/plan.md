# Plan — Spec 010: Generación automática de mazos de palabras

**Estado:** aprobado para implementación tras aprobación de la spec.

## Decisiones

- `updateAppState` centraliza la regeneración automática para que todos los
  controles de palabras compartan el mismo comportamiento.
- Los cambios de `wordDeckInput` validan y regeneran en el mismo paso; cuando son
  inválidos dejan `wordCards` vacío y conservan los diagnósticos.
- La generación de imágenes no cambia.
- Los controles de palabras dejan de emitir `generate-word-deck` y muestran una
  nota de actualización automática.
- La preview y el PDF siguen consumiendo `wordCards` y el `LayoutModel` actual.

## Pruebas

- Probar que `set-word-config` regenere con configuración válida.
- Probar que cambiar listas regenere y que un cambio inválido limpie cartas.
- Probar que el modo imágenes no se vea afectado.
- Probar que el render del modo palabras no incluya botón de generación manual.
- Ejecutar `npm run check` dentro del harness autorizado y revisión manual en
  navegador cuando Docker esté disponible.
