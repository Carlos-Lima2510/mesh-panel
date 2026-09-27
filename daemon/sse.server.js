const http = require('http');

class SseServer {
  constructor(port, heartbeatIntervalMs, getInitialSnapshotFn) {
    this.port = port;
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.getInitialSnapshot = getInitialSnapshotFn;
    this.clients = [];
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const snapshot = this.getInitialSnapshot();
      res.write(`data: ${JSON.stringify({ tipo: 'INIT', puestos: snapshot })}\n\n`);

      this.clients.push(res);

      req.on('close', () => {
        this.clients = this.clients.filter(c => c !== res);
      });
    });

    setInterval(() => {
      this.clients.forEach(res => res.write(':heartbeat\n\n'));
    }, this.heartbeatIntervalMs);

    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`[+] Servidor SSE escuchando en http://0.0.0.0:${this.port}`);
    });
  }

  broadcastUpdate(node) {
    const payload = JSON.stringify({ tipo: 'UPDATE', puesto: node });
    this.clients.forEach(res => res.write(`data: ${payload}\n\n`));
  }
}

module.exports = SseServer;