# Plan de implementación — 001 Mejora funcionalidad

**Estado:** aprobado para ejecución  
**Spec de referencia:** `spec.md` (aprobada el 31 de octubre de 2026)  
**Alcance:** prototipo HTML/JavaScript; no incluye movimiento libre de cartas, dúplex,
recorte manual, cuentas ni sincronización en la nube.

## Nota de proceso

La spec fue aprobada antes de ejecutar esta corrección. Si durante la implementación
aparece una contradicción, se detendrá el trabajo y se pedirá una decisión antes de
cambiar el comportamiento.

## Resultado esperado

Convertir el prototipo monolítico en una aplicación HTML/JavaScript verificable que:

- cargue y gestione imágenes localmente;
- calcule de forma determinista la imposición en milímetros;
- reutilice el mismo modelo para preview y PDF;
- bloquee configuraciones imposibles con errores comprensibles;
- exponga una interfaz operable por teclado y tecnologías de asistencia;
- tenga un harness mínimo reproducible para pruebas y build.

## Decisiones técnicas

### Arquitectura incremental

1. Extraer primero la lógica pura desde `index.html`, sin cambiar intencionalmente el
   comportamiento visible.
2. Mantener `index.html` como shell y mover la aplicación a `src/` mediante módulos ES.
3. Separar funciones puras en `src/utils/`, integraciones de navegador en `src/services/`
   y composición de interfaz en `src/components/` o módulos equivalentes de UI.
4. Mantener HTML/CSS/JavaScript sin framework de UI.

### Modelo de dominio

El estado de entrada será serializable y contendrá configuración física, cartas cargadas,
cantidades, orden, página actual y modo visual. El layout calculado será un valor derivado
e inmutable con:

- tamaño de página y área imprimible en milímetros;
- filas, columnas y capacidad por página;
- lista expandida de copias en orden normal o intercalado;
- páginas y posiciones de cada carta;
- diagnóstico de validez y errores estructurados.

El cálculo no leerá DOM, imágenes, reloj ni estado global. La conversión a píxeles se
reservará para preview; la conversión a unidades del PDF se realizará únicamente en el
adaptador de exportación.

### Algoritmo de imposición

- Validar números finitos y positivos para papel, carta, márgenes y padding.
- Calcular área imprimible restando márgenes de papel.
- Calcular columnas y filas con división entera considerando carta y separación/padding
  según la semántica vigente del prototipo.
- Rechazar explícitamente capacidad horizontal o vertical cero.
- Expandir cantidades en orden normal o por rondas intercaladas, conservando el orden de
  carga y aplicando el límite de cantidad definido por la spec/implementación.
- Paginar la secuencia expandida sin generar páginas para una lista vacía.
- Clampear la página actual al rango válido cuando cambien configuración o cantidades.

La paginación y el posicionamiento son fases relacionadas pero distintas. La secuencia
expandida conserva el orden global de copias; al posicionar cada página, el índice espacial
debe comenzar en cero para esa página. `row`, `column`, `x`, `y` y `position.index` serán
relativos a la página. No se permite reutilizar un contador global para calcular posiciones
espaciales entre páginas. Preview y PDF consumirán esas mismas posiciones por página.

La semántica exacta de `padding`, borde y modo a sangre se conservará del prototipo y se
encapsulará en una función nombrada; cualquier ambigüedad que impida una prueba precisa
será un bloqueo de implementación, no una suposición silenciosa.

### Imágenes y privacidad

La carga usará APIs del navegador (`File`, `FileReader`/`URL.createObjectURL` e imagen)
en un servicio aislado. Se validará tipo, lectura y errores; el formato original se
conservará para exportar PNG y JPEG correctamente. No habrá endpoints ni subida remota.

### Preview y PDF

Preview y PDF consumirán el mismo `LayoutModel`. La preview dibujará una hoja y sus cartas
en una representación escalada; el exportador traducirá milímetros a las unidades de
jsPDF y agregará páginas, imágenes, bordes y márgenes desde el mismo modelo.

La dependencia de jsPDF debe quedar encapsulada en `src/services/`. Si continúa siendo
CDN durante esta spec, el harness y la aplicación deberán hacer visible el fallo de carga;
la eliminación completa de la dependencia de red queda como decisión técnica posterior,
salvo que la implementación determine que es necesaria para cumplir RF-10/RF-12.

## Harness mínimo

El bootstrap del harness es el primer paso ejecutable y debe completarse antes de extraer
o probar lógica pura. Crear `package.json`, lockfile, configuración de Vite, scripts y
pruebas con `node --test`.
Los comandos públicos serán `dev`, `preview`, `build`, `test` y `check`, sin argumentos
arbitrarios ni fallback silencioso al host. El harness seguirá las reglas de aislamiento
descritas en `AGENTS.md` y la constitución; la configuración Docker puede implementarse
junto al harness, pero no debe ocultar fallos de pruebas o build.

Las pruebas unitarias cubrirán las funciones puras sin DOM. Las pruebas estructurales
verificarán el shell, scripts, ausencia de secretos y límites básicos del harness. La
operación visual en navegador seguirá siendo verificación manual y se anotará por separado.

## Estrategia de pruebas

- **Unitaria:** unidades, validación, capacidad, orden, expansión, paginación, página
  actual y diagnóstico de layout.
- **Regresión multihoja:** usar una capacidad reducida y suficientes copias para producir
  al menos dos páginas; verificar que la primera posición de cada página sea `(row: 0,
  column: 0)` y que sus coordenadas coincidan, mientras el orden global de `item` siga siendo
  correcto.
- **Contrato de servicios:** carga de imagen y preservación de formato mediante dobles
  controlados; errores de lectura y exportación no deben producir éxito falso.
- **Estructural:** `index.html` como shell accesible, módulos esperados, scripts públicos,
  aislamiento y no inclusión de artefactos.
- **Integración manual:** carga mixta, cambios de configuración, navegación, teclado,
  preview y descarga de PDF en un navegador real.
- **Regresión RF:** una revisión final mapeará RF-01 a RF-13 contra pruebas y evidencia.

## Secuencia de implementación

0. Bootstrap del harness ESM y del runner de pruebas, sin implementar comportamiento de
   producto.
1. Extraer y probar lógica pura de configuración y unidades.
2. Extraer y probar orden, expansión, capacidad y paginación.
3. Construir la capa de carga y gestión local de imágenes.
4. Reconstruir la composición de interfaz y gestión de estado sobre esa lógica.
5. Implementar preview con paginación y estados inválidos/vacíos.
6. Implementar/encapsular PDF, incluyendo PNG/JPEG y errores.
7. Completar validaciones, límites y accesibilidad.
8. Aislar el harness, ejecutar verificación integral, revisar RF y documentar la pasada
   manual en navegador.

## Riesgos y mitigaciones

- **Desplazamiento acumulado entre páginas:** mantener separado el índice global de la
  secuencia y el índice local usado para posicionar cada página; cubrirlo con una prueba
  determinista de varias páginas.

- **Semántica heredada ambigua:** preservar comportamiento mediante pruebas de contrato y
  detenerse ante contradicciones.
- **jsPDF/CDN:** aislar la dependencia y validar el fallo explícito; evaluar empaquetado
  local en una decisión posterior si el requisito offline lo exige.
- **Imágenes grandes:** evitar duplicaciones innecesarias, liberar object URLs y validar
  errores antes de exportar.
- **Divergencia preview/PDF:** prohibir cálculos paralelos; ambos deben consumir
  `LayoutModel`.
- **Layout imposible:** usar diagnósticos tipados y bloquear todos los controles de salida.
- **Cambios de estado durante exportación:** tomar un snapshot consistente y no anunciar
  descarga válida si alguna carta falla.

## Criterio de finalización del plan

El trabajo se considera listo para revisión cuando las tareas estén implementadas,
`npm run check` sea reproducible dentro del harness, cada RF tenga evidencia, y queden
separados los resultados automatizados de la verificación manual de navegador.
