# ADR-002: Acotamiento de Control de Energía (WoL vs. Apagado), Realidad Hardware Dell y Exclusión Tecnológica

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha:** 2026-11-10
* **Fase:** RUP Inicio (Inception) — Modelo del Dominio
* **Estado:** Aprobado / Acotado por Negocio

---

## 1. Contexto y Realidad Física del Hardware (Dell OptiPlex SKU 631-ADPL)

En el parque informático del laboratorio (60 puestos Dell OptiPlex):
* **Fundido irreversible de fusibles (FPF):** El chipset Intel ME viene de fábrica en modo `DISABLE` (`INFO,RYLTY,ME,DISABLE,DAKAR`). Carecen de licencia y procesador fuera de banda Intel AMT.
* **Consecuencia física:** Es **imposible enviar órdenes de apagado o control a nivel de hardware/placa base**. Cualquier apagado remoto depende 100% de que el sistema operativo (Windows/Linux) esté arrancado, tenga red funcional y ejecute el servicio MeshAgent.
* **Encendido Wake-on-LAN (WoL):** Es una capacidad de hardware puro de Capa 2 (Broadcast / Magic Packet). El chip PHY de la tarjeta de red se mantiene alimentado a 5V en standby (S5) y enciende la máquina sin requerir agente ni sistema operativo previo.

---

## 2. Decisión de Negocio: Retiro del Apagado Remoto del Panel

### El Problema de Fiabilidad Identificado
Si un equipo entra en estado **`DESCONFIGURADO` / `FALLO_LOGICO`** (por ejemplo, un alumno configuró una IP estática errónea durante una práctica de redes, o el servicio del agente se detuvo):
* El agente está caído.
* Al no haber Intel AMT, el apagado remoto es **técnicamente imposible de ejecutar**.
* Además, reiniciar o apagar la máquina no resuelve el problema automáticamente: Windows almacena la configuración de red de forma persistente en el Registro. Al encender de nuevo, el equipo arranca con la misma configuración rota y vuelve a caer en `DESCONFIGURADO`.

### Decisión Adoptada:
* **Acotar el alcance del panel a Observabilidad en Tiempo Real + Encendido Remoto (WoL).**
* **Retirar la funcionalidad de "Apagado Remoto" del panel:** Evita prometer al usuario una acción que el hardware no puede garantizar en situaciones de fallo o desconfiguración.
* **El apagado se modela como evento manual/externo:** En el ciclo de vida del Host, la transición a `APAGADO` se mantiene porque el sistema **observa y detecta** cuándo un equipo ha sido apagado (ya sea por el alumno desde *Inicio $\to$ Apagar* al terminar la clase o por apagado forzado físico en el botón de la torre), pero ya no constituye una orden remitida por el panel.

---

## 3. Implicaciones en el Diagrama de Estados del Host (`diagrama-estados-host.puml`)

A raíz de este análisis, el autómata de estados incorpora dos refinamientos clave:

1. **Doble rama en el encendido desde `APAGADO`:**
   Reconoce que encender un PC no garantiza que el sistema operativo esté sano:
   ```plantuml
   APAGADO -right-> OPERATIVO : Encender [agente conecta]
   APAGADO -right-> DESCONFIGURADO : Encender [sin agente / IP errónea]
   ```
2. **Transiciones de apagado como eventos observados:**
   ```plantuml
   OPERATIVO -left-> APAGADO : Apagado manual (local / alumno)
   DESCONFIGURADO -left-> APAGADO : Apagado manual (forzado en torre)
   ```
   En el estado `OPERATIVO` no se promete la acción `• Habilita: Apagar`.

---

## 4. Exclusión de Entidades Tecnológicas de Red (`Switch` y `PuertoSwitch`)

Se ratificó formalmente mantener al `Switch` y al `PuertoSwitch` fuera del Modelo de Dominio:
* **Frontera del Dominio (*Bounded Context*):** El software supervisa puestos de trabajo y alumnos para la docencia; no es un software NMS de telecomunicaciones para gestionar racks ni topología de red.
* **Separación Hexagonal:** El switch actúa como una sonda externa de telemetría de Capa 1 y reside limpiamente en la capa de adaptadores de infraestructura (`daemon/infrastructure/network/SnmpSwitchProvider.js`).
* **La Toma como Atributo:** La roseta RJ-45 de la pared es un elemento estático de la mesa sin comportamiento propio; por tanto, se modela como un simple atributo `toma` dentro de la entidad `Puesto`.

---

## 5. Acciones Masivas (Encendido / Apagado en Bloque)

Se confirmó que el soporte para ejecutar acciones sobre múltiples o todos los puestos a la vez (ej. encender todo el aula mediante WoL):
* **No requiere modificar el Diagrama de Clases:** La relación `Laboratorio *-- Puesto o-- Host` ya agrupa todas las máquinas bajo el Aggregate Root `Laboratorio`.
* El encendido masivo es un **flujo de Caso de Uso** que itera sobre la colección existente, sin necesidad de inventar clases artificiales de `Grupo` o `Lote`.

---

## 6. Cuadro Resumen de Decisiones de la Sesión

| Tema Abordado | Decisión Inicial / Olor Detectado | Decisión Final Acotada | Justificación Metodológica |
| :--- | :--- | :--- | :--- |
| **Rol Administrador** | ¿Incluir clase `Administrador`? | **Excluido** del Diagrama de Clases | Un solo usuario, sin requisito de auditoría (YAGNI). Vive como Actor en Casos de Uso. |
| **Clase Acción** | `Estado ..> Accion` | **Eliminada** del Diagrama de Clases | Era un detalle de UI/botón. Las acciones son eventos en Estados y Casos de Uso. |
| **Apagado Remoto** | Botón de apagado en el panel | **Retirado del panel** | Dell SKU 631-ADPL sin AMT no garantiza apagado si el agente cae. Queda como evento manual observado. |
| **Encendido WoL** | Transición directa a `OPERATIVO` | **Bifurcación condicional** | Si Windows arranca con IP rota, transiciona directamente a `DESCONFIGURADO`. |
| **Entidad Switch** | ¿Modelar `Switch` y `PuertoSwitch`? | **Excluidos** del Dominio | Detalle tecnológico de Capa 1 confinado en Infraestructura (`SnmpSwitchProvider`). |
| **Toma / Roseta** | ¿Modelar entidad `Toma`? | **Atributo** `toma` en `Puesto` | Elemento físico pasivo sin identidad dinámica ni comportamiento. |
| **Acciones Masivas** | ¿Modelar clase `Grupo` o `Lote`? | **Sin clases extra** | Resuelto por iteración sobre el contenedor natural `Laboratorio *-- Puesto`. |
| **Carpetas RUP** | `RUP/00-casos-uso/00-modelo-del-dominio/` | `RUP/00-modelo-del-dominio/` y `01-requisitos/` | Estructura modular independiente con espejo en `images/`. |
