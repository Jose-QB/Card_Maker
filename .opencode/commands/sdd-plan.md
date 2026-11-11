---
description: SDD - genera el plan técnico de una spec aprobada
agent: plan
---
Lee `docs/constitution.md`, `AGENTS.md` y `specs/$1/spec.md`. Si no está aprobada o tiene
dudas abiertas, detente. No escribas código.

Genera `specs/$1/plan.md` con archivos y responsabilidades, funciones puras sin DOM,
algoritmo de imposición, representación de preview/PDF, decisiones justificadas,
estrategia de `node --test` y cobertura RF por sección.
