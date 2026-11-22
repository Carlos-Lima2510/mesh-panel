<div align=right>

<sub>[Al inicio](/README.md) / [Modelo del dominio](/RUP/00-modelo-del-dominio/README.md) / [Requisitos](/RUP/01-requisitos/README.md) / [Actores y Contexto](/RUP/01-requisitos/00-actores-casos-uso/README.md) / Análisis / Diseño / Desarrollo</sub><br><sub>OpSys -- Plataforma de supervisión y observabilidad en tiempo real de puestos de trabajo en laboratorios docentes compartidos.</sub>

</div>

# OpSys - Detalle y Prototipado de Casos de Uso

Índice concentrador de las especificaciones detalladas y prototipos de interfaz de usuario para cada uno de los casos de uso del sistema.

<div align=center>

|🏠️|DdC|Detalle|Análisis|Diseño|Desarrollo|Pruebas|
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
|[Inicio](/README.md)|[DdC](/RUP/01-requisitos/00-actores-casos-uso/README.md#2-diagrama-de-contexto)|[Detalle](README.md)|Pendiente|Pendiente|Pendiente|Pendiente|

</div>

---

## 1. Convenciones de Modelado de Detalle

Cada caso de uso se documenta en su propia carpeta bajo una estructura formal unificada:
1. **Especificación formal (`especificacion.puml`):** Diagrama de estados que modela el ciclo de ejecución interactiva entre el Actor y el Sistema (con nodos `<<choice>>` para flujos alternativos y excepcionales, cumpliendo la gramática estricta de verbos: `solicita` / `introduce` para el actor; `presenta` / `permite solicitar` / `permite introducir` para el sistema).
2. **Prototipo de Interfaz (`wireframes.puml`):** Maqueta visual navegable implementada en PlantUML Salt que plasma los controles, datos y disposición física en la interfaz.
3. **Ficha descriptiva (`README.md`):** Tabla con atributos de objetivo, actor, tipo y nivel, descripción funcional y matriz de trazabilidad con el Diagrama de Contexto, el Modelo de Dominio y los ADRs.

> 📘 **Guía y Plantillas:** Para consultar la especificación completa de la gramática de verbos, convenciones de wireframes Salt, comandos de compilación SVG y plantillas base, véase el manual normativo: **[FORMATO-DETALLE.md](FORMATO-DETALLE.md)**.

---

## 2. Estado de Detallado de los Casos de Uso

| ID | Caso de Uso | Contexto UI | Actor Principal | Especificación | Wireframe / Prototipo | Estado |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: |
| **CU-01** | `consultarEstadoPuestos()` | `SISTEMA_DISPONIBLE` | `Administrador` | [Ficha](consultarEstadoPuestos/README.md) | [wireframes.svg](../../../images/01-requisitos/01-detalle-casos-uso/consultarEstadoPuestos/wireframes.svg) | 🟢 Completado |
| **CU-02** | `consultarDetallePuesto()` | `PUESTO_ABIERTO` | `Administrador` | [Ficha](consultarDetallePuesto/README.md) | [wireframes.svg](../../../images/01-requisitos/01-detalle-casos-uso/consultarDetallePuesto/wireframes.svg) | 🟢 Completado |
| **CU-03** | **`cambiarModo()`** | `SISTEMA_DISPONIBLE` | `Administrador` | [Ficha](cambiarModo/README.md) | [wireframes.svg](../../../images/01-requisitos/01-detalle-casos-uso/cambiarModo/wireframes.svg) | 🟢 Completado |
| **CU-04** | **`asignarPuestosASwitch()`** | `SISTEMA_DISPONIBLE` | `Administrador` | [Ficha](asignarPuestosASwitch/README.md) | [wireframes.svg](../../../images/01-requisitos/01-detalle-casos-uso/asignarPuestosASwitch/wireframes.svg) | 🟢 Completado |
| **CU-05** | **`dimensionarCuadricula()`** | `SISTEMA_DISPONIBLE` | `Administrador` | [Ficha](dimensionarCuadricula/README.md) | [wireframes.svg](../../../images/01-requisitos/01-detalle-casos-uso/dimensionarCuadricula/wireframes.svg) | 🟢 Completado |
| **CU-06** | **`encenderPuesto()`** | `SISTEMA_DISPONIBLE` / `PUESTO_ABIERTO` | `Administrador` | *Pendiente* | *Pendiente* | ⚪ Pendiente |
| **CU-07** | **`iniciarSesion()`** | `SESION_CERRADA` | `UsuarioNoLogueado` | *Pendiente* | *Pendiente* | ⚪ Pendiente |
| **CU-08** | **`cerrarSesion()`** | `SISTEMA_DISPONIBLE` / `PUESTO_ABIERTO` | `Administrador` | *Pendiente* | *Pendiente* | ⚪ Pendiente |

---

## 3. Trazabilidad con el Diagrama de Contexto

Todas las transiciones de las fichas detalladas se originan y concluyen en los estados definidos en el [Diagrama de Contexto](../00-actores-casos-uso/README.md#2-diagrama-de-contexto):
* **`SESION_CERRADA`:** Contexto previo a la autenticación (`iniciarSesion()`).
* **`SISTEMA_DISPONIBLE`:** Cuadro de mando reactivo del laboratorio (`consultarEstadoPuestos()`, `cambiarModo()`, `dimensionarCuadricula()`, `asignarPuestosASwitch()`, `encenderPuesto()`, `cerrarSesion()`).
* **`PUESTO_ABIERTO`:** Detalle técnico y de cableado de un puesto físico individual (`consultarDetallePuesto()`).
