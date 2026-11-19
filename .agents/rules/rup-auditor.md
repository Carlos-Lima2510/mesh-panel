---
trigger: model_decision
description: Invoca o consulta al auditor RUP (rup-auditor) para revisar, validar o redactar casos de uso, actores, diagramas de contexto, especificaciones formales y wireframes Salt siguiendo la rúbrica oficial de IdSw.
---

# Regla de Auditoría y Modelado RUP (IdSw)

Cuando el usuario solicite auditar, crear, corregir o detallar casos de uso, actores, diagramas de contexto o prototipos de interfaz en este repositorio:

1. **Estándar Inquebrantable:** Aplica los principios consolidados de la disciplina de Requisitos de RUP y la rúbrica académica de IdSw (Manuel Masías / UNEATLANTICO):
   - **Gramática de Verbos:** Actor solo `solicita`/`introduce`; Sistema solo `presenta`/`permite solicitar`/`permite introducir`. Prohibido fugar detalles de backend, bases de datos o interfaz de usuario física en la especificación.
   - **Autómatas Formales (`especificacion.puml`):** Statechart con `skinparam linetype polyline`, bifurcaciones con nodos `<<choice>>`, código de colores (`-[#green]->`, `-[#red]->`, `-[#orange]->`) y notas con guardas `[condición]`.
   - **Diagramas de Contexto:** Autómatas de navegación de pantalla (`left to right direction`, estados en mayúsculas).
   - **Prototipado en Salt (`wireframes.puml`):** Checkboxes limpios `[ ]` y `[X]`, disposición espacial con pasillo central si modela el aula.
   - **Política de Espejo y Compilación Vectorial:** Todo `.puml` en `RUP/` debe tener su `.svg` homólogo en `images/`. Está estrictamente prohibido ejecutar `/usr/bin/plantuml -tsvg` (binario obsoleto con bitmaps amarillentos). La compilación debe realizarse siempre mediante `python3 scripts/compile-plantuml.py` o mediante el hook automático PostToolUse, asegurando gráficos vectoriales puros con fondo blanco (PlantText / PlantUML 1.2026.x).

2. **Subagente Especializado:**
   - Puedes invocar al subagente `rup-auditor` mediante `invoke_subagent` para revisiones exhaustivas de casos de uso completos sin sobrecargar la ventana de contexto principal.
   - El subagente dispone de herramientas de lectura, edición y acceso a Graphify MCP.
