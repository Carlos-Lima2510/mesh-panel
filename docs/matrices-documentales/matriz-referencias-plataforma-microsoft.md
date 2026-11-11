# Matriz Específica MDE-02: Plataforma Microsoft Learn, Windows Internals y Diagnóstico de Red

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha:** 2026-11-11
* **Fase:** RUP Inicio (Inception) — Evidencia de Plataforma y Sistema Operativo Cliente
* **Ámbito del Sistema:** 60 estaciones Dell OptiPlex (Windows 10/11 Enterprise/Education) conectadas a red docente y red aislada.
* **Propósito:** Evaluar con rigor técnico la documentación oficial del fabricante del sistema operativo cliente (Microsoft), fundamentando las causas de `FALLO_LOGICO`, el descarte de scripts invasivos (*Zero-Touch*) y las condiciones indispensables para la fiabilidad de Wake-on-LAN (*Fast Startup*).
* **Dossier Técnico Completo:** [DOC-01-microsoft-windows-internals-dhcp-wol.md](../doc/DOC-01-microsoft-windows-internals-dhcp-wol.md)

---

## 1. Criterios de Evaluación para Documentación de Fabricante (Microsoft)

* **CI-DOC-1 (Especificación Oficial del Fabricante):** Documentación técnica directa de Microsoft Learn, Windows Internals o APIs Win32/NDIS aplicable a Windows 10/11.
* **CI-DOC-2 (Diagnóstico de Red y Pila de Protocolos):** Especificación de canales de eventos, códigos de error y cmdlets de inspección de adaptadores de red.
* **CI-DOC-3 (Control Energético y Estados ACPI):** Documentación del comportamiento de apagado híbrido (*Fast Startup*), reactivación por red (*Magic Packet*) y transiciones de estados del dispositivo ($D0$ a $D3$).
* **CE-DOC-1 (Soluciones de Terceros / Foros no Oficiales):** Artículos de blogs no contrastados o scripts comunitarios sin garantía de especificación oficial.
* **CE-DOC-2 (Ámbito Exclusivo Azure / Cloud):** Documentación de virtualización en la nube sin aplicabilidad a clientes de sobremesa físicos (*bare-metal*).

---

## 2. Matriz Consolidada de Documentación Técnica Evaluada

| Ref ID | Título Oficial y URL Canónica | Componente Técnico Analizado | Impacto en la Pila del Cliente | Estado | Aportación Concreta al Proyecto OpSys |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **DOC-MS-01** | *Troubleshoot problems on the DHCP client*<br>[Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshoot-dhcp-client) | `Dhcp-Client/Admin`<br>`Dhcp-Client/Operational` | Asignación de IP, pérdida de lease y degradación APIPA (`169.254.x.x`) | **INCLUIDA** | Fundamenta la transición al estado **`FALLO_LOGICO` / `AMARILLO`**. Explica los Event IDs 1001 y 1002 al mover el cable a la red de prácticas sin DHCP. |
| **DOC-MS-02** | *Wake on LAN (WOL) behavior in Windows 10 and 11*<br>[Microsoft Learn](https://learn.microsoft.com/es-es/troubleshoot/windows-client/setup-upgrade-and-drivers/wake-on-lan-feature) | *Fast Startup* (Arranque Rápido) vs. Apagado Clásico ($S4$ vs. $S5$) | Desarme del adaptador de red en $D3_{cold}$ por política del kernel | **INCLUIDA** | **Demuestra que por defecto Windows desarma el WoL al apagar**. Obliga a documentar la directiva GPO de desactivación de *Fast Startup* para que el panel pueda encender el aula. |
| **DOC-MS-03** | *System Power States & Wake-on-LAN Behavior*<br>[Microsoft Win32 Documentation](https://learn.microsoft.com/es-es/windows/win32/power/system-power-states#wake-on-lan-behavior) | Estados ACPI ($S0$–$S5$) y Device Power States ($D0$–$D3$) | Filtrado de patrones Magic Packet en estado de bajo consumo | **INCLUIDA** | Especifica la interacción entre el Administrador de Energía del SO y el transceptor PHY de la placa base alimentado a 5VSB. |

---

## 3. Fichas de Extracción Técnica

### DOC-MS-01: Troubleshoot problems on the DHCP client
* **Canales Analizados:** 
  * `Microsoft-Windows-DHCP Client Events/Admin`
  * `Microsoft-Windows-DHCP Client Events/Operational`
* **Eventos Clave:**
  * **Event ID 1001:** *“Your computer was not assigned an address from the network (by the DHCP Server) for the Network Card with network Address...”* (Fallo en la fase `INIT` / `SELECTING`).
  * **Event ID 1002:** *“The IP address lease [...] has been lost...”* (Pérdida de concesión al desconectar de la red docente o vencer temporizador $T2$).
  * **Event ID 50042:** Registro de transiciones operacionales y fallos de actualización DDNS al cambiar de subred.
* **Correlación Arquitectónica:** Cuando el switch docente registra `ifOperStatus = UP (1)` pero MeshAgent no conecta, este documento valida que la causa raíz es la degradación local de la pila a APIPA, modelada en el autómata de OpSys como `FALLO_LOGICO`.

---

### DOC-MS-02: Wake on LAN (WOL) behavior in Windows 10 and Windows 11
* **Problema Identificado en el Fabricante:**
  * En Windows 10 y 11, el comportamiento de apagado predeterminado es el **Apagado Híbrido (*Fast Startup*)**, clasificado como estado ACPI $S4$.
  * En este estado, Windows ordena a los controladores de red transicionar a $D3$ y **desarma explícitamente el soporte de Wake-on-LAN** para garantizar un consumo nulo y prevenir reactivaciones no solicitadas.
* **Requisito Técnico Indispensable en OpSys:**
  * Para que el panel de control pueda encender remotamente las 60 estaciones Dell OptiPlex desde el estado de apagado ordinario, la infraestructura del laboratorio debe aplicar la directiva de sistema:
    ```ini
    [HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Power]
    "HiberbootEnabled"=dword:00000000
    ```
  * Desactivar *Fast Startup* fuerza a Windows a realizar un apagado ACPI $S5$ real, permitiendo que la UEFI/BIOS mantenga el chip PHY energizado a la escucha del *Magic Packet*.

---

### DOC-MS-03: System Power States and Wake-on-LAN Behavior
* **Especificación de Estados:**
  * Define la matriz de correspondencia entre el estado del sistema ($S3$ Sleep, $S4$ Hibernate, $S5$ Soft Off) y el estado del dispositivo ($D0$ Fully On, $D3_{hot}$, $D3_{cold}$).
  * Aclara que WoL solo es gobernado por el sistema operativo mientras este mantiene el control de los estados de energía; una vez en $S5$ puro, el control pasa al transceptor físico de hardware, respaldando la asimetría de red descrita en [ADR-002](../adr/ADR-002-acotamiento-control-energia-hardware.md).
