const { spawn, exec } = require('child_process');

class MeshStreamService {
  constructor(config, onEventCallback) {
    this.config = config;
    this.onEventCallback = onEventCallback;
    this.child = null;
  }

  fetchInitialSnapshot() {
    return new Promise((resolve) => {
      console.log('[*] [COLD START] Obteniendo snapshot inicial de puestos...');
      const cmd = 'meshctrl listdevices --url "$MESH_URL" --loginuser "$MESH_USER" --loginpass "$MESH_PASS" --json';

      exec(cmd, {
        env: {
          ...process.env,
          MESH_URL: this.config.mesh.url,
          MESH_USER: this.config.mesh.user,
          MESH_PASS: this.config.mesh.pass
        }
      }, (error, stdout) => {
        if (error) {
          console.error('[!] Error en snapshot inicial:', error.message);
          return resolve([]);
        }

        try {
          const parsed = JSON.parse(stdout);
          return resolve(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error('[!] Error al parsear snapshot JSON:', e.message);
          return resolve([]);
        }
      });
    });
  }

  startEventStream() {
    console.log('[*] Conectando stream reactivo continuo a MeshCentral...');

    this.child = spawn('meshctrl', [
      'showevents',
      '--url', '$MESH_URL',
      '--loginuser', '$MESH_USER',
      '--loginpass', '$MESH_PASS',
      '--json'
    ], {
      shell: true,
      env: {
        ...process.env,
        MESH_URL: this.config.mesh.url,
        MESH_USER: this.config.mesh.user,
        MESH_PASS: this.config.mesh.pass
      }
    });

    let buffer = '';

    this.child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const blocks = buffer.split('\n}\n');

      if (blocks.length > 1) {
        buffer = blocks.pop();
        for (const raw of blocks) {
          const jsonStr = (raw.trim().startsWith('{') ? raw.trim() : '{' + raw.trim()) + '\n}';
          this._handleRawBlock(jsonStr);
        }
      }
    });

    this.child.stderr.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg && !msg.includes('Warning')) {
        console.error(`[MESHCTRL STDERR] ${msg}`);
      }
    });

    this.child.on('close', (code) => {
      console.warn(`[!] Stream caído (Código ${code}). Reconectando en ${this.config.server.reconnectDelayMs / 1000}s...`);
      setTimeout(() => this.startEventStream(), this.config.server.reconnectDelayMs);
    });
  }

  _handleRawBlock(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      this.onEventCallback(data.event || data);
    } catch (_) {
      // Ignorar fragmentos no válidos o banners
    }
  }
}

module.exports = MeshStreamService;