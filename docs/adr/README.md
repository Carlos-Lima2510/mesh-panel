<div align=right>

|[![](https://img.shields.io/badge/-Inicio-24292e?style=flat&logo=github&logoColor=white)](/README.md) [![](https://img.shields.io/badge/-RUP-24292e?style=flat&logo=Elsevier&logoColor=white)](/RUP/README.md) [![](https://img.shields.io/badge/-Modelo_del_dominio-24292e?style=flat&logo=diagramsdotnet&logoColor=white)](/RUP/00-modelo-del-dominio/README.md) [![](https://img.shields.io/badge/-Requisitos-24292e?style=flat&logo=crewunited&logoColor=white)](/RUP/01-requisitos/README.md) [![](https://img.shields.io/badge/-Detalle_Casos_de_Uso-24292e?style=flat&logo=buffer&logoColor=white)](/RUP/01-requisitos/01-detalle-casos-uso/README.md) [![](https://img.shields.io/badge/-Matriz_Documental-24292e?style=flat&logo=gitbook&logoColor=white)](/docs/matriz-documental-general.md) [![](https://img.shields.io/badge/-Decisiones_ADR-24292e?style=flat&logo=gitbook&logoColor=white)](/docs/adr/README.md)
|-:

</div>

# Registros de Decisiones Arquitectónicas (ADR)

Índice centralizador de los Registros de Decisiones Arquitectónicas (*Architectural Decision Records*) del proyecto **OpSys**, documentando el contexto, problema, alternativas consideradas, justificación teórica y consecuencias metodológicas.

---

## Catálogo de Decisiones

| Identificador | Título de la Decisión | Fase / Ámbito | Estado | Enlace al Documento |
| :---: | :--- | :---: | :---: | :--- |
| **ADR-001** | Justificación y Acotamiento de Acciones, Trazabilidad y Rol Administrador | RUP Inicio / Dominio | **Aprobado** | [ADR-001-acotamiento-acciones-trazabilidad.md](ADR-001-acotamiento-acciones-trazabilidad.md) |
| **ADR-002** | Acotamiento de Control de Energía (WoL vs. Apagado), Realidad Hardware Dell y Exclusión Tecnológica | RUP Inicio / Dominio | **Aprobado** | [ADR-002-acotamiento-control-energia-hardware.md](ADR-002-acotamiento-control-energia-hardware.md) |
| **ADR-003** | Arquitectura de Remediación de Red (GPO Startup con Rollback vs. Bajo Demanda) y Exclusión del Switch | RUP Inicio / Requisitos | **Superado por ADR-004** | [ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md](ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md) |
| **ADR-004** | Inclusión de la Entidad Switch, Disposición Espacial de Puestos en Cuadrícula y Aulas Híbridas | RUP Inicio / Dominio | **Aprobado** | [ADR-004-inclusion-switch-asignacion-distribuciones.md](ADR-004-inclusion-switch-asignacion-distribuciones.md) |

---

## Trazabilidad con la Base Científica

Todas las decisiones arquitectónicas están fundamentadas empíricamente y contrastadas con la literatura técnica y estándares en la **[Matriz Documental General](../matriz-documental-general.md)**.
