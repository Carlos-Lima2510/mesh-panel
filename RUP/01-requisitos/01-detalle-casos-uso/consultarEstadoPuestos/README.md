<div align=right>

<sub>[Al inicio](/README.md) / [Modelo del dominio](/RUP/00-modelo-del-dominio/README.md) / [Requisitos](/RUP/01-requisitos/README.md) / [Detalle de Casos de Uso](../README.md) / Análisis / Diseño / Desarrollo</sub><br><sub>OpSys -- Plataforma de supervisión y observabilidad en tiempo real de puestos de trabajo en laboratorios docentes compartidos.</sub>

</div>

# OpSys > consultarEstadoPuestos()

<div align=center>

|🏠️|DdC|Detalle|Análisis|Diseño|Desarrollo|Pruebas|
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
|[Inicio](/README.md)|[DdC](/RUP/01-requisitos/00-actores-casos-uso/README.md#2-diagrama-de-contexto)|[Detalle](../README.md)|Pendiente|Pendiente|Pendiente|Pendiente|

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
| **Objetivo** | Consultar en tiempo real la cuadrícula física de puestos con su estado de conexión, telemetría física y lógica, y las métricas consolidadas del laboratorio |
| **Tipo** | Primario, esencial |
| **Nivel** | Objetivo de usuario (User-Goal Level) |

### Descripción del caso de uso

El Administrador accede al cuadro de mando principal del laboratorio (`SISTEMA_DISPONIBLE`) para supervisar la salud de los puestos y el aula en tiempo real:

1. **Cuadrícula espacial con pasillo central:** El sistema presenta los puestos organizados por filas y columnas, divididos en dos hileras simétricas (izquierda y derecha) separadas físicamente por un pasillo central (`=== PASILLO CENTRAL ===` / `║  Pasillo  ║`), reflejando la distribución real de las mesas del laboratorio.
2. **Estructura ampliada de cada tarjeta de puesto:** Cada mesa de trabajo se representa mediante una tarjeta de alta visibilidad que concentra la telemetría esencial en cinco datos clave:
   - **Nombre del puesto e identificador físico:** Indicador semafórico del diagnóstico determinista (`🟢` Operativo, `⚫` Standby, `🟡` Red Aislada / Fallo Lógico, `🟠` Desconectado), nombre lógico del host (`PC-01`) y número de slot físico (`#01`).
   - **Dirección IP:** Dirección IPv4 en red (`IP: 10.10.136.101`) o indicación vacía (`IP: ---`) en equipos apagados o sin arrendamiento DHCP.
   - **Puerto del switch físico:** Boca física en el switch y estado de enlace eléctrico de Capa 1 (`Port: port1 (UP)` o `Port: port5 (DOWN)`).
   - **Switch asignado:** Conmutador al que pertenece el puesto (`Switch: Universitario` o `Switch: Prácticas`).
   - **Disponibilidad del agente (con icono de Windows):** Conexión viva de Capa 7 a nivel del sistema operativo (`🪟 Agente: En línea` o `🪟 Agente: Desconectado`).
3. **Ausencia deliberada de descripción de estado en la tarjeta:** Para optimizar el espacio visual de supervisión panorámica y evitar sobrecarga cognitiva, la tarjeta prescinde de leyendas textuales largas de estado o botones de acción en su pie; dicha información y controles se reservan para la vista de detalle al interactuar con el puesto.
4. **Selección interactiva de tarjeta completa:** Se prescinde de casillas de verificación individuales (*checkbox*), haciendo que toda la tarjeta sea seleccionable directamente mediante clic (representada con resaltado de fondo azul `<back:#bfdbfe>`). Esto permite marcar puestos individuales o en bloque para operaciones masivas mediante el botón superior `[ Asignar a switch ]` (modal para conmutación rápida entre `Switch Universitario` y `Switch de Prácticas`).
5. **Cabecera y métricas globales:** La barra superior presenta el título del sistema (`OpSys - Supervisión de Laboratorio`), el selector de modo operativo contextual (`[ 🎓 Modo Clase ]` / `[ 🧪 Modo Práctica ]`) a la izquierda, los botones de acción global (`[ Asignar a switch ]`, `[Dimensionar: 6x10]`, `[Consultar estado]`, `[🚪 Cerrar sesión]`) y la barra de métricas consolidadas en tiempo real (Total, Operativos, Standby, Prácticas/DHCP y Desconectados).

### Referencias
* **Diagrama de contexto de Admin:** `SISTEMA_DISPONIBLE --> SISTEMA_DISPONIBLE : consultarEstadoPuestos()`
* **Modelo del dominio:** `Laboratorio`, `Puesto`, `Host`, `Switch`, `Estado`
* **Decisiones arquitectónicas:**
  * [ADR-001: Justificación y Acotamiento de Acciones, Trazabilidad y Rol Administrador](../../../../docs/adr/ADR-001-acotamiento-acciones-trazabilidad.md)
  * [ADR-004: Inclusión de la Entidad Switch, Disposición Espacial de Puestos en Cuadrícula y Aulas Híbridas](../../../../docs/adr/ADR-004-inclusion-switch-asignacion-distribuciones.md)
