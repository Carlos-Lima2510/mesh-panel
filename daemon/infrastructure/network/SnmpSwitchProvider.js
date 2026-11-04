const snmp = require('net-snmp');
const NetworkProvider = require('./NetworkProvider');

class SnmpSwitchProvider extends NetworkProvider {

  constructor({ host = 'virtual-switch:1616', community = 'public' } = {}) {
    super();
    this.host = host;
    this.community = community;
    this.cache = null;
    this.lastFetch = 0;
    this.indicesANombreCache = null;
    this.session = null;
  }

  _obtenerSesion() {
    if (!this.session) {
      let targetHost = this.host;
      let targetPort = 161;
      if (this.host.includes(':')) {
        const parts = this.host.split(':');
        targetHost = parts[0];
        targetPort = parseInt(parts[1], 10) || 161;
      }

      this.session = snmp.createSession(targetHost, this.community, {
        port: targetPort,
        retries: 1,
        timeout: 1000,
        backoff: 1.0,
        transport: 'udp4',
        version: snmp.Version2c
      });

      this.session.on('error', () => {
        this._cerrarSesion();
      });
    }
    return this.session;
  }

  _cerrarSesion() {
    if (this.session) {
      try {
        this.session.close();
      } catch (_) {}
      this.session = null;
    }
  }

  _consultarSubtree(oid) {
    return new Promise((resolve) => {
      let session;
      try {
        session = this._obtenerSesion();
      } catch (err) {
        return resolve({ error: err, varbinds: [] });
      }

      const varbinds = [];
      session.subtree(oid, 20, (chunk) => {
        for (const vb of chunk) {
          if (!snmp.isVarbindError(vb)) {
            varbinds.push(vb);
          }
        }
      }, (error) => {
        if (error) {
          return resolve({ error, varbinds: [] });
        }
        resolve({ error: null, varbinds });
      });
    });
  }

  async _consultarSnmp() {
    const ahora = Date.now();
    if (this.cache && (ahora - this.lastFetch < 3000)) {
      return this.cache;
    }

    // 1. Obtener nombres de las bocas (ifDescr: 1.3.6.1.2.1.2.2.1.2) - Caché estática
    if (!this.indicesANombreCache) {
      const resNombres = await this._consultarSubtree('1.3.6.1.2.1.2.2.1.2');
      if (!resNombres.error && resNombres.varbinds.length > 0) {
        const mapaNombres = new Map();
        for (const vb of resNombres.varbinds) {
          const match = vb.oid.match(/\.1\.3\.6\.1\.2\.1\.2\.2\.1\.2\.(\d+)$/) || vb.oid.match(/\.(\d+)$/);
          const indice = match ? match[1] : vb.oid.split('.').pop();
          const nombre = (Buffer.isBuffer(vb.value) ? vb.value.toString('utf8') : String(vb.value))
            .trim()
            .replace(/^"|"$/g, '');
          mapaNombres.set(indice, nombre);
        }
        if (mapaNombres.size > 0) {
          this.indicesANombreCache = mapaNombres;
        }
      }
    }

    // 2. Obtener estado operacional de las interfaces (ifOperStatus: 1.3.6.1.2.1.2.2.1.8)
    const resEstados = await this._consultarSubtree('1.3.6.1.2.1.2.2.1.8');

    if (resEstados.error || resEstados.varbinds.length === 0) {
      return this.cache || new Map();
    }

    const indicesANombre = this.indicesANombreCache || new Map();
    const indicesAEstado = new Map();

    for (const vb of resEstados.varbinds) {
      const match = vb.oid.match(/\.1\.3\.6\.1\.2\.1\.2\.2\.1\.8\.(\d+)$/) || vb.oid.match(/\.(\d+)$/);
      const indice = match ? match[1] : vb.oid.split('.').pop();
      const val = vb.value;
      const isUp = (val === 1 || String(val).toLowerCase() === 'up');
      indicesAEstado.set(indice, isUp ? 'UP' : 'DOWN');
    }

    const resultado = new Map();
    for (const [indice, nombreBoca] of indicesANombre.entries()) {
      if (!nombreBoca.startsWith('port')) continue;

      const numPuerto = parseInt(nombreBoca.replace('port', ''), 10) || parseInt(indice, 10);
      const link = indicesAEstado.get(indice) || 'DOWN';

      resultado.set(nombreBoca, {
        port: numPuerto,
        portName: nombreBoca,
        link: link,
        speed: link === 'UP' ? 1000 : 0,
        source: 'snmp_real'
      });
    }

    this.cache = resultado;
    this.lastFetch = ahora;
    return resultado;
  }

  async obtenerEstadoBoca(boca) {
    const mapa = await this._consultarSnmp();
    if (mapa && mapa.has(boca)) {
      return { ...mapa.get(boca) };
    }
    const num = parseInt(boca.replace('port', ''), 10) || 99;
    return { port: num, portName: boca, link: 'UP', speed: 1000, source: 'snmp_fallback' };
  }

  async obtenerTodosLosPuertos() {
    const mapa = await this._consultarSnmp();
    const obj = {};
    for (const [k, v] of mapa.entries()) {
      obj[k] = v;
    }
    return obj;
  }
}

module.exports = SnmpSwitchProvider;
