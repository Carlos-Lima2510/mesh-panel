// ==============================================================================
// ENTRYPOINT: DAEMON.JS
// ==============================================================================
// Punto de entrada del servidor backend.
// Ensambla las capas: Infraestructura -> Aplicación -> API HTTP / SSE.

const http = require('http');
const config = require('./config');

// Capa de Infraestructura
const MeshCentralAdapter = require('./infrastructure/meshcentral/MeshCentralAdapter');
const SnmpSwitchProvider = require('./infrastructure/network/SnmpSwitchProvider');
const SimulatedSwitchProvider = require('./infrastructure/network/SimulatedSwitchProvider');

// Capa de Aplicación
const LaboratorioService = require('./application/LaboratorioService');

// 1. Instanciar Adaptadores de Infraestructura
const meshAdapter = new MeshCentralAdapter({
  url: config.meshUrl,
  user: config.meshUser,
  pass: config.meshPass
});

const networkProvider = config.switchMode === 'simulado'
  ? new SimulatedSwitchProvider()
  : new SnmpSwitchProvider({ host: config.switchHost, community: config.switchCommunity });

// 2. Instanciar Servicio de Aplicación
const laboratorioService = new LaboratorioService({
  meshCentralAdapter: meshAdapter,
  networkProvider: networkProvider
});

// Clientes SSE conectados
const clientesSSE = [];

/**
 * Consulta y difunde el estado del laboratorio.
 */
async function refrescarLaboratorio(forzar = false) {
  const laboratorio = await laboratorioService.obtenerLaboratorio({ forzar });
  const datosLab = laboratorio.toJSON();

  // Difundir evento INIT a clientes SSE conectados
  const payload = JSON.stringify({ tipo: 'INIT', laboratorio: datosLab });
  clientesSSE.forEach(res => res.write(`data: ${payload}\n\n`));

  return datosLab;
}

// 3. Servidor HTTP / REST API
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const urlPath = req.url.split('?')[0].replace(/\/$/, '');

  // ENDPOINTS: Consultar laboratorio / Escaneo a demanda
  if (
    (req.method === 'GET' && (urlPath === '/api/laboratorio' || urlPath === '/api/devices')) ||
    (req.method === 'POST' && (urlPath === '/api/laboratorio/scan' || urlPath === '/api/scan-now' || urlPath === '/api/devices' || urlPath === '/api/refresh'))
  ) {
    try {
      const esForzado = req.method === 'POST';
      const datosLab = await refrescarLaboratorio(esForzado);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        laboratorio: datosLab
      }));
    } catch (err) {
      console.error('[-] Error consultando laboratorio:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // ENDPOINT: Consultar estado de los puertos de red
  if (req.method === 'GET' && urlPath === '/api/switch') {
    try {
      const puertos = await laboratorioService.obtenerPuertosRed();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        modo: config.switchMode,
        puertos
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // ENDPOINT: Cambiar modo de operación (CLASE vs PRACTICA)
  if (req.method === 'POST' && urlPath === '/api/laboratorio/modo') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const nuevoModo = data.modo === 'PRACTICA' ? 'PRACTICA' : 'CLASE';
        console.log(`[*] [Modo] Cambiando modo de laboratorio a: ${nuevoModo}`);
        
        // Re-evaluación instantánea en memoria (0 ms)
        const lab = laboratorioService.establecerModo(nuevoModo);
        const datosLab = lab.toJSON();
        
        // Emitir inmediatamente a clientes SSE
        const payload = JSON.stringify({ tipo: 'INIT', laboratorio: datosLab });
        clientesSSE.forEach(c => c.write(`data: ${payload}\n\n`));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, laboratorio: datosLab }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ENDPOINT: Modificar puerto si está en modo simulado en memoria
  if (req.method === 'POST' && urlPath === '/api/switch') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        if (config.switchMode === 'simulado' && networkProvider.establecerEstadoBoca) {
          const boca = data.boca || ('port' + data.port);
          networkProvider.establecerEstadoBoca(boca, { link: data.link, speed: data.speed });
        }
        const datosLab = await refrescarLaboratorio(true);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, laboratorio: datosLab }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ENDPOINT: Ejecutar acción sobre un host (ej. Wake-on-LAN)
  if (req.method === 'POST' && (urlPath === '/api/power/wake' || urlPath.startsWith('/api/host/'))) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const nodeId = data.node_id || (urlPath.split('/')[3]);
        if (!nodeId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Falta node_id del host' }));
        }

        const resultado = await laboratorioService.ejecutarAccion(nodeId, 'WAKE_ON_LAN');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, resultado }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ENDPOINT: Server-Sent Events (SSE)
  if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Emitir estado actual instantáneamente desde caché en memoria
    laboratorioService.obtenerLaboratorio({ forzar: false })
      .then(lab => {
        const d = lab.toJSON();
        res.write(`data: ${JSON.stringify({ tipo: 'INIT', laboratorio: d })}\n\n`);
      })
      .catch(() => {});

    clientesSSE.push(res);
    req.on('close', () => {
      const idx = clientesSSE.indexOf(res);
      if (idx !== -1) clientesSSE.splice(idx, 1);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

// Heartbeat SSE cada 25 segundos
setInterval(() => {
  clientesSSE.forEach(res => res.write(':heartbeat\n\n'));
}, 25000);

// Polling reactivo en segundo plano cada 5 segundos si hay clientes conectados
setInterval(async () => {
  if (clientesSSE.length > 0) {
    try {
      await refrescarLaboratorio(true);
    } catch (err) {
      // Ignorar fallos transitorios en polling periódico
    }
  }
}, 5000);

// Iniciar servidor
server.listen(config.port, '0.0.0.0', async () => {
  console.log(`[+] Servidor Daemon escuchando en http://0.0.0.0:${config.port}`);
  console.log(`[+] Modo de red: ${config.switchMode.toUpperCase()}`);
  try {
    const inicial = await refrescarLaboratorio(true);
    console.log(`[+] [ARRANQUE] Consulta inicial completada: ${inicial.hosts.length} hosts en ${inicial.nombre}.`);
  } catch (err) {
    console.warn(`[!] [ARRANQUE] Consulta inicial fallida (${err.message}). A la espera de peticiones.`);
  }
});