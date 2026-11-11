# MEMORY.md — Generador de barajas

## Propósito

Aplicación local para preparar hojas imprimibles de cartas de prototipos de juegos de
mesa. El usuario carga imágenes, asigna cantidades, define papel y dimensiones, revisa
la imposición y descarga un PDF.

## Estado al 2026-10-31

- El prototipo fue modularizado progresivamente bajo `specs/001-Mejora-funcionalidad`.
- Ya existen `package.json`, `package-lock.json`, Vite, `src/`, `test/`, `scripts/` y el
  harness Docker aislado.
- La lógica pura cubre unidades, configuración, orden normal/intercalado, layout,
  posiciones y paginación.
- La UI ya integra estado único, carga local, selección de archivos y arrastrar/soltar,
  preview paginada, validaciones accesibles y exportación PDF.
- jsPDF está fijado como dependencia local; ya no se usa el CDN original.
- La suite directa reporta 59 pruebas correctas; `npm test`/`npm run check` requieren Docker
  y están bloqueados en entornos donde Docker no está disponible.
- La verificación manual de navegador, teclado, lector de pantalla y PDF real sigue
  pendiente.
- Se mantiene la documentación base y el flujo SDD en `.opencode/`.
- El flujo SDD también se ejecutará directamente en Codex: el asistente principal hace
  de coordinator y puede delegar planificación, implementación y revisión a roles
  especializados. `.opencode/` es la versión portable para el runtime OpenCode, no un
  mecanismo que Codex cargue automáticamente.

## Decisiones permanentes

- El producto es local-first: las imágenes del usuario no salen del navegador.
- La unidad de negocio es el milímetro; la previsualización es una representación, no la
  fuente de verdad.
- La geometría debe vivir en funciones puras y compartirse entre preview y exportación.
- No se implementa una funcionalidad sin spec aprobada, plan y tareas.
- El runner preferido para lógica es `node --test`; no introducir Jest/Vitest salvo una
  decisión explícita de constitución.
- La seguridad del harness es parte del producto de desarrollo: Docker local, sin red,
  sin montajes ni credenciales y sin fallback al host.

## Riesgos y pendientes conocidos

1. Docker no está disponible en el entorno actual; T8/T9 no tienen verificación real de
   contenedor, red, privilegios, montaje y limpieza.
2. La pasada manual de navegador sigue pendiente: teclado, lector de pantalla, responsive,
   arrastrar/soltar, preview y descarga de PDF real.
3. Debe confirmarse en navegador que las dimensiones físicas del PDF coinciden con el
   layout y que las imágenes grandes no degradan la experiencia.
4. No se ha ejecutado una auditoría de dependencias; npm reportó una vulnerabilidad crítica
   pendiente en la cadena de jsPDF.

## Próximo paso recomendado

Instalar Docker Desktop con contenedores Linux y ejecutar el harness aislado. Después hacer
la pasada manual en navegador y registrar el veredicto RF por RF en la documentación de
verificación de la spec 001.
