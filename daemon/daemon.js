const http = require('http');
const config = require('./config');

const MeshCentralAdapter = require('./infrastructure/meshcentral/MeshCentralAdapter');
const SnmpSwitchProvider = require('./infrastructure/network/SnmpSwitchProvider');
const SimulatedSwitchProvider = require('./infrastructure/network/SimulatedSwitchProvider');

const LaboratorioService = require('./application/LaboratorioService');

const meshAdapter = new MeshCentralAdapter({
  url: config.meshUrl,
  user: config.meshUser,
  pass: config.meshPass
});

const networkProvider = config.switchMode === 'simulado'
  ? new SimulatedSwitchProvider()
  : new SnmpSwitchProvider({ host: config.switchHost, community: config.switchCommunity });

const laboratorioService = new LaboratorioService({
  meshCentralAdapter: meshAdapter,
  networkProvider: networkProvider
});

const clientesSSE = [];

async function refrescarLaboratorio(forzar = false) {
  const laboratorio = await laboratorioService.obtenerLaboratorio({ forzar });
  const datosLab = laboratorio.toJSON();

  const payload = JSON.stringify({ tipo: 'INIT', laboratorio: datosLab });
  clientesSSE.forEach(res => res.write(`data: ${payload}\n\n`));

  return datosLab;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const urlPath = req.url.split('?')[0].replace(/\/$/, '');

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

  if (req.method === 'POST' && urlPath === '/api/laboratorio/modo') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const nuevoModo = data.modo === 'PRACTICA' ? 'PRACTICA' : 'CLASE';
        console.log(`[*] [Modo] Cambiando modo de laboratorio a: ${nuevoModo}`);
        
        const lab = laboratorioService.establecerModo(nuevoModo);
        const datosLab = lab.toJSON();
        
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

  if (req.method === 'POST' && (urlPath === '/api/power/wake' || urlPath === '/api/power/off' || urlPath === '/api/power/shutdown' || urlPath.startsWith('/api/host/'))) {
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

        let tipoAccion = data.accion;
        if (!tipoAccion) {
          if (urlPath === '/api/power/off' || urlPath === '/api/power/shutdown') {
            tipoAccion = 'POWER_OFF';
          } else {
            tipoAccion = 'WAKE_ON_LAN';
          }
        }

        console.log(`[*] [Acción] Solicitando ${tipoAccion} para: ${nodeId}`);
        const resultado = await laboratorioService.ejecutarAccion(nodeId, tipoAccion);
        const exito = Boolean(resultado && resultado.success);
        res.writeHead(exito ? 200 : 400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: exito, resultado }));
      } catch (err) {
        console.error(`[!] [Acción] Error procesando acción:`, err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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

setInterval(() => {
  clientesSSE.forEach(res => res.write(':heartbeat\n\n'));
}, 25000);

setInterval(async () => {
  if (clientesSSE.length > 0) {
    try {
      await refrescarLaboratorio(true);
    } catch (err) {
    }
  }
}, 5000);

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