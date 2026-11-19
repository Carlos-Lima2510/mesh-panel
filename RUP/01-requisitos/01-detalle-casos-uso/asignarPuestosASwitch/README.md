<div align=right>

<sub>[Al inicio](/README.md) / [Modelo del dominio](/RUP/00-modelo-del-dominio/README.md) / [Requisitos](/RUP/01-requisitos/README.md) / [Detalle de Casos de Uso](../README.md) / Análisis / Diseño / Desarrollo</sub><br><sub>OpSys -- Plataforma de supervisión y observabilidad en tiempo real de puestos de trabajo en laboratorios docentes compartidos.</sub>

</div>

# OpSys > asignarPuestosASwitch()

<div align=center>

|🏠️|DdC|Detalle|Análisis|Diseño|Desarrollo|Pruebas|
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
|[Inicio](/README.md)|[DdC](/RUP/01-requisitos/00-actores-casos-uso/README.md#2-diagrama-de-contexto)|[Detalle](../README.md)|Pendiente|Pendiente|Pendiente|Pendiente|

</div>

### Especificación

<div align="center">
  <img src="../../../../images/01-requisitos/01-detalle-casos-uso/asignarPuestosASwitch/especificacion.svg" alt="Especificación asignarPuestosASwitch" />
  <p><em>Código fuente: <a href="especificacion.puml">especificacion.puml</a></em></p>
</div>

### Prototipo (Wireframe)

<div align="center">
  <img src="../../../../images/01-requisitos/01-detalle-casos-uso/asignarPuestosASwitch/wireframes.svg" alt="Wireframe asignarPuestosASwitch" />
  <p><em>Código fuente: <a href="wireframes.puml">wireframes.puml</a></em></p>
</div>

## Información del caso de uso

| Atributo | Valor |
| :--- | :--- |
| **Actor** | Administrador |
| **Objetivo** | Asignar o conmutar el conmutador de red (`Switch Docente` o `Switch de Prácticas`) vinculado a uno o varios puestos de trabajo físicos (`Puesto`), permitiendo la parametrización individualizada del contexto de supervisión (según ADR-004) para soportar dinámicas de aulas híbridas y garantizar la exactitud del diagnóstico determinista sin falsos positivos ni falsos negativos |
| **Tipo** | Primario, esencial |
| **Nivel** | Objetivo de usuario (User-Goal Level) |

### Descripción del caso de uso

El caso de uso permite al Administrador asociar puestos físicos a su conmutador correspondiente bajo dos modalidades operativas según el contexto de origen:

1. **Contexto 1: Asignación por lote desde el cuadro general (`SISTEMA_DISPONIBLE`)**:
   * **Precondición estricta:** El Administrador debe haber seleccionado previamente uno o varios puestos en la cuadrícula general del aula.
   * **Bloqueo si no hay selección:** Si no existe ningún puesto seleccionado previamente, el sistema **no permite acceder al modal** de asignación a switch, presentando un aviso de que se requiere seleccionar puestos antes de proceder.
   * **Apertura de modal minimalista:** Con puestos seleccionados, el Administrador solicita asignar a switch mediante el botón de la barra de acciones (`[ Asignar a switch ]`). El sistema presenta un **modal minimalista** enfocado exclusivamente en la elección del destino:
     * Resumen conciso de los puestos seleccionados (ej. `4 puestos (PC-02, PC-04, PC-11, PC-15)`).
     * Selector mutuamente excluyente entre uno u otro switch:
       * `(X) Switch Universitario (Red Docente)`
       * `( ) Switch de Prácticas (Red Aislada)`
   * **Confirmación:** El Administrador introduce su elección y solicita confirmar. El sistema actualiza en memoria los puestos reasignados y recalcula inmediatamente el diagnóstico determinista en la cuadrícula panorámica.

2. **Contexto 2: Asignación individual desde la ficha técnica de detalle (`PUESTO_ABIERTO`)**:
   * El Administrador inspecciona un puesto individual en su modal de detalle y solicita cambiar el conmutador asignado mediante el selector interactivo (`Switch asignado: [ Switch Universitario |v| ]`).
   * El Administrador introduce el conmutador de destino deseado (`Switch Universitario` o `Switch de Prácticas`) y solicita la confirmación.
   * El sistema actualiza el puesto en memoria, recalculando de inmediato el diagnóstico individualizado y presentando la ficha técnica actualizada.

3. **Flujos alternativos y excepcionales**:
   * **Sin puestos seleccionados:** Si el Administrador acciona la opción sin puestos marcados en cuadrícula, el sistema no abre el modal y presenta un aviso preventivo.
   * **Cancelación de la solicitud:** Si el Administrador cancela el diálogo (`[ Cancelar ]`), el sistema retorna al contexto de origen sin aplicar ninguna modificación.

### Referencias
* **Diagrama de contexto de Admin:** 
  * `SISTEMA_DISPONIBLE --> SISTEMA_DISPONIBLE : asignarPuestosASwitch()`
  * `PUESTO_ABIERTO --> PUESTO_ABIERTO : asignarPuestosASwitch()`
* **Modelo del dominio:** `Laboratorio`, `Puesto`, `Host`, `Switch`, `Red`, `Estado`, `EvaluadorEstado`
* **Decisiones arquitectónicas:**
  * [ADR-001: Justificación y Acotamiento de Acciones, Trazabilidad y Rol Administrador](../../../../docs/adr/ADR-001-acotamiento-acciones-trazabilidad.md)
  * [ADR-004: Inclusión de la Entidad Switch, Disposición Espacial de Puestos en Cuadrícula y Aulas Híbridas](../../../../docs/adr/ADR-004-inclusion-switch-asignacion-distribuciones.md)
