<div align=right>

|[![](https://img.shields.io/badge/-Inicio-24292e?style=flat&logo=github&logoColor=white)](/README.md) [![](https://img.shields.io/badge/-RUP-24292e?style=flat&logo=Elsevier&logoColor=white)](/RUP/README.md) [![](https://img.shields.io/badge/-Modelo_del_dominio-24292e?style=flat&logo=diagramsdotnet&logoColor=white)](/RUP/00-modelo-del-dominio/README.md) [![](https://img.shields.io/badge/-Requisitos-24292e?style=flat&logo=crewunited&logoColor=white)](/RUP/01-requisitos/README.md) [![](https://img.shields.io/badge/-Detalle_Casos_de_Uso-24292e?style=flat&logo=buffer&logoColor=white)](/RUP/01-requisitos/01-detalle-casos-uso/README.md) [![](https://img.shields.io/badge/-Matriz_Documental-24292e?style=flat&logo=gitbook&logoColor=white)](/docs/matriz-documental-general.md) [![](https://img.shields.io/badge/-Decisiones_ADR-24292e?style=flat&logo=gitbook&logoColor=white)](/docs/adr/README.md)
|-:

</div>

# Matriz de Telemetría: Puestos, Equipos, Switches y Velocidades de Enlace

> **Fecha de auditoría**: 2026-11-20  
> **Laboratorio**: LAB | **Modo de Operación**: `CABLEADO` | **Total Puestos**: 56 puestos  
> **Métricas globales del panel**: 🟢 Verde: 20 | 🟡 Amarillo: 0 | ⚫ Gris: 0 | 🟠 Naranja: 35

---

## 1. Matriz de Puestos de Trabajo (Puestos 01 a 56)

A continuación se detalla la correlación entre el puesto físico en el aula, el host o PC asignado, la roseta, el switch físico, la boca SNMP consultada, su estado de enlace (`UP`/`DOWN`), velocidad y diagnóstico resultante.

| Puesto | Fila / Col | Toma / Roseta | Nombre PC | Switch Físico | Boca / Puerto | Enlace (Capa 1) | Velocidad | Agente (Capa 7) | Estado Panel | Observaciones Topológicas |
| :--- | :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Puesto 01** | F1-C1 (IZQ) | `ROS-01` | `Puesto-01` | `10.10.136.13` (sw13 - Principal) | `port1` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 02** | F1-C2 (IZQ) | `ROS-02` | `Puesto-02` | `10.10.136.13` (sw13 - Principal) | `port2` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | - |
| **Puesto 03** | F1-C3 (IZQ) | `ROS-03` | `Puesto-03` | `10.10.136.13` (sw13 - Principal) | `port3` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 04** | F1-C4 (IZQ) | `ROS-04` | `Puesto-04` | `10.10.136.13` (sw13 - Principal) | `port4` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | - |
| **Puesto 05** | F1-C5 (DER) | `ROS-05` | `Puesto-05` | `10.10.136.13` (sw13 - Principal) | `port5` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 06** | F1-C6 (DER) | `ROS-06` | `Puesto-06` | `10.10.136.13` (sw13 - Principal) | `port6` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 07** | F1-C7 (DER) | `ROS-07` | `Puesto-07` | `10.10.136.13` (sw13 - Principal) | `port7` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 08** | F1-C8 (DER) | `ROS-08` | `Puesto-08` | `10.10.136.13` (sw13 - Principal) | `port8` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 09** | F2-C1 (IZQ) | `ROS-09` | `Puesto-09` | `10.10.136.13` (sw13 - Principal) | `port9` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 10** | F2-C2 (IZQ) | `ROS-10` | `Puesto-10` | `10.10.136.13` (sw13 - Principal) | `port10` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 11** | F2-C3 (IZQ) | `ROS-11` | `Puesto-11` | `10.10.136.13` (sw13 - Principal) | `port11` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 12** | F2-C4 (IZQ) | `ROS-12` | `Puesto-12` | `10.10.136.13` (sw13 - Principal) | `port12` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 13** | F2-C5 (DER) | `ROS-13` | `Puesto-13` | `10.10.136.13` (sw13 - Principal) | `port13` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 14** | F2-C6 (DER) | `ROS-14` | `Puesto-14` | `10.10.136.13` (sw13 - Principal) | `port14` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | - |
| **Puesto 15** | F2-C7 (DER) | `ROS-15` | `Puesto-15` | `10.10.136.13` (sw13 - Principal) | `port15` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | - |
| **Puesto 16** | F2-C8 (DER) | `ROS-16` | `Puesto-16` | `10.10.136.13` (sw13 - Principal) | `port16` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 17** | F3-C1 (IZQ) | `ROS-17` | `Puesto-17` | `10.10.136.13` (sw13 - Principal) | `port17` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 18** | F3-C2 (IZQ) | `ROS-18` | `Puesto-18` | `10.10.136.13` (sw13 - Principal) | `port18` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | - |
| **Puesto 19** | F3-C3 (IZQ) | `ROS-19` | `Puesto-19` | `10.10.136.13` (sw13 - Principal) | `port19` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 20** | F3-C4 (IZQ) | `ROS-20` | `Puesto-20` | `10.10.136.13` (sw13 - Principal) | `port20` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 21** | F3-C5 (DER) | `ROS-21` | `Puesto-21` | `10.10.136.13` (sw13 - Principal) | `port21` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 22** | F3-C6 (DER) | `ROS-22` | `Puesto-22` | `10.10.136.13` (sw13 - Principal) | `port22` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 23** | F3-C7 (DER) | `ROS-23` | `Puesto-23` | `10.10.136.13` (sw13 - Principal) | `port23` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 24** | F3-C8 (DER) | `ROS-24` | `Puesto-24` | `10.10.136.13` (sw13 - Principal) | `port24` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 25** | F4-C1 (IZQ) | `ROS-25` | `Puesto-25` | `10.10.136.13` (sw13 - Principal) | `port25` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | - |
| **Puesto 26** | F4-C2 (IZQ) | `ROS-26` | `Puesto-26` | `10.10.136.13` (sw13 - Principal) | `port26` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 27** | F4-C3 (IZQ) | `ROS-27` | `Puesto-27` | `10.10.136.13` (sw13 - Principal) | `port27` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | - |
| **Puesto 28** | F4-C4 (IZQ) | `ROS-28` | `Puesto-28` | `10.10.136.13` (sw13 - Principal) | `port28` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 29** | F4-C5 (DER) | `ROS-29` | `Puesto-29` | `10.10.136.13` (sw13 - Principal) | `port29` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 30** | F4-C6 (DER) | `ROS-30` | `Puesto-30` | `10.10.136.13` (sw13 - Principal) | `port30` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 31** | F4-C7 (DER) | `ROS-31` | `Puesto-31` | `10.10.136.13` (sw13 - Principal) | `port31` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 32** | F4-C8 (DER) | `ROS-32` | `Puesto-32` | `10.10.136.13` (sw13 - Principal) | `port32` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 33** | F5-C1 (IZQ) | `ROS-33` | `UEA-C244` | `10.10.136.13` (sw13 - Principal) | `port34` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Switch de mesa intermedio (Fila 5) |
| **Puesto 34** | F5-C2 (IZQ) | `ROS-34` | `UEA-C245` | `10.10.136.13` (sw13 - Principal) | `port34` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Switch de mesa intermedio (Fila 5) |
| **Puesto 35** | F5-C3 (IZQ) | `ROS-35` | `UEA-C246` | `10.10.136.13` (sw13 - Principal) | `port34` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Switch de mesa intermedio (Fila 5) |
| **Puesto 36** | F5-C4 (IZQ) | `ROS-36` | `UEA-C250` | `10.10.136.13` (sw13 - Principal) | `port34` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Switch de mesa intermedio (Fila 5) |
| **Puesto 37** | F5-C5 (DER) | `ROS-37` | `UEA-C421` | `10.10.136.13` (sw13 - Principal) | `port34` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Switch de mesa intermedio (Fila 5) |
| **Puesto 38** | F5-C6 (DER) | `ROS-38` | `Puesto-38` | `10.10.136.13` (sw13 - Principal) | `port38` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 39** | F5-C7 (DER) | `ROS-39` | `Puesto-39` | `10.10.136.13` (sw13 - Principal) | `port39` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | - |
| **Puesto 40** | F5-C8 (DER) | `ROS-40` | `Puesto-40` | `10.10.136.13` (sw13 - Principal) | `port40` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | - |
| **Puesto 41** | F6-C1 (IZQ) | `ROS-41` | `UEA-C271` | `10.10.136.13` (sw13 - Principal) | `port43` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Switch de mesa intermedio (Fila 6) |
| **Puesto 42** | F6-C2 (IZQ) | `ROS-42` | `UEA-C272` | `10.10.136.13` (sw13 - Principal) | `port43` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Switch de mesa intermedio (Fila 6) |
| **Puesto 43** | F6-C3 (IZQ) | `ROS-43` | `UEA-C273` | `10.10.136.13` (sw13 - Principal) | `port43` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Switch de mesa intermedio (Fila 6) |
| **Puesto 44** | F6-C4 (IZQ) | `ROS-44` | `UEA-C277` | `10.10.136.13` (sw13 - Principal) | `port43` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Switch de mesa intermedio (Fila 6) |
| **Puesto 45** | F6-C5 (DER) | `ROS-45` | `Puesto-45` | `10.10.136.13` (sw13 - Principal) | `port45` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 46** | F6-C6 (DER) | `ROS-46` | `Puesto-46` | `10.10.136.13` (sw13 - Principal) | `port46` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 47** | F6-C7 (DER) | `ROS-47` | `*(Sin Host)*` | Switch Principal Docente | `-` | 🔴 DOWN | 0 Mbps | Desconectado | `LIBRE` | Puerto 47 excluido en rack |
| **Puesto 48** | F6-C8 (DER) | `ROS-48` | `Puesto-48` | `10.10.136.13` (sw13 - Principal) | `port48` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | - |
| **Puesto 49** | F7-C1 (IZQ) | `ROS-49` | `UEA-C240` | `10.10.136.42` (sw42) | `port49` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Mesa auxiliar (Switch .42) |
| **Puesto 50** | F7-C2 (IZQ) | `ROS-50` | `Puesto-Aux1` | `10.10.136.39` (sw39) | `port1` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | Mesa auxiliar (Switch .39) |
| **Puesto 51** | F7-C3 (IZQ) | `ROS-51` | `Puesto-Aux2` | `10.10.136.39` (sw39) | `port2` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | Mesa auxiliar (Switch .39) |
| **Puesto 52** | F7-C4 (IZQ) | `ROS-52` | `Puesto-Aux3` | `10.10.136.39` (sw39) | `port3` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | Mesa auxiliar (Switch .39) |
| **Puesto 53** | F7-C5 (DER) | `ROS-53` | `Puesto-Aux4` | `10.10.136.39` (sw39) | `port4` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | Mesa auxiliar (Switch .39) |
| **Puesto 54** | F7-C6 (DER) | `ROS-54` | `Puesto-Aux5` | `10.10.136.39` (sw39) | `port5` | **🟢 UP** | **1 Gbps** (1000 M) | Desconectado | 🟢 VERDE | Mesa auxiliar (Switch .39) |
| **Puesto 55** | F7-C7 (DER) | `ROS-55` | `Puesto-Aux6` | `10.10.136.39` (sw39) | `port6` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | Mesa auxiliar (Switch .39) |
| **Puesto 56** | F7-C8 (DER) | `ROS-56` | `Puesto-Aux7` | `10.10.136.39` (sw39) | `port7` | 🔴 DOWN | 0 Mbps | Desconectado | 🟠 NARANJA | Mesa auxiliar (Switch .39) |

---

## 2. Auditoría Física de Enlace por Switch (SNMP Directo)

Estado integral de las bocas activas consultadas directamente mediante SNMP MIB-II (`ifOperStatus` e `ifHighSpeed`):

### 2.1 Switch `10.10.136.13` -- Switch Principal Docente (Dell/Cisco Managed Rack)

* **Total bocas consultadas**: 52
* **Bocas en enlace UP**: 19 bocas
* **Bocas en enlace DOWN**: 33 bocas

| Velocidad | Bocas Detectadas | Total | Clasificación Operativa |
| :--- | :--- | :---: | :--- |
| **100 Mbps** | `port41` | 1 | ⚡ **STANDBY / FAST ETHERNET (PC Apagado con Deep Sleep OFF o switch 10/100)** |
| **1000 Mbps** | `port2`, `port4`, `port14`, `port15`, `port18`, `port25`, `port27`, `port34`, `port35`, `port36`, `port39`, `port40`, `port42`, `port43`, `port47`, `port50` | 16 | 🟢 **GIGABIT ACTIVO (Equipos encendidos o switches Gigabit)** |
| **10000 Mbps** | `port51`, `port52` | 2 | 🔷 **UPLINK / TRUNK 10 Gbps (Interconexión troncal de red)** |


### 2.2 Switch `10.10.136.39` -- Switch Auxiliar Laboratorio (.39)

* **Total bocas consultadas**: 52
* **Bocas en enlace UP**: 5 bocas
* **Bocas en enlace DOWN**: 47 bocas

| Velocidad | Bocas Detectadas | Total | Clasificación Operativa |
| :--- | :--- | :---: | :--- |
| **100 Mbps** | `port41` | 1 | ⚡ **STANDBY / FAST ETHERNET (PC Apagado con Deep Sleep OFF o switch 10/100)** |
| **1000 Mbps** | `port5`, `port39` | 2 | 🟢 **GIGABIT ACTIVO (Equipos encendidos o switches Gigabit)** |
| **10000 Mbps** | `port51`, `port52` | 2 | 🔷 **UPLINK / TRUNK 10 Gbps (Interconexión troncal de red)** |


### 2.3 Switch `10.10.136.42` -- Switch Auxiliar Laboratorio (.42)

* **Total bocas consultadas**: 52
* **Bocas en enlace UP**: 34 bocas
* **Bocas en enlace DOWN**: 18 bocas

| Velocidad | Bocas Detectadas | Total | Clasificación Operativa |
| :--- | :--- | :---: | :--- |
| **100 Mbps** | `port17`, `port48` | 2 | ⚡ **STANDBY / FAST ETHERNET (PC Apagado con Deep Sleep OFF o switch 10/100)** |
| **1000 Mbps** | `port5`, `port10`, `port13`, `port15`, `port16`, `port18`, `port19`, `port20`, `port21`, `port22`, `port23`, `port24`, `port26`, `port27`, `port28`, `port29`, `port30`, `port31`, `port32`, `port33`, `port35`, `port37`, `port38`, `port39`, `port41`, `port44`, `port45`, `port46`, `port47`, `port49` | 30 | 🟢 **GIGABIT ACTIVO (Equipos encendidos o switches Gigabit)** |
| **10000 Mbps** | `port51`, `port52` | 2 | 🔷 **UPLINK / TRUNK 10 Gbps (Interconexión troncal de red)** |


---

## 3. Conclusiones y Diagnóstico Técnico

1. **Confirmación de Standby (10/100 Mbps)**:  
   Existen 4 bocas físicas negociando a 100 Mbps en el laboratorio: `sw13:port41`, `sw39:port41`, `sw42:port17` y `sw42:port48`. Esto corrobora que cuando un equipo Dell OptiPlex se apaga con el modo *Deep Sleep* desactivado en BIOS, su controladora Ethernet permuta su enlace a 100 Mbps para escuchar *Magic Packets* Wake-on-LAN.

2. **Efecto de los Switches de Mesa Intermedios (Filas 5 y 6)**:  
   Las filas que dependen de un switch intermedio (bocas `port34` y `port43` del switch principal) permanecen fijas a 1000 Mbps porque el switch del rack no dialoga con el PC, sino con el switch intermedio energizado. El apagado de un PC en esas filas es invisible a nivel de velocidad en la boca troncal del rack.

3. **Discrepancia en Puesto 41**:  
   El `Puesto 41` del panel tiene asignada en código la boca `port43` (compartida con la fila 6). Dado que la boca física `port41` del switch .13 está a 100 Mbps, si ese PC físico se encuentra ponchado a la roseta 41 directa, el panel no reflejará su estado Standby hasta que se vincule a `port41`.
