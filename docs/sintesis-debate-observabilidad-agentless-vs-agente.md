<div align=right>

|[![](https://img.shields.io/badge/-Inicio-003366?style=flat&logo=github&logoColor=white)](/README.md) [![](https://img.shields.io/badge/-RUP-003366?style=flat&logo=Elsevier&logoColor=white)](/RUP/README.md) [![](https://img.shields.io/badge/-Modelo_del_dominio-003366?style=flat&logo=diagramsdotnet&logoColor=white)](/RUP/00-modelo-del-dominio/README.md) [![](https://img.shields.io/badge/-Requisitos-003366?style=flat&logo=crewunited&logoColor=white)](/RUP/01-requisitos/README.md) [![](https://img.shields.io/badge/-Detalle_Casos_de_Uso-003366?style=flat&logo=buffer&logoColor=white)](/RUP/01-requisitos/01-detalle-casos-uso/README.md) [![](https://img.shields.io/badge/-Matriz_Documental-003366?style=flat&logo=gitbook&logoColor=white)](/docs/matriz-documental-general.md) [![](https://img.shields.io/badge/-Decisiones_ADR-003366?style=flat&logo=gitbook&logoColor=white)](/docs/adr/README.md)
|-:

</div>

# Síntesis Arquitectónica: Modelo Agentless (SNMP + GPO + WoL) vs. Modelo con Agente (MeshCentral + SNMP)

* **Proyecto:** OpSys / Mesh-Panel — Observabilidad y Supervisión de Laboratorio Docente
* **Fecha:** 2026-11-24
* **Ámbito del Sistema:** Laboratorio -2.6 (60 puestos Dell OptiPlex SKU 631-ADPL, 3 switches gestionados SNMP en rack: `10.10.136.13`, `10.10.136.42`, `10.10.136.39`).
* **Propósito:** Consolidar con lenguaje claro, directo y rigor de ingeniería las conclusiones definitivas del debate arquitectónico sobre la presencia de agentes en los puestos clientes, la gestión del apagado nocturno mediante Directivas de Grupo (GPO), la viabilidad de sondeos de red y la autonomía de Wake-on-LAN.
* **Documentos de Referencia:**
  * [Matriz Específica MDE-03: Comparativa de Mecanismos de Observabilidad](matrices-documentales/matriz-evaluacion-mecanismos-observabilidad.md)
  * [Dossier Técnico DOC-01: Windows Internals, DHCP y WoL](doc/DOC-01-microsoft-windows-internals-dhcp-wol.md)
  * [ADR-002: Acotamiento de Control de Energía (Apagado como evento observado)](adr/ADR-002-acotamiento-control-energia-hardware.md)
  * [ADR-003: Arquitectura de Remediación GPO Startup con Rollback](adr/ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md)
  * [ADR-004: Inclusión de Switch y Desambiguación de Telemetría](adr/ADR-004-inclusion-switch-asignacion-distribuciones.md)

---

## 1. Contexto Real del Aula -2.6 y Origen del Problema

Para evaluar cualquier decisión técnica, es imprescindible partir de la realidad operativa del aula:

1. **Estado Actual de los Puestos:**  
   En las 60 estaciones Dell OptiPlex **todavía NO está desplegado MeshCentral**. Por este motivo, la dirección académica planteó la disyuntiva: *«¿Podemos prescindir de instalar un agente en cada PC y resolverlo todo con la red (SNMP + Ping o ARP)?»*.
2. **El Problema del Consumo 24/7:**  
   Actualmente el aula **no se apaga por las noches**, manteniendo 60 torres encendidas de forma continua con un gasto eléctrico innecesario de ~1.500 W.
3. **El Problema de la Desconfiguración de Red en Prácticas:**  
   Cuando los alumnos realizan prácticas de redes, configuran IPs estáticas manuales o cambian parámetros de red. Al día siguiente, la máquina permanece desconfigurada.
4. **La Solución Planificada por GPO de Inicio (*Startup Script*):**  
   El proyecto concibió una directiva GPO ejecutada al arrancar Windows bajo contexto `NT AUTHORITY\SYSTEM` ([ADR-003](adr/ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md)): comprueba si hay DHCP en la red universitaria; si lo hay, autorrepara la red; si nadie responde (Cable 2 en prácticas), aplica *rollback* para no romper la práctica del alumno.
5. **El Eslabón Perdido:**  
   Para que la GPO de inicio se ejecute a diario, **los ordenadores TIENEN que apagarse por la noche y reencenderse por la mañana**. Si los ordenadores nunca se apagan, la autorreparación de red nunca tiene lugar.

---

## 2. Por qué los Sondeos de Red Típicos Fallan

### A. El Descarte Definitivo del Ping (ICMP)
* **El fallo técnico:** Windows 10 y 11 Enterprise/Education incorporan *Windows Defender Firewall* con la regla de entrada de peticiones de eco ICMP (`ICMPv4-In Echo Request`) **deshabilitada de fábrica**.
* **El impacto:** Un ordenador con clase normal ignora los pings entrantes. Para el panel, un PC operativo y un PC con la IP rota dan exactamente el mismo resultado: `Request Timed Out`. Pintaría toda el aula en falso fallo lógico.
* **Veredicto:** Excluido. Obligaría a tocar el cortafuegos de los clientes, rompiendo la filosofía *Zero-Touch*.

### B. El Análisis Realista del ARP Request
* **El acierto:** Al operar en Capa 2 (NDIS), el cortafuegos de Windows no lo bloquea. Si el switch marca `UP a 1 Gbps` y el PC no responde al ARP de su IP institucional, se deduce que la IP está cambiada.
* **Las limitaciones:**
  * **No cruza routers:** Las tramas ARP mueren en la frontera de Capa 3. Obliga a que el servidor del panel tenga un enlace troncal (*VLAN Trunk 802.1Q*) hacia la red de los alumnos y permisos de red cruda (`CAP_NET_RAW`).
  * **Inundación de difusión:** Emitir ARPs periódicos a 60 puestos inunda la red de difusiones (`FF:FF:..`). Debe ejecutarse estrictamente **bajo demanda**.
  * **Incapacidad de control:** El protocolo ARP solo traduce direcciones; no puede transmitir órdenes de apagado.

---

## 3. La Revelación del Apagado por GPO: ¿Realmente Necesitamos el Agente?

Durante el debate se evidenció una realidad de administración de sistemas: **Windows puede apagarse de forma totalmente autónoma mediante una Directiva de Grupo (GPO) de Active Directory**.

Una tarea programada desplegada por GPO (ej. `shutdown.exe /s /f /t 60` a las 21:30 o tras 30 minutos de inactividad) apaga los ordenadores limpiamente sin necesidad de que nadie pulse un botón en una página web.

Esto valida de forma rotunda la decisión fundacional de **[ADR-002](adr/ADR-002-acotamiento-control-energia-hardware.md)**:
> *«El panel se acota a Observabilidad en tiempo real + Encendido Remoto (WoL), modelando el apagado como un **evento externo observado** (por GPO o por el alumno), sin emitir órdenes de apagado por red»*.

---

## 4. Comparativa de los Dos Modelos Arquitectónicos

Con este nuevo prisma, el proyecto puede articularse bajo dos visiones perfectamente válidas:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MODELO 1: "AGENTLESS TOTAL" (Enfoque Sin Agente en Clientes)                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Sin instalación de ningún agente en los 60 puestos cliente.                          │
│ • Capa 1 / Enlace: Switch gestionado por SNMP (Standby 100M vs Encendido 1G vs DOWN).  │
│ • Encendido: Magic Packet Wake-on-LAN emitido directamente por UDP desde el Daemon.     │
│ • Apagado: Tarea programada por GPO de Active Directory a las 21:30 o inactividad.     │
│ • Autorreparación DHCP: Script GPO de Inicio al arrancar Windows por la mañana.        │
│ • Verificación Fallo Lógico: ARP Request bajo demanda (con Trunking 802.1Q).          │
│                                                                                        │
│ 🟢 Ventaja: Cero despliegue de software en clientes; filosofía Zero-Touch absoluta.    │
│ 🔴 Inconveniente: Panel de "solo lectura"; sin apagado interactivo de mesas sueltas.   │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MODELO 2: "HÍBRIDO CON AGENTE" (OpSys con MeshCentral)                                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Incluye todo lo del Modelo 1 (SNMP, WoL nativo y GPOs de autorreparación).           │
│ • Añade el servicio MeshAgent en la imagen de los puestos clientes.                    │
│ • Supervisión Lógica: WebSocket saliente (TCP 443) inmune a firewalls y sin Trunking. │
│ • Control Interactivo: Botón web para apagar puestos individuales desatendidos.       │
│ • Telemetría Avanzada: Nombre de usuario en sesión, consola remota y soporte técnico.  │
│                                                                                        │
│ 🟢 Ventaja: Control total e interactivo en tiempo real desde la interfaz web.          │
│ 🔴 Inconveniente: Requiere desplegar el agente en los 60 puestos del aula.             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. El Flujo de Identidad de la MAC y la Autonomía del Wake-on-LAN

Uno de los mayores hallazgos de este análisis es que **el panel no necesita a MeshCentral para encender el aula**:

1. **La Memoria Volátil del Switch:** Cuando el PC se apaga a $S5$, el switch borra la dirección MAC de su tabla FDB tras 5 minutos de inactividad (*Aging Timeout*).
2. **Auto-descubrimiento en Clase:** Durante las clases ordinarias con los equipos encendidos, el daemon ejecuta un barrido SNMP pasivo sobre la MIB Bridge (`dot1dTpFdbPort`) del switch, lee qué MAC está transmitiendo en cada boca y la **guarda automáticamente en su base de datos local** (`puestos.mac`).
3. **Encendido Directo por UDP:** A las 7:30 AM con el aula 100% apagada, el daemon consulta su propia base de datos, recupera la MAC inmutable de cada mesa y **dispara el *Magic Packet* directamente mediante sockets UDP nativos (`dgram` en Node.js)**.
4. **Independencia Total:** El encendido del aula no depende de servidores intermedios; funciona de forma autónoma entre el panel y la electrónica de red.

---

## 6. Para qué sirve el Caso de Uso `CU-04: asignarPuestosASwitch`

En el armario de comunicaciones del aula conviven **3 switches físicos** (`SW-01: 10.10.136.13`, `SW-02: 10.10.136.42`, `SW-03: 10.10.136.39`).

Como los tres switches tienen puertos con los mismos números (todos tienen una `boca 14`), el daemon sondea los 3 switches en bloque en paralelo (*Bulk SNMP*) y almacena en memoria RAM las tres tablas.

El caso de uso **`CU-04: asignarPuestosASwitch`** permite al administrador definir a qué switch está conectada cada hilera de mesas:
* Al evaluar el `Puesto 14`, el sistema sabe que debe consultar exclusivamente la telemetría de `SW-01:port14`.
* Descarta las bocas homónimas de `SW-02` y `SW-03`, **evitando falsos estados desconectados**.
* Si soporte traslada cables en el patch panel, el operador remapea el puesto desde la web en 5 segundos sin reiniciar el servidor ni tocar código ([ADR-004](adr/ADR-004-inclusion-switch-asignacion-distribuciones.md)).

---

## 7. Conclusiones y Dictamen de Ingeniería

1. **Viabilidad Condicionada del Modelo *Agentless*:**  
   La arquitectura sin agentes en clientes es técnicamente viable para la operativa básica del aula, siempre que el apagado nocturno se delegue a directivas de grupo (GPO / Tarea programada en Active Directory) y el encendido matutino se ejecute mediante Wake-on-LAN directo en Capa 2 utilizando las direcciones MAC descubiertas por SNMP y persistidas en base de datos.
2. **Rechazo Categórico de Sondeos ICMP (Ping):**  
   Se ratifica el descarte de Ping como mecanismo de supervisión debido a la política de filtrado por defecto de *Windows Defender Firewall*, preservando la premisa *Zero-Touch* al no requerir la apertura de reglas de entrada en los puestos clientes. Si se requiere discriminación lógica sin agente a 1 Gbps, la alternativa técnica correcta es el sondeo ARP bajo demanda mediante enlaces troncales 802.1Q.
3. **Evolución Modular hacia el Modelo Híbrido:**  
   La arquitectura del sistema permite operar bajo el modelo *Agentless* puro (SNMP + GPO + WoL) para cubrir la observabilidad de enlace físico y encendido, habilitando la incorporación aditiva de MeshAgent en la imagen de los puestos si la institución demanda control interactivo granular en tiempo real (apagado de puestos individuales desatendidos y asistencia remota).
