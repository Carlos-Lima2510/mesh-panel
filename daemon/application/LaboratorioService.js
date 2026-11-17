const Laboratorio = require('../domain/Laboratorio');
const Host = require('../domain/Host');
const Red = require('../domain/Red');
const Puesto = require('../domain/Puesto');
const Switch = require('../domain/Switch');

/**
 * Crea la cuadrícula del aula según filas y columnas por hilera configuradas por el administrador,
 * garantizando que el pasillo esté siempre en el medio dividiendo dos hileras simétricas.
 */
function crearPuestosCuadricula({
  filas = 5,
  columnas = null,
  columnasHilera = 4,
  redPorDefecto = null,
  switchDocente = null,
  switchPracticas = null,
  asignacionSwitches = new Map()
} = {}) {
  const cHilera = columnasHilera || Math.ceil((columnas || 8) / 2);
  const puestos = [];
  let slotNum = 1;

  for (let f = 1; f <= filas; f++) {
    // Hilera Izquierda
    for (let c = 1; c <= cHilera; c++) {
      const id = `puesto-${slotNum}`;
      const swId = asignacionSwitches.get(id) || 'sw-docente';
      const switchObj = swId === 'sw-practicas' ? switchPracticas : switchDocente;

      const p = new Puesto({
        id,
        etiqueta: `Puesto ${String(slotNum).padStart(2, '0')}`,
        fila: f,
        columna: c,
        hilera: 'IZQUIERDA',
        toma: `ROS-${String(slotNum).padStart(2, '0')}`,
        red: switchObj && switchObj.red ? switchObj.red : redPorDefecto
      });

      if (switchObj) {
        try {
          p.asignarSwitch(switchObj, slotNum);
        } catch (_) {}
      }

      puestos.push(p);
      slotNum++;
    }

    // Hilera Derecha (mismo número exacto de columnas, pasillo en medio siempre)
    for (let c = 1; c <= cHilera; c++) {
      const id = `puesto-${slotNum}`;
      const swId = asignacionSwitches.get(id) || 'sw-docente';
      const switchObj = swId === 'sw-practicas' ? switchPracticas : switchDocente;

      const p = new Puesto({
        id,
        etiqueta: `Puesto ${String(slotNum).padStart(2, '0')}`,
        fila: f,
        columna: cHilera + c,
        hilera: 'DERECHA',
        toma: `ROS-${String(slotNum).padStart(2, '0')}`,
        red: switchObj && switchObj.red ? switchObj.red : redPorDefecto
      });

      if (switchObj) {
        try {
          p.asignarSwitch(switchObj, slotNum);
        } catch (_) {}
      }

      puestos.push(p);
      slotNum++;
    }
  }

  return puestos;
}

class LaboratorioService {
  constructor({
    meshCentralAdapter,
    networkProvider,
    mapeoBocas = {},
    cacheTtlMs = 3000,
    filas = 5,
    columnasHilera = 4,
    columnas = 8
  } = {}) {
    this.meshAdapter = meshCentralAdapter;
    this.networkProvider = networkProvider;
    this.cacheTtlMs = cacheTtlMs;
    this.filas = filas;
    this.columnasHilera = columnasHilera || Math.ceil(columnas / 2);
    this.columnas = this.columnasHilera * 2;
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

    this.switchesPorDefecto = [
      new Switch({
        id: 'sw-docente',
        nombre: 'Switch Principal Docente',
        tipo: 'GESTIONADO',
        totalPuertos: parseInt(process.env.SWITCH_TOTAL_PUERTOS, 10) || 96,
        ipGestion: process.env.SNMP_HOST || '10.0.0.2',
        red: this.redesPorDefecto[0]
      }),
      new Switch({
        id: 'sw-practicas',
        nombre: 'Switch Banco de Prácticas',
        tipo: 'NO_GESTIONADO',
        totalPuertos: parseInt(process.env.SWITCH_PRACTICAS_PUERTOS, 10) || 96,
        ipGestion: null,
        red: this.redesPorDefecto[1]
      })
    ];

    this.modoActual = 'CLASE';
    this.asignacionPuestos = new Map();
    this.asignacionSwitches = new Map();
  }

  establecerModo(modo) {
    this.modoActual = modo === 'PRACTICA' ? 'PRACTICA' : 'CLASE';
    if (this.ultimoLaboratorio) {
      this.ultimoLaboratorio.establecerModo(this.modoActual);
      return this.ultimoLaboratorio;
    }
    return this.obtenerLaboratorio({ forzar: true });
  }

  asignarSwitchAPuestos(puestoIds, switchId) {
    const swObj = this.switchesPorDefecto.find(s => s.id === switchId);
    if (!swObj) {
      throw new Error(`Switch '${switchId}' no reconocido en el catálogo.`);
    }

    const ids = Array.isArray(puestoIds) ? puestoIds : [puestoIds];
    for (const id of ids) {
      const idNorm = id.startsWith('puesto-') ? id : `puesto-${id}`;
      this.asignacionSwitches.set(idNorm, switchId);

      if (this.ultimoLaboratorio) {
        const puesto = this.ultimoLaboratorio.obtenerPuesto(idNorm);
        if (puesto) {
          const slotNum = puesto.puertoSwitch || parseInt(idNorm.replace('puesto-', ''), 10) || 1;
          try {
            puesto.asignarSwitch(swObj, slotNum);
          } catch (_) {}

          const host = puesto.obtenerHost();
          if (host && host.telemetria) {
            host.evaluarEstado({
              osOnline: host.telemetria.os_online,
              amtOnline: host.telemetria.amt_online,
              pwr: host.telemetria.pwr,
              conn: host.telemetria.conn,
              modoLaboratorio: this.modoActual,
              puesto,
              switchAsignado: swObj
            });
          }
        }
      }
    }

    return this.ultimoLaboratorio;
  }

  asignarRangoSwitch(desde, hasta, switchId) {
    const d = parseInt(desde, 10);
    const h = parseInt(hasta, 10);
    if (!d || !h || d < 1 || h < d) {
      throw new Error('Rango de puestos inválido.');
    }
    const ids = [];
    for (let i = d; i <= h; i++) {
      ids.push(`puesto-${i}`);
    }
    return this.asignarSwitchAPuestos(ids, switchId);
  }

  configurarDimensiones(filas, columnas, columnasHilera = null) {
    const f = parseInt(filas, 10);
    let cHilera = columnasHilera ? parseInt(columnasHilera, 10) : null;
    let cTotal = parseInt(columnas, 10);

    if (cHilera && cHilera >= 1) {
      cTotal = cHilera * 2;
    } else if (cTotal && cTotal >= 1) {
      cHilera = Math.ceil(cTotal / 2);
      cTotal = cHilera * 2;
    } else {
      cHilera = 4;
      cTotal = 8;
    }

    if (!f || f < 1 || f > 30 || !cHilera || cHilera < 1 || cHilera > 20) {
      throw new Error('Dimensiones inválidas (filas entre 1-30, columnas entre 1-20).');
    }

    this.filas = f;
    this.columnasHilera = cHilera;
    this.columnas = cTotal;

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
    const laboratorio = new Laboratorio({
      nombre: nombreAula,
      modo: this.modoActual,
      filas: this.filas,
      columnas: this.columnas,
      columnasHilera: this.columnasHilera
    });

    for (const sw of this.switchesPorDefecto) {
      laboratorio.agregarSwitch(sw);
    }

    for (const r of this.redesPorDefecto) {
      laboratorio.agregarRed(r);
    }

    const puestosCuadricula = crearPuestosCuadricula({
      filas: this.filas,
      columnas: this.columnas,
      columnasHilera: this.columnasHilera,
      redPorDefecto: this.redesPorDefecto[0],
      switchDocente: this.switchesPorDefecto[0],
      switchPracticas: this.switchesPorDefecto[1],
      asignacionSwitches: this.asignacionSwitches
    });

    for (const p of puestosCuadricula) {
      laboratorio.agregarPuesto(p);
    }

    const maxPuestos = this.filas * this.columnas;

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

      // Determinación de puesto
      let idPuesto = this.asignacionPuestos.get(nodeId);
      if (!idPuesto) {
        const slotMatch = bocaAsignada.match(/port0*(\d+)/i) || nombre.match(/(?:pc|puesto|host|uea|c)?[-_\s]?0*([1-9]|[1-9][0-9]|1[0-9]{2})$/i);
        const slotNum = slotMatch ? parseInt(slotMatch[1], 10) : null;
        if (slotNum && slotNum >= 1 && slotNum <= maxPuestos) {
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

      const switchAsignado = puestoDestino ? puestoDestino.obtenerSwitch() : null;

      host.evaluarEstado({
        osOnline,
        amtOnline,
        pwr,
        conn,
        modoLaboratorio: this.modoActual,
        puesto: puestoDestino,
        switchAsignado
      });

      laboratorio.agregarHost(host);

      if (puestoDestino && !puestoDestino.estaOcupado()) {
        puestoDestino.alojarHost(host);
        host.puestoId = puestoDestino.id;
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
