const http = require('http');

class SseServer {
  /**
   * @param {number} port 
   * @param {number} heartbeatIntervalMs 
   * @param {Function} onRefreshRequestFn
   * @param {Function} getSnapshotFn 
   * @param {Object} [switchService]
   */
  constructor(port, heartbeatIntervalMs, onRefreshRequestFn, getSnapshotFn, switchService = null) {
    this.port = port;
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.onRefreshRequest = onRefreshRequestFn;
    this.getSnapshot = getSnapshotFn;
    this.switchService = switchService;
    this.clients = [];
    this.server = null;
  }

  start() {
    this.server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
      }

      const urlPath = req.url.split('?')[0].replace(/\/$/, '');

      if (
        (req.method === 'GET' && urlPath === '/api/devices') ||
        (req.method === 'POST' && (urlPath === '/api/scan-now' || urlPath === '/api/devices' || urlPath === '/api/refresh'))
      ) {
        try {
          console.log(`[*] [HTTP ${req.method}] Solicitud a demanda recibida en ${urlPath}`);
          const puestos = await this.onRefreshRequest();
          this.broadcastInit(puestos);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, count: puestos.length, puestos }));
        } catch (error) {
          console.error('[-] Error en endpoint a demanda:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: error.message }));
        }
      }

      if (req.method === 'GET' && urlPath === '/api/switch') {
        let ports = {};
        if (this.switchService) {
          if (this.switchService.mode === 'snmp') {
            const snmpMap = await this.switchService.fetchSnmpSwitchData();
            if (snmpMap) {
              for (const [k, v] of snmpMap.entries()) ports[k] = v;
            } else {
              ports = this.switchService.getAllMockPorts();
            }
          } else {
            ports = this.switchService.getAllMockPorts();
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          mode: this.switchService ? this.switchService.mode : 'disabled',
          host: this.switchService ? this.switchService.host : null,
          ports
        }));
      }

      if (req.method === 'POST' && urlPath === '/api/switch') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            if (this.switchService && data.nombre) {
              this.switchService.setMockPort(data.nombre, {
                port: data.port,
                link: data.link,
                speed: data.speed
              });
            }
            const puestos = await this.onRefreshRequest();
            this.broadcastInit(puestos);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: true,
              updated: data,
              ports: this.switchService ? this.switchService.getAllMockPorts() : {},
              puestos
            }));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }

      if (req.method === 'GET' && urlPath === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      }

      if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const snapshot = this.getSnapshot();
        const snapshotList = Array.isArray(snapshot) ? snapshot : Array.from(snapshot.values ? snapshot.values() : []);
        res.write(`data: ${JSON.stringify({ tipo: 'INIT', puestos: snapshotList })}\n\n`);

        this.clients.push(res);

        req.on('close', () => {
          this.clients = this.clients.filter(c => c !== res);
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
    });

    setInterval(() => {
      this.clients.forEach(res => res.write(':heartbeat\n\n'));
    }, this.heartbeatIntervalMs);

    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`[+] Servidor escuchando en http://0.0.0.0:${this.port}`);
    });
  }

  broadcastInit(puestos) {
    const payload = JSON.stringify({ tipo: 'INIT', puestos });
    this.clients.forEach(res => res.write(`data: ${payload}\n\n`));
  }

  broadcastUpdate(node) {
    const payload = JSON.stringify({ tipo: 'UPDATE', puesto: node });
    this.clients.forEach(res => res.write(`data: ${payload}\n\n`));
  }
}

module.exports = SseServer;