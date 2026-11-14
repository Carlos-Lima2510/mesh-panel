# ADR-004: Inclusión de la Entidad Switch, Disposición Espacial de Puestos en Cuadrícula y Soporte para Aulas Híbridas

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha:** 2026-11-14
* **Fase:** RUP Inicio (Inception) — Modelo del Dominio y Arquitectura
* **Estado:** Aprobado / Acordado con Dirección Académica
* **Supera a:** [ADR-003: Decisión 2 (Exclusión del Switch del Modelo del Dominio)](ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md)
* **Documentos complementarios:**
  * [ADR-001: Justificación y Acotamiento de Acciones](ADR-001-acotamiento-acciones-trazabilidad.md)
  * [ADR-002: Acotamiento de Control de Energía y Hardware Dell](ADR-002-acotamiento-control-energia-hardware.md)
  * [ADR-003: Remediación GPO y Persistencia de Red](ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md)
  * [Modelo de Dominio RUP (Clases y Objetos)](../../RUP/00-modelo-del-dominio/README.md)
  * [Matriz Documental General](../../docs/matriz-documental-general.md)

---

## 1. Contexto y Justificación del Cambio

En [ADR-003 (Decisión 2)](ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md) se acordó excluir la entidad `Switch` del dominio bajo el argumento de que el sistema no es un software NMS (*Network Management System*) y que el switch secundario de prácticas constituía un "objeto ciego" sin telemetría SNMP. Bajo dicha premisa, el contexto operacional se resolvía mediante una bandera global en el aggregate root: `Laboratorio.modo = 'CLASE' | 'PRACTICA'`.

### 1.1. La Limitación del Aula Homogénea Frente a la Realidad Docente
El modelo global presupone que los 56 puestos del aula operan siempre bajo una política idéntica (todos en red universitaria o todos en red aislada). Sin embargo, la dinámica pedagógica real en asignaturas de redes e ingeniería de sistemas exige con frecuencia el escenario de **Aula Híbrida o por Subgrupos**:
* **Subgrupo A (ej. 20 puestos / Filas 1 a 3):** Realiza prácticas de laboratorio de enrutamiento y conmutación $\rightarrow$ Se conectan al Switch de Prácticas (Red Aislada).
* **Subgrupo B (ej. 20 puestos / Filas 4 a 6):** Sigue la sesión teórica ordinaria, realiza tareas de desarrollo o exámenes $\rightarrow$ Permanece en el Switch Principal Docente (Red Universitaria).

### 1.2. El Fallo del Diagnóstico con Modo Global
Si el aula se encuentra en un escenario híbrido y el estado del laboratorio es global:
1. **Falso Positivo en `CLASE`:** Si el aula está en `Modo Clase`, los 20 puestos del Subgrupo A (que legítimamente han cambiado su cable a la red de prácticas) provocan la caída de la boca en el switch docente, marcándose erróneamente en alarma **`DESCONECTADO`** (naranja).
2. **Falso Negativo en `PRACTICA`:** Si el aula se conmuta a `Modo Práctica`, cualquier desconexión accidental o avería de cable en los puestos del Subgrupo B se clasifica falsamente como **`RED_AISLADA`** (amarillo), enmascarando la pérdida real de conectividad en puestos que debían estar operativos en red universitaria.

---

## 2. Decisión Arquitectónica 1: Incorporación de la Entidad `Switch` en el Dominio

Se revoca la Decisión 2 de ADR-003 y se incorpora formalmente la entidad `Switch` en el Modelo del Dominio de clases conceptuales (Evans [1], Larman [2]). 

Lejos de ser un mero contenedor pasivo o DTO anémico, la entidad `Switch` asume responsabilidades e **invariantes de integridad física y de negocio**:

```
┌────────────────────────────────────────────────────────┐
│                        Switch                          │
├────────────────────────────────────────────────────────┤
│ - id: String                                           │
│ - nombre: String                                       │
│ - tipo: TipoSwitch (GESTIONADO | NO_GESTIONADO)        │
│ - totalPuertos: Integer                                │
│ - ipGestion: String [0..1]                             │
│ - puertosOcupados: Map<Integer, String>                │
├────────────────────────────────────────────────────────┤
│ + conectarPuesto(puerto: Integer, puestoId: String)    │
│ + desconectarPuesto(puerto: Integer)                   │
│ + esGestionado(): Boolean                              │
│ + esperaMeshCentral(): Boolean                         │
│ + puertosLibres(): Integer                             │
└────────────────────────────────────────────────────────┘
```

### 2.1. Invariantes de Dominio Garantizados por `Switch`
1. **Invariante de Capacidad Física:** El puerto a conectar debe estar estrictamente acotado en el rango físico del hardware ($1 \le \text{puerto} \le \text{totalPuertos}$).
2. **Invariante de No-Colisión Física:** Un puerto físico de un switch no puede tener dos rosetas o cables conectados simultáneamente. La operación `conectarPuesto(puerto, puestoId)` rechaza transaccionalmente cualquier solape.
3. **Semántica de Conectividad y Aislamiento:**
   * Si `tipo == GESTIONADO`: Posee dirección IP (`ipGestion`) y habilita telemetría de Capa 1 vía SNMP.
   * Si `tipo == NO_GESTIONADO`: Carece de IP (`ipGestion == null`) y representa el conmutador ciego de prácticas.
   * La operación `esperaMeshCentral()` devuelve `false` si el switch da servicio a una red aislada, desacoplando la política del aggregate root.

---

## 3. Decisión Arquitectónica 2: Disposición Espacial de Puestos en Cuadrícula y Descarte de `Distribucion` como Entidad

Se evalúa si la disposición del aula debe modelarse mediante una entidad adicional de clases (`Distribucion`).

### 3.1. Dictamen de Dominio y Principio YAGNI (*You Aren't Gonna Need It*)
1. **Lenguaje Ubicuo del Cliente (Evans [1], Larman [2]):**  
   El cliente/docente nunca requirió un catálogo abstracto de plantillas persistentes con histórico o CRUD de "Distribuciones". El requerimiento real del aula consiste en:
   * Generar visualmente la cuadrícula física del laboratorio a partir de sus dimensiones: $\text{Filas } (F) \times \text{Columnas } (C)$ con un **pasillo central**.
   * Seleccionar bloques de puestos en dicha cuadrícula (ej. 20 puestos) para asignarlos a uno u otro switch.
2. **Suficiencia y Cohesión de `Puesto`:**  
   La plaza física (`Puesto`) ya encapsula de forma natural las coordenadas espaciales del aula:
   $$\text{Puesto} \big(\text{fila}, \text{columna}, \text{toma}, \text{puertoSwitch}\big)$$
   El laboratorio posee físicamente dichos puestos (`Laboratorio "1" *-- "1..*" Puesto`). Crear una clase intermedia `Distribucion` introduce sobreingeniería (complejidad accidental) sin aportar nuevo comportamiento de negocio.
3. **Persistencia Directa en Base de Datos:**  
   La asignación del switch no requiere tablas intermedias de plantillas: cada puesto guarda su clave foránea al switch asignado (`puestos.switch_id`). Una reconfiguración de subgrupos se traduce en una actualización directa sobre la colección de puestos:
   $$\text{UPDATE puestos SET switch\_id = 'sw-practicas' WHERE fila IN (1, 2, 3);}$$

### 3.2. Especificación de la Vista en Cuadrícula con Pasillo Central
* La interfaz de usuario genera la cuadrícula física a partir de $F \text{ filas} \times C \text{ columnas}$ (ej. $5 \times 8 = 40$ puestos o $7 \times 8 = 56$ puestos).
* El **pasillo central** se modela como una regla estructural de presentación que divide el espacio en dos hileras simétricas:
  * **Hilera Izquierda:** Columnas $1 \dots \lfloor C/2 \rfloor$.
  * **Hilera Derecha:** Columnas $\lfloor C/2 \rfloor + 1 \dots C$.
* La selección interactiva permite marcar un bloque de puestos y asignarle el switch destino (`swDocente` vs. `swPracticas`), mapeando automáticamente las bocas físicas (`puertoSwitch`).

---

## 4. Decisión Arquitectónica 3: Evaluación Contextual por Puesto (`EvaluadorEstado`)

Al asociar directamente cada puesto al switch correspondiente (`Puesto "0..*" -- "1" Switch`), el motor de clasificación y diagnóstico (`EvaluadorEstado`) abandona la dependencia del modo global del laboratorio y pasa a realizar una **evaluación contextual e individualizada por puesto**:

$$\text{Estado}(Host_i) = f\big(\text{SNMP}_{\text{Docente}}(Host_i), \text{MeshCentral}(Host_i), \text{SwitchAsignado}(Puesto_i)\big)$$

### Matriz Determinista de Diagnóstico Actualizada

| Switch Asignado al Puesto | Enlace Switch Docente (Capa 1 SNMP) | Conexión MeshAgent (Capa 7 Lógica) | Diagnóstico Clasificado | Significado Físico / Remediación |
| :--- | :---: | :---: | :---: | :--- |
| **Switch Docente** | `UP` (10/100 Mbps) | Desconectado (`conn = 0`) | ⚫ **`STANDBY`** | PC apagado en reposo ($S5$). Habilita encendido remoto por WoL. |
| **Switch Docente** | `UP` (1 Gbps) | Conectado (`conn & 1`) | 🟢 **`OPERATIVO`** | Operación normal en red universitaria. Habilita apagado remoto. |
| **Switch Docente** | `UP` (1 Gbps) | Desconectado (`conn = 0`) | 🟡 **`FALLO_LOGICO`** | Problema de DHCP / IP estática persistida. Requiere reinicio con GPO Startup. |
| **Switch Docente** | `DOWN` | Desconectado (`conn = 0`) | 🟠 **`DESCONECTADO`** | **Alarma física:** El equipo debía estar en clase y se ha desconectado de la roseta. |
| **Switch Prácticas** | `DOWN` | Desconectado (`conn = 0`) | 🟡 **`RED_AISLADA`** | **Comportamiento previsto:** El alumno trasladó el cable al switch aislado de prácticas. |
| **Switch Prácticas** | `UP` | Conectado (`conn & 1`) | 🔵 **`ANOMALIA_CABLEADO`** | **Aviso docente:** El puesto está asignado a prácticas pero el alumno olvidó cambiar el cable. |

---

## 5. Impacto en los Modelos Estructurales RUP

### 5.1. Refactorización del Diagrama de Clases
La inclusión de `Switch` y el modelado directo en `Puesto` eliminan la relación directa espuria `Laboratorio -- Red`, logrando una cadena conceptual limpia, físicamente verosímil y acíclica:

```plantuml
@startuml
skinparam classAttributeIconSize 0
hide empty members

class Laboratorio {
    nombre
    modo
}

class Puesto {
    etiqueta
    fila
    columna
    toma
    puertoSwitch
}

class Host {
    nombre
    mac
    ip
}

class Switch {
    nombre
    tipo
    totalPuertos
    ipGestion
}

class Red {
    nombre
    esAislada
}

Laboratorio "1" *-- "1..*" Puesto : posee físicamente
Laboratorio "1" o-- "1..*" Switch : alberga >
Puesto "0..*" -- "1" Switch : conecta a boca >
Puesto "1" o-- "0..1" Host : aloja
Switch "1..*" -- "1" Red : da servicio a >
@enduml
```

### 5.2. Validación en el Diagrama de Objetos
El diagrama de objetos se valida instanciando de forma simultánea:
* `swDocente : Switch` conectado a `redUniversidad : Red` dando servicio a `puesto_01` con `pc_01` (`OPERATIVO`).
* `swPracticas : Switch` conectado a `redAislada : Red` dando servicio a `puesto_02` con `pc_02` (`RED_AISLADA`).

---

## 6. Cuadro Comparativo: ADR-003 vs. ADR-004

| Criterio de Arquitectura | ADR-003 (Modelo Homogéneo) | ADR-004 (Modelo de Aula Híbrida) |
| :--- | :--- | :--- |
| **Entidad `Switch`** | Excluida del dominio (relegada a adaptador de infraestructura). | **Entidad de Dominio activa** con invariantes de capacidad y no-colisión. |
| **Granularidad del Contexto** | Global para todo el aula (`laboratorio.modo = CLASE / PRACTICA`). | **Por puesto individual**, parametrizado mediante `puesto.switch`. |
| **Soporte de Aula Híbrida** | Imposible. Generaba falsos diagnósticos si se dividía la clase. | **Nativo.** Admite particiones arbitrarias de puestos en diferentes switches. |
| **Topología y Cableado** | Puesto asociado directamente a una `Red` abstracta. | Puesto conectado a la boca física de un `Switch` que materializa la `Red`. |
| **Modelado Espacial** | Sin soporte para cuadrícula de aula. | Coordenadas en `Puesto` (`fila`, `columna`), pasillo central y descarte de `Distribucion` (YAGNI). |

---

## 7. Referencias Bibliográficas

* **[1]** E. Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Boston, MA: Addison-Wesley, 2003.
* **[2]** C. Larman, *Applying UML and Patterns: An Introduction to Object-Oriented Analysis and Design and Iterative Development*, 3.ª ed. Upper Saddle River, NJ: Prentice Hall, 2004.
* **[3]** J. M. Caicedo and W. Cerroni, "A laboratory architecture for networking education," in *Proc. 2009 39th IEEE Frontiers in Education Conference (FIE)*, San Antonio, TX, 2009, pp. 1–6, doi: [10.1109/FIE.2009.5350782](https://doi.org/10.1109/FIE.2009.5350782).
* **[4]** P. Albee et al., "Design of an isolated multi-purpose networking laboratory," in *Proc. 8th ACM SIGITE Conf. Inf. Technol. Educ. (SIGITE '07)*, Destin, FL, 2007, pp. 119–124, doi: [10.1145/1324302.1324321](https://doi.org/10.1145/1324302.1324321).
* **[5]** K. McCloghrie and F. Kastenholz, "The Interfaces Group MIB," RFC 2863, Standards Track, Jun. 2000, doi: [10.17487/RFC2863](https://www.rfc-editor.org/rfc/rfc2863).
