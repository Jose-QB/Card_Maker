# Plan de implementación — 004 Tamaños predefinidos

**Estado:** aprobado para ejecución  
**Spec de referencia:** `spec.md`

1. Exponer `CARD_PRESETS` como catálogo inmutable de medidas en mm.
2. Añadir al estado `cardPreset` y `customCardEnabled` sin romper configuraciones previas.
3. Mostrar selector de preset y checkbox personalizado en controles compartidos.
4. Reutilizar validación existente para los campos personalizados.
5. Mantener el `LayoutModel` como única fuente de recálculo para preview, respaldos y PDF.
6. Probar catálogo, selección, checkbox, validación y regresión completa.

