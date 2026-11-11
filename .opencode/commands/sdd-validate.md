---
description: SDD - valida una spec RF por RF
agent: build
---
Recorre `specs/$1/spec.md` requisito por requisito. Lee plan, tareas y diff; ejecuta las
pruebas autorizadas y registra resultado por RF. Para interfaz, verifica navegador y
previsualización en tamaños de escritorio y móvil cuando estén disponibles. Comprueba
criterios de finalización, constitución, privacidad local y seguridad del harness. No
arregles nada. Termina con un veredicto claro.
