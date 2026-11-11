# ADR-002: Acotamiento de Control de Energía (WoL vs. Apagado), Realidad Hardware Dell y Justificación Científica

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha:** 2026-11-11
* **Fase:** RUP Inicio (Inception) — Modelo del Dominio
* **Estado:** Aprobado / Fundamentado Científicamente
* **Documento complementario:** [Matriz de Extracción y Evaluación de Literatura Científica](../matrices-documentales/matriz-referencias-apagado.md)

---

## 1. Contexto y Realidad Física del Hardware (Dell OptiPlex SKU 631-ADPL)

En el parque informático principal del laboratorio (60 estaciones de sobremesa Dell OptiPlex):
* **Fundido irreversible de fusibles (FPF):** El chipset Intel ME viene de fábrica en modo `DISABLE` (`INFO,RYLTY,ME,DISABLE,DAKAR`). Carecen de licencia y de procesador fuera de banda Intel AMT.
* **Consecuencia física:** Es **físicamente imposible enviar órdenes de apagado o control a nivel de hardware o placa base**. Cualquier apagado remoto por red depende al 100% de que el sistema operativo (Windows/Linux) esté arrancado, tenga red funcional y ejecute el servicio MeshAgent.
* **Encendido Wake-on-LAN (WoL):** Es una capacidad de hardware puro de Capa 2 (Broadcast / Magic Packet). El chip PHY de la tarjeta de red se mantiene energizado a 5V en standby ($S5$) y enciende la máquina sin requerir agente ni sistema operativo previo.

---

## 2. Fundamentación Científica: La Asimetría de Red entre Encendido y Apagado

La literatura especializada en gestión de redes y energía de ordenadores personales identifica una asimetría estructural fundamental entre las operaciones de encendido y apagado:

### 2.1. Encendido en Capa 2 (Hardware Puro en S5)
Como demuestran Byon et al. [1] y Jimeno et al. [2], la reactivación remota mediante *Wake-on-LAN* opera a nivel de **Capa de Enlace (Capa 2)**. Cuando el host se encuentra en estado de apagado ACPI $S5$, el transceptor PHY de la interfaz de red permanece a la escucha del patrón binario del *Magic Packet* (16 repeticiones de la dirección MAC). Al detectarlo, el hardware genera una señal eléctrica directa al conector de alimentación de la placa base, iniciando el encendido sin necesidad de sistema operativo, pila TCP/IP, resolución de nombres ni autenticación previa [2].

### 2.2. Apagado en Capa 7 (Dependencia de la Pila Completa)
A diferencia del encendido, los estándares de red no disponen de un mecanismo nativo de "paquete mágico de apagado" [2]. Para inducir el apagado o suspensión a través de tráfico de red estándar, se requiere la concurrencia de la pila completa:
1. Enlace físico y lógico operativo en Capa 3 (enrutamiento IP y DHCP válido).
2. Capa de Transporte (Capa 4) funcional mediante sockets TCP o UDP [1].
3. Capa de Aplicación (Capa 7) activa con canal cifrado (WebSocket/TLS).
4. Núcleo (*kernel*) del sistema operativo responsivo y libre de bloqueos.
5. Proceso demonio o agente residente en ejecución local con permisos de superusuario para ordenar las llamadas del sistema (`ExitWindowsEx` o `systemctl poweroff`) [3], [4].

Esta discrepancia produce una **asimetría operativa crítica**: el panel puede encender de manera fiable y determinista cualquier máquina conectada, pero carece de un canal simétrico para ordenarle el apagado por red si alguna de las capas superiores falla [1], [2].

---

## 3. Inviabilidad de la Vía Fuera de Banda (*Out-of-Band* / OOB)

La investigación científica establece de forma canónica que el control energético independiente del sistema operativo exige arquitecturas Fuera de Banda (OOB):

* **Sistemas OOB Industriales:** Wijekoon et al. [5] demuestran que la gestión remota fiable de estaciones de trabajo (apagado forzado, reinicio y aislamiento de red en puestos congelados o con fallos de configuración) requiere obligatoriamente microcontroladores integrados en el chipset como **Intel AMT** bajo la plataforma vPro.
* **Coprocesamiento Dedicado en la NIC:** En investigaciones experimentales avanzadas sobre control energético de PCs, como la arquitectura *Somniloquy* desarrollada por Agarwal et al. [6] (Microsoft Research / USENIX NSDI), se demostró que para procesar comandos de red con el host apagado o inaccesible es físicamente necesario **añadir un coprocesador secundario embebido en la propia tarjeta de red**.

### Dictamen Técnico para OpSys:
Dado que el lote Dell OptiPlex (SKU 631-ADPL) tiene los fusibles FPF quemados de fábrica en modo `DISABLE` [8], [9], no dispone de procesador Intel AMT ni hardware secundario tipo *Somniloquy* [6]. **La vía fuera de banda queda formal y físicamente descartada** [5], [6], [8], [9].

---

## 4. Inviabilidad de la Vía Lógica (*In-Band*): *Fate Sharing* y Principio *Zero-Touch*

Descartada la vía OOB, la literatura universitaria recurre a soluciones lógicas dentro de banda (*In-Band*), tales como *PoliSave* (Chiaraviglio & Mellia [3]) o modelos de transición ACPI dirigidos por telemetría (Chan Piseth et al. [4]). No obstante, este enfoque resulta inviable en el laboratorio docente por dos razones estructurales:

### 4.1. Destino Compartido (*Fate Sharing*) en Escenarios de Prácticas
En un laboratorio de redes y sistemas, los alumnos modifican asignaciones de IP, configuran máscaras erróneas, detienen servicios del sistema o trasladan el cable a la red aislada de prácticas:
* El agente pierde contacto con el servidor de control y el host transiciona a **`FALLO_LOGICO` / `DESCONFIGURADO`**.
* En este estado, el canal de control por donde viajaría la orden de apagado queda interrumpido (*fate sharing*: el mecanismo de control comparte el destino del sistema supervisado) [4].
* Reiniciar o apagar la máquina no corrige la avería: Windows almacena las configuraciones de red de manera persistente en el Registro. Al arrancar de nuevo, el equipo reproduce el fallo y vuelve a caer en `DESCONFIGURADO`.

### 4.2. Ruptura del Principio *Zero-Touch*
El marco de requisitos de OpSys prohíbe taxativamente la instalación de scripts, tareas programadas o agentes secundarios en los clientes. Desplegar demonios locales de apagado vulneraría el principio *Zero-Touch*, introduciría brechas de seguridad en equipos multi-usuario y acarrearía una sobrecarga de mantenimiento frente a actualizaciones del SO o arranques duales [3].

---

## 5. Decisión de Negocio y Arquitectura: Retiro del Apagado Remoto del Panel

Ofrecer un botón interactivo de "Apagado Remoto" en el panel constituiría una **falsa promesa de control**: la interfaz ofrecería una acción que el sistema no puede garantizar precisamente cuando el puesto presenta fallos o desconfiguraciones [4].

### Decisiones Adoptadas:
1. **Acotar el panel a Observabilidad en Tiempo Real + Encendido Remoto (WoL):** Se explotan exclusivamente las capacidades fiables y no invasivas de Capa 1 (SNMP en switch docente) y Capa 2 (Magic Packet Ethernet) [1], [2].
2. **El apagado se modela como evento manual/externo observado:** El panel detecta y refleja cuándo un puesto ha sido apagado (mediante *Inicio $\to$ Apagar* al concluir la clase o pulsación del botón de la torre), pero no remite órdenes de apagado por red.

---

## 6. Implicaciones en el Diagrama de Estados del Host (`diagrama-estados-host.puml`)

El autómata de estados refleja esta realidad mediante dos patrones clave:

1. **Doble rama en el encendido desde `APAGADO`:**
   Reconoce que emitir WoL no garantiza que el sistema operativo arranque en condiciones óptimas:
   ```plantuml
   APAGADO -right-> OPERATIVO : Encender [agente conecta]
   APAGADO -right-> DESCONFIGURADO : Encender [sin agente / IP errónea]
   ```
2. **Transiciones de apagado como eventos observados:**
   ```plantuml
   OPERATIVO -left-> APAGADO : Apagado manual (local / alumno)
   DESCONFIGURADO -left-> APAGADO : Apagado manual (forzado en torre)
   ```
   En el estado `OPERATIVO` no se prescribe la acción de apagado remoto.

---

## 7. Exclusión de Entidades Tecnológicas de Red (`Switch` y `PuertoSwitch`)

Se ratifica formalmente mantener al `Switch` y al `PuertoSwitch` fuera del Modelo del Dominio:
* **Frontera del Dominio (*Bounded Context*):** El sistema supervisa puestos de trabajo y ocupación para la docencia; no es una plataforma NMS de gestión de infraestructura de red.
* **Separación Hexagonal:** El switch actúa como una sonda de Capa 1 y reside en la capa de adaptadores de infraestructura (`daemon/infrastructure/network/SnmpSwitchProvider.js`).
* **La Toma como Atributo:** La roseta RJ-45 es un elemento físico pasivo de la mesa sin comportamiento propio; se modela como un atributo estático `toma` en la entidad `Puesto`.

---

## 8. Acciones Masivas (Encendido en Bloque)

El soporte para operaciones masivas sobre múltiples máquinas (ej. encender todo el aula mediante WoL al inicio de la jornada):
* **No requiere clases conceptuales adicionales:** La agregación `Laboratorio *-- Puesto o-- Host` ya agrupa naturalmente todos los equipos bajo el Aggregate Root `Laboratorio`.
* El encendido masivo es un **flujo de Caso de Uso** que itera sobre la colección existente, sin necesidad de introducir clases artificiales como `Grupo` o `Lote`.

---

## 9. Cuadro Comparativo de Alternativas Evaluadas

| Enfoque | Requisito Técnico (Literatura) | Situación en el Laboratorio | Dictamen de Diseño |
| :--- | :--- | :--- | :---: |
| **Fuera de Banda (OOB)** | Chipset Intel AMT / Coprocesador en NIC [5], [6], [8], [9] | Dell SKU 631-ADPL con fusibles FPF quemados en `DISABLE` | **Descartada** (Inviable físicamente) |
| **Lógica por Red (In-Band)** | Agente local en SO y red TCP/IP funcional [1], [3], [4] | Violación de *Zero-Touch* y fallo por *fate sharing* en prácticas | **Descartada** (Inviable operativamente) |
| **Corte Eléctrico Externo** | Smart PDUs o relés conmutados por toma [7] | Mobiliario docente convencional sin regletas gestionables | **Descartada** (Requiere inversión física externa) |
| **Observabilidad + WoL** | MIB-II SNMP en switch (L1) + Magic Packet (L2) [1], [2] | Soportado nativamente por la infraestructura y las NICs Dell | **Aprobada** (Arquitectura de OpSys) |

---

## 10. Referencias Bibliográficas

* **[1]** S. Byon, E. Kwon, E.-S. Jung, Y.-T. Lee, and W. Ryu, "An implementation of PC state management in IP networks," in *Proc. 2015 International Conference on Information and Communication Technology Convergence (ICTC)*, Jeju Island, Korea, 2015, pp. 1152–1154, doi: [10.1109/ICTC.2015.7354699](https://doi.org/10.1109/ICTC.2015.7354699).
* **[2]** M. Jimeno, K. Christensen, and B. Nordman, "A Network Connection Proxy to Enable Hosts to Sleep and Save Energy," in *Proc. 2008 IEEE 27th International Performance Computing and Communications Conference (IPCCC)*, Austin, TX, 2008, pp. 401–410, doi: [10.1109/PCCC.2008.4745124](https://doi.org/10.1109/PCCC.2008.4745124).
* **[3]** L. Chiaraviglio and M. Mellia, "PoliSave: Efficient Power Management of Campus PCs," in *Proc. 18th International Conference on Software, Telecommunications and Computer Networks (SoftCOM 2010)*, Bol, Croatia, 2010, pp. 82–87.
* **[4]** C. Piseth, A. Oxley, and L. T. Jung, "Dynamic PC power state transitioning based on a monitoring service," in *Proc. 2012 International Conference on Computer & Information Science (ICCIS)*, Kuala Lumpur, Malaysia, 2012, vol. 1, pp. 237–241, doi: [10.1109/ICCISci.2012.6297247](https://doi.org/10.1109/ICCISci.2012.6297247).
* **[5]** J. Wijekoon, M. Wijesundara, T. Dassanayaka, D. Samarathunga, R. Dissanayaka, and D. Perera, "The Advanced Remote PC Management Suite," in *Proc. 2011 6th International Conference on Industrial and Information Systems (ICIIS)*, Kandy, Sri Lanka, 2011, pp. 410–413, doi: [10.1109/ICIINFS.2011.6038103](https://doi.org/10.1109/ICIINFS.2011.6038103).
* **[6]** Y. Agarwal, S. Hodges, J. Scott, R. Chandra, P. Bahl, and R. Gupta, "Somniloquy: Augmenting Network Interfaces to Reduce PC Energy Usage," in *Proc. 6th USENIX Symposium on Networked Systems Design and Implementation (NSDI '09)*, Boston, MA, 2009, pp. 365–380.
* **[7]** S. Brienza and G. Anastasi, "A sensor-based power management system for sustainable computing in large environments," in *Proc. 2013 Sustainable Internet and ICT for Sustainability (SustainIT)*, Palermo, Italy, 2013, pp. 1–4, doi: [10.1109/SustainIT.2013.6685197](https://doi.org/10.1109/SustainIT.2013.6685197).
* **[8]** X. Ruan, *Platform Embedded Security Technology Revealed: Safeguarding the Future of Computing with Intel Embedded Security and Management Features*. New York, NY: Apress / Springer, 2014, doi: [10.1007/978-1-4302-6572-6](https://doi.org/10.1007/978-1-4302-6572-6).
* **[9]** Intel Corporation, "Intel CSME Security Advisory White Paper," Intel Technical Document, Dec. 2017. [En línea]. Disponible en: [https://www.intel.com/content/dam/www/public/us/en/security-advisory/documents/intel-csme-security-white-paper.pdf](https://www.intel.com/content/dam/www/public/us/en/security-advisory/documents/intel-csme-security-white-paper.pdf).
