# Matriz Documental General del Proyecto OpSys

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha de Apertura:** 2026-11-11
* **Fase:** RUP Inicio (Inception) — Base Documental y Evidencia Científica
* **Ámbito del Sistema:** Laboratorio -2.6 (56 puestos cliente Dell OptiPlex SKU 631-ADPL, switch gestionado docente SNMP v2c MIB-II, red aislada de prácticas).
* **Propósito:** Registro centralizador de literatura científica, manuales técnicos y estándares que respaldan con rigor metodológico y de ingeniería cada decisión arquitectónica del proyecto.

---

## 1. Criterios Metodológicos de Selección

Para garantizar que la base documental se mantenga rigurosa, orientada a la realidad del aula y conforme a los límites del proyecto, toda referencia se evalúa contra los siguientes criterios formales:

### Criterios de Inclusión (CI)
* **CI-1 (Supervisión LAN Cliente 2016-2026):** Publicaciones y manuales técnicos (período temporal preferente 2016–2026, salvo literatura fundacional seminal) enfocados en la supervisión, telemetría y observabilidad de redes de área local (LAN) en entornos de estaciones de trabajo cliente.
* **CI-2 (Remediación Viable / Open Source / COTS):** Documentación sobre herramientas, protocolos y mecanismos de remediación o control sin costes de licencia inasumibles para el entorno universitario (Open Source, protocolos estándar de Internet o herramientas de coste cero).
* **CI-3 (Compatibilidad con Infraestructura Real):** Tecnologías y mecanismos directamente compatibles con la infraestructura física y hardware existente en los 56 puestos del aula -2.6 (Dell OptiPlex sin Intel AMT / vPro, switch gestionado docente con MIB-II estándar y switches de prácticas no gestionados).

### Criterios de Exclusión (CE — Límites del Proyecto)
* **CE-1 (Troncal / WAN):** Soluciones de nivel corporativo diseñadas exclusivamente para redes troncales de campus (*WAN / Core Backbone* o centros de datos) sin aplicación a la problemática de boca de usuario final.
* **CE-2 (Modificación Física / Conmutación Estructurada Externa):** Documentación centrada en modificaciones de cableado físico, parches en racks de planta o conmutación estructurada fuera de los límites del aula piloto.
* **CE-3 (Propietario / Intrusivo / Violación *Zero-Touch*):** Soluciones cerradas que requieran alterar la electrónica de red de la universidad (cambio de switches) o instalar agentes propietarios de alto consumo o intrusión en los sistemas cliente.
* **CE-4 (Teórico sin Viabilidad Empírica):** Modelos puramente teóricos o simulaciones en red sin validación experimental ni aplicabilidad directa a entornos de sobremesa físicos.

---

## 2. Ejes Temáticos del Dominio OpSys

La búsqueda y extracción bibliográfica se organiza en cuatro ejes vertebradores:

1. **Eje 1: Observabilidad y Correlación Multinivel (Capa 1 Física vs. Capa 7 Lógica):**
   * Telemetría SNMP v2c MIB-II (`ifOperStatus`, `ifSpeed`, `ifDescr`).
   * Correlación determinista entre enlace físico (PHY carrier sense) y presencia de software en sistema operativo (MeshCentral / WebSockets).
   * Detección de desconexiones físicas vs. apagados locales vs. fallos de DHCP sin sobrecargar con sondeos ICMP.
2. **Eje 2: Arquitectura *Zero-Touch* en Laboratorios Docentes Compartidos:**
   * Modelos de administración no invasiva de aulas informáticas.
   * Telemetría pasiva mediante infraestructura frente a agentes pesados en clientes.
   * Comparativa de costes de mantenimiento y seguridad en puestos multi-usuario.
3. **Eje 3: Manejo de Contexto Operativo y Redes Aisladas (Modo Clase vs. Modo Práctica):**
   * Supervisión en topologías dinámicas con conmutación manual a switches no gestionados (laboratorios de redes).
   * Inferencia de estado por contexto de aula en lugar de telemetría directa bloqueante.
4. **Eje 4: Gestión Energética No Invasiva en Parques COTS:**
   * Wake-on-LAN masivo (Capa 2 Broadcast) en entornos con subredes.
   * Detección de standby ACPI $S5$ mediante negociación de enlace (10/100 Mbps vs. 1 Gbps).
   * Límites de control en hardware sin procesadores fuera de banda (sin Intel AMT).

---

## 3. Catálogo de Matrices Documentales Específicas

Las revisiones detalladas sobre decisiones de diseño puntuales se ramifican en matrices específicas dentro del directorio [`matrices-documentales/`](matrices-documentales/):

| Código | Matriz Específica | Ejes Vinculados | Estado | Enlace al Documento |
| :---: | :--- | :---: | :---: | :--- |
| **MDE-01** | Control de Energía, Apagado Remoto y Realidad Hardware Dell | Eje 4 | **Completada** | [matriz-referencias-apagado.md](matrices-documentales/matriz-referencias-apagado.md) |

---

## 4. Matriz Documental General Consolidada

A continuación se registra el catálogo general de literatura, estándares y manuales que respaldan la arquitectura del proyecto:

| Ref ID | Eje | Cita / Documento / DOI | Tipo de Fuente | Criterios CI | Estado | Aportación Concreta al Proyecto OpSys |
| :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **MDG-01** | Eje 4 | Byon et al. (2015)<br>DOI: [`10.1109/ICTC.2015.7354699`](https://doi.org/10.1109/ICTC.2015.7354699) | Paper IEEE | CI-1, CI-2, CI-3 | **INCLUIDA** | Demuestra la asimetría de red: encendido por WoL a Capa 2 vs. dependencia de socket/demonio para control de estado en Capa 4/7. |
| **MDG-02** | Eje 4 | Wijekoon et al. (2011)<br>DOI: [`10.1109/ICIINFS.2011.6038103`](https://doi.org/10.1109/ICIINFS.2011.6038103) | Paper IEEE | Seminal OOB | **INCLUIDA** | Referencia canónica de gestión OOB con Intel AMT. Justifica formalmente el descarte de apagado fuera de banda ante el hardware Dell con FPF en `DISABLE`. |
| **MDG-03** | Eje 2, Eje 4 | Chiaraviglio & Mellia (2010)<br>IEEE SoftCOM 2010 | Paper IEEE | CI-1, CI-2 | **INCLUIDA** | Antecedente directo en campus universitario (*PoliSave*): valida WoL para encendido y demuestra que el control lógico de energía siempre requirió agentes cliente. |
| **MDG-04** | Eje 3, Eje 4 | Brienza & Anastasi (2013)<br>IEEE SustainIT 2013 | Paper IEEE | CI-1, CI-2 | **INCLUIDA** | Valida el uso del contexto ambiental del aula para gobernar estados de energía, respaldando la alternancia entre `Modo Clase` y `Modo Práctica`. |
| **MDG-05** | Eje 1, Eje 4 | Chan Piseth et al. (2012)<br>IEEE ICCIS 2012 | Paper IEEE | CI-1, CI-3 | **INCLUIDA** | Modela transiciones ACPI gobernadas por servicios de monitorización. Demuestra que si el host se desconfigura en prácticas, las órdenes de control colapsan. |
| **MDG-06** | Eje 1, Eje 4 | Jimeno et al. (2008)<br>IEEE IPCCC 2008 | Paper IEEE | Seminal L2/L3 | **INCLUIDA** | Formula la pérdida de presencia de red al apagarse el host y la necesidad de supervisión a nivel de infraestructura física de Capa 1. |
| **MDG-07** | Eje 4 | Agarwal et al. (2009)<br>USENIX NSDI 2009 | Paper USENIX | Seminal Hardware | **INCLUIDA** | Evidencia empírica (*Somniloquy*) de que gestionar un PC sin el SO principal requiere procesadores secundarios en la NIC. |
| **MDG-08** | Eje 3 | Yang et al. (2004)<br>J. Comput. Sci. Coll. | Paper Journal | Seminal Eje 3 (Pedagogía) | **INCLUIDA** | Justifica la necesidad arquitectónica y pedagógica de aislar las redes de prácticas (*isolated network laboratory*) para evitar que las pruebas de los alumnos afecten a la producción. |
| **MDG-09** | Eje 3 | Albee et al. (2007)<br>ACM SIGITE 2007 | Paper ACM | Seminal Eje 3 (Topología) | **INCLUIDA** | Modela el laboratorio de redes donde los estudiantes manipulan la conmutación y el cableado físico, origen de las discrepancias de Capa 1 supervisadas en OpSys. |
| **MDG-10** | Eje 3 | Caicedo & Cerroni (2009)<br>DOI: [`10.1109/FIE.2009.5350782`](https://doi.org/10.1109/FIE.2009.5350782) | Paper IEEE (FIE) | Seminal Eje 3 (Gestión de Aula) | **INCLUIDA** | **Referencia clave en gestión de laboratorios:** Diseña el equilibrio entre docencia práctica (redes aisladas) y gestionabilidad eficiente (evitar bloqueos por DHCP rogue o malas configuraciones de puerto). |
| **MDG-11** | Eje 3 | Albee et al. (2007)<br>DOI: [`10.1145/1324302.1324321`](https://doi.org/10.1145/1324302.1324321) | Paper ACM (SIGITE) | Seminal Eje 3 (Sandbox) | **INCLUIDA** | Modela entornos de laboratorio aislados (*sandboxed environment*) para cursos de redes, justificando la coexistencia de redes docentes y aisladas. |

---

### 4.1 Registro de Candidatos Evaluados y Excluidos

| Candidato / DOI | Año | Título / Ámbito | Criterio de Exclusión Aplicado | Justificación de Descarte |
| :--- | :---: | :--- | :---: | :--- |
| **`10.1109/CDCS.2001.918686`** | 2001 | *Network fault management based on SNMP agent groups* | **CI-1 (Temporal)** | Publicado en 2001 (fuera del rango 2016-2026). Trata sobre replicación de agentes SNMP en sistemas distribuidos, no sobre telemetría de boca de switch ni correlación con puestos cliente. |
| **`10.1109/INM.2001.918066`** | 2001 | *Semi-active replication of SNMP objects in agent groups applied for fault management* | **CI-1 (Temporal)** | Publicado en 2001 (fuera del rango 2016-2026). Artículo hermano del anterior; modelo obsoleto de replicación de MIBs distribuidas. |
| **`10.1109/IEEESTD.2013.6605490`** | 2013 | *IEEE Standard for Service Interoperability in Ethernet Passive Optical Networks (SIEPON)* | **CI-1 (Temporal) y CE-1 / CE-2 (Troncal Óptica)** | Publicado en 2013. Estándar de telecomunicaciones para redes ópticas pasivas (EPON / FTTH de operadora). Completamente ajeno a la gestión de LAN y puestos de trabajo cliente. |
| **F. Khemissi (valoria.estin.dz)** | 2026 | *Safety-Governed Zero-Touch Intrusion Detection and Response System for Campus Networks...* | **CE-1 (Troncal) y Falsa Homonimia** | El concepto *Zero-Touch* se usa en el sentido de automatización autónoma de ciberseguridad (ETSI ZSM / IDS / IPS en campus). No trata sobre arquitectura de puestos cliente sin agentes. |
| **T. Das et al. (USENIX ATC)** | 2010 | *{LiteGreen}: Saving Energy in Networked Desktops Using Virtualization* | **CI-1 (Temporal) y CE-4** | Sistema de virtualización de puestos de sobremesa para migración de VMs y suspensión. Excede la infraestructura de OpSys (los 56 puestos corren sobre bare-metal sin hipervisores cliente). |
| **TG Stavropoulos et al. (Elsevier)** | 2013 | *aWESoME: A web service middleware for ambient intelligence* | **CE-1 / Ámbito Domótico** | Middleware para edificios inteligentes y domótica (*ambient intelligence*). No aborda la supervisión ni resolución de incidencias en puestos de aula informática. |
| **AT Messinger (Cal State)** | 2013 | *LiteSwitch* | **CI-2 y CE-3 (Coste / Agente Privativo)** | Desarrolla políticas energéticas sobre Microsoft SCCM (*System Center Configuration Manager*). Viola el principio *Zero-Touch* y requiere licencias comerciales privativas inasumibles. |
| **L. Angeli & F. Bertamini** | - | *Increasing the usability and compatibility of the reCluster sustainable data centre architecture* | **CE-1 (Centros de Datos)** | Arquitectura de servidores para centros de datos (*data centres*), ajena a la problemática de bocas de red en puestos de alumnos. |
| **`10.1109/ICCSE.2019.8845470` (Chae et al.)** | 2019 | *Docker-based Cloud System for Computer Programming Labs* | **CE-4 / Ámbito Cloud/Coding** | Propone contenedores Docker en la nube para prácticas de programación de software. No aborda la supervisión de red física LAN, bocas de switch ni telemetría de puestos físicos. |
| **`10.1109/FIE.2002.1157969` / `1157970`** | 2002 | *Portable networking laboratory* / *A computer networking laboratory for administration...* | **Obsolescencia frente a MDG-10** | Artículos breves de 2002 sobre laboratorios portátiles. Superados conceptual y metodológicamente por Caicedo & Cerroni (2009, MDG-10) y Albee (2007). |

---

## 5. Ecuaciones de Búsqueda Calibradas por Eje

Utiliza estas ecuaciones en **IEEE Xplore**, **Google Scholar** o **ACM Digital Library** para explorar los siguientes bloques temáticos (configurando el filtro temporal a **2016–2026**):

### Bloque A: Observabilidad LAN con SNMP y Correlación Capa 1 / Capa 7 (Eje 1)
> `("SNMP") AND ("switch port" OR "port status") AND ("monitoring" OR "observability" OR "telemetry") AND ("host" OR "workstation" OR "LAN")`

### Bloque B: Supervisión Ligera y Arquitectura Sin Agentes en Clientes (Eje 2)
> `("agentless" OR "non-intrusive" OR "lightweight") AND ("monitoring" OR "observability" OR "telemetry") AND ("computer lab" OR "workstation" OR "desktop")`

### Bloque C: Diagnóstico en Redes Aisladas y Entornos Educativos de Prácticas (Eje 3)
> `("networking laboratory" OR "computer lab") AND ("isolated" OR "hands-on" OR "sandbox" OR "VLAN") AND ("management" OR "monitoring")`

### Bloque D: Gestión de Energía y Escalabilidad WoL en Parques COTS (Eje 4 — 2016–2026)
> `("Wake-on-LAN" OR "WoL") AND ("power management" OR "energy efficiency") AND ("computer lab" OR "desktop computers")`
