<div align=right>

<sub>[Al inicio](/README.md) / [Modelo del dominio](/RUP/00-modelo-del-dominio/README.md) / [Requisitos](/RUP/01-requisitos/README.md) / Análisis / Diseño / Desarrollo</sub><br><sub>OpSys -- Plataforma de supervisión y observabilidad en tiempo real de puestos de trabajo en laboratorios docentes compartidos.</sub>

</div>

# OpSys

Página concentradora de los artefactos RUP de OpSys: desde aquí se llega a cada fase y a la trazabilidad completa por caso de uso.

## Artefactos concentradores

<div align=center>

|Modelo del dominio|Requisitos|Análisis|Diseño|Desarrollo|
|:-:|:-:|:-:|:-:|:-:|
|[Modelo del dominio](/RUP/00-modelo-del-dominio/README.md)|[Requisitos](/RUP/01-requisitos/README.md)|Clases de análisis|Clases de diseño|Desarrollo|
||||Diagrama de entidad-relación||
||||Diccionario de datos||

</div>

## Fases

<div align=center>

|Fase|Índice|Casos de uso con ficha|
|-|-|:-:|
|Requisitos|[Requisitos](/RUP/01-requisitos/README.md)|Actores y 8 Casos de Uso definidos|
|Análisis|Análisis / casos de uso|Pendiente|
|Diseño|Diseño / casos de uso|Pendiente|
|Desarrollo|Desarrollo|Pendiente|

</div>

---

## Registros de Decisiones Arquitectónicas (ADR)

Las justificaciones de diseño, delimitación de alcance y acotamientos metodológicos se registran en [`docs/`](docs/):

* **[ADR-001: Justificación y Acotamiento de Acciones, Trazabilidad y Rol Administrador](docs/adr/ADR-001-acotamiento-acciones-trazabilidad.md)**: Justifica el retiro de la clase `Accion` del modelo de clases (desacoplamiento de UI), el acotamiento del rol `Administrador` (confinado a Actor de Casos de Uso por YAGNI) y el patrón transaccional alternativo en caso de requerir auditoría.
* **[ADR-002: Acotamiento de Control de Energía (WoL vs. Apagado), Realidad Hardware Dell y Exclusión Tecnológica](docs/adr/ADR-002-acotamiento-control-energia-hardware.md)**: Justifica el retiro del apagado remoto del panel por imposibilidad física de garantizarlo sin Intel AMT (Dell SKU 631-ADPL), la persistencia de Windows y bifurcación condicional de encendido, y la exclusión de entidades tecnológicas (`Switch` y `Toma`).
* **[ADR-003: Arquitectura de Remediación de Red (GPO Startup con Rollback vs. Bajo Demanda) y Exclusión del Switch](docs/adr/ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md)**: Justifica la inviabilidad de remediación remota bajo demanda por destino compartido (*fate sharing*), el descarte de scripts de apagado ante apagados forzados en torre y la adopción del script de inicio con rollback transaccional para proteger prácticas de alumnos.
* **[ADR-004: Inclusión de la Entidad Switch, Disposición Espacial de Puestos en Cuadrícula y Aulas Híbridas](docs/adr/ADR-004-inclusion-switch-asignacion-distribuciones.md)**: Supera la exclusión de ADR-003 incorporando la entidad `Switch` en el dominio, definiendo la cuadrícula dinámica ($F \times C$) con pasillo central y permitiendo la asignación granular de puestos para soporte de aulas híbridas.
* **[Matriz Documental General del Proyecto](docs/matriz-documental-general.md)**: Marco general de revisión sistemática y base documental de literatura técnica (2016-2026) que fundamenta la arquitectura de OpSys.
  * **[Matriz Específica: Control de Energía y Apagado](docs/matrices-documentales/matriz-referencias-apagado.md)**: Evaluación sistemática de literatura sobre mecanismos de control energético con agente, fuera de banda (Intel AMT) y sin agente.
  * **[Matriz Específica: Plataforma Microsoft y Windows Internals](docs/matrices-documentales/matriz-referencias-plataforma-microsoft.md)**: Evaluación de diagnósticos DHCP y comportamiento de WoL / Fast Startup en Windows 10/11.
  * **[Dossier Técnico: Plataforma Microsoft Learn](docs/doc/DOC-01-microsoft-windows-internals-dhcp-wol.md)**: Análisis técnico exhaustivo de eventos del sistema, comandos PowerShell y gestión de energía NDIS.

---

## Estructura del Repositorio

```text
mesh-panel/
├── RUP/                                # Artefactos del ciclo de vida RUP
│   ├── 00-modelo-del-dominio/          # Modelo del Dominio (Fase Inicio)
│   │   ├── README.md                   # Índice visual con diagramas incrustados
│   │   ├── diagrama-clases.puml        # Diagrama de Clases estructural
│   │   ├── diagrama-objetos.puml       # Instancia canónica de validación
│   │   └── diagrama-estados/           # Autómatas de estados (Host y Laboratorio)
│   └── 01-requisitos/                  # Requisitos, casos de uso y diagrama de contexto
│       ├── README.md                   # Catálogo de actores, casos de uso y contexto
│       ├── actoresCasosUsoAdmin.puml   # Diagrama de Casos de Uso del Administrador
│       └── diagrama-de-contexto.puml   # Diagrama de Contexto del Administrador
├── docs/                               # Documentación de Arquitectura, Matrices y Manuales
│   ├── adr/                            # Registros de Decisiones Arquitectónicas (ADR)
│   │   ├── ADR-001-acotamiento-acciones-trazabilidad.md
│   │   ├── ADR-002-acotamiento-control-energia-hardware.md
│   │   ├── ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md
│   │   └── ADR-004-inclusion-switch-asignacion-distribuciones.md
│   ├── doc/                            # Dossiers técnicos y manuales de fabricante (DOC)
│   │   └── DOC-01-microsoft-windows-internals-dhcp-wol.md
│   ├── matriz-documental-general.md    # Matriz documental general del proyecto
│   └── matrices-documentales/          # Matrices documentales específicas
│       ├── matriz-referencias-apagado.md
│       └── matriz-referencias-plataforma-microsoft.md
├── images/                             # Estructura espejo de gráficos vectoriales SVG
│   ├── 00-modelo-del-dominio/          # SVGs compilados del Modelo de Dominio
│   └── 01-requisitos/                  # SVGs de requisitos (Casos de Uso y Contexto)
├── daemon/                             # Backend de telemetría y API REST (Node.js DDD)
├── src/                                # Frontend web reactivo (HTML5, CSS3, JS Vanilla, SSE)
├── scripts/                            # Scripts de pruebas y validación de dominio
├── docker-compose.yml                  # Orquestación de entorno (daemon, switch virtual, web)
├── AGENTS.md                           # Especificación técnica, límites hardware y matriz determinista
└── AGENTS-RUP.md                       # Guía metodológica RUP y reglas de modelado
```
