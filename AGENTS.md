# Guía de Contexto, Arquitectura y Reglas del Proyecto (AGENTS.md)

Este repositorio implementa un panel de observabilidad y telemetría en tiempo real para puestos de trabajo en aulas y laboratorios gestionados mediante **MeshCentral**, **MeshAgent** e **Intel AMT (Active Management Technology)**.

---

## 1. Contexto del Dominio y los 3 Escenarios Físicos/Lógicos Únicos

En este laboratorio, todas las máquinas disponen de:
1. **MeshAgent** instalado y corriendo como servicio en el Sistema Operativo (Ubuntu Linux / Windows).
2. **Intel AMT** activado y aprovisionado a nivel de hardware/firmware en la placa base (Intel Management Engine).

Físicamente solo pueden existir **3 escenarios**:

| Escenario | Estado Visual | Condición Técnica Real | Comportamiento en Red y MeshCentral |
| :--- | :--- | :--- | :--- |
| **1. Operativo** | `VERDE` | Puesto con cable conectado, DHCP/red lógica del SO correcta. Agente activo y AMT enlazado. | MeshAgent responde y AMT responde (`conn = 5` o `conn = 3`). Ambos canales de comunicación están activos. |
| **2. Fallo Lógico / DHCP** | `AMARILLO` | Cable de red conectado físicamente, pero configuración de red lógica/DHCP dañada o interfaz caída en el SO. El agente no puede comunicar. | AMT sigue conectado gracias al enlace físico y a su cliente DHCP activo por hardware. El agente en MeshCentral cae. |
| **3. Aislado / Desconectado** | `NARANJA` | Puesto desconectado físicamente del cable o conectado a una red aislada sin salida hacia el servidor MeshCentral. | Ni el agente ni AMT tienen comunicación con MeshCentral (`conn = 0`). Si el corte fue abrupto, se detecta de inmediato como `conn = 1`. |

---

## 2. Decodificación del Estado mediante el Bitfield `conn`

En MeshCentral (obtenido a través de `meshctrl listdevices --json`, funciones internas `GetConnectivityState` / `SetConnectivityState` de `meshcentral.js`), el campo entero `conn` es una **máscara de bits** que refleja los canales de comunicación activos:

- **Bit 0 (`conn & 1`, valor 1)**: Conexión activa del **MeshAgent** (nivel SO).
- **Bit 1 (`conn & 2`, valor 2)**: Conexión activa de **Intel AMT CIRA** (out-of-band remoto).
- **Bit 2 (`conn & 4`, valor 4)**: Conexión activa de **Intel AMT Local** (enlace LAN/TLS directo en puerto 16993). *(Es el modo habitual en este laboratorio, dando `conn = 5` cuando el agente y AMT local están conectados: 1 + 4)*.
- **Bit 3 (`conn & 8`, valor 8)**: Conexión activa de **Intel AMT Relay**.

> **Regla de detección de Intel AMT**: Se considera que Intel AMT está conectado si cualquiera de sus canales está activo: `(conn & 14) !== 0` (es decir, bits 2, 4 u 8).

### Matriz de Decodificación y Clasificación:
* **`conn & 1` y `conn & 14` activos** (ej. `conn = 5` [1+4] o `conn = 3` [1+2]): **Escenario 1 (Operativo / `VERDE`)**.
* **`!(conn & 1)` y `conn & 14` activo** (ej. `conn = 4` o `conn = 2`): **Escenario 2 (Fallo Lógico DHCP / `AMARILLO`)**.
* **`conn === 0` (o sin atributo `conn`)**: **Escenario 3 (Desconectado o Aislado / `NARANJA`)**.
* **`conn === 1` (`conn & 1` activo pero `!(conn & 14)`)**: **Escenario 3 (Corte Físico Abrupto / `NARANJA`)**. Al perderse el enlace eléctrico, AMT cae de inmediato en hardware; si el agente sigue en MeshCentral, se trata de un socket TCP zombie. Se clasifica instantáneamente como `NARANJA`.

---

## 3. Desconexiones Abruptas y Sockets TCP Zombie

Cuando un PC pierde la red abruptamente (desconexión física del cable o apagado de la interfaz con `ip link set down`), el sistema operativo no puede enviar un paquete `TCP FIN` o `TCP RST` a MeshCentral.

1. **El problema del Socket Half-Open**: Para el servidor MeshCentral, el socket TCP WebSocket del agente sigue en estado `ESTABLISHED` hasta que vence un temporizador de inactividad o fallan las retransmisiones del kernel.
2. **Detección Instantánea por Correlación de Hardware (Corte de Cable)**:
   - Dado que en este laboratorio todos los puestos tienen Intel AMT activo en la misma tarjeta de red, **es físicamente imposible que un PC tenga cable conectado y AMT esté apagado**.
   - Si `conn === 1` (Agente supuestamente vivo, pero AMT caído), el clasificador [`ClassifierService`](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/services/classifier.service.js) no espera los timeouts del servidor: deduce de inmediato el corte de cable y marca el puesto en **`NARANJA`** en 0 segundos.

---

## 4. Configuración de Red de Intel AMT (`net0`): DHCP PASSIVE vs ACTIVE

En la BIOS de Intel MEBx (Management Engine BIOS Extension - `Ctrl + P` o `F12` al arrancar):

* **Modo PASSIVE (Shared IP / Compartido)**:
  - AMT escucha pasivamente las peticiones DHCP del SO y toma prestada la IP del sistema operativo.
  - *Problema*: Si el SO apaga la red o falla el DHCP de Linux, AMT puede perder su configuración de red y quedar incomunicado.
* **Modo ACTIVE (Dedicated IP / Autónomo)**:
  - Intel AMT ejecuta **su propio cliente DHCP en el procesador Intel ME** a nivel de hardware.
  - Aunque Ubuntu esté caído, congelado o con la interfaz apagada, **Intel AMT mantiene y renueva su propia IP en el cable**.
  - En la consola de MeshCentral, ejecutar `amt` debe mostrar:
    ```text
    net0: {
      enabled: 1,
      dhcpEnabled: 1,
      dhcpMode: "ACTIVE",
      mac: "A4:BB:6D:4C:BA:1F",
      address: "172.22.100.54"
    }
    ```
  - *Nota*: Aunque la IP sea idéntica a la del SO porque el servidor DHCP asigna por dirección MAC física, el modo `ACTIVE` garantiza la supervivencia del enlace out-of-band en el **Escenario 2 (Fallo Lógico)**.
  - *Hostname / Domain Name en MEBx*: Asignar valores como `amt-UEA236` y `local` es perfectamente compatible con MeshCentral (que autentica por Digest/TLS y no depende de resolución DNS Kerberos).

---

## 5. Optimización del Kernel de Linux en Docker: `net.ipv4.tcp_retries2 = 5`

El kernel de Linux por defecto (`net.ipv4.tcp_retries2 = 15`) reintenta hasta 15 veces el envío de paquetes TCP no confirmados con retroceso exponencial (*exponential backoff*). Esto provocaba que ante una caída del SO sin `RST`, MeshCentral tardara entre **13 y 30 minutos** en declarar muerto el socket.

### Solución en el `docker-compose.yml` del servidor MeshCentral:
```yaml
services:
  meshcentral:
    ...
    sysctls:
      - net.ipv4.tcp_retries2=5
```

### Impacto y Análisis de Riesgos:
* **En entorno de Laboratorio / Red Local (Gigabit Ethernet, latencia < 1ms)**:
  - Reduce el tiempo de detección de caída del SO a solo **10 - 12 segundos** ($0.4\text{s} + 0.8\text{s} + 1.6\text{s} + 3.2\text{s} + 6.4\text{s}$).
  - Riesgo: **Ninguno**. En una LAN con enlaces de fibra/cobre y switches corporativos, si un equipo no responde tras 5 reintentos en 10 segundos, está indudablemente caído.
  - Beneficio: Purga inmediata de descriptores de socket y memoria en el servidor.

---

## 6. Configuración de MeshCentral `config.json` y Peculiaridades del Código Fuente

En la sección `"settings"` del archivo `config.json` de MeshCentral, los parámetros de sondeo deben configurarse con atención a la sensibilidad de mayúsculas:

```json
"settings": {
  "agentping": 10,
  "agentidletimeout": 15,
  "agentPing": 10,
  "agentIdleTimeout": 15
}
```

### Hallazgo crítico en el código de MeshCentral:
* En `meshagent.js` (líneas 53 y 701), las variables internas se evalúan **estrictamente en minúsculas** (`args.agentping` y `args.agentidletimeout`). Si en `config.json` solo se especifica camelCase (`agentPing`), Node.js lo evalúa como `undefined` y vuelve a aplicar el timeout por defecto de 150 segundos (2.5 minutos). Colocar ambas formas previene este problema.
* **`agentPing` vs `agentPong`**:
  - `agentPong`: Es un paquete unidireccional enviado del servidor al agente (para mantener vivos puertos NAT). **No exige respuesta** y no detecta caídas.
  - `agentPing`: Envía un ping al agente y **obliga a recibir un pong de vuelta**. Si no hay respuesta dentro de `agentIdleTimeout`, destruye el socket.

---

## 7. Arquitectura del Repositorio (`mesh-panel`)

El proyecto sigue una arquitectura minimalista, desacoplada y orientada a consultas **a demanda**:

### Backend (`daemon/`):
* [config.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/config.js): Parámetros de conexión a MeshCentral tomados de `.env`.
* [services/mesh.service.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/services/mesh.service.js): Ejecuta a demanda `meshctrl listdevices --json --ignore-cert` mediante `child_process.exec`.
* [services/classifier.service.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/services/classifier.service.js): Aplica la matriz de los 3 escenarios basándose en los bits de `conn` y gestiona la detección inmediata del corte abrupto (`conn === 1`).
* [services/inventory.store.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/services/inventory.store.js): Almacén en memoria de los puestos evaluados.
* [sse.server.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/sse.server.js): Servidor HTTP nativo de Node.js que expone:
  - `GET /api/devices`: Ejecuta la consulta a MeshCentral, clasifica y devuelve JSON.
  - `POST /api/scan-now`: Mismo comportamiento a demanda con broadcast a clientes conectados.
* [daemon.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/daemon.js): Punto de entrada que orquesta los servicios.

### Frontend (`src/`):
* [index.html](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/src/index.html): Cuadrícula visual de puestos con botón interactivo de actualización y contadores KPI (Operativos, Fallo DHCP, Aislados).
* [js/app.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/src/js/app.js): Lógica cliente que invoca `/api/devices` al cargar y al pulsar el botón, gestionando estados de carga (⏳ / 🔄) y sellos de tiempo.
* [js/renderer.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/src/js/renderer.js): Renderiza las tarjetas aplicando clases de color (`VERDE`, `AMARILLO`, `NARANJA`) y telemetría de hardware/agente.

---

## 8. Comandos Útiles de Operación y Diagnóstico

### Consultar el endpoint a demanda del panel:
```bash
curl -s http://localhost:3001/api/devices | python3 -m json.tool
```

### Ejecutar `meshctrl listdevices` en el contenedor daemon:
```bash
docker exec -it tfg-daemon sh -c 'meshctrl listdevices --url "$MESH_URL" --loginuser "$MESH_USER" --loginpass "$MESH_PASS" --json --ignore-cert'
```

### Ejecutar `meshctrl deviceinfo` (requiere el `node_id` de MeshCentral, no el nombre):
```bash
docker exec -it tfg-daemon sh -c 'meshctrl deviceinfo --url "$MESH_URL" --loginuser "$MESH_USER" --loginpass "$MESH_PASS" --id "node//<ID_DEL_NODO>" --ignore-cert'
```

### Simular Fallo Lógico en el PC cliente (Ubuntu):
Para evitar que NetworkManager reviva la interfaz automáticamente con `ip link set down`:
```bash
# Apagar la interfaz en NetworkManager:
sudo nmcli device disconnect eno2

# Restaurar la interfaz:
sudo nmcli device connect eno2
```

---

## 9. Alcance Actual vs Roadmap Futuro

### ✅ LO QUE HACEMOS AHORA (Fase Actual: Simplicidad y A Demanda)
- Consultas a demanda con `meshctrl listdevices`.
- Clasificación determinista con la máscara de bits de `conn`.
- Correlación de hardware para corte físico de cable inmediato.
- Optimización de timeouts a nivel de kernel (`tcp_retries2=5`) y `config.json`.

### ❌ LO QUE NO HACEMOS AHORA (Pospuesto para Fases Posteriores)
- **NO** depender de streams reactivos complejos de WebSocket (`meshctrl showevents`).
- **NO** realizar escaneos de puertos invasivos en el daemon (como sondeos TCP al puerto 22 de las máquinas).

---

## 10. Reglas para Modelos y Desarrolladores

1. **Prioridad a la simplicidad**: Todo cambio en el backend debe apoyarse en llamadas limpias a `meshctrl listdevices`.
2. **Respetar los 3 escenarios**: No inventar estados adicionales. Las máquinas o están Operativas (`VERDE`), en Fallo Lógico DHCP (`AMARILLO`) o Desconectadas (`NARANJA`).
3. **Consistencia de datos**: El frontend espera objetos con las propiedades `estado`, `categoria`, `diagnostico` y el subobjeto `telemetria` con `os_online`, `amt_online` y `conn`.
