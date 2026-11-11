# Matriz de Extracción y Evaluación de Literatura Científica: Control de Energía y Apagado en Puestos de Trabajo

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha:** 2026-11-11
* **Fase:** RUP Inicio (Inception) — Justificación Arquitectónica de Dominio
* **Propósito:** Evaluar con rigor científico la viabilidad técnica de mecanismos de control de energía (encendido y apagado) para el parque de puestos de sobremesa (Dell OptiPlex SKU 631-ADPL sin Intel AMT), contrastando enfoques con agente (In-Band), fuera de banda (Out-of-Band) y sin agente (Agentless).

---

## 1. Criterios Metodológicos de Selección

Para discriminar la literatura relevante frente al problema del laboratorio, se establecen los siguientes criterios formales:

* **Criterio de Inclusión 1 (CI-1):** Estudios que describan mecanismos de gestión o control de ciclo de vida energético (encendido, suspensión, apagado) en equipos cliente/workstations de sobremesa.
* **Criterio de Inclusión 2 (CI-2):** Estudios que analicen dependencias de software local (agentes/demonios en el sistema operativo) o arquitecturas fuera de banda (OOB).
* **Criterio de Exclusión 1 (CE-1):** Artículos cuyo ámbito sea infraestructura de telecomunicaciones o redes ópticas/enrutamiento sin relación con la gestión de hosts de usuario final.
* **Criterio de Exclusión 2 (CE-2):** Artículos que se limiten a la medición/monitorización pasiva de consumo eléctrico sin capacidad de actuación o control remoto de estado sobre el equipo.
* **Criterio de Exclusión 3 (CE-3):** Enlaces web, herramientas de software o informes comerciales sin especificación arquitectónica revisada por pares.
* **Criterio de Exclusión 4 (CE-4):** Estudios puramente sociológicos o de interacción persona-ordenador (HCI) en hogares sin diseño de protocolos o sistemas.

---

## 2. Matriz Consolidada de Referencias Evaluadas

| Ref ID | Cita y DOI | Enfoque Tecnológico | Mecanismo Encendido / Apagado | Dependencia del SO | Estado | Justificación de Selección / Exclusión y Relevancia en OpSys |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **REF-01** | Byon et al. (2015)<br>DOI: [`10.1109/ICTC.2015.7354699`](https://doi.org/10.1109/ICTC.2015.7354699) | In-Band por Red (Capa 2 / Capa 4) | Encendido: Wake-on-LAN (L2)<br>Apagado/Sleep: Socket UDP (L4) | Sí (Requiere demonio escuchando en SO) | **INCLUIDA**<br>(Cumple CI-1, CI-2) | **Valida la fragilidad del apagado lógico:** Prueba que para ordenar transiciones de energía mediante tráfico de red estándar se necesita un demonio en el host. Si la IP se desconfigura en prácticas o el SO se cuelga, el paquete UDP no surte efecto. |
| **REF-02** | Wijekoon et al. (2011)<br>DOI: [`10.1109/ICIINFS.2011.6038103`](https://doi.org/10.1109/ICIINFS.2011.6038103) | Out-of-Band (OOB) Hardware | Intel AMT WS-Management a nivel de placa base | No (Independiente del SO) | **INCLUIDA**<br>(Cumple CI-1, CI-2) | **Referencia canónica de OOB y justificación de descarte:** Demuestra que el apagado independiente del SO en sobremesas exige Intel AMT. Al tener los 60 Dell del aula los fusibles FPF quemados de fábrica (`DISABLE`), prueba formalmente la inviabilidad de esta alternativa estándar en el parque. |
| **REF-03** | Meagher et al. (2000)<br>DOI: [`10.1109/50.908812`](https://doi.org/10.1109/50.908812) | Conmutación Óptica de Etiquetas (WDM) | No aplica (Enrutamiento de paquetes en fibra óptica) | N/A | **EXCLUIDA**<br>(Aplica CE-1) | **Fuera de ámbito:** Trata sobre conmutación óptica ultrarrápida en capas de transporte de telecomunicaciones. No aborda la gestión de energía ni el control de terminales cliente. |
| **REF-04** | Tavares et al. (2018)<br>DOI: [`10.1109/INDIN.2018.8471960`](https://doi.org/10.1109/INDIN.2018.8471960) | Monitorización Eléctrica No Intrusiva (NILM) | No aplica (Sensing de corriente/voltaje vía IoT) | N/A | **EXCLUIDA para control**<br>(Aplica CE-2) | **Solo telemetría pasiva:** Propone un medidor de potencia no invasivo. No implementa control, apagado ni conmutación de energía sobre los equipos, por lo que no resuelve el apagado sin agente. |
| **REF-05** | Chiaraviglio & Mellia (2010)<br>IEEE SoftCOM 2010 | Híbrido Cliente-Servidor (*PoliSave*) | Encendido: Wake-on-LAN (L2)<br>Apagado/Sleep: Agente cliente + Programación web | Sí (Requiere software cliente en puestos) | **INCLUIDA**<br>(Cumple CI-1, CI-2) | **Caso real de campus universitario:** Demuestra que en flotas de campus la gestión energética combina WoL para encendido con un agente cliente para apagado/reposo. Valida que una arquitectura *Zero-Touch* sin agentes no puede garantizar apagado fiable por red. |
| **REF-06** | Brienza & Anastasi (2013)<br>IEEE SustainIT 2013 | Sensor-Based Power Management | Transiciones automáticas por presencia ambiental (sensores PIR/actividad) | No para la decisión (externa), Sí para ejecutar ACPI en host | **INCLUIDA**<br>(Cumple CI-1, CI-2) | **Automatización sin órdenes manuales:** Propone usar sensores externos en grandes entornos para inducir estados de reposo sin que un operador envíe comandos remotos directos. Valida la necesidad de desacoplar la decisión de la orden manual. |
| **REF-07** | Chan Piseth, Oxley & Jung (2012)<br>IEEE ICCIS 2012 | Transición Dinámica de Estados ACPI | Transiciones dinámicas S0-S5 dirigidas por servicio de monitorización | Sí (Servicio de telemetría y host cooperativo) | **INCLUIDA**<br>(Cumple CI-1, CI-2) | **Transiciones guiadas por telemetría:** Modela el paso entre estados energéticos acoplado a un servicio de monitorización continua. Demuestra que si el host deja de responder al servicio de telemetría, las transiciones se bloquean. |
| **REF-08** | Jimeno, Christensen & Nordman (2008)<br>IEEE IPCCC 2008 | Network Connection Proxy (*Sleep Proxy*) | Proxy de presencia de red + Wake-on-LAN | No mientras duerme (el Proxy responde por él) | **INCLUIDA**<br>(Cumple CI-1, CI-2) | **Fundamento de la asimetría de red:** Explica por qué un PC apagado o en reposo desaparece de Capa 3/7. Para que un PC no requiera estar encendido escuchando, la literatura inventó proxys externos o hardware de presencia. |
| **REF-09** | Agarwal et al. (2009)<br>USENIX NSDI 2009 | Hardware Augmentation (*Somniloquy*) | Microcontrolador embebido en la tarjeta de red (NIC) | No (El procesador secundario gestiona la red) | **INCLUIDA**<br>(Cumple CI-1, CI-2) | **Evidencia definitiva sobre hardware:** Demuestra que para tener control de red sin el SO principal corriendo, es indispensable un procesador secundario de bajo consumo en el hardware (equivalente a Intel AMT). Confirma la imposibilidad física en COTS sin dicho hardware. |

---

### 2.1 Registro de Candidatos Excluidos del Rastreo (Snowballing)

| Candidato | Tipo de Fuente | Motivo de Exclusión |
| :--- | :--- | :--- |
| **Wen-Kang Jia (2023)** (IEEE Syst. J.) | Cita a PoliSave | **CE-1 (Fuera de ámbito):** Trata sobre SDN, DNS y cruce de NAT; no aborda control ni gestión de energía en puestos. |
| **Chetty et al. (2009)** (ACM CHI) | Referencia de PoliSave | **CE-4 (Estudio sociológico):** Análisis de hábitos domésticos de usuarios frente al consumo, sin diseño de sistemas ni protocolos. |
| **Nedevschi et al. (2008)** (USENIX NSDI) | Referencia de PoliSave | **CE-1 (Fuera de ámbito):** Técnicas de ahorro (*rate-adaptation*) para routers y switches de red, no estaciones cliente. |
| **Nedevschi et al. (2009)** (USENIX NSDI) | Referencia de PoliSave | **CE-1 (Fuera de ámbito):** Optimización de periodos de reposo en equipamiento de red (*networked systems* de enrutamiento). |
| **Roberson et al. (2004)** (LBNL Report) | Referencia de PoliSave | **CE-2 (Solo medición):** Informe estadístico de consumo fuera de horas de equipos de oficina (*plug-load equipment*). |
| **SMART 2020 Report** | Referencia de PoliSave | **CE-3 (Informe general):** Reporte global medioambiental de emisiones de carbono en TIC. |
| **Verdiem Surveyor / Cisco EnergyWise** | Referencias de PoliSave | **CE-3 (Producto comercial):** Enlaces a plataformas comerciales propietarias sin especificación de investigación abierta. |
| **nmap / Web PoliSave** | Referencias de PoliSave | **CE-3 (Herramienta / Web):** URLs de utilidades y repositorios web auxiliares. |

---

## 3. Fichas de Extracción Detalladas

### REF-01: Byon et al. (2015)
* **Título:** *An implementation of PC state management in IP networks*
* **Publicación:** 2015 International Conference on ICT Convergence (ICTC), pp. 1152-1154.
* **Autores:** Sungwon Byon, Eunjung Kwon, Eui-Suk Jung, Yong-Tae Lee, Won Ryu.
* **Mecanismo propuesto:** Marco de gestión de estados ACPI en PCs a través de redes IP. Utiliza paquetes mágicos Wake-on-LAN para el encendido bajo demanda y mensajes UDP de control para inducir modos de reposo/apagado y minimizar el consumo energético.
* **Implicación directa en OpSys:** Confirma que el control de energía basado puramente en red sin procesador de gestión fuera de banda presenta una asimetría técnica: el encendido se realiza por hardware de Capa 2 (independiente del SO), pero el apagado o suspensión exige que la pila de red del SO y un proceso receptor estén operativos. Si el equipo se encuentra desconfigurado, el mecanismo falla.

### REF-02: Wijekoon et al. (2011)
* **Título:** *The Advanced Remote PC Management Suite*
* **Publicación:** 2011 6th International Conference on Industrial and Information Systems (ICIIS), pp. 410-413.
* **Autores:** J. Wijekoon, M. Wijesundara, T. Dassanayaka, D. Samarathunga, R. Dissanayaka, D. Perera.
* **Mecanismo propuesto:** Suite de administración centralizada de PCs basada en hardware Intel Active Management Technology (Intel AMT). Implementa aprovisionamiento, monitorización, aislamiento de red y control de energía (encendido, reinicio, apagado forzado) a través de un canal fuera de banda (OOB) dedicado en el chipset.
* **Implicación directa en OpSys:** Constituye la evidencia bibliográfica de referencia para la gestión de PCs sin dependencia del sistema operativo. Sin embargo, su precondición indispensable es la presencia de procesadores vPro y firmware Intel AMT habilitado. Esta referencia fundamenta el descarte técnico de la gestión OOB en el proyecto OpSys, debido a la restricción física de fábrica de los 60 Dell OptiPlex (SKU 631-ADPL, fusibles FPF quemados en `DISABLE`).

### REF-03: Meagher et al. (2000)
* **Título:** *Design and implementation of ultra-low latency optical label switching for packet-switched WDM networks*
* **Publicación:** Journal of Lightwave Technology, Vol. 18, No. 12, pp. 1978-1995.
* **Autores:** B. Meagher, G. K. Chang, G. Ellinas, Y. M. Lin, et al.
* **Diagnóstico de aparición en búsqueda:** Apareció como falso positivo en búsquedas por coincidencia léxica en texto completo de términos de conmutación de paquetes (*switching*, *packet-switched*).
* **Dictamen:** Descartada formalmente por no pertenecer al dominio de gestión de estaciones de trabajo ni control de ciclo de vida.

### REF-04: Tavares et al. (2018)
* **Título:** *A Non-intrusive Approach for Smart Power Meter*
* **Publicación:** 2018 IEEE 16th International Conference on Industrial Informatics (INDIN), pp. 690-695.
* **Autores:** Hugo Tavares, Bruno Prado, Kalil Bispo, Daniel Dantas.
* **Diagnóstico de aparición en búsqueda:** Apareció debido al uso de términos de monitorización no invasiva (*non-intrusive*) y gestión energética (*power meter*, *remote management*).
* **Diagnóstico técnico:** El artículo describe un medidor inteligente basado en pinzas amperimétricas/sensores IoT para registrar consumo sin intervenir el cableado interno. No dispone de relés de corte ni capacidad de enviar órdenes de apagado a los ordenadores.
* **Dictamen:** Excluida para el mecanismo de control de energía. Sirve conceptualmente para distinguir entre observabilidad no invasiva (similar a la telemetría SNMP en switch de OpSys) y control operativo activo.

### REF-05: Chiaraviglio & Mellia (2010)
* **Título:** *PoliSave: Efficient Power Management of Campus PCs*
* **Publicación:** 2010 18th International Conference on Software, Telecommunications and Computer Networks (SoftCOM), pp. 82-87. IEEE.
* **Autores:** Luca Chiaraviglio, Marco Mellia (Politecnico di Torino).
* **Mecanismo propuesto:** Arquitectura web cliente-servidor orientada a reducir el consumo eléctrico de flotas de ordenadores en campus universitarios. Utiliza Wake-on-LAN para el encendido bajo demanda y despliega un agente cliente en los puestos para programar políticas de suspensión y apagado según la actividad y demanda de los usuarios.
* **Implicación directa en OpSys:** Es el antecedente académico más directo de gestión de puestos de aula y campus. Valida que el encendido por WoL es el estándar de facto, pero evidencia que el apagado automatizado en la literatura siempre ha requerido instalar software cliente en cada PC. Esto respalda que, bajo nuestro principio irrenunciable de arquitectura *Zero-Touch* y ante equipos sin AMT, el apagado no debe delegarse a una orden insegura del panel.

### REF-06: Brienza & Anastasi (2013)
* **Título:** *A sensor-based power management system for sustainable computing in large environments*
* **Publicación:** 2013 Sustainable Internet and ICT for Sustainability (SustainIT), pp. 1-4. IEEE.
* **Autores:** Simone Brienza, Giuseppe Anastasi (Universidad de Pisa).
* **Mecanismo propuesto:** Sistema de gestión energética en entornos amplios (oficinas, laboratorios) que emplea sensores de presencia ambiental (PIR) y detección de inactividad para inducir de forma autónoma el paso a modos de reposo/apagado en las estaciones de trabajo cuando los puestos quedan vacíos.
* **Implicación directa en OpSys:** Demuestra que la decisión de apagar o suspender puestos en entornos compartidos debe apoyarse en el contexto ambiental y de uso del aula (Modo Clase vs. Modo Práctica), evitando forzar órdenes manuales que dependan de la intervención constante del operador.

### REF-07: Chan Piseth, Oxley & Low Tan Jung (2012)
* **Título:** *Dynamic PC power state transitioning based on a monitoring service*
* **Publicación:** 2012 International Conference on Computer & Information Science (ICCIS), Vol. 1, pp. 237-241. IEEE.
* **Autores:** Chan Piseth, Alan Oxley, Low Tan Jung (Universiti Teknologi PETRONAS).
* **Mecanismo propuesto:** Modelo de transición dinámica entre estados de energía ACPI (S0 a S5) desacoplado de la interacción directa del usuario y gobernado por un servicio de monitorización y telemetría de red.
* **Implicación directa en OpSys:** Concuerda con el diseño de nuestro servicio de telemetría de Capa 1 + Capa 7, pero advierte que toda transición de energía ordenada por red hacia el host requiere un sistema operativo sano y cooperativo. Si la red lógica o el socket fallan, las órdenes hacia el autómata del host quedan bloqueadas.

### REF-08: Jimeno, Christensen & Nordman (2008)
* **Título:** *A Network Connection Proxy to Enable Hosts to Sleep and Save Energy*
* **Publicación:** 2008 IEEE 27th International Performance Computing and Communications Conference (IPCCC), pp. 401-410. IEEE.
* **Autores:** M. Jimeno, K. Christensen, B. Nordman (University of South Florida & LBNL).
* **Mecanismo propuesto:** Arquitectura de *Sleep Proxy* (Proxy de Conexión de Red) que mantiene la presencia de red de un host (respondiendo a ARP, ICMP y pings) mientras el PC permanece en estado de bajo consumo o apagado (S3/S5), despertándolo mediante Wake-on-LAN solo cuando llega tráfico relevante.
* **Implicación directa en OpSys:** Explica la asimetría fundamental de red analizada en nuestro proyecto: cuando un host se apaga, desaparece completamente de las capas superiores (ARP, TCP, HTTP), dejando ciego a cualquier gestor de software. Esto justifica por qué la Capa 1 física (SNMP en el switch docente) es la única fuente de verdad para saber si el host sigue físicamente conectado en la roseta.

### REF-09: Agarwal et al. (2009)
* **Título:** *Somniloquy: Augmenting Network Interfaces to Reduce PC Energy Usage*
* **Publicación:** 6th USENIX Symposium on Networked Systems Design and Implementation (NSDI '09), pp. 365-380. USENIX Association.
* **Autores:** Y. Agarwal, S. Hodges, J. Scott, R. Chandra, P. Bahl, R. Gupta (Microsoft Research & UC San Diego).
* **Mecanismo propuesto:** Arquitectura hardware-software que añade un microcontrolador embebido de muy bajo consumo a la tarjeta de red (NIC) del PC. Este procesador secundario ejecuta una pila de red ligera e independiente que procesa paquetes de gestión remota y órdenes de encendido/apagado mientras el procesador principal y el sistema operativo de la máquina permanecen apagados.
* **Implicación directa en OpSys:** Es la prueba experimental más concluyente de la literatura: para lograr control de energía sin agente en el sistema operativo principal, **es físicamente necesario un coprocesador secundario en el hardware de red**. Dado que nuestros Dell OptiPlex carecen tanto de hardware tipo Somniloquy como de Intel AMT activo (FPF en `DISABLE`), queda científicamente demostrado que no es posible implementar apagado fuera de banda sin modificar el hardware físico.

---

## 4. Síntesis para la Justificación de Arquitectura

El análisis estructurado de las referencias recuperadas en el proceso de bola de nieve (*snowballing*) concluye que:

1. **La vía estándar Fuera de Banda (OOB) (REF-02, REF-09)** requiere obligatoriamente un coprocesador embebido en placa o tarjeta de red (Intel AMT o microcontroladores tipo *Somniloquy*). Al venir los 60 Dell del laboratorio con fusibles FPF quemados de fábrica en modo `DISABLE`, esta categoría queda formal y físicamente descartada.
2. **La vía Lógica por Software de Red (REF-01, REF-05, REF-07)** sufre invariablemente de acoplamiento estricto con el sistema operativo (*fate sharing*) y exige la instalación y mantenimiento de un agente cliente local en cada máquina.
3. **El principio irrenunciable *Zero-Touch* de OpSys** prohíbe la inserción de scripts o agentes secundarios en los puestos. En situaciones donde el alumno rompe la configuración de red durante prácticas, cualquier orden de apagado remoto por red es inoperativa.
4. **La asimetría de red demostrada en REF-08** ratifica que mientras el encendido (Wake-on-LAN) es un mecanismo robusto de Capa 2 soportado por el chip PHY del PC apagado, el apagado por red no posee equivalente sin agentes.
5. **Decisión consolidada:** Se ratifica como óptima y científicamente fundada la arquitectura de [ADR-002](../ADR-002-acotamiento-control-energia-hardware.md): acotar el panel a **Supervisión de Capa 1 (SNMP) + Capa 7 (MeshAgent) y Encendido Remoto (WoL)**, modelando el apagado como un **evento manual/externo observado** por la telemetría del sistema.
