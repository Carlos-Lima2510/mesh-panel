<div align=right>

|[![](https://img.shields.io/badge/-Inicio-003366?style=flat&logo=github&logoColor=white)](/README.md) [![](https://img.shields.io/badge/-RUP-003366?style=flat&logo=Elsevier&logoColor=white)](/RUP/README.md) [![](https://img.shields.io/badge/-Modelo_del_dominio-003366?style=flat&logo=diagramsdotnet&logoColor=white)](/RUP/00-modelo-del-dominio/README.md) [![](https://img.shields.io/badge/-Requisitos-003366?style=flat&logo=crewunited&logoColor=white)](/RUP/01-requisitos/README.md) [![](https://img.shields.io/badge/-Detalle_Casos_de_Uso-003366?style=flat&logo=buffer&logoColor=white)](/RUP/01-requisitos/01-detalle-casos-uso/README.md) [![](https://img.shields.io/badge/-Matriz_Documental-003366?style=flat&logo=gitbook&logoColor=white)](/docs/matriz-documental-general.md) [![](https://img.shields.io/badge/-Decisiones_ADR-003366?style=flat&logo=gitbook&logoColor=white)](/docs/adr/README.md)
|-:

</div>

# Proceso Unificado RUP · OpSys

Página concentradora de las disciplinas, fases y artefactos del sistema **OpSys** (Plataforma de Supervisión y Observabilidad en Tiempo Real de Puestos de Trabajo en Laboratorios Docentes Compartidos), siguiendo el marco metodológico de **Rational Unified Process (RUP)** y los estándares de **Ingeniería del Software (IdSw)**.

## Información del proceso
* **Proyecto:** OpSys · Supervisión de Laboratorios
* **Asignatura:** Ingeniería del Software I · UNEATLANTICO
* **Metodología:** RUP iterativo e incremental con trazabilidad bidireccional

---

## 1. Disciplinas y Fases RUP

<div align="center">

| Fase / Disciplina | Artefacto Concentrador | Contenido Clave | Estado Actual |
| :--- | :--- | :--- | :---: |
| **00 · Modelo del Dominio** | [00-modelo-del-dominio/](/RUP/00-modelo-del-dominio/README.md) | Diagrama de clases del negocio, diagrama de objetos y autómatas de estados. | Validado |
| **01 · Requisitos** | [01-requisitos/](/RUP/01-requisitos/README.md) | Modelo de actores, catálogo de 8 casos de uso, diagrama de contexto, especificaciones formales y prototipos Salt. | En curso |
| **02 · Análisis** | *02-analisis/* | Clases de análisis (*boundary, control, entity*) y diagramas de colaboración. | Planificado |
| **03 · Diseño** | *03-diseno/* | Arquitectura del software (DDD hexagonal), diagramas de secuencia, diseño de clases y persistencia. | Planificado |
| **04 · Desarrollo / Implementación** | *daemon/ & src/* | Backend Node.js en streaming SSE, telemetría SNMP v2c, MeshCentral wrapper y panel web reactivo. | En desarrollo |

</div>

---

## 2. Trazabilidad de Casos de Uso

La trazabilidad completa caso por caso entre actores, diagramas de contexto, especificaciones formales, prototipos Salt y decisiones de arquitectura se encuentra consolidada en:
* **[01-requisitos/01-detalle-casos-uso/](/RUP/01-requisitos/01-detalle-casos-uso/README.md)**
