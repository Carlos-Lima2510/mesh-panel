const config = require('./config');
const ClassifierService = require('./services/classifier.service');
const InventoryStore = require('./services/inventory.store');
const MeshStreamService = require('./services/mesh-stream.service');
const SseServer = require('./sse.server');

const classifier = new ClassifierService(config.network.dhcpSubnet);
const store = new InventoryStore();

const sseServer = new SseServer(
  config.server.port,
  config.server.heartbeatIntervalMs,
  () => store.getAll(),
  classifier, // <--- Pasamos el clasificador aquí
  (updatedNode) => store.set(updatedNode.node_id, updatedNode) // <--- Actualizar el store
);

function handleMeshEvent(evt) {
  if (!evt || !evt.action) return;

  const nodeId = evt.nodeid;
  const current = store.get(nodeId) || { nombre: 'Puesto-' + (nodeId ? nodeId.substring(7, 13) : 'X'), telemetria: {} };

  if (evt.action === 'changenode' && evt.node) {
    const n = evt.node;
    const conn = current.telemetria.conn ?? 0;
    const ip = n.ip || current.telemetria.ip_reportada;
    const evaluation = classifier.evaluate(conn, ip);

    const updated = {
      node_id: evt.nodeid,
      nombre: n.name || n.rname || current.nombre,
      grupo: n.meshid || current.grupo || 'General',
      ...evaluation
    };

    store.set(evt.nodeid, updated);
    sseServer.broadcastUpdate(updated);
  }

  if (evt.action === 'nodeconnect') {
    const conn = evt.conn ?? 0;
    const ip = current.telemetria.ip_reportada || null;
    const evaluation = classifier.evaluate(conn, ip);

    const updated = {
      node_id: nodeId,
      nombre: current.nombre,
      grupo: current.grupo || 'General',
      ...evaluation
    };

    store.set(nodeId, updated);
    sseServer.broadcastUpdate(updated);
  }
}

const meshStream = new MeshStreamService(config, handleMeshEvent);

(async () => {
  sseServer.start();

  const devices = await meshStream.fetchInitialSnapshot();
  devices.forEach(dev => {
    const evaluation = classifier.evaluate(dev.conn || 0, dev.ip || null);
    store.set(dev._id, {
      node_id: dev._id,
      nombre: dev.name || 'Sin Nombre',
      grupo: dev.groupname || 'General',
      ...evaluation
    });
  });

  console.log(`[+] [COLD START] Snapshot consolidado: ${store.count()} puestos en memoria.`);
  meshStream.startEventStream();
})();