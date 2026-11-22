<div align=right>

|[![](https://img.shields.io/badge/-Inicio-24292e?style=flat&logo=github&logoColor=white)](/README.md) [![](https://img.shields.io/badge/-Requisitos-24292e?style=flat&logo=crewunited&logoColor=white)](/RUP/01-requisitos/README.md) [![](https://img.shields.io/badge/-Diagrama_de_Contexto-24292e?style=flat&logo=diagramsdotnet&logoColor=white)](/RUP/01-requisitos/00-actores-casos-uso/README.md#2-diagrama-de-contexto) [![](https://img.shields.io/badge/-Detalle_Casos_de_Uso-24292e?style=flat&logo=buffer&logoColor=white)](/RUP/01-requisitos/01-detalle-casos-uso/README.md)
|-:

</div>

# OpSys > cambiarModo()

### Especificación

<div align="center">
  <img src="../../../../images/01-requisitos/01-detalle-casos-uso/cambiarModo/especificacion.svg" alt="Especificación cambiarModo" />
  <p><em>Código fuente: <a href="especificacion.puml">especificacion.puml</a></em></p>
</div>

### Prototipo (Wireframe)

<div align="center">
  <img src="../../../../images/01-requisitos/01-detalle-casos-uso/cambiarModo/wireframes.svg" alt="Wireframe cambiarModo" />
  <p><em>Código fuente: <a href="wireframes.puml">wireframes.puml</a></em></p>
</div>

## Información del caso de uso

| Atributo | Valor |
| :--- | :--- |
| **Actor** | Administrador |
| **Objetivo** | Conmutar el contexto operacional global del laboratorio docente entre `Modo Clase` (operación habitual en red docente) y `Modo Práctica` (laboratorio en red aislada de prácticas) para re-evaluar inmediatamente en memoria los diagnósticos deterministas de todos los puestos de trabajo sin generar alarmas erróneas de cable desconectado |
| **Tipo** | Primario, esencial |
| **Nivel** | Objetivo de usuario (User-Goal Level) |

### Descripción del caso de uso

El caso de uso modela la conmutación del contexto operacional global del aula, permitiendo adaptar las reglas de clasificación determinista de la telemetría según la actividad docente que se esté desarrollando:

1. **Contextos Operacionales del Aula:**
   * **`Modo Clase` (Operación Normal):**
     * Todos los puestos deben encontrarse conectados al Switch Principal Docente (`sw-docente`).
     * Si la boca del switch pasa a `DOWN` y el agente no conecta, se diagnostica como una anomalía física $\rightarrow$ **`🟠 DESCONECTADO` (Cable Desconectado)**.
   * **`Modo Práctica` (Sesión de Redes / Switch Aislado):**
     * Se espera que los alumnos desconecten físicamente el cable de la roseta docente y lo conecten al switch secundario de prácticas (`sw-practicas`), el cual no dispone de gestión SNMP ni salida a Internet/MeshCentral.
     * Al detectar la boca del switch docente en `DOWN`, el sistema deduce el cambio legítimo de contexto $\rightarrow$ **`🟡 RED AISLADA` (En Red Aislada de Prácticas)**, evitando falsas alarmas de desconexión.

2. **Flujo Principal:**
   * El Administrador solicita cambiar el modo del aula interactuando con los botones del selector de modo en la cabecera superior del cuadro general (`[ 🎓 Modo Clase ]` o `[ 🧪 Modo Práctica ]`).
   * El Administrador introduce el modo seleccionado.
   * El sistema valida la solicitud y actualiza en memoria el atributo `modo` del aggregate root `Laboratorio`.
   * El aggregate root re-evalúa de forma instantánea en memoria (< 1 ms) la matriz determinista de todos los puestos de trabajo del aula sin requerir nuevas consultas de red externas.
   * El sistema presenta visualmente el botón seleccionado como activo (`.active-clase` o `.active-practica`), actualiza el estado semafórico de las tarjetas de puestos en la cuadrícula y recalcula los contadores consolidados de métricas.
   * El sistema difunde de forma reactiva el nuevo snapshot del laboratorio a todos los clientes conectados a través del canal Server-Sent Events (SSE).

3. **Flujos Alternativos y Excepcionales:**
   * **Fallo de comunicación con el daemon:** Si se produce un fallo de red o error HTTP al intentar contactar con el backend, el sistema presenta un aviso visual de advertencia y mantiene el modo operativo previo sin alteraciones.

### Referencias
* **Diagrama de contexto de Admin:** 
  * `SISTEMA_DISPONIBLE --> SISTEMA_DISPONIBLE : cambiarModo()`
* **Modelo del dominio:** `Laboratorio`, `Host`, `Puesto`, `Switch`, `Red`, `Estado`, `EvaluadorEstado`
* **Decisiones arquitectónicas:**
  * [ADR-001: Justificación y Acotamiento de Acciones, Trazabilidad y Rol Administrador](../../../../docs/adr/ADR-001-acotamiento-acciones-trazabilidad.md)
  * [ADR-003: Remediación GPO y Persistencia de Red](../../../../docs/adr/ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md)
  * [ADR-004: Inclusión de la Entidad Switch, Disposición Espacial de Puestos en Cuadrícula y Aulas Híbridas](../../../../docs/adr/ADR-004-inclusion-switch-asignacion-distribuciones.md)
