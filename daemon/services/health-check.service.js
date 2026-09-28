const net = require('net');

function probeHost(ip, port = 22, timeoutMs = 800) {
  return new Promise((resolve) => {
    if (!ip || ip === '0.0.0.0' || ip === '127.0.0.1') {
      return resolve(false);
    }

    const socket = new net.Socket();
    let handled = false;

    socket.setTimeout(timeoutMs);

    socket.connect(port, ip, () => {
      handled = true;
      socket.destroy();
      resolve(true); // Conexión abierta con éxito
    });

    socket.on('error', (err) => {
      socket.destroy();
      if (!handled) {
        handled = true;
        // Si la interfaz está DOWN o la IP no existe:
        // err.code suele ser 'EHOSTUNREACH', 'ENETUNREACH' o 'ETIMEDOUT'
        // Si no tienes SSH levantado en la VM y quieres testear, pon temporalmente: resolve(false)
        console.log(`[*] [PROBE] IP ${ip}:${port} devolvió error: ${err.code}`);
        resolve(false); 
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      if (!handled) {
        handled = true;
        console.log(`[*] [PROBE] IP ${ip}:${port} dio TIMEOUT`);
        resolve(false);
      }
    });
  });
}

async function scanAllDevices(devices) {
  const list = Array.isArray(devices) ? devices : Array.from(devices.values());
  const promises = list.map((node) => {
    const ip = node.ip || node.host;
    const id = node._id || node.id;
    return probeHost(ip).then((isReachable) => ({ id, isReachable, ip }));
  });

  return Promise.all(promises);
}

module.exports = { probeHost, scanAllDevices };