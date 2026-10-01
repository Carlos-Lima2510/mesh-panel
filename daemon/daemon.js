const { exec } = require('child_process');
const config = require('./config');
const ClassifierService = require('./services/classifier.service');
const InventoryStore = require('./services/inventory.store');
const MeshService = require('./services/mesh.service');
const SseServer = require('./sse.server');

const classifier = new ClassifierService();
const store = new InventoryStore();
const meshService = new MeshService(config);

/**
 * Comprueba si el host responde físicamente por ICMP en la red local.
 * Intel AMT en modo ACTIVE responde directamente por hardware en < 1ms si el cable está conectado.
 * Si el cable fue desconectado, falla con 100% pérdida.
 */
function checkPhysicalLink(ip) {
  return new Promise((resolve) => {
    if (!ip || !/^[0-9a-fA-F.:]+$/.test(ip)) {
      return resolve(false);
    }
    exec(`ping -c 1 -w 1 -W 1 -q ${ip}`, (error) => {
      resolve(!error);
    });
  });
}

async function refreshDevices() {
  const rawDevices = await meshService.fetchDevices();

  const processed = await Promise.all(
    rawDevices.map(async (dev) => {
      const nodeId = dev._id || dev.id;
      const conn = dev.conn ?? 0;
      const ip = dev.ip || dev.host || null;
      const pwr = dev.pwr !== undefined ? dev.pwr : null;
      const amtProvisioned = dev.intelamt ? dev.intelamt.state === 2 : false;

      // Solo verificamos enlace físico si hay discrepancia (agente OFF pero AMT aparentemente ON en MeshCentral)
      // Y además la placa base está físicamente encendida (pwr === 1)
      const connInt = parseInt(conn, 10) || 0;
      const rawOsOnline = (connInt & 1) !== 0;
      const amtOnline = (connInt & 14) !== 0;

      let linkAlive = true;
      if (!rawOsOnline && amtOnline && pwr === 1 && ip) {
        linkAlive = await checkPhysicalLink(ip);
      }

      const evaluation = classifier.evaluate(conn, ip, linkAlive, pwr, amtProvisioned);

      const record = {
        node_id: nodeId,
        nombre: dev.name || ('Puesto-' + (nodeId ? nodeId.substring(0, 6) : 'X')),
        grupo: dev.groupname || dev.meshid || 'General',
        ...evaluation
      };

      store.set(nodeId, record);
      return record;
    })
  );

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