# Constitución — Generador de barajas

## Principios innegociables

1. **Producto local y privado.** Las imágenes y datos del usuario se procesan en el
   navegador; no se suben ni se envían a servicios externos. Cualquier excepción debe
   ser un requisito explícito y aprobado.

2. **Spec antes que código.** Cada cambio de comportamiento debe tener una spec SDD
   aprobada en `specs/`, seguida por `plan.md` y `tasks.md`. La implementación no puede
   ampliar silenciosamente el alcance.

3. **Geometría pura y determinista.** Las unidades, validaciones, ordenamiento de copias,
   imposición y paginación deben poder probarse sin DOM, navegador ni reloj. La
   previsualización y el PDF consumen el mismo modelo calculado.

4. **Salida físicamente honesta.** El PDF debe respetar papel, orientación, dimensiones
   en milímetros y márgenes declarados. Si el layout no es imprimible, la aplicación debe
   rechazarlo de forma visible en vez de producir una salida ambigua.

5. **Stack pequeño y verificable.** Se usa HTML/CSS/JavaScript con Vite como build y
   `node --test` para lógica. No se añaden frameworks, librerías de UI o herramientas de
   pruebas duplicadas sin una decisión documentada y aprobada.

6. **Harness aislado.** Instalación, pruebas y build se ejecutan en Docker local,
   reproducible y sin red; no se ejecuta código del proyecto en el host como fallback.
   No se copian secretos, credenciales, `node_modules` ni artefactos generados.

7. **Accesibilidad desde el diseño.** Todos los controles tienen nombre accesible,
   soporte de teclado, foco visible y errores anunciables. La interfaz no puede depender
   exclusivamente de color, arrastre o precisión del puntero.

8. **Idioma consistente.** Identificadores de código en inglés; documentación, comentarios,
   títulos de pruebas y textos visibles en español. Los nombres técnicos de formatos o
   APIs conservan su forma oficial.

## Fuente de verdad

La spec aprobada define el comportamiento. `plan.md` define la solución autorizada.
`tasks.md` define el trabajo ejecutable. `AGENTS.md` define el proceso y los guardarraíles.
`MEMORY.md` conserva decisiones y riesgos acumulados, pero no puede contradecir una spec
aprobada ni esta constitución.

El proceso debe ser portable entre OpenCode y Codex. En OpenCode se usan los agentes y
comandos de `.opencode/`; en Codex, el asistente principal reproduce el rol coordinator
y utiliza delegación nativa cuando esté disponible. La diferencia de runtime no permite
saltarse aprobaciones, pruebas, revisión ni los límites de escritura de cada rol.

## Cambios a la constitución

Solo pueden proponerse mediante `/sdd-constitution`, con justificación, impacto sobre
las specs existentes y aprobación explícita del usuario.
