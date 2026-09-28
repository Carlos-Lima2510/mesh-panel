const http = require('http');
const { scanAllDevices } = require('./services/health-check.service');

class SseServer {
  /**
   * @param {number} port - Puerto de escucha
   * @param {number} heartbeatIntervalMs - Frecuencia de latidos
   * @param {Function} getInitialSnapshotFn - Retorna () => store.getAll()
   * @param {Object} classifierInstance - Instancia de ClassifierService
   * @param {Function} onDeviceUpdatedFn - Callback para persistir en store
   */
  constructor(port, heartbeatIntervalMs, getInitialSnapshotFn, classifierInstance = null, onDeviceUpdatedFn = null) {
    this.port = port;
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.getInitialSnapshot = getInitialSnapshotFn;
    this.classifier = classifierInstance;
    this.onDeviceUpdated = onDeviceUpdatedFn;
    this.clients = [];
    this.server = null;
  }

  start() {
    this.server = http.createServer(async (req, res) => {
      // Cabeceras globales de CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      // 1. Resolver peticiones preflight CORS
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
      }

      // 2. Endpoint REST: Sondeo Activo bajo demanda
      const urlPath = req.url.split('?')[0].replace(/\/$/, '');
      if (req.method === 'POST' && urlPath === '/api/scan-now') {
        try {
          console.log('[*] [SCAN-NOW] Petición recibida. Ejecutando sondeo TCP...');

          const currentNodes = this.getInitialSnapshot();
          
          // Normalizar colección de puestos desde InventoryStore
          let nodesList = [];
          if (Array.isArray(currentNodes)) {
            nodesList = currentNodes;
          } else if (currentNodes instanceof Map) {
            nodesList = Array.from(currentNodes.values());
          } else if (typeof currentNodes === 'object' && currentNodes !== null) {
            nodesList = Object.values(currentNodes);
          }

          // Extractor de IP compatible con tu estructura real de Store
          const extractIp = (node) => {
            if (node.telemetria && (node.telemetria.ip_reportada || node.telemetria.ip_os)) {
              return node.telemetria.ip_reportada || node.telemetria.ip_os;
            }
            return node.ip || node.host || null;
          };

          // Preparar array para scanAllDevices con node_id real e IP interna
          const formattedList = nodesList.map(n => ({
            id: n.node_id || n._id || n.id,
            ip: extractIp(n),
            originalNode: n
          }));

          const results = await scanAllDevices(formattedList);
          let updatedCount = 0;

          for (const { id, isReachable, ip } of results) {
            const currentRecord = nodesList.find(n => (n.node_id || n._id || n.id) === id);
            if (!currentRecord) continue;

            const nodeName = currentRecord.nombre || id;
            console.log(`[*] [SCAN-NOW] Evaluando nodo ${nodeName} (IP: ${ip}) -> Alcanzable: ${isReachable}`);

            // Obtener el conn actual (está en telemetria.conn o en la raíz)
            const currentConn = currentRecord.telemetria?.conn ?? currentRecord.conn ?? 0;
            const isCurrentlyOnline = (currentConn & 1) !== 0;

            if (!isReachable && isCurrentlyOnline) {
              console.log(`[!] [SCAN-NOW] Forzando caída de ${nodeName}`);

              // Apagar el Bit 0 (MeshAgent caído)
              const newConn = currentConn & ~1;

              // Reevaluar con ClassifierService para regenerar telemetria completa
              let evaluation = {};
              if (this.classifier && typeof this.classifier.evaluate === 'function') {
                evaluation = this.classifier.evaluate(newConn, ip);
              } else {
                evaluation = {
                  estado: (newConn & 4) !== 0 ? 'AMARILLO' : 'NARANJA',
                  telemetria: {
                    conn: newConn,
                    meshagent_online: false,
                    intel_amt_online: (newConn & 4) !== 0,
                    ip_reportada: ip,
                    diagnostico: 'Puesto aislado o sin red'
                  }
                };
              }

              // Estructurar el objeto exactamente como lo genera tu handleMeshEvent
              const updated = {
                ...currentRecord,
                node_id: currentRecord.node_id || id,
                nombre: currentRecord.nombre,
                grupo: currentRecord.grupo || 'General',
                ...evaluation
              };

              // Persistir en InventoryStore
              if (typeof this.onDeviceUpdated === 'function') {
                this.onDeviceUpdated(updated);
              }

              // Emitir actualización inmediata al frontend vía SSE
              this.broadcastUpdate(updated);
              updatedCount++;
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, updatedCount, total: nodesList.length }));
        } catch (error) {
          console.error('[-] [SCAN-NOW] Error durante el escaneo:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: error.message }));
        }
      }

      // 3. Endpoint SSE (Canal reactivo de eventos)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const snapshot = this.getInitialSnapshot();
      const snapshotList = Array.isArray(snapshot) ? snapshot : Array.from(snapshot.values ? snapshot.values() : []);
      res.write(`data: ${JSON.stringify({ tipo: 'INIT', puestos: snapshotList })}\n\n`);

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