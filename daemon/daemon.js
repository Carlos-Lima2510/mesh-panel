const config = require('./config');
const ClassifierService = require('./services/classifier.service');
const InventoryStore = require('./services/inventory.store');
const MeshService = require('./services/mesh.service');
const SseServer = require('./sse.server');

const classifier = new ClassifierService();
const store = new InventoryStore();
const meshService = new MeshService(config);

async function refreshDevices() {
  const rawDevices = await meshService.fetchDevices();
  const processed = [];

  for (const dev of rawDevices) {
    const nodeId = dev._id || dev.id;
    const conn = dev.conn ?? 0;
    const ip = dev.ip || null;
    const evaluation = classifier.evaluate(conn, ip);

    const record = {
      node_id: nodeId,
      nombre: dev.name || ('Puesto-' + (nodeId ? nodeId.substring(0, 6) : 'X')),
      grupo: dev.groupname || dev.meshid || 'General',
      ...evaluation
    };

    store.set(nodeId, record);
    processed.push(record);
  }

  return processed;
}

const sseServer = new SseServer(
  config.server.port,
  config.server.heartbeatIntervalMs,
  refreshDevices,
  () => store.getAll()
);

(async () => {
  sseServer.start();

  try {
    const initialList = await refreshDevices();
    console.log(`[+] [ARRANQUE] Consulta inicial completada: ${initialList.length} puestos en memoria.`);
  } catch (err) {
    console.warn(`[!] [ARRANQUE] No se pudo ejecutar la consulta inicial: ${err.message}. El servidor queda a la espera de peticiones a demanda.`);
  }
})();