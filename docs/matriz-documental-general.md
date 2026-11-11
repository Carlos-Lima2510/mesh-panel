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
| **MDE-02** | Plataforma Microsoft Learn, Windows Internals y Diagnóstico de Red | Eje 1, Eje 4 | **Completada** | [matriz-referencias-plataforma-microsoft.md](matrices-documentales/matriz-referencias-plataforma-microsoft.md) (Dossier: [DOC-01](doc/DOC-01-microsoft-windows-internals-dhcp-wol.md), [ADR-003](adr/ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md)) |

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
| **MDG-12** | Eje 1 | Baikole et al. (2026)<br>DOI: [`10.35842/ijicom.v8i1.226`](https://doi.org/10.35842/ijicom.v8i1.226) | Paper Journal (IJICOM) | CI-1, CI-2, CI-3 | **INCLUIDA** | Demuestra el problema de invisibilidad en Capa 3 ante fallos o cambios de configuración IP en clientes, validando el uso de SNMP y descubrimiento de enlace (Capa 2) para preservar la observabilidad desde el panel. |
| **MDG-13** | Eje 1, Eje 2 | Issariyapat et al. (2012)<br>IEEE / APNIC | Paper IEEE / Conf | CI-2, CI-3 | **INCLUIDA** | Evidencia las limitaciones estructurales de NMS tradicionales (Nagios) frente a bocas de switch e interfaces (ceguera de enlaces por modelado plano de host), justificando un panel especializado con trazabilidad física de bocas. |
| **MDG-14** | Eje 1, Eje 3 | Xiaozhong Chen (2015)<br>DOI: [`10.2991/esac-15.2015.12`](https://doi.org/10.2991/esac-15.2015.12) | Paper Conf (Atlantis Press) | CI-1, CI-2, CI-3 | **INCLUIDA** | Analiza la disponibilidad y fallos en la renovación del servicio DHCP en redes de campus, fundamentando empíricamente la causa de transición a `FALLO_LOGICO` cuando el enlace físico está activo pero el host no obtiene o renueva IP. |
| **MDG-15** | Eje 1 | De Lima et al. (2006)<br>DOI: [`10.1109/NOMS.2006.1687583`](https://doi.org/10.1109/NOMS.2006.1687583) | Paper IEEE (NOMS) | Seminal Rendimiento | **INCLUIDA** | Evaluación cuantitativa de rendimiento entre notificaciones SNMP y Web Services. Demuestra la mínima sobrecarga y latencia del sondeo SNMP ligero, justificando su viabilidad frente a consultas continuas por capas superiores. |
| **MDG-16** | Eje 4 | Xiaoyu Ruan (2014)<br>*Platform Embedded Security Technology Revealed* (Apress / Springer) | Libro Seminal (Investigador Intel) | Seminal Hardware, CI-2, CI-3 | **INCLUIDA** | Referencia canónica de arquitectura Intel CSME/ME. Demuestra que los fusibles programables en campo (FPF) bloquean de forma permanente e irreversible la ejecución de módulos de gestión OOB (AMT) una vez fundidos en fábrica en modo `DISABLE`. |
| **MDG-17** | Eje 1 | D. Mauro & K. Schmidt (2005)<br>*Essential SNMP* (O'Reilly Media) | Libro Canónico de Ingeniería | Seminal SNMP, CI-2, CI-3 | **INCLUIDA** | Manual de referencia de ingeniería de Net-SNMP y MIB-II. Fundamenta el diseño de consultas masivas por PDUs `GetRequest`/`GetBulkRequest` y los timeouts estrictos para sondeo de interfaces (`ifOperStatus`, `ifSpeed`) sin sobrecargar el conmutador. |
| **MDG-18** | Eje 1, Eje 2 | Pillo-Guanoluisa et al. (2025)<br>DOI: [`10.1109/ETCM67548.2025.11304414`](https://doi.org/10.1109/ETCM67548.2025.11304414) | Paper IEEE (ETCM) | CI-1, CI-2, CI-3 | **INCLUIDA** | **Referencia comparativa de Zabbix:** Caso de estudio de monitorización centralizada en switches de acceso bajo FCAPS. Permite justificar por qué Zabbix es idóneo para infraestructura troncal pero excesivamente intrusivo y complejo para puestos cliente frente al modelo Zero-Touch de OpSys. |
| **MDG-19** | Eje 1 | Qalandarov et al. (2026)<br>DOI: [`10.3390/telecom7060143`](https://doi.org/10.3390/telecom7060143) | Paper Journal (MDPI Telecom) | CI-1, CI-2, CI-3 | **INCLUIDA** | **Fundamentación científica de A Demanda vs. Polling:** Demuestra matemáticamente cómo el sondeo continuo síncrono satura la CPU de gestión de los switches y valida el modelo de *Asynchronous Hybrid Polling* (sondeos dirigidos y a demanda de eventos) para telemetría en tiempo real sin sobrecarga de red. |

---

### 4.1 Registro de Candidatos Evaluados y Excluidos

| Candidato / DOI | Año | Título / Ámbito | Criterio de Exclusión Aplicado | Justificación de Descarte |
| :--- | :---: | :--- | :---: | :--- |
| **Andrew MacKay**<br>([`hdl.handle.net/11264/1561`](https://hdl.handle.net/11264/1561)) | 2018 | *A Trusted Recovery Framework for Supervisory Control and Data Acquisition Systems* (RMC Canada) | **CE-1 (Industrial/SCADA) y CE-4** | Tesis sobre ciberresiliencia y recuperación OOB para infraestructuras críticas y sistemas SCADA (subestaciones y plantas industriales). Ámbito de tecnología operacional ajeno a puestos cliente de aula universitaria. |
| **J. M. Kretchmar** | 2004 | *Open Source Network Administration* (Prentice Hall) | **CI-1 (Temporal)** | Publicado en 2004. Guía práctica sobre Net-SNMP y MRTG; superada metodológicamente por la obra de referencia canónica de Mauro & Schmidt (2005, MDG-17) y estándares IETF. |
| **Tian Qin et al.**<br>([`10.1007/s41605-024-00459-8`](https://doi.org/10.1007/s41605-024-00459-8)) | 2024 | *A device information-centered accelerator control network management system* | **CE-1 (Física Nuclear) y CE-4** | Sistema de control de red diseñado para instalaciones de aceleradores de partículas y física de radiaciones. Ámbito científico nuclear ajeno a puestos de usuario y redes de laboratorios docentes. |
| **Actas ICOSEC 2025**<br>([`10.1109/ICOSEC67334.2025.11459596`](https://doi.org/10.1109/ICOSEC67334.2025.11459596)) | 2025 | *IEEE International Conference on Smart Electronics and Communication* | **CE-1 (Microelectrónica / IoT)** | Actas focalizadas en diseño de sensores electrónicos y hardware embebido IoT. Sin aplicación directa a la observabilidad de LAN de sobremesas ni gestión de conmutadores de acceso. |
| **Tesis Repositorio Theseus**<br>([`urn.fi/URN:NBN:fi:amk-2019121626834`](https://urn.fi/URN:NBN:fi:amk-2019121626834)) | 2019 | Tesis de licenciatura/máster sobre monitorización de TI (AMK Finlandia) | **Prioridad Metodológica** | Trabajo de titulación de grado no indexado en bases científicas principales de impacto. Superado formalmente por Pillo-Guanoluisa (IEEE 2025) y Qalandarov (MDPI 2026). |
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

---

## 6. Catálogo de Estándares Normativos IETF (RFCs)

Especificaciones técnicas y estándares normativos internacionales que fundamentan los protocolos de red y mecanismos de telemetría implementados en la arquitectura de OpSys:

| Ref ID | Estándar IETF | Título Oficial y Autores | Estado Normativo | Ámbito y Aportación Concreta al Proyecto OpSys |
| :---: | :---: | :--- | :---: | :--- |
| **STD-01** | [RFC 2863](https://www.rfc-editor.org/rfc/rfc2863) | *The Interfaces Group MIB*<br>(K. McCloghrie, F. Kastenholz, 2000) | Standards Track | **Base Canónica de Capa 1/2:** Especifica los objetos MIB-II de interfaz `ifOperStatus` (`1.3.6.1.2.1.2.2.1.8`), `ifSpeed`, `ifDescr` y las notificaciones `linkDown`/`linkUp`. Sustenta el adaptador [`SnmpSwitchProvider`](../daemon/infrastructure/network/SnmpSwitchProvider.js) como única fuente de verdad física sin intrusión en clientes. |
| **STD-02** | [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131) | *Dynamic Host Configuration Protocol*<br>(R. Droms, 1997) | Standards Track (Draft Standard) | **Base Canónica de Capa 3:** Define la máquina formal de estados de autoconfiguración IP (`INIT`, `SELECTING`, `BOUND`, `RENEWING`, `REBINDING`). Explica la transición al estado `FALLO_LOGICO` ante expiración de leases o desconexión en redes de prácticas. |
| **STD-03** | [RFC 3416](https://www.rfc-editor.org/rfc/rfc3416) | *Version 2 of Protocol Operations for the Simple Network Management Protocol (SNMP)*<br>(R. Presuhn et al., 2002) | Standards Track | **Base Canónica de Consulta SNMPv2c:** Especifica las PDUs de transporte `GetRequest`, `GetBulkRequest` y `Response`, validando la arquitectura de consultas masivas y sondeo periódico ligero en subredes locales sin saturación de CPU en el switch. |
| **STD-04** | [RFC 2613](https://www.rfc-editor.org/rfc/rfc2613) | *Remote Network Monitoring MIB Extensions for Switched Networks (SMON)*<br>(R. Waterman et al., 1999) | Standards Track | **Supervisión en Conmutación:** Extiende RMON para switches y norma la consistencia y replicación de los valores de `ifAdminStatus` e `ifOperStatus` por boca de switch individual en entornos conmutados. |

---

## 7. Catálogo de Documentación Oficial de Plataformas y Fabricantes (DOC)

Especificaciones de fabricante, manuales de administración y documentación de sistemas operativos cliente que respaldan el comportamiento empírico del parque informático:

| Ref ID | Fabricante / Plataforma | Título Oficial y Recurso | Tipo de Documento | Ámbito y Aportación Concreta al Proyecto OpSys |
| :---: | :---: | :--- | :---: | :--- |
| **DOC-MS-01** | Microsoft | *Troubleshoot problems on the DHCP client*<br>[Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshoot-dhcp-client) | Guía Oficial de Soporte | **Diagnóstico de `FALLO_LOGICO`:** Especifica el canal `Dhcp-Client/Admin`, los Event IDs 1001 (fallo de asignación) y 1002 (pérdida de lease) y la degradación a APIPA (`169.254.x.x`). |
| **DOC-MS-02** | Microsoft | *Wake on LAN (WOL) behavior in Windows 10 and 11*<br>[Microsoft Learn](https://learn.microsoft.com/es-es/troubleshoot/windows-client/setup-upgrade-and-drivers/wake-on-lan-feature) | Especificación de Arquitectura OS | **Requisito Obligatorio de WoL:** Demuestra que el kernel de Windows en *Fast Startup* ($S4$ híbrido) desarma la tarjeta de red al apagar. Fundamenta la directiva GPO obligatoria `HiberbootEnabled = 0` para encender el aula. |
| **DOC-MS-03** | Microsoft | *System Power States & Wake-on-LAN Behavior*<br>[Win32 Power Management](https://learn.microsoft.com/es-es/windows/win32/power/system-power-states#wake-on-lan-behavior) | Especificación de API Win32 / NDIS | **Correspondencia ACPI $S0$–$S5$ y Device States $D0$–$D3$:** Documenta la pérdida de control del SO en $S5$ puro y la transferencia al transceptor físico energizado a 5VSB. |
| **DOC-INTEL-01** | Intel | *Intel CSME Security Advisory White Paper*<br>[Intel Technical Document](https://www.intel.com/content/dam/www/public/us/en/security-advisory/documents/intel-csme-security-white-paper.pdf) | White Paper Oficial de Arquitectura | **Irreversibilidad de FPF:** Especifica la matriz de fusibles de silicio no volátiles (FPF) del PCH como raíz de confianza hardware. Demuestra que el quemado de fábrica de Dell (SKU 631-ADPL en `DISABLE`) no puede revertirse por firmware ni software. |
| **DOC-INTEL-02** | Intel | *LOM Design Guide (AP-468)*<br>[Application Note AP-468](https://www.intel.co.il/content/dam/doc/application-note/82541pi-er-82562gz-gx-dual-footprint-lom-design-guide-appl-note.pdf) | Guía de Diseño de Hardware | **Circuito de Alimentación Auxiliar (5VSB / Standby WoL):** Documenta el suministro de tensión continua de reserva (5VSB) al transceptor PHY de red en estado $S5$ para mantener la escucha de Magic Packets a 10/100 Mbps (heredado en la familia Intel I219-LM de los OptiPlex). |
| **DOC-MESH-01** | MeshCentral | *MeshCtrl User's Guide*<br>[Manual Oficial de Plataforma](https://meshcentral.com/docs/MeshCtrlUsersGuide.pdf) | Manual Oficial de Herramienta CLI | **Especificación de Telemetría Capa 7:** Documenta la herramienta `meshctrl`, las llamadas `listdevices --json` y la máscara binaria `conn & 1` del agente WebSocket, base del adaptador [`MeshCentralAdapter`](../daemon/infrastructure/meshcentral/MeshCentralAdapter.js). |

> [!NOTE] Dossier Técnico Detallado
> Para un análisis exhaustivo con fragmentos de configuración, comandos PowerShell (`NetAdapter`) y claves del Registro de Windows, consultar el [Dossier Técnico DOC-01](doc/DOC-01-microsoft-windows-internals-dhcp-wol.md).


