<div align=right>

<sub>[Al inicio](/README.md) / [Modelo del dominio](/RUP/00-modelo-del-dominio/README.md) / [Requisitos](/RUP/01-requisitos/) / Análisis / Diseño / Desarrollo</sub><br><sub>OpSys -- Plataforma de supervisión y observabilidad en tiempo real de puestos de trabajo en laboratorios docentes compartidos.</sub>

</div>

# OpSys

Página concentradora de los artefactos RUP de OpSys: desde aquí se llega a cada fase y a la trazabilidad completa por caso de uso.

## Artefactos concentradores

<div align=center>

|Modelo del dominio|Requisitos|Análisis|Diseño|Desarrollo|
|:-:|:-:|:-:|:-:|:-:|
|[Modelo del dominio](/RUP/00-modelo-del-dominio/README.md)|[Requisitos](/RUP/01-requisitos/)|Clases de análisis|Clases de diseño|Desarrollo|
||||Diagrama de entidad-relación||
||||Diccionario de datos||

</div>

## Fases

<div align=center>

|Fase|Índice|Casos de uso con ficha|
|-|-|:-:|
|Requisitos|[Requisitos](/RUP/01-requisitos/)|Pendiente|
|Análisis|Análisis / casos de uso|Pendiente|
|Diseño|Diseño / casos de uso|Pendiente|
|Desarrollo|Desarrollo|Pendiente|

</div>

---

## Registros de Decisiones Arquitectónicas (ADR)

Las justificaciones de diseño, delimitación de alcance y acotamientos metodológicos se registran en [`docs/`](docs/):

* **[ADR-001: Justificación y Acotamiento de Acciones, Trazabilidad y Rol Administrador](docs/ADR-001-acotamiento-acciones-trazabilidad.md)**: Justifica el retiro de la clase `Accion` del modelo de clases (desacoplamiento de UI), el acotamiento del rol `Administrador` (confinado a Actor de Casos de Uso por YAGNI) y el patrón transaccional alternativo en caso de requerir auditoría.
* **[ADR-002: Acotamiento de Control de Energía (WoL vs. Apagado), Realidad Hardware Dell y Exclusión Tecnológica](docs/ADR-002-acotamiento-control-energia-hardware.md)**: Justifica el retiro del apagado remoto del panel por imposibilidad física de garantizarlo sin Intel AMT (Dell SKU 631-ADPL), la persistencia de Windows y bifurcación condicional de encendido, y la exclusión de entidades tecnológicas (`Switch` y `Toma`).

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
│   └── 01-requisitos/                  # Casos de uso y actores (Próxima fase)
├── docs/                               # Decisiones Arquitectónicas (ADR)
│   ├── ADR-001-acotamiento-acciones-trazabilidad.md
│   └── ADR-002-acotamiento-control-energia-hardware.md
├── images/                             # Estructura espejo de gráficos vectoriales SVG
│   ├── 00-modelo-del-dominio/          # SVGs compilados del Modelo de Dominio
│   └── 01-requisitos/                  # SVGs de la fase de requisitos
├── daemon/                             # Backend de telemetría y API REST (Node.js DDD)
├── src/                                # Frontend web reactivo (HTML5, CSS3, JS Vanilla, SSE)
├── scripts/                            # Scripts de pruebas y validación de dominio
├── docker-compose.yml                  # Orquestación de entorno (daemon, switch virtual, web)
├── AGENTS.md                           # Especificación técnica, límites hardware y matriz determinista
└── AGENTS-RUP.md                       # Guía metodológica RUP y reglas de modelado
```
