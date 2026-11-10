# ADR-001: Justificación y Acotamiento de Acciones, Trazabilidad y Rol Administrador

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha:** 2026-11-10
* **Fase:** RUP Inicio (Inception) — Modelo del Dominio
* **Estado:** Aprobado / Acotado por Negocio

---

## 1. Contexto y Problema

En las primeras versiones del Modelo del Dominio (`diagrama-clases.puml`), se incluyó una clase `Accion` conectada mediante dependencia con `Estado`:
```plantuml
Host "1" *-- "1" Estado : "se encuentra en"
Estado ..> Accion : "habilita"
```

El propósito de esta relación en el código backend (`daemon/domain/Accion.js`) era indicarle dinámicamente a la interfaz web si debía pintar el botón interactivo de encendido (`⚡ WoL`) o apagado (`🛑 Apagar`).

Sin embargo, al contrastar esta estructura contra los criterios formales de **Ingeniería del Software 1 (Cátedra Masías / RUP / Larman)** documentados en `~/practices/`:
1. **Olor a diseño de software / UI:** En un modelo conceptual puro, modelar una clase solo para resolver qué botón presentar en pantalla traslada detalles de la Vista y del patrón *Command* al dominio.
2. **Alternativa analizada:** Para que `Accion` fuera una clase legítima del dominio según la **Heurística 2 («El Trípode de las Transacciones»)**, el sistema debería registrar un hecho histórico inmutable (`AccionEjecutada` o `RegistroOperativo`) asociando fecha, hora, resultado y autoría (`Administrador`).

---

## 2. Requisitos Reales del Cliente y Decisión de Acotamiento

Tras evaluar los requisitos y el alcance real acordado con el cliente:
1. **Un solo operador:** El laboratorio opera con un único usuario administrador del aula.
2. **Sin requisito de auditoría:** El cliente no ha solicitado en ningún momento trazabilidad histórica ni auditoría de quién o cuándo se ejecutan los encendidos/apagados.
3. **Principio YAGNI y Criterio Masías:**
   > *«No inventes conceptos o clases si el cliente no los nombra ni los exige.»* — Apuntes IdSw1.

### Decisión Adoptada:
* **Excluir `Administrador` del Modelo del Dominio:** Actúa estrictamente como **Actor externo** en la frontera del sistema para la fase siguiente (`01-requisitos`).
* **Retirar la clase `Accion` del Diagrama de Clases Estructural:** Las acciones operativas (`Encender WoL`) no son entidades estáticas; son los **eventos y transiciones** del comportamiento dinámico, ya capturados formalmente en el **Diagrama de Estados del Host** (`diagrama-estados-host.puml`) y en los **Casos de Uso**.
* **Modelar el estado del Host como un enumerado conceptual:**
  ```plantuml
  enum EstadoHost {
      OPERATIVO
      STANDBY
      FALLO_LOGICO
      RED_AISLADA
      DESCONECTADO
  }
  Host .. EstadoHost
  ```

---

## 3. Arquitectura Alternativa Documentada (Para Futuras Ampliaciones)

Si en una iteración posterior el cliente requiriese auditoría forense o multi-usuario (ej. registro de qué profesor ordenó una acción sobre las máquinas durante una prueba evaluada), el modelo se extendería de forma natural bajo el patrón transaccional canónico de `~/practices/`:

```mermaid
classDiagram
    direction TB
    class Administrador {
        nombre
        correo
    }
    class AccionEjecutada {
        fechaHora
        tipo
        resultado
    }
    class Host {
        nombre
        mac
        ip
    }
    enum EstadoHost {
        OPERATIVO
        STANDBY
        FALLO_LOGICO
        RED_AISLADA
        DESCONECTADO
    }

    Administrador "1" -- "0..*" AccionEjecutada : solicita >
    Host "1" -- "0..*" AccionEjecutada : recibe >
    Host .. EstadoHost
```

### Características de la Extensión:
* **Trípode completo:** Sujeto (`Administrador`) $\to$ Hecho (`AccionEjecutada`) $\to$ Objeto (`Host`).
* **Multiplicidad Test del Dedo:** 
  - `Administrador "1" -- "0..*" AccionEjecutada`
  - `Host "1" -- "0..*" AccionEjecutada`
* **Inmutabilidad:** Cada acción ejecutada almacena `fechaHora`, `tipo` (`WAKE_ON_LAN`, `REINICIO`, etc.) y `resultado` (`EXITO`, `TIMEOUT`, `ERROR`).

---

## 4. Argumentación para Defensa Técnica / Tribunal

Si un revisor cuestiona la ausencia de la clase `Administrador` o de clases para los botones de acción en el Diagrama de Clases:

> *«El Modelo del Dominio se acotó estrictamente al problema real del cliente bajo el principio YAGNI y las directrices de RUP. Dado que el sistema cuenta con un único administrador y no existe requerimiento de auditoría histórica, el Administrador se modeló como Actor en los Casos de Uso, evitando introducir entidades artificiales en el dominio. Asimismo, las operaciones operativas se confinaron a su lugar metodológico natural: los eventos del Diagrama de Estados del Host y la especificación de Casos de Uso, preservando un Diagrama de Clases limpio, cohesivo y libre de acoplamiento con la interfaz de usuario.»*
