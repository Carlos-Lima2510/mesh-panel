const Laboratorio = require('../domain/Laboratorio');
const Host = require('../domain/Host');
const Red = require('../domain/Red');

class LaboratorioService {

  constructor({ meshCentralAdapter, networkProvider, mapeoBocas = {}, cacheTtlMs = 3000 }) {
    this.meshAdapter = meshCentralAdapter;
    this.networkProvider = networkProvider;
    this.cacheTtlMs = cacheTtlMs;
    this.ultimoLaboratorio = null;
    this.ultimoRefresco = 0;
    this.promesaRefresco = null;

    this.mapeoBocas = {
      'UEA-C226': 'port1',
      'UEA-C232': 'port2',
      'UEA-C234': 'port3',
      'UEA-C236': 'port4',
      'UEA-C403': 'port5',
      ...mapeoBocas
    };

    this.redesPorDefecto = [
      new Red({
        id: 'red-docencia',
        nombre: 'Red Docencia / Producción',
        subred: process.env.DHCP_SUBNET || '192.168.122.',
        esAislada: false
      }),
      new Red({
        id: 'red-aislada',
        nombre: 'Red Aislada de Prácticas',
        subred: '10.0.99.',
        esAislada: true
      })
    ];
    this.modoActual = 'CLASE'; 
  }

  establecerModo(modo) {
    this.modoActual = modo === 'PRACTICA' ? 'PRACTICA' : 'CLASE';
    if (this.ultimoLaboratorio) {
      this.ultimoLaboratorio.establecerModo(this.modoActual);
      return this.ultimoLaboratorio;
    }
    return this.obtenerLaboratorio({ forzar: true });
  }

  async obtenerLaboratorio({ forzar = false } = {}) {
    const ahora = Date.now();

    if (!forzar && this.ultimoLaboratorio && (ahora - this.ultimoRefresco < this.cacheTtlMs)) {
      return this.ultimoLaboratorio;
    }

    if (this.promesaRefresco) {
      if (!forzar && this.ultimoLaboratorio) {
        return this.ultimoLaboratorio;
      }
      return await this.promesaRefresco;
    }

    this.promesaRefresco = this._refrescarInterno();
    try {
      const resultado = await this.promesaRefresco;
      return resultado;
    } finally {
      this.promesaRefresco = null;
    }
  }

  async _refrescarInterno() {
    const [rawDevices, mapaPuertos] = await Promise.all([
      this.meshAdapter.listarDispositivos().catch(err => {
        console.error('[-] Error listando dispositivos MeshCentral:', err.message);
        return [];
      }),
      this.networkProvider.obtenerTodosLosPuertos().catch(err => {
        console.error('[-] Error consultando puertos de red:', err.message);
        return {};
      })
    ]);

    const nombreAula = rawDevices.length > 0 && rawDevices[0].groupname ? rawDevices[0].groupname : 'Laboratorio';
    const laboratorio = new Laboratorio({ nombre: nombreAula, modo: this.modoActual });

    for (const r of this.redesPorDefecto) {
      laboratorio.agregarRed(r);
    }

    for (const dev of rawDevices) {
      const nodeId = dev._id || dev.id;
      const nombre = dev.name || ('Puesto-' + (nodeId ? nodeId.substring(0, 6) : 'X'));
      const bocaAsignada = this.mapeoBocas[nombre] || 'port99';
      const ip = dev.ip || dev.host || null;

      const numBoca = parseInt(bocaAsignada.replace('port', ''), 10) || 99;
      const infoBoca = (mapaPuertos && mapaPuertos[bocaAsignada]) ? mapaPuertos[bocaAsignada] : {
        port: numBoca,
        portName: bocaAsignada,
        link: 'UP',
        speed: 1000,
        source: 'default'
      };

      const redAsignada = laboratorio.obtenerRedDeIp(ip) || this.redesPorDefecto[0];

      const host = new Host({
        id: nodeId,
        nombre: nombre,
        ip: ip,
        mac: dev.mac || null,
        bocaSwitch: bocaAsignada,
        soportaWoL: true,
        red: redAsignada,
        enlaceFisico: infoBoca
      });

      const conn = parseInt(dev.conn, 10) || 0;
      const osOnline = (conn & 1) !== 0;
      const amtOnline = (conn & 14) !== 0;
      const pwr = dev.pwr !== undefined ? dev.pwr : null;

      host.evaluarEstado({ osOnline, amtOnline, pwr, conn, modoLaboratorio: this.modoActual });

      laboratorio.agregarHost(host);
    }

    this.ultimoLaboratorio = laboratorio;
    this.ultimoRefresco = Date.now();
    return laboratorio;
  }

  async ejecutarAccion(nodeId, tipoAccion) {
    if (tipoAccion === 'WAKE_ON_LAN') {
      return await this.meshAdapter.despertarDispositivo(nodeId);
    }
    if (tipoAccion === 'POWER_OFF' || tipoAccion === 'SHUTDOWN' || tipoAccion === 'APAGAR') {
      return await this.meshAdapter.apagarDispositivo(nodeId);
    }
    throw new Error(`Acción ${tipoAccion} no es ejecutable remotamente.`);
  }

  async obtenerPuertosRed() {
    return await this.networkProvider.obtenerTodosLosPuertos();
  }
}

module.exports = LaboratorioService;
