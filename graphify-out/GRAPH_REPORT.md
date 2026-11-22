# Graph Report - mesh-panel  (2026-11-22)

## Corpus Check
- 67 files · ~67,256 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: .puml 16, .example 1, (none) 1)
- WARNING: 21 of 105 files seen (20%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 537 nodes · 806 edges · 45 communities (20 shown, 25 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 65 edges (avg confidence: 0.9)
- Token cost: 177,006 input · 6,991 output

## Graph Freshness
- Built from commit: `03275970`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- Accion
- test-domain.js
- daemon.js
- Laboratorio
- telemetry-daemon
- SnmpSwitchProvider
- procesarDatosLaboratorio
- Puesto
- DashboardRenderer
- Router
- 2. Auditoría Física de Enlace por Switch (SNMP Directo)
- auto-compile-plantuml.py
- Host
- ADR-004: Inclusión de la Entidad Switch
- package.json
- Información del caso de uso
- Switch
- SseClient
- consultarDetallePuesto
- consultarEstadoPuestos
- dimensionarCuadricula
- Auditor RUP de Élite: Actores, Casos de Uso y Prototipos
- test-switch.sh
- abrirModalDimensionar
- Guía de Modelado RUP y Reglas del Agente
- LaboratorioService.js
- Estado
- Diagrama de Clases de Dominio
- Microsoft-Windows-DHCP Client Events/Operational
- Zero-Touch Architecture
- REF-01: Byon et al. (2015)
- Host
- rup-auditor.md
- Auditoría de Red SNMPwalk: Estado de Bocas (UP/DOWN) y Velocidades de Negociación
- Referencias
- Referencias
- OpSys > dimensionarCuadricula
- confirmarAsignarSwitch

## God Nodes (most connected - your core abstractions)
1. `Laboratorio` - 29 edges
2. `Puesto` - 22 edges
3. `Accion` - 20 edges
4. `Switch` - 17 edges
5. `Host` - 15 edges
6. `SnmpSwitchProvider` - 15 edges
7. `LaboratorioService` - 14 edges
8. `DashboardRenderer` - 14 edges
9. `EstadoDesconectado` - 12 edges
10. `ADR-004: Inclusión de la Entidad Switch` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Descripción del caso de uso` --references--> `Laboratorio`  [INFERRED]
  RUP/01-requisitos/01-detalle-casos-uso/cambiarModo/README.md → daemon/domain/Laboratorio.js
- `Información del caso de uso` --references--> `Puesto`  [INFERRED]
  RUP/01-requisitos/01-detalle-casos-uso/asignarPuestosASwitch/README.md → daemon/domain/Puesto.js
- `Información del caso de uso` --references--> `Switch`  [INFERRED]
  RUP/01-requisitos/01-detalle-casos-uso/asignarPuestosASwitch/README.md → daemon/domain/Switch.js
- `Referencias` --references--> `Host`  [INFERRED]
  RUP/01-requisitos/01-detalle-casos-uso/asignarPuestosASwitch/README.md → daemon/domain/Host.js
- `Referencias` --references--> `Laboratorio`  [INFERRED]
  RUP/01-requisitos/01-detalle-casos-uso/asignarPuestosASwitch/README.md → daemon/domain/Laboratorio.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Configuration and Topology Use Cases** — cu_asignarpuestosaswitch, cu_dimensionarcuadricula, cu_cambiarmodo [EXTRACTED 1.00]
- **Core Domain Entities** — domain_laboratorio, domain_puesto, domain_host, domain_switch [EXTRACTED 1.00]
- **Laboratory Monitoring and Configuration Flow** — images_01_requisitos_01_detalle_casos_uso_consultar_detalle_puesto_especificacion_consultar_detalle_puesto, images_01_requisitos_01_detalle_casos_uso_consultar_estado_puestos_especificacion_consultar_estado_puestos, images_01_requisitos_01_detalle_casos_uso_dimensionar_cuadricula_especificacion_dimensionar_cuadricula [EXTRACTED 1.00]
- **Rationale for Discarding OOB/Agent-based Shutdown** — ref_02_wijekoon_2011, ref_09_agarwal_2009, ref_10_ruan_2014, opsys_zero_touch_architecture [EXTRACTED 1.00]
- **Observability and Diagnosis Flow** — domain_estado_evaluadorestado, cu_consultarestadopuestos, cu_consultardetallepuesto [INFERRED 0.85]

## Communities (45 total, 25 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.03
Nodes (63): OpSys - Supervisión de Laboratorio, btnAplicarCuadricula, btnAplicarRangoSwitch, btnAsignarSwitch, btnAsignarSwitchText, btnClearSearch, btnDimensionarLabel, btnDimensionarToggle (+55 more)

### Community 1 - "Accion"
Cohesion: 0.07
Nodes (8): Accion, EstadoDesconectado, EstadoFalloLogico, EstadoOperativo, EstadoRedAislada, EstadoSinTelemetria, EstadoStandby, EvaluadorEstado

### Community 2 - "test-domain.js"
Cohesion: 0.06
Nodes (28): SseBroadcaster, ADR-0004, assert, desalojado, estAislada, estCableadoDown, estCableadoUp, estDhcp (+20 more)

### Community 3 - "daemon.js"
Cohesion: 0.05
Nodes (15): http, laboratorioController, laboratorioService, meshAdapter, pollTimer, powerController, router, server (+7 more)

### Community 5 - "telemetry-daemon"
Cohesion: 0.07
Nodes (29): context, dockerfile, networks, tfg-net, services, telemetry-daemon, virtual-switch, web (+21 more)

### Community 6 - "SnmpSwitchProvider"
Cohesion: 0.13
Nodes (6): NetworkProvider, SimulatedSwitchProvider, snmp, SnmpSwitchProvider, assert, testSnmpSwitchProvider()

### Community 7 - "procesarDatosLaboratorio"
Cohesion: 0.27
Nodes (11): actualizarBotonesModo(), actualizarSelectRangeOptions(), actualizarVista(), aplicarAjustePantalla(), aplicarDimensionesCuadricula(), cambiarModo(), cerrarModalDimensionar(), client (+3 more)

### Community 11 - "2. Auditoría Física de Enlace por Switch (SNMP Directo)"
Cohesion: 0.25
Nodes (7): 1. Matriz de Puestos de Trabajo (Puestos 01 a 56), 2.1 Switch `10.10.136.13` -- Switch Principal Docente (Dell/Cisco Managed Rack), 2.2 Switch `10.10.136.39` -- Switch Auxiliar Laboratorio (.39), 2.3 Switch `10.10.136.42` -- Switch Auxiliar Laboratorio (.42), 2. Auditoría Física de Enlace por Switch (SNMP Directo), 3. Conclusiones y Diagnóstico Técnico, Matriz de Telemetría: Puestos, Equipos, Switches y Velocidades de Enlace

### Community 12 - "auto-compile-plantuml.py"
Cohesion: 0.17
Nodes (14): append3bytes(), compile_puml_to_svg(), encode6bit(), get_target_svg_paths(), main(), plantuml_encode(), main(), should_update_graph() (+6 more)

### Community 13 - "Host"
Cohesion: 0.29
Nodes (7): Guía de Contexto, Arquitectura y Reglas del Proyecto, EvaluadorEstado, Host, Laboratorio, Puesto, Switch, Arquitectura de Telemetría SNMP y Observabilidad Física

### Community 14 - "ADR-004: Inclusión de la Entidad Switch"
Cohesion: 0.12
Nodes (28): Administrador, DOC-MS-02: Wake on LAN behavior in Windows 10/11, ADR-001: Justificación y Acotamiento de Acciones, ADR-002: Acotamiento de Control de Energía, ADR-003: Arquitectura de Remediación de Red, ADR-004: Inclusión de la Entidad Switch, Dossier Técnico DOC-01: Windows Internals, Diagnóstico DHCP y Wake-on-LAN, Matriz de Extracción y Evaluación: Control de Energía y Apagado (+20 more)

### Community 15 - "package.json"
Cohesion: 0.20
Nodes (10): dependencies, net-snmp@^3.29.2, description, main, name, scripts, start, test (+2 more)

### Community 16 - "Información del caso de uso"
Cohesion: 0.40
Nodes (5): Descripción del caso de uso, Información del caso de uso, Postcondiciones, Precondiciones, Referencias

### Community 22 - "Auditor RUP de Élite: Actores, Casos de Uso y Prototipos"
Cohesion: 0.13
Nodes (14): 1. El Núcleo Metodológico: La Rúbrica de Requisitos (30% - 40% - 30%), 2. Los Actores: Reglas y Distinciones Críticas, 3. Diagramas de Contexto (Context Navigation Automaton), 4. Especificación Formal de Casos de Uso (`especificacion.puml`), 5. Gramática Estricta de Verbos (Indicaciones vs. Contraindicaciones), 6. Prototipado de Interfaz de Usuario (`wireframes.puml` con PlantUML Salt), 7. Estructura de Directorios y Política de Espejo, 8. Procedimiento de Auditoría Paso a Paso (+6 more)

### Community 33 - "Estado"
Cohesion: 0.29
Nodes (4): Estado, Descripción del caso de uso, Información del caso de uso, Referencias

### Community 40 - "Auditoría de Red SNMPwalk: Estado de Bocas (UP/DOWN) y Velocidades de Negociación"
Cohesion: 0.33
Nodes (5): Auditoría de Red SNMPwalk: Estado de Bocas (UP/DOWN) y Velocidades de Negociación, Resumen Consolidado de Velocidades Negociadas, Switch `10.10.136.13` -- Switch Principal Rack (sw13), Switch `10.10.136.39` -- Switch Auxiliar Laboratorio (sw39), Switch `10.10.136.42` -- Switch Auxiliar Laboratorio (sw42)

### Community 41 - "Referencias"
Cohesion: 0.33
Nodes (6): Descripción del caso de uso, Especificación, Información del caso de uso, OpSys > cambiarModo(), Prototipo (Wireframe), Referencias

### Community 42 - "Referencias"
Cohesion: 0.33
Nodes (6): Descripción del caso de uso, Especificación, Información del caso de uso, OpSys > consultarDetallePuesto(), Prototipo (Wireframe), Referencias

### Community 43 - "OpSys > dimensionarCuadricula"
Cohesion: 0.33
Nodes (6): Descripción del caso de uso, Especificación, Información del caso de uso, OpSys > dimensionarCuadricula(), Prototipo (Wireframe), Referencias

### Community 44 - "confirmarAsignarSwitch"
Cohesion: 0.40
Nodes (4): abrirModalAsignarSwitch(), actualizarBotonesAsignacion(), cerrarModalAsignarSwitch(), confirmarAsignarSwitch()

## Knowledge Gaps
- **17 isolated node(s):** `ADR-0004`, `OpSys - Supervisión de Laboratorio`, `Modal: Detalle de Puesto`, `Button: Consultar estado`, `Button: Dimensionar` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 284 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Puesto` connect `Puesto` to `Estado`, `test-domain.js`, `Referencias`, `Referencias`, `OpSys > dimensionarCuadricula`, `Información del caso de uso`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `Laboratorio` (e.g. with `Referencias` and `Descripción del caso de uso`) actually correct?**
  _`Laboratorio` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ADR-0004`, `OpSys - Supervisión de Laboratorio`, `Modal: Detalle de Puesto` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03076923076923077 - nodes in this community are weakly interconnected._
- **Why does `Laboratorio` connect `Laboratorio` to `Estado`, `test-domain.js`, `Referencias`, `Referencias`, `OpSys > dimensionarCuadricula`, `Información del caso de uso`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `Puesto` (e.g. with `Información del caso de uso` and `Referencias`) actually correct?**
  _`Puesto` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `Accion` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._