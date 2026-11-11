# Dossier Técnico DOC-01: Windows Internals, Diagnóstico DHCP y Wake-on-LAN en Puestos Cliente

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha:** 2026-11-11
* **Fase:** RUP Inicio (Inception) — Evidencia de Plataforma y Sistema Operativo
* **Documentos de Referencia:**
  * [Matriz Específica MDE-02](../matrices-documentales/matriz-referencias-plataforma-microsoft.md)
  * [ADR-002: Acotamiento de Control de Energía](../adr/ADR-002-acotamiento-control-energia-hardware.md)
  * [Matriz Documental General](../matriz-documental-general.md)

---

## 1. Contexto y Objetivos del Dossier

En el parque informático del Laboratorio -2.6 (60 estaciones de sobremesa Dell OptiPlex SKU 631-ADPL), el sistema operativo base es **Windows 10/11 Enterprise/Education**. Para garantizar la solidez de la arquitectura de observabilidad del panel (OpSys) bajo la metodología RUP, este dossier analiza en profundidad la documentación técnica oficial de Microsoft Learn y las especificaciones de Windows Internals en tres áreas críticas:

1. **La causa raíz y el diagnóstico del estado `FALLO_LOGICO`** a través de los canales de eventos de red de Windows.
2. **El descarte fundamentado de scripts locales de remediación** bajo la premisa de la arquitectura *Zero-Touch*.
3. **El comportamiento del kernel de Windows ante el apagado híbrido (*Fast Startup*)** y los requisitos obligatorios para que el encendido remoto por *Wake-on-LAN* (WoL) sea viable y determinista.

---

## 2. Diagnóstico de Red y Registro de Eventos del Cliente DHCP

### 2.1 La Ambigüedad de los Event IDs en Windows
En la administración de sistemas Windows, los códigos numéricos de evento (`Event ID`) no son unívocos a nivel global de la máquina, sino que están jerárquicamente subordinados al **Proveedor (*Provider*)** y al **Canal (*Channel*)**.

> [!WARNING] Ambigüedad Clásica en Windows Event Log
> * En el canal **`Application`**, el **Event ID 1001** corresponde a la utilidad de comprobación de disco del sistema de archivos (`Wininit` / `Chkdsk`: *"Checking file system on C:..."*).
> * En el canal de red **`Microsoft-Windows-DHCP Client Events/Admin`**, el **Event ID 1001** representa el **fallo crítico de asignación de dirección IP por DHCP**.

### 2.2 Estructura de los Canales de Eventos DHCP en Windows
La arquitectura del cliente DHCP en Windows Server y Windows Client (`dhcpcore.dll` / servicio `Dhcp`) canaliza sus diagnósticos a través de la ruta:
`Applications and Services Logs > Microsoft > Windows > Dhcp-Client`

```
┌────────────────────────────────────────────────────────┐
│             Dhcp-Client (Servicio DHCP)                │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
                ▼                        ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│          Canal Admin          │ │       Canal Operational       │
│  (Errores Críticos de Red)    │ │ (Transiciones de Estado Fino) │
│  - Event ID 1001 (Fallo IP)   │ │ - Event ID 50042 (DNS/DDNS)   │
│  - Event ID 1002 (Pérdida T2) │ │ - Renovaciones T1/T2          │
│  - Event ID 1003 (DHCPNAK)    │ │ - Notificaciones de interfaz  │
└───────────────────────────────┘ └───────────────────────────────┘
```

#### Catálogo de Eventos Críticos para OpSys:
* **Event ID 1001 (`Dhcp-Client/Admin`):**
  > *«Your computer was not assigned an address from the network (by the DHCP Server) for the Network Card with network Address 0x... The following error occurred: 0x79. The semaphore timeout period has expired.»*
  * **Causa técnica:** El cliente emitió ráfagas de paquetes `DHCPDISCOVER` en difusión (*broadcast*) conforme a la RFC 2131, pero no recibió ninguna respuesta `DHCPOFFER`.
  * **Comportamiento de Windows:** El cliente desiste y asigna a la interfaz una dirección del rango **APIPA (Automatic Private IP Addressing)** en la red `169.254.0.0/16`.
* **Event ID 1002 (`Dhcp-Client/Admin`):**
  > *«The IP address lease 10.x.x.x for the Network Card with network Address 0x... has been lost by the DHCP Client to the DHCP Server 10.x.x.1.»*
  * **Causa técnica:** La máquina agotó el tiempo de renovación ($T2$ - *Rebinding Time*) sin confirmación del servidor, o detectó una desconexión física transitoria del cable antes de conectarse a la red aislada.
* **Event ID 50042 (`Dhcp-Client/Operational`):**
  * Registra el fallo o éxito de las actualizaciones dinámicas de nombres DNS (DDNS) asociadas al cambio de concesión de red.

### 2.3 Explicación del Estado `FALLO_LOGICO` / `AMARILLO`
Este comportamiento de Windows explica la correlación que implementa OpSys:
1. El alumno mueve el cable de red de la roseta docente al switch de prácticas (que no tiene servidor DHCP configurado).
2. El switch de prácticas (o una boca reconfigurada) establece portadora física $\to$ El chip de red y el switch docente registran Capa 1 en `UP` (`ifOperStatus = 1`).
3. Windows genera los **Event IDs 1001 y 1002**, retira la IP de la subred universitaria y adopta `169.254.x.x`.
4. El socket WebSocket del servicio `MeshAgent` colapsa porque no existe ruta hacia el servidor docente (`conn = 0`).
5. **Resultado en OpSys:** Capa 1 `UP` + Capa 7 `DOWN` $\to$ **`FALLO_LOGICO` / `AMARILLO`** (o `RED_AISLADA` si el laboratorio se encuentra en `Modo Práctica`).

---

## 3. Comandos de Inspección (`NetAdapter`) y Justificación *Zero-Touch*

### 3.1 Inspección Local en Windows
Microsoft documenta el módulo de PowerShell `NetAdapter` como la interfaz estándar para telemetría local de hardware de red:

```powershell
Get-NetAdapter -IncludeHidden | Select-Object Name, InterfaceDescription, Status, LinkSpeed, MediaConnectionState
```

Este comando expone la dualidad de capas dentro del propio kernel:
* **`MediaConnectionState: Connected`:** La capa física (PHY/NDIS) tiene portadora eléctrica.
* **`Status: Up` vs. `Disconnected`:** Estado lógico del adaptador y presencia de pila TCP/IP.

### 3.2 ¿Por qué OpSys NO ejecuta comandos de remediación remota en los clientes?
En etapas preliminares podría contemplarse invocar scripts remotos de PowerShell (`Restart-NetAdapter`, `ipconfig /renew` o llamadas WMI/WinRM) para reparar la conectividad del equipo. Sin embargo, la documentación oficial y los principios de diseño confirman su inviabilidad:

1. **La Paradoja de Transmisión (*Fate Sharing*):** Para que PowerShell Remoting (WinRM en puerto 5985/5986) responda, la máquina necesita una dirección IP válida y enrutable hacia el panel. Si la máquina se encuentra en `FALLO_LOGICO` (APIPA) o conectada al switch aislado, el canal por donde viajaría la orden de remediación está físicamente interrumpido.
2. **Violación del Principio *Zero-Touch*:** Abrir WinRM de forma desatendida en un parque multi-usuario universitario obligaría a habilitar servicios expuestos, autenticación delegada (CredSSP o Kerberos) y almacenamiento de credenciales administrativas en el servidor, generando una superficie de ataque inaceptable.

---

## 4. Control Energético, Wake-on-LAN y la Restricción de *Fast Startup*

### 4.1 Comportamiento Predeterminado de Apagado en Windows 10/11
A partir de Windows 10, Microsoft introdujo como comportamiento de fábrica el **Apagado Híbrido (*Fast Startup*)**:
* Cuando el usuario pulsa *Inicio $\to$ Apagar*, Windows **no** realiza un apagado estándar ACPI $S5$.
* En su lugar, cierra las sesiones de usuario y realiza una **hibernación parcial de la sesión del kernel** (estado híbrido clasificado como **$S4$**).

### 4.2 Impacto Crítico en Wake-on-LAN
La documentación oficial de Microsoft (*Wake on LAN behavior in Windows 10/11*) formula una regla tajante:

> [!CAUTION] Desarme del Adaptador de Red por Política de Kernel
> *«In Windows 10 and Windows 11, the default shutdown behavior puts the system into the hybrid shutdown (state S4) and all devices are put into D3. In this state, WOL is not supported.»*
> 
> *«Windows explicitly disarms network adapters for WOL during hybrid shutdown to ensure zero power consumption and prevent accidental wake-ups.»*

Al apagar con *Fast Startup* activo, el administrador de energía de Windows ordena al controlador de red transicionar a **$D3_{cold}$** y **deshabilita la escucha de patrones de reactivación en el chip de red**.

### 4.3 Requisito Técnico Obligatorio para el Aula -2.6
Para que el panel OpSys pueda emitir *Magic Packets* Wake-on-LAN y encender con éxito los 60 ordenadores Dell OptiPlex desde el estado de apagado:

1. **Desactivación Obligatoria de *Fast Startup*:**  
   La imagen del sistema operativo desplegada en los puestos clientes debe tener inhabilitado el arranque rápido, asegurando que el equipo transicione a un apagado limpio **$S5$ clásico**:
   * **Vía Directiva de Grupo (GPO):**
     `Configuración del equipo > Plantillas administrativas > Sistema > Apagado > Desactivar inicio rápido`
   * **Vía Registro de Windows:**
     ```ini
     [HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Power]
     "HiberbootEnabled"=dword:00000000
     ```
2. **Configuración del Transceptor en BIOS/UEFI Dell:**  
   Con *Fast Startup* desactivado, al apagarse el PC, el sistema operativo transfiere el control total de la interfaz a la UEFI. La placa base Dell mantiene el transceptor de red energizado a **5VSB (Standby Voltage)**, negociando a 10/100 Mbps y despertando inmediatamente al detectar las 16 repeticiones de la dirección MAC en el *Magic Packet*.

---

## 5. Resumen de Decisiones de Arquitectura Derivadas

| Hallazgo en Documentación Microsoft | Impacto en el Dominio OpSys | Decisión de Diseño Adoptada |
| :--- | :--- | :--- |
| **Event IDs 1001 / 1002 en `Dhcp-Client`** | El cliente pierde IP y cae en APIPA ante cambios de switch o caídas de DHCP. | Modela formalmente el estado polimórfico `EstadoFalloLogico` (`FALLO_LOGICO` / `AMARILLO`). |
| **Dependencia de IP en PowerShell / WinRM** | No se pueden enviar scripts remotos de corrección a máquinas con la red rota. | Se ratifica la arquitectura **Zero-Touch**: cero agentes y cero scripts locales en los puestos. |
| **Desarme de WoL bajo *Fast Startup* ($S4$)** | Si el arranque rápido está activo, los Dell OptiPlex no responden al *Magic Packet*. | Documentar formalmente como requisito de despliegue la clave `HiberbootEnabled = 0` para garantizar la fiabilidad del encendido masivo. |
| **Asimetría de Estados ACPI ($S5$ vs. $S0$)** | El sistema operativo pierde el control de la red al apagarse el equipo. | Respaldo total a [ADR-002](../adr/ADR-002-acotamiento-control-energia-hardware.md): encendido por hardware de Capa 2 y retiro de la orden de apagado remoto. |
