const { exec } = require('child_process');
const NetworkProvider = require('./NetworkProvider');

class SnmpSwitchProvider extends NetworkProvider {

  constructor({ host = 'virtual-switch:1616', community = 'public' } = {}) {
    super();
    this.host = host;
    this.community = community;
    this.cache = null;
    this.lastFetch = 0;
    this.indicesANombreCache = null;
  }

  _ejecutarComando(cmd) {
    return new Promise((resolve) => {
      exec(cmd, { timeout: 2000 }, (error, stdout) => {
        if (error) return resolve('');
        resolve(stdout.trim());
      });
    });
  }

  async _consultarSnmp() {
    const ahora = Date.now();
    if (this.cache && (ahora - this.lastFetch < 3000)) {
      return this.cache;
    }

    let salidaNombres = '';
    if (!this.indicesANombreCache) {
      salidaNombres = await this._ejecutarComando(`snmpwalk -v2c -c ${this.community} -t 1 -r 1 -Oqn ${this.host} 1.3.6.1.2.1.2.2.1.2`);
      if (salidaNombres) {
        const mapaNombres = new Map();
        salidaNombres.split('\n').forEach(linea => {
          const match = linea.match(/\.1\.3\.6\.1\.2\.1\.2\.2\.1\.2\.(\d+)\s+"?([^"\s]+)"?/);
          if (match) mapaNombres.set(match[1], match[2]);
        });
        if (mapaNombres.size > 0) {
          this.indicesANombreCache = mapaNombres;
        }
      }
    }

    const salidaEstados = await this._ejecutarComando(`snmpwalk -v2c -c ${this.community} -t 1 -r 1 -Oqn ${this.host} 1.3.6.1.2.1.2.2.1.8`);

    if (!salidaEstados) {
      return this.cache || new Map();
    }

    const indicesANombre = this.indicesANombreCache || new Map();

    const indicesAEstado = new Map();
    salidaEstados.split('\n').forEach(linea => {
      const match = linea.match(/\.1\.3\.6\.1\.2\.1\.2\.2\.1\.8\.(\d+)\s+([a-zA-Z0-9]+)/);
      if (match) {
        const val = match[2].toLowerCase();
        const isUp = (val === '1' || val === 'up');
        indicesAEstado.set(match[1], isUp ? 'UP' : 'DOWN');
      }
    });

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
