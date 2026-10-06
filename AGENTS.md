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
| **1. Operativo** | `VERDE` | Puesto con cable conectado, DHCP/red lógica del SO correcta. Agente activo y AMT enlazado (o agente activo sin AMT). | MeshAgent responde y AMT responde (`conn = 5` o `conn = 3`). Ambos canales de comunicación están activos. |
| **2. Fallo Lógico / DHCP** | `AMARILLO` | Cable de red conectado físicamente y PC encendido (`pwr = 1`), pero configuración de red lógica/DHCP dañada o interfaz caída en el SO. | AMT sigue conectado (`conn = 4`) y la placa está encendida. Responde ping ICMP por hardware. El agente en MeshCentral cae. |
| **3. Apagado (S5 / Standby)** | `GRIS` | Equipo apagado voluntariamente por el usuario (`sudo poweroff`) con cables de corriente y red conectados. | Intel AMT activo en standby (`conn = 4`), pero placa apagada (`pwr = 0`). No se ejecuta ping ICMP. |
| **4. Aislado / Desconectado** | `NARANJA` | Puesto desconectado físicamente del cable o conectado a una red aislada sin salida hacia el servidor MeshCentral. | Ni el agente ni AMT tienen comunicación con MeshCentral (`conn = 0`). Si el corte fue abrupto, se detecta de inmediato como `conn = 1`. |

---

## 2. Decodificación del Estado mediante el Bitfield `conn` y `pwr`

En MeshCentral (obtenido a través de `meshctrl listdevices --json`, funciones internas `GetConnectivityState` / `SetConnectivityState` de `meshcentral.js`), el campo entero `conn` es una **máscara de bits** que refleja los canales de comunicación activos:

- **Bit 0 (`conn & 1`, valor 1)**: Conexión activa del **MeshAgent** (nivel SO).
- **Bit 1 (`conn & 2`, valor 2)**: Conexión activa de **Intel AMT CIRA** (out-of-band remoto).
- **Bit 2 (`conn & 4`, valor 4)**: Conexión activa de **Intel AMT Local** (enlace LAN/TLS directo en puerto 16993). *(Es el modo habitual en este laboratorio, dando `conn = 5` cuando el agente y AMT local están conectados: 1 + 4)*.
- **Bit 3 (`conn & 8`, valor 8)**: Conexión activa de **Intel AMT Relay**.

> **Regla de detección de Intel AMT**: Se considera que Intel AMT está conectado si cualquiera de sus canales está activo: `(conn & 14) !== 0` (es decir, bits 2, 4 u 8).

### Matriz de Decodificación y Clasificación:
* **`conn & 1` y `conn & 14` activos** (ej. `conn = 5` [1+4] o `conn = 3` [1+2]): **Escenario 1 (Operativo / `VERDE`)**.
* **`conn & 1` activo pero máquina sin AMT aprovisionado** (`intelamt.state !== 2`): **Escenario 1 (Operativo / `VERDE`)**.
* **`!(conn & 1)` y `conn & 14` activo con `pwr === 0`**: **Escenario 3 (Apagado / `GRIS`)**. Placa apagada en standby; sin ping ICMP.
* **`!(conn & 1)` y `conn & 14` activo con `pwr !== 0` y `linkAlive === true`**: **Escenario 2 (Fallo Lógico DHCP / `AMARILLO`)**.
* **`conn === 0` (o sin atributo `conn`)**: **Escenario 4 (Desconectado o Aislado / `NARANJA`)**.
* **`conn === 1` en máquina con AMT aprovisionado**: **Escenario 4 (Corte Físico Abrupto / `NARANJA`)**. Socket zombie.
* **`conn = 4` con `linkAlive === false`**: **Escenario 4 (Corte Físico de Cable / `NARANJA`)**. Cable desconectado.

---

## 3. Desconexiones Abruptas, Sockets TCP Zombie y Desambiguación de Cable

Cuando un PC pierde la red abruptamente (desconexión física del cable o apagado de la interfaz con `ip link set down`), el sistema operativo no puede enviar un paquete `TCP FIN` o `TCP RST` a MeshCentral. Esto genera dos casos transitorios asimétricos que el panel resuelve de forma determinista:

### Caso A: Agente Zombie en MeshCentral (`conn === 1`)
1. **El problema del Socket Half-Open**: Para el servidor MeshCentral, el socket TCP WebSocket del agente sigue en estado `ESTABLISHED` hasta que vence un temporizador de inactividad o fallan las retransmisiones del kernel.
2. **Detección Instantánea por Correlación de Hardware**:
   - Dado que en este laboratorio todos los puestos tienen Intel AMT activo en la misma tarjeta de red, **es físicamente imposible que un PC tenga cable conectado y AMT esté apagado**.
   - Si `conn === 1` (Agente supuestamente vivo, pero AMT caído), el clasificador [`ClassifierService`](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/services/classifier.service.js) no espera los timeouts del servidor: deduce de inmediato el corte de cable y marca el puesto en **`NARANJA`** en 0 segundos.

### Caso B: Desconexión Física de Cable y Falso Parpadeo Amarillo (`conn = 4`)
1. **El desfase de Timeouts (Agente vs AMT)**:
   - Al desconectar el cable de red físico, el agente del SO cae de inmediato en 1–2 segundos (`conn & 1` pasa a `0`).
   - Sin embargo, el socket CIRA / TLS local de Intel AMT gestionado internamente por MeshCentral (`mpsserver.js`) mantiene un temporizador `KEEPALIVE_INTERVAL = 30` (30 a 45 segundos) antes de declarar muerta la sesión de hardware.
   - Durante esos 30–45 segundos, MeshCentral reporta `conn = 4` (Agente OFF, AMT ON), lo que sin filtro provocaría que el panel mostrase transitoriamente **`AMARILLO`** (falso Fallo Lógico) antes de pasar a **`NARANJA`**.
2. **Solución Implementada: Desambiguador Físico ICMP (`linkAlive`)**:
   - Cuando un equipo se encuentra en el estado candidato a `AMARILLO` (`!rawOsOnline && amtOnline`), el daemon ejecuta un sondeo ultrarrápido ICMP de 1 paquete (`ping -c 1 -w 1 -W 1 -q <ip>`).
   - **Si el cable fue desconectado**: El enlace físico PHY está muerto a nivel de switch. El ping falla con 100% de pérdida en 1 segundo $\rightarrow$ El clasificador marca de inmediato **`NARANJA`** (Corte de cable detectado), eliminando por completo el falso amarillo.
   - **Si es un Fallo Lógico real** (cable conectado, pero interfaz del SO caída o fallo DHCP): Gracias a que Intel AMT está configurado en modo `ACTIVE` en MEBx, el chip de hardware Intel ME responde activamente al eco ICMP en **< 0.1 ms** $\rightarrow$ El clasificador confirma con total certeza el estado **`AMARILLO`**.
   - **Sobrecarga Cero**: Este sondeo solo se ejecuta a demanda y exclusivamente para puestos sospechosos de discrepancia transitoria; nunca se sondea a puestos operativos (`VERDE`) ni a puestos desconectados confirmados (`NARANJA`).

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
* [services/classifier.service.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/services/classifier.service.js): Aplica la matriz de los 3 escenarios basándose en los bits de `conn`, gestiona la detección inmediata del corte abrupto (`conn === 1`) y discrimina falsos amarillos mediante el indicador `linkAlive`.
* [services/inventory.store.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/services/inventory.store.js): Almacén en memoria de los puestos evaluados.
* [sse.server.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/sse.server.js): Servidor HTTP nativo de Node.js que expone:
  - `GET /api/devices`: Ejecuta la consulta a MeshCentral, clasifica y devuelve JSON.
  - `POST /api/scan-now`: Mismo comportamiento a demanda con broadcast a clientes conectados.
* [daemon.js](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/daemon.js): Punto de entrada que orquesta los servicios, ejecuta en paralelo la desambiguación ICMP `checkPhysicalLink(ip)` para puestos con posible fallo lógico y actualiza el almacén.

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
- Correlación de hardware para corte físico de cable inmediato (`conn === 1`).
- Desambiguación de enlace físico por ICMP ultrarrápido (< 0.1ms en Intel AMT) para eliminar falsos amarillos por keepalive de AMT (`conn === 4` o `conn === 2`).
- Optimización de timeouts a nivel de kernel (`tcp_retries2=5`) y `config.json`.

### ❌ LO QUE NO HACEMOS AHORA (Pospuesto para Fases Posteriores)
- **NO** depender de streams reactivos complejos de WebSocket (`meshctrl showevents`).
- **NO** realizar escaneos de puertos invasivos en el daemon (como sondeos TCP al puerto 22 de las máquinas).

---

## 10. Estudio de Casos Límite (Edge Cases) y Robustez del Sistema

A partir del análisis técnico del aula y de la telemetría reportada por MeshCentral, se identifican los siguientes casos límite del modelo actual:

### 1. Equipos sin Intel AMT aprovisionado (`conn === 1`)
- **Situación**: Un PC tiene MeshAgent activo en Linux/Windows, pero Intel AMT no está aprovisionado en MEBx o la placa no dispone de tecnología vPro (`intelamt.state === 0`).
- **Solución Implementada**: Se evalúa `dev.intelamt.state === 2`. Si el puesto no está aprovisionado en AMT (`amtProvisioned = false`), el clasificador lo reconoce como operativo por software y lo marca como **`VERDE`** en lugar de falso corte de cable.

### 2. Equipos Apagados Voluntariamente (Estado ACPI S5 / Soft-Off) con Cable Conectado
- **Situación**: El alumno o docente apaga el equipo (`sudo poweroff`) al finalizar la jornada, pero deja el cable de red y de corriente conectados.
- **Solución Implementada**: Se consulta el atributo `dev.pwr` de MeshCentral:
  - En MeshCentral e Intel AMT (estándar DMTF CIM), **`pwr === 1`** indica encendido (*Power On / S0*), mientras que valores como **`pwr === 6`** (*Power Off - Hard / Soft-off*), **`pwr === 8`** (*Power Off - Soft*) o **`pwr === 0`** indican que la placa base está apagada en modo S5/Standby.
  - Cuando `pwr !== 1`, el clasificador lo categoriza como **`APAGADO`** y lo pinta de color **`GRIS`**.
  - **Optimización Crítica para 60 PCs**: Al detectar `pwr !== 1`, **se omite completamente el ping ICMP**. Cuando los 60 ordenadores del aula se apagan al terminar la clase, la consulta sigue tardando solo **0.2 segundos** y no se lanza ningún ping innecesario.

### 3. Reinicios del Sistema Operativo (`sudo reboot`)
- **Situación**: Durante un reinicio de Linux, el agente del SO se desconecta durante 20–30 segundos mientras el hardware de AMT permanece alimentado.
- **Comportamiento**: Pasa transitoriamente a **`AMARILLO`** durante el intervalo del reinicio y vuelve automáticamente a **`VERDE`** en cuanto el agente reconecta con MeshCentral.

### 4. Cambios Dinámicos de IP / Desfase de Caché en MeshCentral
- **Situación**: Si un equipo cambia de dirección IP y MeshCentral tarda en actualizar el atributo `dev.ip`, el ping de desambiguación ICMP apuntaría a la IP previa.
- **Comportamiento**: Fallaría el ping por timeout (1 s) y se clasificaría temporalmente como **`NARANJA`** hasta que MeshCentral refresque la IP asignada.

### 5. Bloqueo de ICMP en Red o BIOS
- **Situación**: Si en MEBx o en la política de red se bloquea el tráfico de eco ICMP.
- **Comportamiento**: `checkPhysicalLink` siempre retornaría `false`, provocando que cualquier fallo lógico genuino se clasifique como corte físico (`NARANJA`).

---

## 11. Limitaciones de Hardware OEM y Heterogeneidad del Parque (Dell SKU 631-ADPL)

Durante el despliegue y análisis en el aula principal de 60 puestos de trabajo (lote de producción), se identificaron discrepancias críticas de hardware frente al lote piloto de desarrollo (`UEA-C236`, `UEA-C403`).

### 11.1 Análisis Técnico del Lote de Producción Dell (SKU 631-ADPL)

En la orden de compra y especificación técnica de Dell para este lote de 60 PCs figuran los siguientes identificadores de fábrica:
* **Descripción principal**: `631-ADPL : Sin gestión de sistemas fuera de banda` (*No Out-of-Band Systems Management*).
* **Códigos internos de ingeniería Dell**:
  - `INFO,RYLTY,ME,DISABLE,DAKAR`
  - `INFO,MGMT,INTEL,ME,DISABLE`

#### ¿Por qué es físicamente imposible activar Intel AMT por software o BIOS en este lote?
1. **Fundido de Fusibles FPF (Field Programmable Fuses)**:
   - En el proceso de fabricación en fábrica (línea OEM de Dell), el motor de gestión Intel ME (Intel Management Engine integrado en el chipset/PCH) se configura de forma irreversible quemando fusibles físicos en silicio (FPFs).
   - Cuando se selecciona la opción "Sin gestión fuera de banda", los fusibles de habilitación de gestión remota se queman en modo `DISABLE`.
2. **Firmware de Consumo (Consumer SKU 1.5 MB vs Corporate SKU 5 MB)**:
   - Los equipos vPro disponen de una memoria flash SPI con la imagen de firmware "Corporate" (~5 MB a 11 MB), que contiene la pila de red TCP/IP autónoma, el servidor web TLS y los servicios WS-Management/CIM.
   - Los equipos con SKU `631-ADPL` se ensamblan con la imagen "Consumer/Basic" (~1.5 MB), que solo incluye funciones básicas de arranque y control térmico, careciendo por completo del código ejecutable de AMT.
3. **Licencia de Royalties vPro No Pagada (`INFO,RYLTY,ME,DISABLE`)**:
   - Intel cobra un canon/royalty por cada procesador/chipset con vPro activo. El código indica explícitamente que la licencia no fue adquirida. Cualquier intento de inyectar firmware de AMT es rechazado por la firma criptográfica RSA pública de Intel quemada en el procesador.
4. **Consecuencia en BIOS / MEBx**:
   - No existe menú de configuración de Intel AMT en la BIOS (`System Management`), ni combinación de teclas de acceso rápido (`Ctrl + P`).
   - Ninguna herramienta de software (Intel SCS, ACUConfig, utilidades de flasheo de BIOS o agentes en Windows/Linux) puede activar AMT en estas placas.

---

### 11.2 Arquitectura Híbrida / Heterogénea del Panel de Control

El diseño del backend (`mesh-panel`) está preparado de fábrica para convivir con un parque informático heterogéneo sin requerir bifurcaciones de código:

| Característica | Lote Piloto / Desarrollo (ej. `C236`, `C403`) | Lote Producción Aula 60 PCs (Dell `631-ADPL`) |
| :--- | :--- | :--- |
| **Tecnología Hardware** | Intel vPro / Intel AMT activo (`intelamt.state === 2`) | Sin Intel AMT (`intelamt.state === 0` o no aprovisionado) |
| **Canal de Observabilidad** | Doble canal: MeshAgent (SO) + Intel AMT (Out-of-band) | Canal único: MeshAgent (SO en Windows) |
| **Estados Visuales Soportados** | **4 Estados**: `VERDE`, `AMARILLO`, `GRIS`, `NARANJA` | **2 Estados**: `VERDE` (en sesión) y `NARANJA` (apagado / aislado) |
| **Detección Fallo Lógico / DHCP** | Sí (`AMARILLO` asistido por ping ICMP a chip AMT) | No aplicable (si cae la red del SO, el agente desconecta $\rightarrow$ `NARANJA`) |
| **Detección Apagado Standby (S5)** | Sí (`GRIS` mediante `pwr === 6` / `conn = 4`) | No (al apagarse, cae el agente $\rightarrow$ `NARANJA`) |
| **Encendido Remoto (Power On)** | Intel AMT Power On nativo (puerto 16993 / WSMAN) | Wake-on-LAN tradicional (Magic Packet a MAC de tarjeta integrada) |

#### Manejo transparente en el clasificador ([`classifier.service.js`](file:///home/carlos.alvarado@ctdesarrollo-sdr.org/Escritorio/Projects/mesh-panel/daemon/services/classifier.service.js)):
* Gracias a la evaluación de `amtProvisioned = dev.intelamt?.state === 2`, cuando un PC del aula de 60 equipos conecta con MeshCentral (`conn === 1`), el clasificador **no lo interpreta como socket zombie ni corte abrupto**, clasificándolo correctamente en **`VERDE` (Operativo)**.

---

### 11.3 Gestión de Energía en Aulas: Suspensión (S3) vs Apagado (S5)

Se detectó una discrepancia en el comportamiento del socket de red según el modo de reposo del equipo:

#### Discrepancia Técnica entre S3 y S5:
1. **Apagado Completo Voluntario (Estado ACPI S5 / Soft-off / `shutdown` / `poweroff`)**:
   - La fuente de alimentación y la placa base mantienen activo el raíl de espera de 5 voltios (+5VSB).
   - En equipos con Intel AMT, el procesador Intel ME permanece activo y mantiene levantada su sesión TLS local con MeshCentral en el puerto 16993.
   - MeshCentral reporta `conn = 4, pwr = 6` de forma continua y estable $\rightarrow$ El panel clasifica el equipo como **`GRIS` (`APAGADO`)**.
2. **Suspensión del Sistema Operativo (Estado ACPI S3 / Sleep / Standby)**:
   - Al suspenderse el SO, la política de gestión energética de la interfaz de red (Intel ME Wake in S3) hace que el procesador ME cierre las conexiones TCP/TLS activas para pasar a un modo de escucha pasiva de paquetes de reactivación.
   - Al cerrarse el socket TLS, MeshCentral detecta desconexión total (`conn = 0`) $\rightarrow$ El panel clasifica el puesto como **`NARANJA`** (falsa desconexión física).

#### Rechazo de Scripts Residentes en Clientes:
* Desplegar scripts auxiliares o interceptores de eventos de suspensión en los 60 puestos de Windows (hooks de PowerShell, tareas programadas, llamadas curl a APIs intermedias) vulnera la directriz de **cero mantenimiento en el cliente** (*zero-touch architecture*), introduce fragilidad ante actualizaciones del SO y genera problemas de permisos y cortafuegos.

#### Solución Estándar de la Industria para Laboratorios y Aulas:
En entornos educativos y empresariales de aulas de ordenadores, la mejor práctica de administración de sistemas consiste en **deshabilitar la suspensión del sistema operativo manteniendo el apagado de pantallas**:
1. **Configuración en Windows (mediante GPO o comando de provisión)**:
   ```cmd
   :: Desactivar suspensión automática con alimentación de CA
   powercfg /change standby-timeout-ac 0

   :: Desactivar hibernación
   powercfg /hibernate off

   :: Apagar monitor tras 10-15 minutos de inactividad (ahorra el ~80% de energía de la estación)
   powercfg /change monitor-timeout-ac 10
   ```
2. **Configuración en Linux (Ubuntu/Debian)**:
   ```bash
   sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
   ```
3. **Flujo de Vida Resultante en el Panel**:
   - Durante la jornada docente: Los equipos permanecen encendidos y reportando al agente $\rightarrow$ **`VERDE`**. Si el alumno no los usa, la pantalla se apaga pero la telemetría permanece viva.
   - Al cierre del aula: Apagado programado masivo mediante comando desde MeshCentral o tarea nocturna (`shutdown /s /t 0`) $\rightarrow$ Los equipos con AMT pasan limpiamente a **`GRIS`**, y los equipos estándar pasan a **`NARANJA`** listos para ser despertados por WoL al día siguiente.

---

### 11.4 Impacto Operativo Real de la Carencia de Intel AMT

Tener o no tener Intel AMT marca la línea divisoria entre **observar un sistema operativo por software** o **controlar la placa base y la corriente por hardware**:

1. **En el Panel de Observabilidad**:
   - **Colapso de granularidad**: Se reduce de 4 estados a solo 2 estados (`VERDE` y `NARANJA`).
   - **Pérdida de diagnóstico causal**: Un PC apagado voluntariamente por el usuario (`shutdown`), un corte de cable, un fallo de DHCP o un pantallazo azul (BSOD) se traducen en el mismo síntoma: `NARANJA` (desconectado).
   - **Desfase en la detección de cortes**: Sin la correlación de hardware instantánea de AMT, la detección de un corte abrupto de red queda supeditada al temporizador TCP del kernel (`tcp_retries2 = 5` $\rightarrow$ 10-12s) en lugar de deducirse en 0 segundos.
2. **En la Administración de Sistemas del Aula**:
   - **Encendido Remoto**: Dependencia de Wake-on-LAN tradicional (*Magic Packet* UDP broadcast de capa 2). Si el servidor está en una VLAN distinta al aula, los routers descartan los paquetes broadcast a menos que se configure *IP Directed-Broadcast* o *WoL relay*.
   - **KVM Fuera de Banda (BIOS / BSOD)**: Imposibilidad de ver la pantalla si el SO no ha cargado, si está en bucle de reparación de inicio o congelado en pantalla azul. Con AMT, el KVM por hardware permite operar la BIOS y diagnósticos antes de que arranque Windows.
   - **Recuperación de Cuelgues Críticos**: Si el sistema operativo se bloquea por saturación de CPU/RAM, el agente deja de responder y es imposible reiniciar el equipo de forma remota; se requiere intervención física en el botón de encendido.
   - **Despliegue y Mantenimiento**: No se dispone de redirección de medios virtuales (IDE-R) para bootear ISOs de recuperación en remoto.

---

### 11.5 Alternativas Zero-Touch de Desambiguación para Puestos sin AMT (Infraestructura de Red)

Dado el requisito de **no instalar agentes secundarios ni scripts en los 60 puestos cliente de Windows**, la única fuente fiable de telemetría física independiente del sistema operativo reside en la **infraestructura de red (Switch gestionado y Capa 2/3)**:

#### Alternativa 1: Consulta al Switch del Aula por SNMP (La vía estándar)
El switch gestionado del aula (Cisco, HP/Aruba, Dell, UniFi) monitoriza en tiempo real el estado físico de cada boca Ethernet:
- **Estado de Puerto (`ifOperStatus`)**:
  - `DOWN (2)`: Cable desconectado físicamente al 100%.
  - `UP (1)`: Cable conectado físicamente con enlace PHY activo.
- **Detección de Standby mediante Velocidad de Enlace (*Link Speed*)**:
  - Si Wake-on-LAN está activo en la BIOS de Dell, la tarjeta de red integrada reduce su velocidad en standby para ahorrar energía:
    - **Enlace a 10 Mbps o 100 Mbps**: PC **Apagado en Standby (S5)** con cable conectado $\rightarrow$ Equivale a **`GRIS`**.
    - **Enlace a 1 Gbps**: PC **Encendido físicamente**.
    - **Enlace caído (No link)**: **Cable desconectado** o regleta sin corriente $\rightarrow$ **`NARANJA`**.

#### Alternativa 2: Detección de Red Aislada vs Salida MeshCentral (Ping LAN / ARP)
Cuando el agente no conecta con MeshCentral (`conn = 0`), puede deberse a que el equipo está en una VLAN aislada, con puerta de enlace errónea o cortafuegos bloqueando la salida hacia el servidor:
- **Ping ICMP en LAN Local**: Si el daemon o una sonda en la misma subred recibe respuesta ICMP del PC pero MeshCentral lo reporta desconectado $\rightarrow$ **Red Aislada o Fallo de Enrutamiento / Proxy / DNS** $\rightarrow$ **`AMARILLO`**.
- **Inspección de Tabla ARP (`ip neigh` / caché del switch)**: Si el router o gateway conserva la entrada ARP activa para la MAC del puesto, el hardware y la capa de enlace están demostradamente activos.

#### Alternativa 3: Sondeo No Invasivo de Servicios del SO (SMB 445 / RPC 135)
Para aislar si el problema es que el servicio de MeshAgent ha fallado o se ha detenido mientras Windows sigue operativo:
- Un sondeo TCP ultrarrápido (timeout 200 ms) al puerto estándar de Windows **445 (SMB)**:
  - **Puerto 445 responde + MeshAgent desconectado** $\rightarrow$ Windows encendido y red viva; fallo lógico exclusivo del servicio del agente.

#### Matriz de Diagnóstico de Infraestructura Resultante:

| Consulta Switch | Ping LAN Local | MeshAgent | Diagnóstico Deductivo | Estado Visual |
| :---: | :---: | :---: | :--- | :---: |
| **Port DOWN** | ❌ Falla | ❌ Off | **Cable desconectado físicamente** | `NARANJA` |
| **Port UP (10/100M)**| ❌ Falla | ❌ Off | **PC Apagado en Standby (WoL armado)**| `GRIS` |
| **Port UP (1G)** | ✅ Responde | ❌ Off | **Red Aislada / Fallo salida a Mesh** | `AMARILLO` |
| **Port UP (1G)** | ❌ Falla | ❌ Off | **Fallo DHCP / Interfaz caída / Freeze**| `AMARILLO` |
| **Port UP (1G)** | ✅ Responde | ✅ On | **Puesto Operativo en Sesión** | `VERDE` |

---

## 12. Reglas para Modelos y Desarrolladores

1. **Prioridad a la simplicidad**: Todo cambio en el backend debe apoyarse en llamadas limpias a `meshctrl listdevices`.
2. **Respetar los estados visuales del parque heterogéneo**:
   - Puestos con AMT: Operativo (`VERDE`), Fallo Lógico DHCP (`AMARILLO`), Apagado Standby (`GRIS`) o Desconectado (`NARANJA`).
   - Puestos sin AMT (Dell 631-ADPL): Operativo (`VERDE`) o Desconectado/Apagado (`NARANJA`).
3. **Consistencia de datos**: El frontend espera objetos con las propiedades `estado`, `categoria`, `diagnostico` y el subobjeto `telemetria` con `os_online`, `amt_online`, `pwr` y `conn`.
4. **Arquitectura Zero-Touch en clientes**: Nunca introducir scripts, agentes secundarios ni daemons auxiliares en las máquinas cliente (Windows o Linux); toda la observabilidad debe provenir de MeshAgent y del hardware Intel AMT gestionados por el servidor MeshCentral.
