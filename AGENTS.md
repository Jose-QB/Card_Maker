# AGENTS.md

Generador de barajas para prototipos de juegos de mesa. El producto permite cargar
imágenes de cartas, definir el papel y las dimensiones físicas, ordenar copias y
exportar una composición imprimible en PDF.

El proyecto está en fase de preparación del harness SDD. La aplicación actual vive
en un único `index.html` y todavía no tiene `package.json`, build, pruebas ni una
separación modular. Las primeras specs deben describir el comportamiento deseado y
no asumir que la implementación actual es correcta.

## Flujo SDD obligatorio

1. **Spec**: entrevistar al usuario y crear `specs/NNN-nombre/spec.md`.
2. **Clarificación**: revisar la spec como QA y detectar ambigüedades, contradicciones
   y casos límite.
3. **Aprobación**: no planificar ni implementar mientras la spec siga en borrador.
4. **Plan**: crear `plan.md` con decisiones, responsabilidades, algoritmo y pruebas.
5. **Tareas**: crear `tasks.md` con tareas pequeñas, ordenadas y verificables.
6. **Implementación**: ejecutar una sola tarea por vez, primero pruebas y después código.
7. **Validación**: recorrer cada requisito funcional, ejecutar pruebas y dejar pendientes
   explícitos para la verificación visual/manual.

Los comandos SDD viven en `.opencode/commands/` y los roles en `.opencode/agents/`.
La spec aprobada y sus artefactos son la fuente de alcance; este archivo y
`docs/constitution.md` son las reglas permanentes.

## Ejecución con Codex

Estas reglas también se aplican cuando el trabajo se realiza directamente en la
conversación de Codex. En ese caso, el asistente principal actúa como `coordinator`:

- conserva el orden de fases y solicita aprobación de spec y plan;
- usa `planner`, `implementer` y `reviewer` como roles de trabajo, aunque la delegación
  se ejecute mediante las capacidades nativas de Codex y no mediante OpenCode;
- transmite a cada rol la petición original, las decisiones y las rutas relevantes;
- no presenta una tarea como terminada con pruebas rojas;
- no confunde la existencia de un comando `.opencode` con una ejecución real del comando.

La carpeta `.opencode/` sigue siendo la definición portable para OpenCode. El contenido
de este archivo es la autoridad común para OpenCode y Codex. Si una capacidad de un
runtime no existe en el otro, se conserva el control de proceso y se declara la
diferencia al usuario.

## Harness de desarrollo y seguridad

Cuando se incorpore el harness ejecutable, los comandos públicos serán únicamente:

- `npm run dev`: servidor local con recarga.
- `npm run preview`: build y servidor de previsualización.
- `npm run build`: build reproducible para publicación.
- `npm test`: pruebas con el runner integrado de Node.
- `npm run check`: pruebas y build en una sola ejecución.

El harness deberá ejecutarse dentro de un contenedor Linux desechable, sin red para
las pruebas, sin montajes del workspace, sin credenciales y sin fallback silencioso a
la ejecución en el host. Los manifiestos y el lockfile se validarán antes de instalar.
La imagen de Node deberá estar fijada por versión y digest. Los artefactos temporales,
`dist/` y `node_modules/` no forman parte del estado fuente.

Mientras el harness ejecutable no exista, no se deben inventar comandos `npm` ni
declarar que una prueba pasó. Se permite inspección estática y edición documental.

## Arquitectura objetivo

- `index.html`: shell mínimo y accesible; no debe contener la lógica completa.
- `src/`: aplicación y composición de la interfaz.
- `src/utils/`: lógica pura de unidades, distribución, paginación y validación.
- `src/services/`: integración con el navegador y exportación PDF.
- `src/components/`: controles, lista de cartas, previsualización y estadísticas.
- `test/`: guardarraíles del shell, contratos y seguridad del harness.
- `specs/`: especificaciones, planes y tareas SDD.
- `docs/`: constitución, seguridad local y decisiones de producto.

La separación es una dirección arquitectónica, no una autorización para reorganizar
la aplicación fuera de una spec aprobada.

## Invariantes del dominio

- Las dimensiones físicas se expresan en milímetros; los píxeles solo sirven para la
  previsualización.
- El cálculo de layout debe ser determinista y no depender del DOM ni del reloj.
- La lista expandida de copias debe conservar el orden normal e intercalado definido
  por la spec.
- La previsualización y el PDF deben derivarse del mismo resultado de layout.
- El margen de papel y el margen/área de carta son conceptos distintos.
- Un layout inválido debe producir un error visible y verificable; nunca divisiones por
  cero, páginas infinitas ni PDF parcialmente válido.
- Los archivos de usuario se procesan localmente. No se suben imágenes ni documentos.
- El PDF generado es una salida del usuario y no se versiona en el repositorio.

## Calidad y accesibilidad

- Código, nombres de archivos, variables y funciones en inglés; documentación, textos
  visibles y títulos de pruebas en español.
- Sin dependencias de UI innecesarias. La lógica pura usa `node --test`.
- La interfaz debe funcionar con teclado, tener foco visible, labels asociados y
  mensajes de error accesibles.
- La generación debe contemplar PNG y JPEG, imágenes grandes, archivos inválidos,
  cero cartas, dimensiones imposibles y cartas que no caben en el papel.
- Todo cambio visual requiere una pasada manual en navegador y debe quedar anotado.

## Verificación

El agente revisor debe comenzar con `VEREDICTO: APROBADO` o
`VEREDICTO: CAMBIOS NECESARIOS`, mapear cada RF a evidencia y separar bloqueos de
recomendaciones opcionales. Las pruebas de UI no se consideran cubiertas por
`node --test`.

## Estado inicial

- La única implementación existente es `index.html`.
- El prototipo carga jsPDF desde CDN.
- No hay specs de producto aprobadas.
- No hay harness ejecutable ni pruebas automatizadas locales.
- El siguiente trabajo correcto es crear la primera spec del dominio, no migrar código
  por intuición.
