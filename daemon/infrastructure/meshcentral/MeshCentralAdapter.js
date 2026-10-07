const { exec } = require('child_process');

class MeshCentralAdapter {

  constructor({ url, user, pass }) {
    this.url = url;
    this.user = user;
    this.pass = pass;
  }

  listarDispositivos() {
    return new Promise((resolve, reject) => {
      const cmd = `meshctrl listdevices --url "${this.url}" --loginuser "${this.user}" --loginpass "${this.pass}" --json --ignore-cert`;

      console.log('[*] [MeshCentralAdapter] Ejecutando: meshctrl listdevices...');
      exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
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
      const cmd = `meshctrl devicepower --url "${this.url}" --loginuser "${this.user}" --loginpass "${this.pass}" --wake --id "${nodeId}" --ignore-cert`;

      console.log(`[*] [MeshCentralAdapter] Enviando Wake-on-LAN a ${nodeId}...`);
      exec(cmd, { timeout: 10000 }, (error, stdout) => {
        if (error) {
          console.error(`[!] [MeshCentralAdapter] Error en Wake-on-LAN para ${nodeId}:`, error.message);
          return reject(error);
        }
        console.log(`[+] [MeshCentralAdapter] WoL completado con éxito:`, stdout.trim());
        resolve({ success: true, salida: stdout.trim() });
      });
    });
  }
}

module.exports = MeshCentralAdapter;
