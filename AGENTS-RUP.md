# Guía de Modelado RUP y Reglas del Agente (AGENTS-RUP.md)

Este documento rige el proceso de documentación, diseño y modelado de artefactos bajo la metodología **RUP (Rational Unified Process)** para el rediseño del panel de monitorización y observabilidad del laboratorio informático.

---

## 1. Reglas Estrictas para el Agente (Inviolables)

1. **Autorización y Confirmación Explícita:**
   * El agente **NO PUEDE** crear, editar, eliminar ni aplicar cambios en ningún archivo o estructura a menos que el usuario lo solicite expresamente **Y** confirme de forma inequívoca que se puede aplicar.
   * Cualquier propuesta debe ser planteada, debatida y validada antes de tocar el repositorio.

2. **Gestión de Gráficos SVG y Estructura Espejo (`images/`):**
   * Los diagramas se compilan en formato vectorial **`.svg`** y se almacenan en una carpeta raíz denominada **`images/`**, replicando **exactamente la misma estructura de directorios** que tienen los archivos fuente `.puml` de `RUP/`:
     ```text
     images/
     ├── 00-modelo-del-dominio/
     │   ├── diagrama-clases.svg
     │   ├── diagrama-objetos.svg
     │   └── diagrama-estados/
     │       ├── diagrama-estados-host.svg
     │       └── diagrama-estados-laboratorio.svg
     └── 01-requisitos/
     ```
   * En los documentos `README.md`, **NO se debe colocar el código fuente PlantUML directamente en texto plano**. Se deben incrustar las imágenes `.svg` centradas mediante `<div align="center">` junto con un enlace al `.puml` de origen.
   * No generar formatos de imagen rasterizados como `.png` o `.jpg`.

3. **Estructura Modular y Progresiva de Carpetas:**
   * Se debe respetar estrictamente la jerarquía numerada dentro de `RUP/`:
     ```text
     RUP/
     ├── 00-modelo-del-dominio/
     │   ├── README.md
     │   ├── diagrama-clases.puml
     │   ├── diagrama-objetos.puml
     │   └── diagrama-estados/
     │       ├── diagrama-estados-host.puml
     │       └── diagrama-estados-laboratorio.puml
     └── 01-requisitos/                  <-- (Próximo paso, NO crear contenido hasta orden expresa)
     ```
   * **Prohibido adelantarse:** No se creará contenido dentro de `01-requisitos/` ni ningún artefacto subsiguiente hasta que el usuario dé la orden explícita de iniciar esa fase.

---

## 2. Documentación del Modelo de Dominio (Cerrado y Validado)

El artefacto **Modelo de Dominio** reside en `RUP/00-modelo-del-dominio/` y captura los conceptos, relaciones y ciclos de vida fundamentales del problema.

### 2.1 Principios Arquitectónicos del Dominio
1. **Puestos Fijos en el Aula (`Puesto "1" o-- "0..1" Host`):**
   * El puesto físico (mesa) existe de forma permanente en el aula, independientemente de si aloja un ordenador o está vacío por mantenimiento.
2. **Navegación Transitiva y Cero Redundancia:**
   * La relación entre `Laboratorio` y `Host` es estrictamente transitiva:
     $$\text{Laboratorio} \xrightarrow{*--} \text{Puesto} \xrightarrow{o--} \text{Host}$$
   * Se elimina la asociación directa `Laboratorio o-- Host` para garantizar la coherencia del modelo.
3. **Desacoplamiento de Red a través del Puesto (`Puesto "0..*" -- "0..1" Red`):**
   * El latiguillo y la roseta (`toma`) pertenecen a la mesa física. Es el puesto el que se conecta a una red o queda desenchufado físicamente en el suelo.
4. **Contexto Operativo del Aula (`ModoClase` vs `ModoPractica`):**
   * El switch docente ve `DOWN` tanto ante un cable suelto como ante un cable conectado al switch aislado de prácticas o un corte eléctrico. El modo del aula (`ModoOperativo`) desambigua el diagnóstico (Alerta en Clase vs Normal en Práctica).

---

### 2.2 Entidades del Dominio y Enumerados

| Concepto | Tipo | Atributos Principales | Responsabilidad en el Dominio |
| :--- | :---: | :--- | :--- |
| **`Laboratorio`** | Entidad / Raíz | `nombre`, `modo` | Gestiona el aula, sus redes y puestos físicos. |
| **`Puesto`** | Entidad | `etiqueta`, `fila`, `columna`, `toma` | Mesa física fija en el suelo del aula. Aloja 0 o 1 Host. |
| **`Host`** | Entidad | `nombre`, `mac`, `ip` | Puesto informático cliente (PC OptiPlex). Posee su estado telemático. |
| **`Red`** | Entidad | `nombre`, `esAislada` | Segmento de red disponible (Red Docencia vs Red de Prácticas). |
| **`Estado`** | Enum | `OPERATIVO`, `STANDBY`, `FALLO_LOGICO`, `RED_AISLADA`, `DESCONECTADO` | Estado operacional evaluado del host. |
| **`ModoOperativo`**| Enum | `CLASE`, `PRACTICA` | Define el contexto docente del laboratorio. |

---

### 2.3 Estructura de Artefactos

* **README de Artefacto:** `RUP/00-modelo-del-dominio/README.md`
* **Decisiones Arquitectónicas (ADR y Literatura en `docs/`):**
  * `docs/adr/ADR-001-acotamiento-acciones-trazabilidad.md`
  * `docs/adr/ADR-002-acotamiento-control-energia-hardware.md`
  * `docs/matriz-documental-general.md`
  * `docs/matrices-documentales/matriz-referencias-apagado.md`
  * `docs/matrices-documentales/matriz-referencias-plataforma-microsoft.md`
  * `docs/doc/DOC-01-microsoft-windows-internals-dhcp-wol.md`
* **Fuentes PlantUML:**
  * `RUP/00-modelo-del-dominio/diagrama-clases.puml`
  * `RUP/00-modelo-del-dominio/diagrama-objetos.puml`
  * `RUP/00-modelo-del-dominio/diagrama-estados/diagrama-estados-host.puml`
  * `RUP/00-modelo-del-dominio/diagrama-estados/diagrama-estados-laboratorio.puml`
* **Gráficos Renderizados (Espejo en `images/`):**
  * `images/00-modelo-del-dominio/diagrama-clases.svg`
  * `images/00-modelo-del-dominio/diagrama-objetos.svg`
  * `images/00-modelo-del-dominio/diagrama-estados/diagrama-estados-host.svg`
  * `images/00-modelo-del-dominio/diagrama-estados/diagrama-estados-laboratorio.svg`

---

## 3. Estado Actual del Proyecto y Siguiente Fase

* **Fase Actual:** `00-modelo-del-dominio` $\rightarrow$ **CERRADO Y VALIDADO**.
* **Próxima Fase:** `01-requisitos/` (Pendiente de que el usuario dé la instrucción expresa de inicio).
