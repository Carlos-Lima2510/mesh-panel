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
     └── 00-casos-uso/
         └── 00-modelo-del-dominio/
             ├── diagrama-clases.svg
             ├── diagrama-objetos.svg
             └── diagrama-estados/
                 ├── diagrama-estados-host.svg
                 └── diagrama-estados-laboratorio.svg
     ```
   * En los documentos `README.md`, **NO se debe colocar el código fuente PlantUML directamente en texto plano**. Se deben incrustar las imágenes `.svg` centradas mediante `<div align="center">` junto con un enlace al `.puml` de origen.
   * No generar formatos de imagen rasterizados como `.png` o `.jpg`.

3. **Estructura Modular y Progresiva de Carpetas:**
   * Se debe respetar estrictamente la jerarquía numerada dentro de `RUP/`:
     ```text
     RUP/
     └── 00-casos-uso/
         ├── 00-modelo-del-dominio/
         │   ├── README.md
         │   ├── diagrama-clases.puml
         │   ├── diagrama-objetos.puml
         │   └── diagrama-estados/
         │       ├── diagrama-estados-host.puml
         │       └── diagrama-estados-laboratorio.puml
         ├── 01-actores-casos-uso/         <-- (Próximo paso, NO crear hasta orden expresa)
         └── ...
     ```
   * **Prohibido adelantarse:** No se creará la carpeta `01-actores-casos-uso/` ni ningún artefacto subsiguiente hasta que el usuario dé la orden explícita de iniciar esa fase.

---

## 2. Documentación del Modelo de Dominio (Cerrado y Validado)

El artefacto **Modelo de Dominio** reside en `RUP/00-casos-uso/00-modelo-del-dominio/` y captura los conceptos, relaciones y ciclos de vida fundamentales del problema.

### 2.1 Principios Arquitectónicos del Dominio
1. **Puestos Fijos en el Aula (`Puesto "1" o-- "0..1" Host`):**
   * El puesto físico (mesa) existe de forma permanente en el aula, independientemente de si aloja un ordenador o está vacío por mantenimiento.
2. **Navegación Transitiva y Cero Redundancia:**
   * La relación entre `Laboratorio` y `Host` es estrictamente transitiva:
     $$\text{Laboratorio} \xrightarrow{*--} \text{Puesto} \xrightarrow{o--} \text{Host}$$
   * Se elimina la asociación directa `Laboratorio o-- Host` para garantizar la coherencia del modelo.
3. **Desacoplamiento de Red en el Host (`Host "0..1" --> "0..1" Red`):**
   * Un host desenchufado físicamente no pertenece a ninguna red en ese instante.
4. **Contexto Operativo del Aula (`ModoClase` vs `ModoPractica`):**
   * El switch docente ve `DOWN` tanto ante un cable suelto como ante un cable conectado al switch aislado de prácticas o un corte eléctrico. El modo del aula desambigua el diagnóstico (Alerta en Clase vs Normal en Práctica).

---

### 2.2 Entidades del Dominio y Atributos

| Entidad | Tipo | Atributos Principales | Responsabilidad en el Dominio |
| :--- | :---: | :--- | :--- |
| **`Laboratorio`** | Entidad / Raíz | `nombre: String`, `modo: ModoOperativo` | Gestiona el aula, sus redes, distribuciones y puestos físicos. |
| **`Distribucion`**| Entidad | `nombre: String`, `activa: Boolean` | Define el plano o disposición espacial activa de los puestos. |
| **`Puesto`** | Entidad | `etiqueta: String`, `fila: Integer`, `columna: Integer` | Mesa física fija en el suelo del aula. Aloja 0 o 1 Host. |
| **`Host`** | Entidad | `nombre: String`, `mac: String`, `ip: String` | Puesto informático cliente (PC OptiPlex). Posee su estado telemático. |
| **`Red`** | Entidad | `nombre: String`, `esAislada: Boolean` | Segmento de red disponible (Red Docencia vs Red de Prácticas). |
| **`Estado`** | Entidad / Objeto | `nombre: String`, `color: String`, `diagnostico: String` | Estado operacional evaluado del host. |
| **`Accion`** | Comando / Valor | `tipo: String`, `descripcion: String` | Operación remediadora habilitada al Administrador. |
| **`ModoOperativo`**| Enum | `CLASE`, `PRACTICA` | Define el contexto docente del laboratorio. |

---

### 2.3 Estructura de Artefactos

* **README de Artefacto:** `RUP/00-casos-uso/00-modelo-del-dominio/README.md`
* **Fuentes PlantUML:**
  * `RUP/00-casos-uso/00-modelo-del-dominio/diagrama-clases.puml`
  * `RUP/00-casos-uso/00-modelo-del-dominio/diagrama-objetos.puml`
  * `RUP/00-casos-uso/00-modelo-del-dominio/diagrama-estados/diagrama-estados-host.puml`
  * `RUP/00-casos-uso/00-modelo-del-dominio/diagrama-estados/diagrama-estados-laboratorio.puml`
* **Gráficos Renderizados (Espejo en `images/`):**
  * `images/00-casos-uso/00-modelo-del-dominio/diagrama-clases.svg`
  * `images/00-casos-uso/00-modelo-del-dominio/diagrama-objetos.svg`
  * `images/00-casos-uso/00-modelo-del-dominio/diagrama-estados/diagrama-estados-host.svg`
  * `images/00-casos-uso/00-modelo-del-dominio/diagrama-estados/diagrama-estados-laboratorio.svg`

---

## 3. Estado Actual del Proyecto y Siguiente Fase

* **Fase Actual:** `00-modelo-del-dominio` $\rightarrow$ **CERRADO Y VALIDADO**.
* **Próxima Fase:** `01-actores-casos-uso` (Pendiente de que el usuario dé la instrucción expresa de inicio).
