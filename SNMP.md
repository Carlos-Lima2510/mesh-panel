# Arquitectura de Telemetría SNMP y Observabilidad Física del Laboratorio (SNMP.md)

Este documento detalla la arquitectura de monitorización de **Capa 1 (Física)** mediante **SNMPv3**, la correlación con **Capa 7 (Lógica - MeshCentral)** y la justificación técnica de los estados observados en el parque informático del laboratorio.

---

## 1. Contexto del Dominio y Principio Arquitectónico

### 1.1 El Parque Informático y la Limitación de Hardware
El laboratorio cuenta con **60 puestos de sobremesa Dell OptiPlex (Lote Producción SKU 631-ADPL)** junto a puestos auxiliares de desarrollo (`UEA-C236`, `UEA-C403`, `UEA-C240`).

* **Limitación Crítica de Hardware (Dell SKU 631-ADPL)**:
  - En la orden de fabricación figura: `631-ADPL : Sin gestión de sistemas fuera de banda` (*No Out-of-Band Systems Management*).
  - Códigos de ingeniería: `INFO,RYLTY,ME,DISABLE,DAKAR` y `INFO,MGMT,INTEL,ME,DISABLE`.
  - **Fundido irreversible de fusibles (FPF)**: El chipset tiene deshabilitado por hardware Intel ME / AMT. **Es físicamente imposible usar Intel vPro o AMT** por software o BIOS.
* **Principio Zero-Touch**:
  - No se instalan daemons propietarios, cron jobs ni scripts secundarios en los clientes.
  - La observabilidad se logra cruzando la telemetría del sistema operativo estándar (**MeshAgent**) con la infraestructura de red gestionada (**SNMP MIB-II** en switches).

---

## 2. Topología de Red y Switches Monitorizados

El laboratorio no está conectado a un único switch de 48 bocas, sino a un ecosistema distribuido de switches gestionados y de sobremesa:

```
                                  ┌─────────────────────────────┐
                                  │   TELEMETRY DAEMON (3001)   │
                                  └──────────────┬──────────────┘
                                                 │ SNMPv3 (authPriv - SHA/AES)
                ┌────────────────────────────────┼────────────────────────────────┐
                ▼                                ▼                                ▼
    ┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
    │ Switch Principal .13 │         │ Switch Auxiliar .39  │         │ Switch Auxiliar .42  │
    │  (10.10.136.13)      │         │  (10.10.136.39)      │         │  (10.10.136.42)      │
    │  Puertos 1-46, 48    │         │  Puertos 1-7         │         │  Puerto 49           │
    │  (Puestos 1-48 aula) │         │  (Puestos Aux 50-56) │         │  (Host UEA-C240)     │
    └──────────┬───────────┘         └──────────────────────┘         └──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐┌──────────────┐
│Sw. Mesa Fila5││Sw. Mesa Fila6│
│ (en port 34) ││ (en port 43) │
│ C244, C245,  ││ C271, C272,  │
│ C246, C250,  ││ C273, C277   │
│ C421 (Mesas) ││ (Mesas)      │
└──────────────┘└──────────────┘
```

### 2.1 Desglose de Equipamiento de Red
1. **Switch Principal Docencia (`10.10.136.13`)**:
   - Da servicio a las rosetas directas del aula (puertos 1 al 48, con el puerto 47 reservado/sin uso).
   - Proporciona enlace de subida (*uplink*) a los switches de mesa de las filas 5 y 6.
2. **Switch Auxiliar 1 (`10.10.136.39`)**:
   - Bocas 1 a 7 conectadas a puestos complementarios/bancos de trabajo (mapeados a los slots 50 al 56 en el plano del aula).
3. **Switch Auxiliar 2 (`10.10.136.42`)**:
   - Boca 49 conectada al equipo especial `UEA-C240` (slot 49).
4. **Switches de Sobremesa Intermedios (Mesas de Trabajo)**:
   - **Mesa Fila 5 (detrás de `port34`)**: Aloja 5 equipos (`UEA-C244`, `UEA-C245`, `UEA-C246`, `UEA-C250`, `UEA-C421`).
   - **Mesa Fila 6 (detrás de `port43`)**: Aloja 4 equipos (`UEA-C271`, `UEA-C272`, `UEA-C273`, `UEA-C277`).
   - **Comportamiento clave**: Estos switches intermedios reciben alimentación fija de la regleta de la mesa y negocian **1000 Mbps permanentes** con el switch central, independientemente de si las torres de los alumnos están encendidas o apagadas.

---

## 3. Protocolo SNMPv3 y Consultas MIB-II

La comunicación se realiza mediante **SNMPv3** con nivel de seguridad `authPriv` (autenticación SHA y privacidad/cifrado AES-128).

### 3.1 Seguridad y Gestión de Credenciales
* Las credenciales se configuran exclusivamente a través de variables de entorno en [.env](file:///.env) (protegido por `.gitignore`).
* Plantilla documentada sin secretos en [.env.example](file:///.env.example).
* Los contenedores Docker reciben las variables por interpolación sin quemar contraseñas en código fuente.

### 3.2 OIDs Estándar Consultados
| OID | Nombre MIB-II | Propósito en el Panel |
| :--- | :--- | :--- |
| `1.3.6.1.2.1.31.1.1.1.1` | `ifName` | Nombre estandarizado de la interfaz (`port1`..`port48`). Fallback: `ifDescr` (`1.3.6.1.2.1.2.2.1.2`). |
| `1.3.6.1.2.1.2.2.1.8` | `ifOperStatus` | Estado operacional del chip PHY: `1 = UP`, `2 = DOWN`. |
| `1.3.6.1.2.1.31.1.1.1.15` | `ifHighSpeed` | Velocidad negociada en Mbps (`10`, `100`, `1000`). Crucial para distinguir S5 Standby de 1 Gbps. |

---

## 4. Diagnóstico del Estado Actual del Aula (55 Puestos)

Al consultar la API consolidada (`GET /api/laboratorio`), el aula presenta la siguiente distribución exacta:

```
Total Puestos Monitoreados: 55
├── 🟢 18 Puestos con Enlace Físico Activo (Link UP a 1000 Mbps)
└── 🟠 37 Puestos sin Enlace Físico (Link DOWN / Circuito Abierto)
```

### 4.1 ¿Por qué hay 18 puestos en enlace `UP`?
* **Puestos en switches de mesa**: Los 9 equipos de las filas 5 y 6 (`port34` y `port43`) tienen enlace `UP` a 1 Gbps porque los switches de mesa intermedios están alimentados.
* **Puestos directos activos**: Puestos como el 2, 5, 9, 25, 30, 40, 46, el auxiliar 5 en switch `.39` y `UEA-C240` en switch `.42` tienen el cable conectado a su tarjeta de red Dell y negocian a 1000 Mbps.

### 4.2 ¿Por qué marcan 🟢 VERDE ahora y antes marcaban 🟡 AMARILLO?
* **Antes (Modo Clase ordinario)**:
  Al no tener aún instalado `MeshAgent` en las imágenes de los PCs (`osOnline = false`), el evaluador determinaba:
  > *"Hay enlace físico a 1 Gbps, pero el sistema operativo no reporta en MeshCentral $\rightarrow$ Posible fallo de DHCP o caída del agente"*.
  Por tanto, se marcaban en **🟡 AMARILLO (Fallo Lógico / DHCP)**.
* **Ahora (Modo Verificación de Cableado - `CABLEADO`)**:
  Se implementó el modo de pre-despliegue (`MODO_DESPLIEGUE=cableado`). En este modo, el sistema certifica la continuidad física: todo enlace `UP` se valida en **🟢 VERDE (Enlace físico verificado a 1 Gbps)**, permitiendo certificar el aula antes de instalar el agente en los sistemas operativos.

---

## 5. El Enigma del "Deep Sleep" y los 37 Puestos en `DOWN` (Naranja)

Una de las dudas fundamentales al observar el panel es:
> *¿Por qué 37 puestos aparecen en 🟠 NARANJA si muchos tienen el cable físicamente enchufado a la torre? ¿Por qué ninguno aparece en ⚫ GRIS (Apagado / Standby)?*

La respuesta reside en la gestión de energía de los PCs Dell OptiPlex y los estados ACPI:

### 5.1 Los Estados de Energía y la Tarjeta de Red
```
┌────────────────────────────────────────────────────────────────────────┐
│                   ESTADOS ACPI DEL PC Y LA TARJETA NIC                 │
├───────────────┬──────────────────────────────────┬─────────────────────┤
│ Estado ACPI   │ Comportamiento Eléctrico NIC     │ Telemetría Switch   │
├───────────────┼──────────────────────────────────┼─────────────────────┤
│ S0 (Encendido)│ Alimentación completa (1 Gbps)   │ UP a 1000 Mbps      │
│ S3 (Sleep RAM)│ Mantiene sesión en memoria       │ UP (100 o 1000 Mbps)│
│ S5 (Standby)  │ +5VSB activo (WoL habilitado)    │ UP a 10 o 100 Mbps  │
│ Deep Sleep    │ +5VSB CORTADO por normativa ErP  │ DOWN (0 Mbps)       │
└───────────────┴──────────────────────────────────┴─────────────────────┘
```

### 5.2 El Parámetro BIOS: `Deep Sleep Control`
En la BIOS de los Dell OptiPlex existe la opción:
> **`Power Management` $\rightarrow$ `Deep Sleep Control`**

1. **Si está en `Enabled in S4 and S5` (o `Enabled in S5`)**:
   - Para cumplir con normativas ecológicas (< 0.5 W en reposo), la placa base **apaga por completo la línea de 5V de standby (+5VSB)** hacia la tarjeta de red integrada.
   - El chip PHY de la NIC queda eléctricamente muerto (los LEDs del conector RJ-45 de la torre se apagan).
   - **El switch no recibe pulsos eléctricos**: el puerto pasa a **`ifOperStatus = DOWN`**.
   - **Consecuencia para la red**: Para el switch, **un PC en Deep Sleep es eléctricamente indistinguible de un cable desenchufado**.
   - **Consecuencia operativa**: **Wake-on-LAN NO FUNCIONA** en Deep Sleep (no hay procesador ni chip de red alimentado para recibir el *Magic Packet*).
2. **Si está en `Disabled` (Recomendado para telemetría docente)**:
   - La placa base mantiene la alimentación mínima en el chip PHY.
   - La tarjeta de red conmuta a baja velocidad (**10 o 100 Mbps**) para ahorrar energía mientras escucha la red.
   - El switch detecta enlace `UP a 10/100 Mbps`.
   - **El panel lo clasifica automáticamente en ⚫ GRIS (Standby)** y habilita el botón interactivo **⚡ WoL**.

### 5.3 Diagnóstico de los 37 Puestos en `DOWN`
De los 37 puestos actualmente en naranja:
1. Una parte no tiene el cable de red conectado a la roseta o a la torre.
2. Otra parte **sí tiene el cable conectado**, pero:
   - Tienen activado **`Deep Sleep Control`** en la BIOS Dell.
   - O la regleta/alimentación de la mesa está apagada, dejando la fuente sin tensión de standby.

---

## 6. Matriz de Estados del Panel

El motor determinista ([EvaluadorEstado.js](file:///daemon/domain/estado/EvaluadorEstado.js)) clasifica cada puesto según la combinación de telemetría y el modo activo:

| Estado Visual | Capa 1: Switch (SNMP) | Capa 7: MeshAgent | Modo Laboratorio | Diagnóstico | Acción Operativa |
| :---: | :---: | :---: | :---: | :--- | :---: |
| 🟢 **VERDE** | `UP` (Cualquier velocidad) | Conectado (`conn & 1`) | Cualquiera | **Puesto Operativo**: PC encendido con agente activo. | 🛑 `POWER_OFF` |
| 🟢 **VERDE** | `UP` (100/1000 Mbps) | Desconectado / Sin agente | `CABLEADO` | **Enlace Físico Verificado**: Continuidad de cable OK en pre-despliegue. | `NINGUNA` |
| ⚫ **GRIS** | `UP` (10 o 100 Mbps) | Desconectado | `CLASE` o `PRACTICA` | **Apagado en Standby (S5)**: Tarjeta en bajo consumo, lista para despertar. | ⚡ `WAKE_ON_LAN` |
| 🟡 **AMARILLO** | `UP` (1000 Mbps) | Desconectado | `CLASE` | **Fallo Lógico / DHCP**: Cable a 1 Gbps pero el agente no conecta. | `REMEDIAR_DHCP` |
| 🟡 **AMARILLO** | `DOWN` | Desconectado | `PRACTICA` | **Red Aislada de Prácticas**: Cable movido al switch de prácticas. | `NINGUNA` |
| 🟠 **NARANJA** | `DOWN` | Desconectado | `CLASE` o `CABLEADO` | **Cable Desconectado / Deep Sleep**: Sin portadora eléctrica en switch. | `INSPECCION_CABLE` |

---

## 7. Modos de Operación Disponibles en la Cabecera

El panel permite conmutar en caliente entre tres modos operativos mediante la API (`POST /api/laboratorio/modo`) o los botones de la barra superior:

1. **`🔌 Verif. Cableado` (`CABLEADO`)**:
   - Modo de pre-despliegue.
   - Prioriza la verificación física de rosetas y cables: todo puerto con enlace físico `UP` se muestra en **🟢 VERDE** y los puertos sin enlace en **🟠 NARANJA**.
2. **`🎓 Modo Clase` (`CLASE`)**:
   - Modo estándar de docencia.
   - Exige la presencia de `MeshAgent` para otorgar el verde. Si hay 1 Gbps sin agente, alerta en **🟡 AMARILLO**. Si hay 10/100 Mbps en reposo, muestra **⚫ GRIS** con botón WoL.
3. **`🧪 Modo Práctica` (`PRACTICA`)**:
   - Modo para sesiones de laboratorio de redes con switch aislado.
   - Las caídas de enlace en el switch principal no generan alarma naranja, sino diagnóstico de **🟡 AMARILLO (Red Aislada)**.

---

## 8. Recomendaciones para el Despliegue Final de MeshAgent

Para culminar la observabilidad completa del aula manteniendo el principio *Zero-Touch*:

1. **Configuración de BIOS en los 60 Dell OptiPlex**:
   - `Deep Sleep Control` $\rightarrow$ **`Disabled`** (permite que los equipos apagados muestren estado ⚫ GRIS y respondan a Wake-on-LAN).
   - `Wake on LAN` $\rightarrow$ **`LAN Only`**.
2. **Instalación de MeshAgent**:
   - Despliegue silencioso del servicio estándar mediante script de arranque de Active Directory / GPO, clonación de disco (Ghost/Clonezilla) o script de despliegue masivo en Windows/Linux.
3. **Transición Transparente**:
   - En cuanto los PCs arranquen con el agente instalado, el panel en `Modo Clase` transicionará automáticamente los puestos a **🟢 VERDE** por Server-Sent Events (SSE) sin requerir modificaciones adicionales en el código.
