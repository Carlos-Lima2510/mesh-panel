# Guía de Contexto, Arquitectura y Reglas del Proyecto (AGENTS.md)

Este repositorio implementa un panel de observabilidad y telemetría en tiempo real para puestos de trabajo en aulas y laboratorios universitarios gestionados mediante **MeshCentral**, **MeshAgent** e infraestructura de red con switches gestionados (**SNMP**).

---

## 1. Contexto del Dominio y Realidad del Parque Informático

El parque principal del laboratorio está compuesto por **60 ordenadores de sobremesa Dell OptiPlex (Lote Producción SKU 631-ADPL)** junto a un lote piloto reducido de desarrollo (`UEA-C236`, `UEA-C403`).

### 1.1 Limitación Crítica de Hardware: Dell SKU 631-ADPL
En la especificación técnica de Dell para este lote de 60 PCs figura la opción de fábrica:
* **`631-ADPL : Sin gestión de sistemas fuera de banda`** (*No Out-of-Band Systems Management*).
* **Códigos de ingeniería Dell**: `INFO,RYLTY,ME,DISABLE,DAKAR` y `INFO,MGMT,INTEL,ME,DISABLE`.
* **Fundido irreversible de fusibles (FPF)**: En fábrica se queman los fusibles de silicio del chipset (Intel ME) en modo `DISABLE`. Carecen del firmware Corporate vPro y de licencia.
* **Consecuencia**: Es **físicamente imposible activar Intel AMT** por software, utilidades o BIOS. No existe procesador fuera de banda en estos 60 equipos.

### 1.2 Principio Inquebrantable: Arquitectura Zero-Touch en Clientes
* **Directriz**: **CERO instalación de scripts, agentes secundarios o tareas programadas en los puestos cliente**.
* Toda la observabilidad debe lograrse de forma no invasiva mediante el servicio estándar del sistema operativo (**MeshAgent**) y la **infraestructura de red gestionada**.

---

## 2. El Problema de Observabilidad y la Solución en Dos Capas

### 2.1 Por qué MeshCentral en Solitario es Ciego ante la Capa Física
MeshAgent solo mantiene un socket TCP WebSocket con MeshCentral mientras el sistema operativo está encendido y tiene salida a red. Cuando la comunicación se corta, MeshCentral solo registra: `conn = 0` (*"socket cerrado"*). No puede distinguir si:
1. El alumno apagó el PC voluntariamente (`shutdown`).
2. Se desconectó físicamente el cable de red de la roseta.
3. Se produjo un fallo de DHCP o caída lógica de interfaz en el SO.
4. El equipo se conectó a una red o switch de prácticas sin salida a MeshCentral.

### 2.2 ¿Por qué no se le puede preguntar al propio Host si tiene cable?
* **La paradoja de transmisión**: Para responder, el host necesita una red funcional. Si el cable está quitado o conectado a la red aislada, el host no tiene canal IP por donde enviar su respuesta.
* **Equipos apagados (S5)**: Al apagarse el equipo, el sistema operativo no corre y no hay proceso que responda.
* Preguntarle al host solo funciona cuando todo ya funciona (`VERDE`).

### 2.3 Rechazo Definitivo de Sondeos ICMP (Ping)
En versiones anteriores se probó un mecanismo de ping ICMP (`checkPhysicalLink`). Se descartó definitivamente porque:
* En equipos sin Intel AMT, si hay un fallo de DHCP o el PC está apagado, el ping falla de todos modos (no hay IP o no hay SO).
* Añadía latencias bloqueantes innecesarias y generaba falsos diagnósticos.

### 2.4 La Solución: Correlación Capa 1 (Física) + Capa 7 (Lógica)

Combinamos dos fuentes de datos independientes sin tocar los clientes:

```
┌────────────────────────────────┐         ┌────────────────────────────────┐
│   CAPA 1: FÍSICA / ENLACE      │         │     CAPA 7: LÓGICA / S.O.      │
│  Switch Principal Docencia     │         │       Servidor MeshCentral     │
│   (SNMP v2c - ifOperStatus)    │         │       (MeshAgent WebSocket)    │
└───────────────┬────────────────┘         └────────────────┬───────────────┘
                │                                           │
                └───────────────────┬───────────────────────┘
                                    ▼
                     ┌─────────────────────────────┐
                     │     PANEL DE CONTROL        │
                     │  (Motor de Clasificación    │
                     │  + Contexto de Laboratorio) │
                     └─────────────────────────────┘
```

1. **Capa 1 (Switch Principal vía SNMP v2c MIB-II)**:
   * Consulta los OIDs estándar `ifOperStatus` e `ifSpeed`.
   * El chip PHY del switch detecta pulsos eléctricos (*Link Pulses / Carrier Sense*).
   * **`UP (1)`**: Cable conectado físicamente al PC (incluso si está apagado, gracias a los 5V de standby para WoL).
   * **`DOWN (2)`**: Cable desconectado de la roseta o switch docente.
2. **Capa 7 (MeshCentral MeshAgent)**:
   * Determina si Windows/Linux está arrancado y comunicando con el servidor docente (`conn & 1`).

---

## 3. Manejo de la Red Aislada: Modos Operativos (`CLASE` vs `PRACTICA`)

### El Dilema del Switch Secundario Inaccesible
En el laboratorio existe una **Red Aislada de Prácticas** conectada a un switch secundario que es **físicamente no gestionado o inaccesible por red**. Cuando un alumno desconecta su cable de la roseta docente y lo enchufa al switch de prácticas:
* El switch docente pasa a `DOWN`.
* El host deja de llegar a MeshCentral (`conn = 0`).
* Al no tener acceso SNMP al switch de prácticas, el sistema no puede saber por telemetría directa si el cable fue al switch aislado o si quedó colgando en el suelo.

### Solución mediante Contexto Operacional
El sistema modela el **Modo de Operación del Laboratorio**:

1. **`Modo Clase` (Operación Normal)**:
   * Todos los puestos deben estar en la red docente.
   * Si la boca del switch pasa a `DOWN`, es una anomalía $\rightarrow$ **`NARANJA` (Cable Desconectado)**.
2. **`Modo Práctica` (Sesión de Redes / Laboratorio Aislado)**:
   * Se espera que los alumnos cambien sus cables a la red de prácticas.
   * Si la boca del switch pasa a `DOWN`, el sistema deduce el cambio de contexto $\rightarrow$ **`AMARILLO` (En Red Aislada de Prácticas)**, evitando alarmas innecesarias.

---

## 4. Matriz Determinista de Clasificación y Diagnóstico

| Estado Visual | Switch Principal (Capa 1) | MeshAgent (Capa 7) | Modo Laboratorio | Diagnóstico | Acción Propuesta |
| :---: | :---: | :---: | :---: | :--- | :---: |
| 🟢 **VERDE** | `UP` | Conectado (`conn & 1`) | Cualquiera | **Operativo**: PC encendido en red docente. | 🛑 `POWER_OFF` |
| ⚫ **GRIS** | `UP` (10/100 Mbps o Standby) | Desconectado | Cualquiera | **Apagado (Standby)**: Cable conectado, PC apagado en modo S5. | ⚡ `WAKE_ON_LAN` |
| 🟡 **AMARILLO** | `UP` (1 Gbps) | Desconectado | Cualquiera | **Fallo Lógico / DHCP**: Enlace físico a 1 Gbps pero el agente no conecta. | `REMEDIAR_DHCP` |
| 🟡 **AMARILLO** | `DOWN` | Desconectado | `PRACTICA` | **Red Aislada de Prácticas**: Cable movido al switch de prácticas. | `NINGUNA` |
| 🟠 **NARANJA** | `DOWN` | Desconectado | `CLASE` | **Cable Desconectado**: Sin enlace físico en roseta docente. | `INSPECCION_CABLE` |

---

## 5. Arquitectura del Software (Domain-Driven Design - DDD)

El backend de `daemon/` está desacoplado siguiendo arquitectura hexagonal / DDD:

```
daemon/
├── domain/                  # Lógica pura del dominio (sin dependencias externas)
│   ├── Accion.js            # Acciones operativas (WAKE_ON_LAN, REMEDIAR_DHCP, etc.)
│   ├── Host.js              # Entidad Workstation (evalúa estado cruzando Capa 1 y 7)
│   ├── Laboratorio.js       # Aggregate Root (gestiona hosts, redes, modo y KPIs)
│   └── Red.js               # Entidad de segmentos lógicos (Red Docencia, Red Aislada)
├── infrastructure/          # Adaptadores y comunicación con el exterior
│   ├── meshcentral/
│   │   └── MeshCentralAdapter.js   # CLI Wrapper (meshctrl listdevices, wake)
│   └── network/
│       ├── NetworkProvider.js      # Interfaz abstracta de red
│       ├── SnmpSwitchProvider.js   # SNMP v2c MIB-II real (snmpwalk)
│       └── SimulatedSwitchProvider.js # Proveedor simulado para tests/dev
├── application/             # Capa de casos de uso y orquestación
│   └── LaboratorioService.js       # Orquesta polling, caché, deduplicación y cambio de modos
├── config.js                # Configuración de entorno (.env)
└── daemon.js                # Servidor HTTP nativo, caché reactiva y SSE stream
```

### 5.1 Entidades de Dominio
* **[`Laboratorio`](file:///home/carlos-lima/Documentos/mesh-panel/daemon/domain/Laboratorio.js)**:
  - Aggregate Root. Mantiene la colección de `hosts` y `redes`.
  - Mantiene el atributo `modo` (`'CLASE'` | `'PRACTICA'`).
  - Al cambiar de modo, **re-evalúa inmediatamente en memoria** a todos sus hosts sin consultas de red externas.
  - Genera métricas consolidadas (`total`, `verde`, `amarillo`, `gris`, `naranja`).
* **[`Host`](file:///home/carlos-lima/Documentos/mesh-panel/daemon/domain/Host.js)**:
  - Entidad central del puesto de trabajo.
  - Almacena configuración estática (`bocaSwitch`, `mac`, `soportaWoL`).
  - Contiene el método puro `evaluarEstado(modoLab)` que ejecuta la matriz determinista.
* **[`Red`](file:///home/carlos-lima/Documentos/mesh-panel/daemon/domain/Red.js)**:
  - Modela las redes lógicas (`id`, `nombre`, `subred`, `es_aislada`).
  - Define si permite salida hacia MeshCentral (`permiteSalidaMeshCentral()`).
* **[`Accion`](file:///home/carlos-lima/Documentos/mesh-panel/daemon/domain/Accion.js)**:
  - Modela acciones remediadoras o de control (`tipo`, `descripcion`, `ejecutable`).
  - Habilita la ejecución remota de Wake-on-LAN si el puesto está apagado y apagado remoto (Power Off) vía MeshAgent si el puesto está encendido.

---

## 6. Estrategia de Alto Rendimiento, Concurrencia y Caché en Memoria

Para garantizar tiempos de respuesta ultrarrápidos (< 20 ms) con 60 o más puestos sin saturar MeshCentral ni el switch, el sistema implementa una arquitectura **Cache-First** y **Single-Flight**:

```
[ Navegador / Cliente ]
         │
         │  GET /api/laboratorio  (Latencia: ~14 ms)
         ▼
┌────────────────────────────────────────────────────────┐
│  DAEMON MEMORY SNAPSHOT                                │
│  (Objeto Aggregate Laboratorio en RAM)                 │
└─────────────────────────┬──────────────────────────────┘
                          │
       ¿Caché expirada o forzada?
       (Refresco periódico cada 5s en segundo plano)
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  SINGLE-FLIGHT RUNNER (LaboratorioService)             │
│  Deduplica peticiones concurrentes a una sola Promise   │
└────────────┬──────────────────────────────┬────────────┘
             │ (Promise.all en paralelo)    │
             ▼                              ▼
┌────────────────────────┐      ┌────────────────────────┐
│  MeshCentralAdapter    │      │  SnmpSwitchProvider    │
│  (meshctrl en bloque)  │      │  (ifOperStatus masivo) │
└────────────────────────┘      └────────────────────────┘
```

### 6.1 Principios de Rendimiento Aplicados:
1. **Snapshot en Memoria (*Cache-First*)**:
   - `GET /api/laboratorio` devuelve de inmediato el modelo consolidado en RAM sin bloquear al cliente.
   - Las consultas caen de **~400–1500 ms** a **~14–16 ms** (~25 veces más rápido).
2. **Deduplicación de Peticiones (*Single-Flight Pattern*)**:
   - Si 5 navegadores abren el panel a la vez, el servidor no levanta 5 procesos CLI. Todos esperan la misma promesa en curso (`promesaRefresco`), evitando colapso del servidor.
3. **Consultas Masivas y Paralelizadas (`Promise.all`)**:
   - En lugar de consultar puesto por puesto de forma secuencial, se consulta MeshCentral y la tabla completa de puertos SNMP en paralelo.
   - El cruce de datos y evaluación de los 60 puestos se realiza en memoria mediante diccionario en $O(1)$ (< 0.2 ms).
4. **Caché Estática de Bocas y Optimización SNMP**:
   - Los nombres de las bocas (`ifDescr`) se obtienen una sola vez al arranque.
   - En ciclos regulares solo se consulta el OID ligero `ifOperStatus` con timeout estricto (`-t 1 -r 1`).
5. **Reevaluación Instantánea de Modos**:
   - Al alternar entre `Modo Clase` y `Modo Práctica`, la entidad recalcula los estados en memoria en **< 1 ms** y emite por SSE inmediatamente sin consultas externas.
6. **Polling Reactivo en Segundo Plano**:
   - Si hay clientes conectados al canal SSE (`clientesSSE.length > 0`), el daemon refresca automáticamente cada 5 segundos y difunde eventos `INIT` sin interacción del usuario.

---

## 7. API REST y Streaming en Tiempo Real

El servidor expone los siguientes endpoints limpios en el puerto `3001`:

| Método | Endpoint | Latencia Típica | Descripción |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/laboratorio` | **~14 ms** | Devuelve el snapshot del agregador `laboratorio` con métricas, redes y puestos clasificados. |
| `POST` | `/api/laboratorio/modo` | **~15 ms** | Alterna el modo del aula (`{"modo": "CLASE"}` o `{"modo": "PRACTICA"}`) y emite SSE. |
| `POST` | `/api/power/wake` | **~250 ms** | Envía Magic Packet Wake-on-LAN al host especificado (`{"node_id": "..."}`). |
| `POST` | `/api/power/off` | **~250 ms** | Envía orden de apagado remoto (Power Off) vía MeshAgent (`{"node_id": "..."}`). |
| `GET` | `/events` | Streaming | Canal Server-Sent Events (SSE) para actualización reactiva en tiempo real. |

---

## 8. Frontend (`src/`)

* **[`src/index.html`](file:///home/carlos-lima/Documentos/mesh-panel/src/index.html)**:
  - Cabecera con selector interactivo de modo (`🎓 Modo Clase` / `🧪 Modo Práctica`).
  - Contadores KPI en tiempo real (Operativos, En Práctica / DHCP, Apagados, Desconectados).
  - Cuadrícula de tarjetas de puestos.
* **[`src/js/app.js`](file:///home/carlos-lima/Documentos/mesh-panel/src/js/app.js)**:
  - Conexión reactiva vía `EventSource` (`/events`) con reconexión automática.
  - Llamadas a la API para cambio de modo, emisión de Wake-on-LAN y apagado remoto.
* **[`src/js/renderer.js`](file:///home/carlos-lima/Documentos/mesh-panel/src/js/renderer.js)**:
  - Renderizado dinámico de tarjetas con colores semafóricos (`VERDE`, `GRIS`, `AMARILLO`, `NARANJA`).
  - Muestra telemetría física (puerto del switch, estado de enlace, red asignada).
  - Pinta el botón de acción interactivo `⚡ WoL` cuando el equipo está en estado `GRIS`.
  - Pinta el botón de acción interactivo `🛑 Apagar` cuando el equipo está en estado `VERDE`.

---

## 9. Comandos Útiles de Operación y Diagnóstico

### Consultar el laboratorio consolidado (Benchmark instantáneo):
```bash
curl -s http://localhost:3001/api/laboratorio | python3 -m json.tool
```

### Cambiar a Modo Práctica:
```bash
curl -s -X POST http://localhost:3001/api/laboratorio/modo \
  -H "Content-Type: application/json" \
  -d '{"modo": "PRACTICA"}' | python3 -m json.tool
```

### Despertar un puesto por Wake-on-LAN:
```bash
curl -s -X POST http://localhost:3001/api/power/wake \
  -H "Content-Type: application/json" \
  -d '{"node_id": "node//..."}' | python3 -m json.tool
```

### Apagar un puesto de forma remota:
```bash
curl -s -X POST http://localhost:3001/api/power/off \
  -H "Content-Type: application/json" \
  -d '{"node_id": "node//..."}' | python3 -m json.tool
```

### Inspeccionar bocas del Switch simulado / real vía SNMP:
```bash
docker exec -it tfg-daemon snmpwalk -v 2c -c public virtual-switch:1616 1.3.6.1.2.1.2.2.1.8
```

---

## 10. Reglas Estrictas para Agentes y Desarrolladores

1. **Mantener Arquitectura Zero-Touch**: Jamás proponer o introducir scripts, ejecutables ni cron jobs en los puestos cliente (Windows/Linux).
2. **Respetar la Separación de Capas (DDD)**:
   - Toda regla de negocio o cálculo de estado pertenece a `domain/Host.js` o `domain/Laboratorio.js`.
   - Las consultas a red y MeshCentral pertenecen a `infrastructure/`.
3. **No reintroducir ICMP Pings**: La comprobación de enlace físico pertenece exclusivamente al Switch (`SNMP`), nunca a pings ICMP desde el daemon.
4. **Priorizar Rendimiento No Bloqueante**: Las peticiones de lectura deben servirse desde el snapshot en memoria de `LaboratorioService`; nunca ejecutar procesos CLI síncronos en bucles por puesto.
5. **Respetar el Contrato de la API**: Toda respuesta de estado debe ser consumida a través de la raíz `laboratorio` (`laboratorio.hosts`, `laboratorio.metricas`, `laboratorio.modo`).
