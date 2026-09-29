const { exec } = require('child_process');

class MeshService {
  constructor(config) {
    this.config = config;
  }

  fetchDevices() {
    return new Promise((resolve, reject) => {
      console.log('[*] [A DEMANDA] Consultando meshctrl listdevices a MeshCentral...');
      const cmd = 'meshctrl listdevices --url "$MESH_URL" --loginuser "$MESH_USER" --loginpass "$MESH_PASS" --json --ignore-cert';

      exec(cmd, {
        env: {
          ...process.env,
          MESH_URL: this.config.mesh.url,
          MESH_USER: this.config.mesh.user,
          MESH_PASS: this.config.mesh.pass
        }
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('[!] Error al ejecutar meshctrl listdevices:', error.message);
          if (stderr) console.error('[!] meshctrl stderr:', stderr);
          return reject(error);
        }

        try {
          const parsed = JSON.parse(stdout);
          const list = Array.isArray(parsed) ? parsed : [];
          console.log(`[+] [A DEMANDA] Obtenidos ${list.length} dispositivos.`);
          return resolve(list);
        } catch (e) {
          console.error('[!] Error al parsear JSON de meshctrl listdevices:', e.message);
          return reject(e);
        }
      });
    });
  }
}

module.exports = MeshService;
