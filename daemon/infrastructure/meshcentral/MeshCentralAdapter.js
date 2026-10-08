const { execFile } = require('child_process');

class MeshCentralAdapter {

  constructor({ url, user, pass }) {
    this.url = url;
    this.user = user;
    this.pass = pass;
  }

  listarDispositivos() {
    return new Promise((resolve, reject) => {
      const args = [
        'listdevices',
        '--url', this.url,
        '--loginuser', this.user,
        '--loginpass', this.pass,
        '--json',
        '--ignore-cert'
      ];

      console.log('[*] [MeshCentralAdapter] Ejecutando: meshctrl listdevices...');
      execFile('meshctrl', args, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('[!] [MeshCentralAdapter] Error al ejecutar comando:', error.message);
          if (stderr) console.error('[!] [MeshCentralAdapter] stderr:', stderr);
          return reject(error);
        }

        try {
          const datos = JSON.parse(stdout);
          const lista = Array.isArray(datos) ? datos : [];
          console.log(`[+] [MeshCentralAdapter] Obtenidos ${lista.length} dispositivos.`);
          resolve(lista);
        } catch (err) {
          console.error('[!] [MeshCentralAdapter] Salida no válida como JSON:', stdout);
          reject(err);
        }
      });
    });
  }

  despertarDispositivo(nodeId) {
    return new Promise((resolve, reject) => {
      const args = [
        'devicepower',
        '--url', this.url,
        '--loginuser', this.user,
        '--loginpass', this.pass,
        '--wake',
        '--id', nodeId,
        '--ignore-cert'
      ];

      console.log(`[*] [MeshCentralAdapter] Enviando Wake-on-LAN a ${nodeId}...`);
      execFile('meshctrl', args, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`[!] [MeshCentralAdapter] Error en Wake-on-LAN para ${nodeId}:`, error.message);
          return reject(error);
        }

        const salida = stdout ? stdout.trim() : '';
        const esError = salida.toLowerCase().includes('invalid') || salida.toLowerCase().includes('error');
        if (esError) {
          console.warn(`[-] [MeshCentralAdapter] Fallo en WoL para ${nodeId}: ${salida}`);
          return resolve({ success: false, salida });
        }

        console.log(`[+] [MeshCentralAdapter] WoL completado con éxito: ${salida}`);
        resolve({ success: true, salida });
      });
    });
  }
}

module.exports = MeshCentralAdapter;
