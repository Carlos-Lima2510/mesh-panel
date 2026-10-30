const Laboratorio = require('../domain/Laboratorio');
const Host = require('../domain/Host');
const Red = require('../domain/Red');
const Puesto = require('../domain/Puesto');

/**
 * Crea el mapa fijo del aula: 2 hileras de 4 columnas x 5 filas (40 puestos en total)
 * con pasillo central.
 */
function crearPuestosFijosAula(redPorDefecto = null) {
  const puestos = [];
  const FILAS_CONFIG = [
    { fila: 1, left: [1, 2, 3, 4], right: [5, 6, 7, 8] },
    { fila: 2, left: [9, 10, 11, 12], right: [13, 14, 15, 16] },
    { fila: 3, left: [17, 18, 19, 20], right: [21, 22, 23, 24] },
    { fila: 4, left: [25, 26, 27, 28], right: [29, 30, 31, 32] },
    { fila: 5, left: [33, 34, 35, 36], right: [37, 38, 39, 40] }
  ];

  FILAS_CONFIG.forEach(r => {
    r.left.forEach((slotNum, i) => {
      puestos.push(new Puesto({
        id: `puesto-${slotNum}`,
        etiqueta: `Puesto ${String(slotNum).padStart(2, '0')}`,
        fila: r.fila,
        columna: i + 1,
        hilera: 'IZQUIERDA',
        red: redPorDefecto
      }));
    });
    r.right.forEach((slotNum, i) => {
      puestos.push(new Puesto({
        id: `puesto-${slotNum}`,
        etiqueta: `Puesto ${String(slotNum).padStart(2, '0')}`,
        fila: r.fila,
        columna: i + 5,
        hilera: 'DERECHA',
        red: redPorDefecto
      }));
    });
  });

  return puestos;
}

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
    this.asignacionPuestos = new Map();
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

    const puestosFijos = crearPuestosFijosAula(this.redesPorDefecto[0]);
    for (const p of puestosFijos) {
      laboratorio.agregarPuesto(p);
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

      // Asignación a puesto fijo
      let idPuesto = this.asignacionPuestos.get(nodeId);
      if (!idPuesto) {
        const slotMatch = bocaAsignada.match(/port0*(\d+)/i) || nombre.match(/(?:pc|puesto|host|uea|c)?[-_\s]?0*([1-9]|[1-3][0-9]|40)$/i);
        const slotNum = slotMatch ? parseInt(slotMatch[1], 10) : null;
        if (slotNum && slotNum >= 1 && slotNum <= 40) {
          idPuesto = `puesto-${slotNum}`;
        }
      }

      let puestoDestino = idPuesto ? laboratorio.obtenerPuesto(idPuesto) : null;
      if (!puestoDestino || puestoDestino.estaOcupado()) {
        for (const p of laboratorio.listarPuestos()) {
          if (!p.estaOcupado()) {
            puestoDestino = p;
            idPuesto = p.id;
            break;
          }
        }
      }

      if (puestoDestino) {
        puestoDestino.alojarHost(host);
        host.puestoId = puestoDestino.id;
        const numSlot = parseInt(puestoDestino.id.replace('puesto-', ''), 10);
        if (!isNaN(numSlot)) host.slot = numSlot;
        this.asignacionPuestos.set(nodeId, puestoDestino.id);
      }
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

  moverPuesto(hostId, idPuestoDestino) {
    if (!this.ultimoLaboratorio) {
      throw new Error('Laboratorio no inicializado aún.');
    }

    const idPuestoNorm = idPuestoDestino.startsWith('puesto-') ? idPuestoDestino : `puesto-${idPuestoDestino}`;
    const puestoDestino = this.ultimoLaboratorio.obtenerPuesto(idPuestoNorm);
    if (!puestoDestino) {
      throw new Error(`Puesto destino '${idPuestoNorm}' no existe en el aula.`);
    }

    const host = this.ultimoLaboratorio.obtenerHost(hostId);
    if (!host) {
      throw new Error(`Host '${hostId}' no encontrado.`);
    }

    const puestoActual = this.ultimoLaboratorio.obtenerPuestoDeHost(hostId);
    const hostEnDestino = puestoDestino.obtenerHost();

    this.ultimoLaboratorio.moverHost(hostId, idPuestoNorm);

    this.asignacionPuestos.set(hostId, idPuestoNorm);
    if (hostEnDestino && puestoActual) {
      this.asignacionPuestos.set(hostEnDestino.id, puestoActual.id);
    }

    return this.ultimoLaboratorio;
  }

  intercambiarPuestos(idPuestoA, idPuestoB) {
    if (!this.ultimoLaboratorio) {
      throw new Error('Laboratorio no inicializado aún.');
    }
    const idANorm = idPuestoA.startsWith('puesto-') ? idPuestoA : `puesto-${idPuestoA}`;
    const idBNorm = idPuestoB.startsWith('puesto-') ? idPuestoB : `puesto-${idPuestoB}`;

    this.ultimoLaboratorio.intercambiarPuestos(idANorm, idBNorm);

    const puestoA = this.ultimoLaboratorio.obtenerPuesto(idANorm);
    const puestoB = this.ultimoLaboratorio.obtenerPuesto(idBNorm);

    if (puestoA && puestoA.obtenerHost()) {
      this.asignacionPuestos.set(puestoA.obtenerHost().id, idANorm);
    }
    if (puestoB && puestoB.obtenerHost()) {
      this.asignacionPuestos.set(puestoB.obtenerHost().id, idBNorm);
    }

    return this.ultimoLaboratorio;
  }
}

module.exports = LaboratorioService;
