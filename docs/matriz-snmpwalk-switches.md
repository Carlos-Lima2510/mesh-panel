<div align=right>

|[![](https://img.shields.io/badge/-Inicio-003366?style=flat&logo=github&logoColor=white)](/README.md) [![](https://img.shields.io/badge/-RUP-003366?style=flat&logo=Elsevier&logoColor=white)](/RUP/README.md) [![](https://img.shields.io/badge/-Modelo_del_dominio-003366?style=flat&logo=diagramsdotnet&logoColor=white)](/RUP/00-modelo-del-dominio/README.md) [![](https://img.shields.io/badge/-Requisitos-003366?style=flat&logo=crewunited&logoColor=white)](/RUP/01-requisitos/README.md) [![](https://img.shields.io/badge/-Detalle_Casos_de_Uso-003366?style=flat&logo=buffer&logoColor=white)](/RUP/01-requisitos/01-detalle-casos-uso/README.md) [![](https://img.shields.io/badge/-Matriz_Documental-003366?style=flat&logo=gitbook&logoColor=white)](/docs/matriz-documental-general.md) [![](https://img.shields.io/badge/-Decisiones_ADR-003366?style=flat&logo=gitbook&logoColor=white)](/docs/adr/README.md)
|-:

</div>

# Auditoría de Red SNMPwalk: Estado de Bocas (UP/DOWN) y Velocidades de Negociación

> **Fecha de ejecución**: 2026-11-20  
> **Origen de los datos**: Comando directo `snmpwalk` ejecutado sobre la MIB estándar de los 3 switches físicos del laboratorio.  
> **OIDs consultados**:  
> * `1.3.6.1.2.1.31.1.1.1.1` (`ifName` / Identificador de boca)  
> * `1.3.6.1.2.1.2.2.1.8` (`ifOperStatus` / Estado de enlace Capa 1: `up(1)` o `down(2)`)  
> * `1.3.6.1.2.1.31.1.1.1.15` (`ifHighSpeed` / Velocidad negociada en Mbps)

---

## Switch `10.10.136.13` -- Switch Principal Rack (sw13)

* **Total interfaces reportadas**: 56  
* **Bocas UP (Enlace físico activo)**: **23**  
* **Bocas DOWN (Sin portadora física)**: **33**

| ifIndex | ifName (Boca) | ifOperStatus (Enlace) | ifHighSpeed (Velocidad) | Estado Operativo | Equipo / Puesto Mapeado | Observaciones |
| :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| `1` | `port1` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `UEA-C226 (Puesto 01)` | - |
| `2` | `port2` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `UEA-C232 (Puesto 02)` | - |
| `3` | `port3` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `UEA-C234 (Puesto 03)` | - |
| `4` | `port4` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `UEA-C236 (Puesto 04)` | - |
| `5` | `port5` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `UEA-C403 (Puesto 05)` | - |
| `6` | `port6` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-6` | - |
| `7` | `port7` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-7` | - |
| `8` | `port8` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-8` | - |
| `9` | `port9` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-9` | - |
| `10` | `port10` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-10` | - |
| `11` | `port11` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-11` | - |
| `12` | `port12` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-12` | - |
| `13` | `port13` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-13` | - |
| `14` | `port14` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-14` | - |
| `15` | `port15` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-15` | - |
| `16` | `port16` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-16` | - |
| `17` | `port17` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-17` | - |
| `18` | `port18` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-18` | - |
| `19` | `port19` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-19` | - |
| `20` | `port20` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-20` | - |
| `21` | `port21` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-21` | - |
| `22` | `port22` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-22` | - |
| `23` | `port23` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-23` | - |
| `24` | `port24` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-24` | - |
| `25` | `port25` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-25` | - |
| `26` | `port26` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-26` | - |
| `27` | `port27` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-27` | - |
| `28` | `port28` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-28` | - |
| `29` | `port29` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-29` | - |
| `30` | `port30` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-30` | - |
| `31` | `port31` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-31` | - |
| `32` | `port32` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-32` | - |
| `33` | `port33` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-33` | - |
| `34` | `port34` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Fila 5: UEA-C244, C245, C246, C250, C421 (Switch de mesa)` | Switch de mesa intermedio (múltiples PCs) |
| `35` | `port35` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-35 (Respaldo)` | - |
| `36` | `port36` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-36 (Respaldo)` | - |
| `37` | `port37` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-37` | - |
| `38` | `port38` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-38` | - |
| `39` | `port39` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-39` | - |
| `40` | `port40` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-40` | - |
| `41` | `port41` | **🟢 UP (1)** | **⚡ 100 Mbps** | ⚡ **Standby (PC Apagado)** / 100M | `UEA-C271 (Puesto 41)` | ✅ **Verificado en Standby (GRIS) con botón WoL activo** |
| `42` | `port42` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-42` | - |
| `43` | `port43` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Fila 6: UEA-C271, C272, C273, C277 (Switch de mesa)` | Switch de mesa intermedio (múltiples PCs) |
| `44` | `port44` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-44` | - |
| `45` | `port45` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-45` | - |
| `46` | `port46` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-46` | - |
| `47` | `port47` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puerto 47 (Excluido rack)` | - |
| `48` | `port48` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-48` | - |
| `49` | `port49` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `50` | `port50` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-50` | - |
| `51` | `port51` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `Uplink Troncal 10G (SFP+)` | Puerto SFP+ fibra / uplink |
| `52` | `port52` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `Uplink Troncal 10G (SFP+)` | Puerto SFP+ fibra / uplink |
| `53` | `internal` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | Interfaz interna / pila switch |
| `54` | `internal` | **🟢 UP (1)** | 0 Mbps | Enlace Activo | `-` | Interfaz interna / pila switch |
| `55` | `8FNTF24001025-0` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `-` | Interfaz interna / pila switch |
| `56` | `_FlInK1_MLAG0_` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `-` | Interfaz interna / pila switch |

---

## Switch `10.10.136.39` -- Switch Auxiliar Laboratorio (sw39)

* **Total interfaces reportadas**: 56  
* **Bocas UP (Enlace físico activo)**: **9**  
* **Bocas DOWN (Sin portadora física)**: **47**

| ifIndex | ifName (Boca) | ifOperStatus (Enlace) | ifHighSpeed (Velocidad) | Estado Operativo | Equipo / Puesto Mapeado | Observaciones |
| :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| `1` | `port1` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-Aux1 (Puesto 50)` | - |
| `2` | `port2` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-Aux2 (Puesto 51)` | - |
| `3` | `port3` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-Aux3 (Puesto 52)` | - |
| `4` | `port4` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-Aux4 (Puesto 53)` | - |
| `5` | `port5` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Puesto-Aux5 (Puesto 54)` | - |
| `6` | `port6` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-Aux6 (Puesto 55)` | - |
| `7` | `port7` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `Puesto-Aux7 (Puesto 56)` | - |
| `8` | `port8` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `9` | `port9` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `10` | `port10` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `11` | `port11` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `12` | `port12` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `13` | `port13` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `14` | `port14` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `15` | `port15` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `16` | `port16` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `17` | `port17` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `18` | `port18` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `19` | `port19` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `20` | `port20` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `21` | `port21` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `22` | `port22` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `23` | `port23` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `24` | `port24` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `25` | `port25` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `26` | `port26` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `27` | `port27` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `28` | `port28` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `29` | `port29` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `30` | `port30` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `31` | `port31` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `32` | `port32` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `33` | `port33` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `34` | `port34` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `35` | `port35` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `36` | `port36` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `37` | `port37` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `38` | `port38` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `39` | `port39` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `Enlace intermedio` | - |
| `40` | `port40` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `41` | `port41` | **🟢 UP (1)** | **⚡ 100 Mbps** | ⚡ **Standby (PC Apagado)** / 100M | `Dispositivo Standby / 100M` | ⚠️ **Negociando a 100 Mbps (Deep Sleep OFF / Standby)** |
| `42` | `port42` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `43` | `port43` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `44` | `port44` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `45` | `port45` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `46` | `port46` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `47` | `port47` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `48` | `port48` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `49` | `port49` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `50` | `port50` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `51` | `port51` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `Uplink Troncal 10G` | Puerto SFP+ fibra / uplink |
| `52` | `port52` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `Uplink Troncal 10G` | Puerto SFP+ fibra / uplink |
| `53` | `internal` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | Interfaz interna / pila switch |
| `54` | `internal` | **🟢 UP (1)** | 0 Mbps | Enlace Activo | `-` | Interfaz interna / pila switch |
| `55` | `_FlInK1_MLAG0_` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `-` | Interfaz interna / pila switch |
| `56` | `8FFTV23002188-0` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `-` | Interfaz interna / pila switch |

---

## Switch `10.10.136.42` -- Switch Auxiliar Laboratorio (sw42)

* **Total interfaces reportadas**: 56  
* **Bocas UP (Enlace físico activo)**: **38**  
* **Bocas DOWN (Sin portadora física)**: **18**

| ifIndex | ifName (Boca) | ifOperStatus (Enlace) | ifHighSpeed (Velocidad) | Estado Operativo | Equipo / Puesto Mapeado | Observaciones |
| :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| `1` | `port1` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `2` | `port2` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `3` | `port3` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `4` | `port4` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `5` | `port5` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `6` | `port6` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `7` | `port7` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `8` | `port8` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `9` | `port9` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `10` | `port10` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `11` | `port11` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `12` | `port12` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `13` | `port13` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `14` | `port14` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `15` | `port15` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `16` | `port16` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `17` | `port17` | **🟢 UP (1)** | **⚡ 100 Mbps** | ⚡ **Standby (PC Apagado)** / 100M | `Dispositivo Standby / 100M` | ⚠️ **Negociando a 100 Mbps (Standby)** |
| `18` | `port18` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `19` | `port19` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `20` | `port20` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `21` | `port21` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `22` | `port22` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `23` | `port23` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `24` | `port24` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `25` | `port25` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `26` | `port26` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `27` | `port27` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `28` | `port28` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `29` | `port29` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `30` | `port30` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `31` | `port31` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `32` | `port32` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `33` | `port33` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `34` | `port34` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `35` | `port35` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `36` | `port36` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `37` | `port37` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `38` | `port38` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `39` | `port39` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `40` | `port40` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `41` | `port41` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `42` | `port42` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `43` | `port43` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `44` | `port44` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `45` | `port45` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `46` | `port46` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `47` | `port47` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | - |
| `48` | `port48` | **🟢 UP (1)** | **⚡ 100 Mbps** | ⚡ **Standby (PC Apagado)** / 100M | `Dispositivo Standby / 100M` | ⚠️ **Negociando a 100 Mbps (Standby)** |
| `49` | `port49` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `UEA-C240 (Puesto 49)` | - |
| `50` | `port50` | 🔴 DOWN (2) | 0 Mbps | Desconectado | `-` | - |
| `51` | `port51` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `Uplink Troncal 10G` | Puerto SFP+ fibra / uplink |
| `52` | `port52` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `Uplink Troncal 10G` | Puerto SFP+ fibra / uplink |
| `53` | `internal` | **🟢 UP (1)** | **🟢 1000 Mbps (1 Gbps)** | 🟢 Gigabit Activo (PC Encendido) | `-` | Interfaz interna / pila switch |
| `54` | `internal` | **🟢 UP (1)** | 0 Mbps | Enlace Activo | `-` | Interfaz interna / pila switch |
| `55` | `8FFTF23075921-0` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `-` | Interfaz interna / pila switch |
| `56` | `8FNTF24000147-0` | **🟢 UP (1)** | **🔷 10 Gbps** | 🔷 Troncal / Uplink 10G | `-` | Interfaz interna / pila switch |

---

## Resumen Consolidado de Velocidades Negociadas

A partir de la ejecución directa de `snmpwalk`, se identifican las siguientes categorías de enlace en el laboratorio:

1. **Puertos a 100 Mbps (Standby S5 / Deep Sleep OFF)**:  
   * `10.10.136.13` $\rightarrow$ `port41`  
   * `10.10.136.39` $\rightarrow$ `port41`  
   * `10.10.136.42` $\rightarrow$ `port17`, `port48`  
   * *Diagnóstico*: En estos puertos hay equipos Dell OptiPlex apagados con *Deep Sleep* desactivado o hardware Fast Ethernet legacy. La tarjeta de red conmuta a 100 Mbps para escuchar Wake-on-LAN.

2. **Puertos a 1000 Mbps (Gigabit Activo)**:  
   * Equipos encendidos comunicando a velocidad nativa 1 Gbps, o enlaces troncales hacia switches intermedios de mesa (como los de las filas 5 y 6 en `port34` y `port43`).

3. **Puertos a 10000 Mbps (10 Gbps)**:  
   * Puertos 51 y 52 (SFP+) en los tres switches, utilizados para agregación y redundancia MLAG en el rack.
