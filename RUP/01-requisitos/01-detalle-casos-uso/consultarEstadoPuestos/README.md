<div align=right>

<sub>[Al inicio](/README.md) / [Modelo del dominio](/RUP/00-modelo-del-dominio/README.md) / [Requisitos](/RUP/01-requisitos/README.md) / Análisis / Diseño / Desarrollo</sub><br><sub>OpSys -- Plataforma de supervisión y observabilidad en tiempo real de puestos de trabajo en laboratorios docentes compartidos.</sub>

</div>

# OpSys > consultarEstadoPuestos()

<div align=center>

|🏠️|DdC|Detalle|Análisis|Diseño|Desarrollo|Pruebas|
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
|[Inicio](/README.md)|[DdC](/RUP/01-requisitos/00-actores-casos-uso/README.md#2-diagrama-de-contexto)|[Detalle](README.md)|Pendiente|Pendiente|Pendiente|Pendiente|

</div>

### Especificación

<div align="center">
  <img src="../../../../images/01-requisitos/01-detalle-casos-uso/consultarEstadoPuestos/especificacion.svg" alt="Especificación consultarEstadoPuestos" />
  <p><em>Código fuente: <a href="especificacion.puml">especificacion.puml</a></em></p>
</div>

### Prototipo (Wireframe)

<div align="center">
  <img src="../../../../images/01-requisitos/01-detalle-casos-uso/consultarEstadoPuestos/wireframes.svg" alt="Wireframe consultarEstadoPuestos" />
  <p><em>Código fuente: <a href="wireframes.puml">wireframes.puml</a></em></p>
</div>

## Información del caso de uso

| Atributo | Valor |
| :--- | :--- |
| **Actor** | Administrador |
| **Objetivo** | Consultar en tiempo real la cuadrícula física de puestos con su estado de conexión y las métricas consolidadas del laboratorio |
| **Tipo** | Primario, esencial |
| **Nivel** | Objetivo de usuario (User-Goal Level) |

### Descripción del caso de uso

El Administrador accede al cuadro de mando principal del laboratorio (`SISTEMA_DISPONIBLE`) para supervisar la salud de los puestos y el aula en tiempo real:

1. **Cuadrícula espacial con pasillo central:** El sistema presenta los puestos organizados por filas y columnas, divididos en dos hileras simétricas (izquierda y derecha) separadas físicamente por un pasillo central.
2. **Estado semafórico de cada puesto:** Cada mesa de trabajo presenta su identificador de equipo y su indicador de color correspondiente (`OPERATIVO`, `STANDBY`, `FALLO_LOGICO`, `RED_AISLADA`, `DESCONECTADO`).
3. **Selección directa de puestos (Multi-selección sin checkbox):** El usuario puede seleccionar o deseleccionar puestos individuales haciendo clic directamente sobre cualquier tarjeta de la cuadrícula, adoptando un resaltado visual moderno. Esto permite marcar múltiples puestos para operaciones conjuntas de asignación de red mediante el botón superior `[ Asignar a switch ]`, el cual despliega un diálogo modal para elegir el conmutador de destino (`Switch Docente` o `Switch de Prácticas`).
4. **Cabecera y métricas globales:** La barra superior presenta el título del sistema, el botón interactivo de conmutación de modo operativo (`[ 🎓 Modo Clase ]`) inmediatamente debajo del título, las métricas cuantitativas consolidadas (total y puestos por estado) y los accesos de asignación a switch (`[ Asignar a switch ]`), dimensionamiento (`[Dimensionar: 6x10]`), consulta de estado y cierre de sesión alineados a la derecha.

### Referencias
* **Diagrama de contexto de Admin:** `SISTEMA_DISPONIBLE --> SISTEMA_DISPONIBLE : consultarEstadoPuestos()`
* **Modelo del dominio:** `Laboratorio`, `Puesto`, `Host`, `Switch`, `Estado`
* **Decisiones arquitectónicas:**
  * [ADR-001: Justificación y Acotamiento de Acciones, Trazabilidad y Rol Administrador](../../../../docs/adr/ADR-001-acotamiento-acciones-trazabilidad.md)
  * [ADR-004: Inclusión de la Entidad Switch, Disposición Espacial de Puestos en Cuadrícula y Aulas Híbridas](../../../../docs/adr/ADR-004-inclusion-switch-asignacion-distribuciones.md)
