const snmp = require('net-snmp');
const NetworkProvider = require('./NetworkProvider');

class SnmpSwitchProvider extends NetworkProvider {

  constructor({
    version,
    switches = null,
    host = '10.10.136.13',
    community = 'public',
    user = null,
    authKey = null,
    authProto = 'sha',
    privKey = null,
    privProto = 'aes',
    cacheTtlMs = 3000
  } = {}) {
    super();

    this.switches = Array.isArray(switches) && switches.length > 0
      ? switches
      : [host];

    this.host = this.switches[0];
    this.community = community;

    if (version !== undefined) {
      this.version = version;
    } else if (user) {
      this.version = 3;
    } else if (Array.isArray(switches) && switches.length > 0 && user) {
      this.version = 3;
    } else {
      this.version = 2; 
    }

    this.user = user;
    this.authKey = authKey;
    this.authProto = authProto ? authProto.toLowerCase() : 'sha';
    this.privKey = privKey;
    this.privProto = privProto ? privProto.toLowerCase() : 'aes';

    this.cacheTtlMs = cacheTtlMs;
    this.cache = null;
    this.lastFetch = 0;

    // Map<switchHost, Map<indice, nombreBoca>>
    this.indicesANombreCache = new Map();
    // Map<switchHost, Session>
    this.sessions = new Map();
    this.session = null;
  }

  _generarAlias(targetHost) {
    const hostSinPuerto = targetHost.split(':')[0];
    const octetos = hostSinPuerto.split('.');
    if (octetos.length === 4) {
      return `sw${octetos[3]}`;
    }
    return hostSinPuerto;
  }

  _obtenerSesion(target = this.host) {
    if (!this.sessions.has(target)) {
      let targetHost = target;
      let targetPort = 161;
      if (target.includes(':')) {
        const parts = target.split(':');
        targetHost = parts[0];
        targetPort = parseInt(parts[1], 10) || 161;
      }

      let session;

      if (this.version === 3) {
        const authProtocol = this.authProto === 'md5'
          ? snmp.AuthProtocols.md5
          : snmp.AuthProtocols.sha;

        const privProtocol = this.privProto === 'des'
          ? snmp.PrivProtocols.des
          : snmp.PrivProtocols.aes;

        const user = {
          name: this.user,
          level: snmp.SecurityLevel.authPriv,
          authProtocol,
          authKey: this.authKey,
          privProtocol,
          privKey: this.privKey
        };

        session = snmp.createV3Session(targetHost, user, {
          port: targetPort,
          retries: 1,
          timeout: 1500,
          backoff: 1.0,
          transport: 'udp4'
        });
      } else {
        session = snmp.createSession(targetHost, this.community, {
          port: targetPort,
          retries: 1,
          timeout: 1000,
          backoff: 1.0,
          transport: 'udp4',
          version: snmp.Version2c
        });
      }

      session.on('error', () => {
        this._cerrarSesion(target);
      });

      this.sessions.set(target, session);
      if (target === this.host) {
        this.session = session;
      }
    }

    return this.sessions.get(target);
  }

  _cerrarSesion(target = null) {
    if (target) {
      const s = this.sessions.get(target);
      if (s) {
        try { s.close(); } catch (_) {}
        this.sessions.delete(target);
      }
      if (target === this.host) {
        this.session = null;
      }
    } else {
      for (const [, s] of this.sessions.entries()) {
        try { s.close(); } catch (_) {}
      }
      this.sessions.clear();
      this.session = null;
    }
  }

  _consultarSubtree(oid, targetHost = this.host) {
    return new Promise((resolve) => {
      let session;
      try {
        session = this._obtenerSesion(targetHost);
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

  async _obtenerNombresPuertos(targetHost) {
    if (this.indicesANombreCache.has(targetHost)) {
      return this.indicesANombreCache.get(targetHost);
    }

    // 1. Probar primero ifName (1.3.6.1.2.1.31.1.1.1.1)
    let resNombres = await this._consultarSubtree('1.3.6.1.2.1.31.1.1.1.1', targetHost);

    // 2. Si falla o está vacío, fallback a ifDescr (1.3.6.1.2.1.2.2.1.2)
    if (resNombres.error || !resNombres.varbinds || resNombres.varbinds.length === 0) {
      resNombres = await this._consultarSubtree('1.3.6.1.2.1.2.2.1.2', targetHost);
    }

    const mapaNombres = new Map();
    if (!resNombres.error && resNombres.varbinds && resNombres.varbinds.length > 0) {
      for (const vb of resNombres.varbinds) {
        const match = vb.oid.match(/\.(\d+)$/);
        const indice = match ? match[1] : vb.oid.split('.').pop();
        let nombre = (Buffer.isBuffer(vb.value) ? vb.value.toString('utf8') : String(vb.value))
          .trim()
          .replace(/^"|"$/g, '');

        // Normalizar nombres tipo "port1(primary)" -> "port1"
        const portMatch = nombre.match(/^(port\d+)/i);
        if (portMatch) {
          nombre = portMatch[1].toLowerCase();
        }

        mapaNombres.set(indice, nombre);
      }
    }

    if (mapaNombres.size > 0) {
      this.indicesANombreCache.set(targetHost, mapaNombres);
    }

    return mapaNombres;
  }

  async _consultarSwitch(targetHost, esPrincipal = false) {
    const indicesANombre = await this._obtenerNombresPuertos(targetHost);
    const [resEstados, resVelocidades] = await Promise.all([
      this._consultarSubtree('1.3.6.1.2.1.2.2.1.8', targetHost),
      this._consultarSubtree('1.3.6.1.2.1.31.1.1.1.15', targetHost)
    ]);

    const resultadoSwitch = new Map();
    if (resEstados.error || !resEstados.varbinds || resEstados.varbinds.length === 0) {
      return resultadoSwitch;
    }

    const indicesAEstado = new Map();
    for (const vb of resEstados.varbinds) {
      const match = vb.oid.match(/\.(\d+)$/);
      const indice = match ? match[1] : vb.oid.split('.').pop();
      const val = vb.value;
      const isUp = (val === 1 || String(val).toLowerCase() === 'up');
      indicesAEstado.set(indice, isUp ? 'UP' : 'DOWN');
    }

    const indicesAVelocidad = new Map();
    if (!resVelocidades.error && resVelocidades.varbinds && resVelocidades.varbinds.length > 0) {
      for (const vb of resVelocidades.varbinds) {
        const match = vb.oid.match(/\.(\d+)$/);
        const indice = match ? match[1] : vb.oid.split('.').pop();
        const val = parseInt(vb.value, 10);
        if (!isNaN(val)) {
          indicesAVelocidad.set(indice, val);
        }
      }
    }

    for (const [indice, nombreBoca] of indicesANombre.entries()) {
      if (!nombreBoca.startsWith('port')) continue;

      const numPuerto = parseInt(nombreBoca.replace('port', ''), 10) || parseInt(indice, 10);
      const link = indicesAEstado.get(indice) || 'DOWN';
      const realSpeed = indicesAVelocidad.get(indice);
      const speed = link === 'UP' ? (realSpeed !== undefined ? realSpeed : 1000) : 0;

      resultadoSwitch.set(nombreBoca, {
        port: numPuerto,
        portName: nombreBoca,
        link: link,
        speed: speed,
        source: 'snmp_real'
      });
    }

    return resultadoSwitch;
  }

  async _consultarSnmp() {
    const ahora = Date.now();
    if (this.cache && (ahora - this.lastFetch < this.cacheTtlMs)) {
      return this.cache;
    }

    // Consultas masivas y paralelizadas (Promise.all)
    const switchesData = await Promise.all(
      this.switches.map((sw, idx) => this._consultarSwitch(sw, idx === 0))
    );

    const resultado = new Map();

    switchesData.forEach((mapaSwitch, idx) => {
      const swHost = this.switches[idx];
      const alias = this._generarAlias(swHost);
      const esPrincipal = (idx === 0);

      for (const [nombreBoca, info] of mapaSwitch.entries()) {
        if (this.switches.length > 1) {
          resultado.set(`${alias}:${nombreBoca}`, info);
          resultado.set(`${swHost}:${nombreBoca}`, info);
        }

        if (esPrincipal || !resultado.has(nombreBoca)) {
          resultado.set(nombreBoca, info);
        }
      }
    });

    if (resultado.size > 0) {
      this.cache = resultado;
      this.lastFetch = ahora;
    }

    return this.cache || new Map();
  }

  async obtenerEstadoBoca(boca) {
    const mapa = await this._consultarSnmp();
    if (mapa && mapa.has(boca)) {
      return { ...mapa.get(boca) };
    }
    const num = parseInt(boca.replace(/\D/g, ''), 10) || 99;
    return { port: num, portName: boca, link: 'UP', speed: 1000, source: 'snmp_fallback' };
  }

  async obtenerTodosLosPuertos() {
    const mapa = await this._consultarSnmp();
    const obj = {};
    for (const [k, v] of mapa.entries()) {
      obj[k] = { ...v };
    }
    return obj;
  }
}

module.exports = SnmpSwitchProvider;
