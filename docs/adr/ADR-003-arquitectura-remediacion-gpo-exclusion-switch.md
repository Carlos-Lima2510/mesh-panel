# ADR-003: Arquitectura de Remediación de Red (GPO Startup con Rollback vs. Bajo Demanda) y Exclusión del Switch en el Dominio

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha:** 2026-11-11
* **Fase:** RUP Inicio (Inception) — Modelo del Dominio y Arquitectura
* **Estado:** **DEPRECADA PARCIALMENTE** por [ADR-004](ADR-004-inclusion-switch-asignacion-distribuciones.md) (Decisión 2 superada por la inclusión de `Switch` para soporte de aulas híbridas) / **VIGENTE** en Decisiones 1, 3, 4 y 5 (Remediación GPO Startup con Rollback transaccional y Políticas de Energía).
* **Documentos complementarios:**
  * [ADR-001: Justificación y Acotamiento de Acciones](ADR-001-acotamiento-acciones-trazabilidad.md)
  * [ADR-002: Acotamiento de Control de Energía y Hardware Dell](ADR-002-acotamiento-control-energia-hardware.md)
  * [ADR-004: Inclusión de Switch y Asignación Granular en Distribuciones](ADR-004-inclusion-switch-asignacion-distribuciones.md)
  * [Dossier Técnico DOC-01: Windows Internals y DHCP](../doc/DOC-01-microsoft-windows-internals-dhcp-wol.md)
  * [Matriz Documental General](../matriz-documental-general.md)

---

## 1. Contexto y Realidad Física del Laboratorio

El laboratorio docente cuenta con 60 puestos cliente Dell OptiPlex (SKU 631-ADPL sin Intel AMT). En cada mesa convive una doble realidad física:
1. **La dinámica de los 2 Cables:**
   * **Cable 1 (Universidad):** Nace en la roseta docente fija de la mesa (`Puesto.toma`) conectada al switch gestionado (SNMP).
   * **Cable 2 (Prácticas):** Conectado al switch aislado de prácticas (físicamente no gestionado o inaccesible por red).
   * Para realizar prácticas de redes, el alumno desconecta el Cable 1 de la torre y conecta el Cable 2, dejando el Cable 1 suelto.
2. **La Persistencia en Windows:**
   * Cuando los alumnos configuran direcciones IP estáticas o parámetros erróneos durante las prácticas, Windows los persiste en el Registro (`HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\{GUID}`).
   * Al regresar a la red universitaria, si el equipo mantiene una IP estática rota, no puede obtener concesión ni comunicar con MeshCentral (`conn = 0`), transicionando a **`FALLO_LOGICO`**.

---

## 2. Decisión 1: Inviabilidad de la Remediación Remota Bajo Demanda (*On-Demand*)

Se evalúa la posibilidad de incorporar en el panel un control interactivo de "Remediación Bajo Demanda" (`REMEDIAR_DHCP` / `Restaurar Red`).

### 2.1. Dictamen de Ingeniería: Falsa Promesa de Control
* **Paradoja de Transmisión y *Fate Sharing* (Chan Piseth et al. [1], Jimeno et al. [2]):**  
  Para que una orden remota de remediación por red alcance al puesto cliente, se requiere una pila de red funcional en Capas 3, 4 y 7. Si el equipo se encuentra precisamente en `FALLO_LOGICO` (APIPA `169.254.x.x` o subred ajena de prácticas), **no existe canal IP por donde entregar la orden** (Baikole et al. [3], Chen [4]).
* **El Reinicio de Boca (*Port Bounce*) es Ineficaz:**  
  Forzar desde el switch docente la caída y subida de la boca (`ifAdminStatus 2 -> 1`) conforme a RFC 2863 [5] genera un evento *Media Connect* en Windows, pero **no elimina una dirección IP estática escrita en el Registro**. Windows vuelve a levantar la interfaz con la misma IP rota.
* **Violación de *Zero-Touch*:**  
  Intentar remediación bajo demanda sin IP obligaría a instalar demonios secundarios con acceso a hardware o puertas traseras inseguras en las 60 máquinas.

### Conclusión:
Se descarta la remediación remota bajo demanda desde el panel. **El panel OpSys se acota exclusivamente a la Observabilidad y Diagnóstico determinista** (detectar y señalizar en < 15 ms la máquina en 🟡 `FALLO_LOGICO`), delegando la remediación al ciclo de vida del sistema operativo.

---

## 3. Decisión 2: Exclusión del Switch del Modelo del Dominio y `toma` como Atributo de `Puesto`

> [!WARNING]
> **DECISIÓN SUPERADA / DEPRECADA POR [ADR-004](ADR-004-inclusion-switch-asignacion-distribuciones.md)**  
> Con fecha 2026-11-14, tras revisión con la dirección académica del TFG y análisis de escenarios de **aulas híbridas** (subgrupos donde unos puestos operan en la red docente y otros en la red de prácticas simultáneamente), esta decisión ha sido superada. La entidad `Switch` se incorpora al Modelo del Dominio asumiendo responsabilidades de capacidad, no-colisión de puertos y semántica de red, integrándose con el modelo de `Distribucion`.

Se ratifica formalmente en esta versión preliminar mantener a las entidades `Switch` y `PuertoSwitch` fuera del Modelo del Dominio de clases:

1. **Frontera del Dominio (*Bounded Context* en DDD) [16]:**  
   OpSys supervisa puestos de trabajo y ocupación para la docencia; no es un sistema NMS de telecomunicaciones.
2. **Separación Hexagonal:**  
   El switch es una sonda externa de telemetría de Capa 1 y reside en la capa de adaptadores de infraestructura (`daemon/infrastructure/network/SnmpSwitchProvider.js`).
3. **La Asimetría del Switch de Prácticas (La Trampa del Objeto Ciego):**  
   El switch de prácticas es no gestionado o deliberadamente aislado (Caicedo & Cerroni [7], Albee et al. [8]). Si el switch fuese una entidad del dominio, el sistema se vería forzado a instanciar entidades "fantasma" sin datos de telemetría o relaciones nulas cada vez que el alumno conmuta al Cable 2. En su lugar, el dominio modela la entidad conceptual **`Red`** (`esAislada: Boolean`) y desambigua el estado mediante el contexto operativo del aula (**`ModoOperativo: CLASE vs. PRACTICA`**).
4. **La `toma` como Atributo Pasivo de `Puesto`:**  
   La roseta RJ-45 (ej. `"D-04"`) es un elemento pasivo fijado físicamente a la mesa (`Puesto`). No posee comportamiento propio, por lo que se modela como un atributo de texto (`toma: String`). Permanece siempre visible en el panel para garantizar la trazabilidad cuando el alumno debe retirar el Cable 2 y volver a conectar el Cable 1 oficial al terminar la clase.

---

## 4. Decisión 3: Arquitectura de GPO — Script de Inicio (*Startup*) vs. Apagado (*Shutdown*)

Para la autorreparación automática de los puestos, se comparan los dos momentos de ejecución por directiva de grupo (GPO) (Microsoft Learn [13]):

| Criterio Técnico | Script de Apagado (*Shutdown Script*) | Script de Inicio (*Startup Script*) |
| :--- | :--- | :--- |
| **Resiliencia ante botón forzado de la torre** | ❌ **Nula:** Si el alumno apaga manteniendo el botón de la torre 5 s, Windows no lo ejecuta. | 🟢 **Total:** Se ejecuta de forma determinista cada vez que Windows arranca. |
| **Seguridad y Privilegios** | ⚠️ Requiere elevación o credenciales administrativas especiales. | 🟢 Ejecuta bajo contexto nativo **`NT AUTHORITY\SYSTEM`** (Cero credenciales expuestas). |
| **Tolerancia a Cable 2 en Prácticas** | ❌ Puede bloquear el apagado durante 10 minutos por *timeouts* de red. | 🟢 Ejecuta a nivel de kernel/NDIS local de forma instantánea. |
| **Garantía para la siguiente clase** | ❌ Aleatoria y frágil. | 🟢 **Determinista (100% garantizado).** |

### Conclusión:
Se adopta el **Script de Inicio de Equipo (*Startup Script GPO*) bajo `NT AUTHORITY\SYSTEM`** como el mecanismo de autorreparación arquitectónicamente robusto.

---

## 5. Decisión 4: Patrón Transaccional con Rollback (Protección de Prácticas)

### 5.1. El Dilema del Reinicio a Mitad de Práctica
Si un alumno reinicia su ordenador en mitad de una sesión de laboratorio con el Cable 2 conectado, un script de inicio ciego que forzase DHCP borraría su configuración de prácticas, dejándolo en APIPA y destruyendo su trabajo.

### 5.2. Especificación del Algoritmo con Rollback
Para evitar la trampa de Capa 3 (donde una IP rota impide hacer ping a la red docente), el script implementa una **transacción a nivel de Capa 2 (RFC 2131 [6], RFC 2863 [5])**:

1. **Snapshot:** Guarda la IP y Gateway actuales en variables locales de memoria.
2. **Prueba activa DHCP:** Configura temporalmente DHCP y emite un broadcast `DHCPDISCOVER`.
3. **Evaluación de Subred:**
   * Si el servidor DHCP de la universidad responde con una concesión institucional (`10.x.x.x`):  
     $\implies$ **Confirmado Cable 1 (Universidad):** Se consolida DHCP permanente y se resetea DNS. La máquina se autorrepara y transiciona a 🟢 **`OPERATIVO`**.
   * Si nadie responde y Windows degrada a APIPA (`169.254.x.x`):  
     $\implies$ **Confirmado Cable 2 (Prácticas Aisladas):** Se ejecuta **Rollback**, reinyectando de inmediato la IP estática que el alumno estaba usando. La práctica persiste intacta.

---

## 6. Decisión 5: Eficiencia Energética, Standby ($S5$) y Encendido Escalonado

1. **Desmitificación del Consumo de Arranque:**  
   El mito de que "arrancar consume más que dejar encendido" es falso en hardware moderno (Brienza & Anastasi [9], Chiaraviglio & Mellia [10]). Un Dell OptiPlex en reposo (*Idle*) consume ~25 W, mientras que en $S5$ consume ~1 W (Byon et al. [11], Intel AP-468 [15]). Un periodo de inactividad de solo **90 segundos** en reposo ya gasta más energía que todo el ciclo de apagado y reencendido.
2. **Política de Reposo del Aula:**  
   En huecos lectivos de más de 45 minutos, noches y fines de semana, los equipos deben apagarse a $S5$, reduciendo la potencia demandada por el aula de **1.500 W a solo 60 W (ahorro del 96%)**.
3. **Encendido Masivo Escalonado por WoL (Protección Eléctrica y de Red):**  
   Para evitar saltos de magnetotérmicos por corriente de choque (*inrush current*) de 60 fuentes ATX simultáneas y prevenir tormentas de difusión DHCP (60 solicitudes `DHCPDISCOVER` en el mismo milisegundo) (Chen [4], Qalandarov et al. [12]), el panel OpSys implementa el encendido masivo mediante **ráfagas escalonadas por lotes de puestos con retardo de 500 ms** (Microsoft Learn [14]).
4. **Política de Puestos Abandonados:**  
   Se complementa con una directiva GPO de reinicio automático tras 15 minutos en pantalla de bloqueo/inactividad para puestos desatendidos.

---

## 7. Cuadro Resumen de Decisiones

| Problema Analizado | Alternativa Descartada | Decisión Aprobada | Justificación Técnica Principal |
| :--- | :--- | :--- | :--- |
| **Remediación de Fallo Lógico** | Botón interactivo de remediación remota en el panel | Autorreparación en el arranque (GPO Startup) | *Fate Sharing:* Una máquina sin IP no puede recibir órdenes de red remotas [1], [2], [3]. |
| **Modelado de Infraestructura** | Clases `Switch` y `PuertoSwitch` en el dominio | Adaptador `SnmpSwitchProvider` y `Puesto.toma` | DDD Bounded Context [16] y asimetría de switch de prácticas inaccesible [7], [8]. |
| **Punto de Ejecución de GPO** | Script de apagado (*Shutdown*) | Script de inicio (*Startup*) en `SYSTEM` | Resiliencia ante apagados forzados con el botón de la torre [13]. |
| **Reinicio durante Prácticas** | Reseteo ciego incondicional a DHCP | Patrón Transaccional con Rollback | Evita machacar la IP estática del alumno si reinicia con Cable 2 (RFC 2131 [6]). |
| **Encendido Masivo del Aula** | Disparo simultáneo de 60 paquetes WoL | Encendido masivo escalonado por lotes | Mitiga picos eléctricos (*inrush*) [9], [10] y tormentas de broadcast DHCP [4], [12]. |

---

## 8. Referencias Bibliográficas

* **[1]** C. Piseth, A. Oxley, and L. T. Jung, "Dynamic PC power state transitioning based on a monitoring service," in *Proc. 2012 International Conference on Computer & Information Science (ICCIS)*, Kuala Lumpur, Malaysia, 2012, vol. 1, pp. 237–241, doi: [10.1109/ICCISci.2012.6297247](https://doi.org/10.1109/ICCISci.2012.6297247).
* **[2]** M. Jimeno, K. Christensen, and B. Nordman, "A Network Connection Proxy to Enable Hosts to Sleep and Save Energy," in *Proc. 2008 IEEE 27th International Performance Computing and Communications Conference (IPCCC)*, Austin, TX, 2008, pp. 401–410, doi: [10.1109/PCCC.2008.4745124](https://doi.org/10.1109/PCCC.2008.4745124).
* **[3]** B. Baikole, Y. P. Pasrun, and L. O. M. F. Aksara, "VLAN Optimization for Security and Efficiency in Educational Institutions using LLDP and SNMP," *Int. J. Intell. Comput. Optim. Manag. (IJICOM)*, vol. 8, no. 1, pp. 226–236, 2026, doi: [10.35842/ijicom.v8i1.226](https://doi.org/10.35842/ijicom.v8i1.226).
* **[4]** X. Chen, "Research on Campus Network DHCP Service Security and Performance," in *Proc. 2015 International Conference on Education, Sports, Arts and Computer (ESAC-15)*, 2015, pp. 48–51, doi: [10.2991/esac-15.2015.12](https://doi.org/10.2991/esac-15.2015.12).
* **[5]** K. McCloghrie and F. Kastenholz, "The Interfaces Group MIB," RFC 2863, Standards Track, Jun. 2000, doi: [10.17487/RFC2863](https://www.rfc-editor.org/rfc/rfc2863).
* **[6]** R. Droms, "Dynamic Host Configuration Protocol," RFC 2131, Standards Track, Mar. 1997, doi: [10.17487/RFC2131](https://www.rfc-editor.org/rfc/rfc2131).
* **[7]** J. M. Caicedo and W. Cerroni, "A laboratory architecture for networking education," in *Proc. 2009 39th IEEE Frontiers in Education Conference (FIE)*, San Antonio, TX, 2009, pp. 1–6, doi: [10.1109/FIE.2009.5350782](https://doi.org/10.1109/FIE.2009.5350782).
* **[8]** P. Albee et al., "Design of an isolated multi-purpose networking laboratory," in *Proc. 8th ACM SIGITE Conf. Inf. Technol. Educ. (SIGITE '07)*, Destin, FL, 2007, pp. 119–124, doi: [10.1145/1324302.1324321](https://doi.org/10.1145/1324302.1324321).
* **[9]** S. Brienza and G. Anastasi, "A sensor-based power management system for sustainable computing in large environments," in *Proc. 2013 Sustainable Internet and ICT for Sustainability (SustainIT)*, Palermo, Italy, 2013, pp. 1–4, doi: [10.1109/SustainIT.2013.6685197](https://doi.org/10.1109/SustainIT.2013.6685197).
* **[10]** L. Chiaraviglio and M. Mellia, "PoliSave: Efficient Power Management of Campus PCs," in *Proc. 18th International Conference on Software, Telecommunications and Computer Networks (SoftCOM 2010)*, Bol, Croatia, 2010, pp. 82–87.
* **[11]** S. Byon, E. Kwon, E.-S. Jung, Y.-T. Lee, and W. Ryu, "An implementation of PC state management in IP networks," in *Proc. 2015 International Conference on Information and Communication Technology Convergence (ICTC)*, Jeju Island, Korea, 2015, pp. 1152–1154, doi: [10.1109/ICTC.2015.7354699](https://doi.org/10.1109/ICTC.2015.7354699).
* **[12]** S. Qalandarov, D. Saidov, and K. Olimov, "Performance Analysis of Asynchronous Hybrid Polling Mechanisms in Network Management," *MDPI Telecom*, vol. 7, no. 6, pp. 143–158, 2026, doi: [10.3390/telecom7060143](https://doi.org/10.3390/telecom7060143).
* **[13]** Microsoft Corporation, "Troubleshoot problems on the DHCP client," *Microsoft Learn*, 2024. [En línea]. Disponible en: [https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshoot-dhcp-client](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshoot-dhcp-client).
* **[14]** Microsoft Corporation, "Wake on LAN (WOL) behavior in Windows 10 and 11," *Microsoft Learn*, 2024. [En línea]. Disponible en: [https://learn.microsoft.com/es-es/troubleshoot/windows-client/setup-upgrade-and-drivers/wake-on-lan-feature](https://learn.microsoft.com/es-es/troubleshoot/windows-client/setup-upgrade-and-drivers/wake-on-lan-feature).
* **[15]** Intel Corporation, "LOM Design Guide (Application Note AP-468)," Intel Corp., Order No. 278696-002, 2002.
* **[16]** E. Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Boston, MA: Addison-Wesley, 2003.
