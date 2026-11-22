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
  asignacionSwitches = new Map(),
  switchesCatalog = []
} = {}) {
  const cHilera = columnasHilera || Math.ceil((columnas || 8) / 2);
  const puestos = [];
  let slotNum = 1;

  for (let f = 1; f <= filas; f++) {
    // Hilera Izquierda
    for (let c = 1; c <= cHilera; c++) {
      const id = `puesto-${slotNum}`;
      const swId = asignacionSwitches.get(id) || (switchesCatalog && switchesCatalog[0] ? switchesCatalog[0].id : 'sw-01');
      const switchObj = (switchesCatalog && switchesCatalog.find ? switchesCatalog.find(s => s.id === swId) : null)
        || (swId === 'sw-practicas' ? switchPracticas : switchDocente);

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
      const swId = asignacionSwitches.get(id) || (switchesCatalog && switchesCatalog[0] ? switchesCatalog[0].id : 'sw-01');
      const switchObj = (switchesCatalog && switchesCatalog.find ? switchesCatalog.find(s => s.id === swId) : null)
        || (swId === 'sw-practicas' ? switchPracticas : switchDocente);

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
    columnas = 8,
    autoCompletarPuertos = false,
    excluirSubred = '172.22.',
    modoDespliegue = false
  } = {}) {
    this.meshAdapter = meshCentralAdapter;
    this.networkProvider = networkProvider;
    this.cacheTtlMs = cacheTtlMs;
    this.filas = filas;
    this.columnasHilera = columnasHilera || Math.ceil(columnas / 2);
    this.columnas = this.columnasHilera * 2;
    this.autoCompletarPuertos = autoCompletarPuertos;
    this.excluirSubred = excluirSubred;
    this.modoDespliegue = Boolean(modoDespliegue);
    this.ultimoLaboratorio = null;
    this.ultimoRefresco = 0;
    this.promesaRefresco = null;

    this.mapeoBocas = {
      'UEA-C226': 'port1',
      'UEA-C232': 'port2',
      'UEA-C234': 'port3',
      'UEA-C236': 'port4',
      'UEA-C403': 'port5',

      // Switch .42 (puerto 49)
      'UEA-C240': 'sw42:port49',
      'C240': 'sw42:port49',

      // Switch .13 port34 (switch de mesa fila 5)
      'UEA-C244': 'port34',
      'C244': 'port34',
      'UEA-C245': 'port34',
      'C245': 'port34',
      'UEA-C246': 'port34',
      'C246': 'port34',
      'UEA-C250': 'port34',
      'C250': 'port34',
      'UEA-C421': 'port34',
      'C421': 'port34',

      // Switch .13 fila 6 (rosetas individuales)
      'UEA-C271': 'port41',
      'C271': 'port41',
      'UEA-C272': 'port42',
      'C272': 'port42',
      'UEA-C273': 'port43',
      'C273': 'port43',
      'UEA-C277': 'port44',
      'C277': 'port44',

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
        id: 'sw-01',
        nombre: 'SW-01 -- 10.10.136.13',
        tipo: 'GESTIONADO',
        totalPuertos: 48,
        ipGestion: '10.10.136.13',
        red: this.redesPorDefecto[0]
      }),
      new Switch({
        id: 'sw-02',
        nombre: 'SW-02 -- 10.10.136.42',
        tipo: 'GESTIONADO',
        totalPuertos: 48,
        ipGestion: '10.10.136.42',
        red: this.redesPorDefecto[0]
      }),
      new Switch({
        id: 'sw-03',
        nombre: 'SW-03 -- 10.10.136.39',
        tipo: 'GESTIONADO',
        totalPuertos: 48,
        ipGestion: '10.10.136.39',
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

    this.modoActual = this.modoDespliegue ? 'CABLEADO' : 'CLASE';
    this.alcanceActual = 'COMPLETO';
    this.asignacionPuestos = new Map();
    this.asignacionSwitches = new Map();
  }

  establecerModo(modo, alcance = 'COMPLETO') {
    const modosValidos = ['CLASE', 'PRACTICA', 'CABLEADO'];
    this.modoActual = modosValidos.includes(modo) ? modo : 'CLASE';
    this.alcanceActual = ['COMPLETO', 'IZQUIERDA', 'DERECHA'].includes(alcance) ? alcance : 'COMPLETO';
    if (this.ultimoLaboratorio) {
      this.ultimoLaboratorio.establecerModo(this.modoActual, this.alcanceActual);
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
              alcancePractica: this.alcanceActual,
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

    const hayTelemetriaSwitch = Boolean(mapaPuertos && Object.keys(mapaPuertos).length > 0);

    const nombreAula = rawDevices.length > 0 && rawDevices[0].groupname ? rawDevices[0].groupname : 'Laboratorio';
    const laboratorio = new Laboratorio({
      nombre: nombreAula,
      modo: this.modoActual,
      alcancePractica: this.alcanceActual,
      filas: this.filas,
      columnas: this.columnas,
      columnasHilera: this.columnasHilera,
      modoDespliegue: this.modoDespliegue
    });

    for (const sw of this.switchesPorDefecto) {
      if (sw.esGestionado()) {
        sw.alcanzable = hayTelemetriaSwitch;
      }
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
      switchPracticas: this.switchesPorDefecto.find(s => s.id === 'sw-practicas'),
      asignacionSwitches: this.asignacionSwitches,
      switchesCatalog: this.switchesPorDefecto
    });

    for (const p of puestosCuadricula) {
      laboratorio.agregarPuesto(p);
    }

    const maxPuestos = this.filas * this.columnas;

    for (const dev of rawDevices) {
      const ip = dev.ip || dev.host || null;
      if (this.excluirSubred && ip && ip.startsWith(this.excluirSubred)) {
        continue; // Excluir equipos de la red indicada (ej: 172.22.)
      }

      const nodeId = dev._id || dev.id;
      const nombre = dev.name || ('Puesto-' + (nodeId ? nodeId.substring(0, 6) : 'X'));
      const bocaAsignada = this.mapeoBocas[nombre] || 'port99';

      const numBoca = parseInt(bocaAsignada.replace(/\D/g, ''), 10) || 99;
      const infoBoca = (mapaPuertos && (mapaPuertos[bocaAsignada] || mapaPuertos[`10.10.136.42:${bocaAsignada}`]))
        ? (mapaPuertos[bocaAsignada] || mapaPuertos[`10.10.136.42:${bocaAsignada}`])
        : {
          port: numBoca,
          portName: bocaAsignada,
          link: hayTelemetriaSwitch ? 'DOWN' : 'DESCONOCIDO',
          speed: 0,
          source: hayTelemetriaSwitch ? 'snmp_real' : 'unreachable'
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
        alcancePractica: this.alcanceActual,
        puesto: puestoDestino,
        switchAsignado
      });

      laboratorio.agregarHost(host);

      if (puestoDestino && !puestoDestino.estaOcupado()) {
        puestoDestino.alojarHost(host);
        host.puestoId = puestoDestino.id;
        const slotNum = parseInt(puestoDestino.id.replace('puesto-', ''), 10);
        if (slotNum) host.slot = slotNum;
        this.asignacionPuestos.set(nodeId, puestoDestino.id);
      }
    }

    if (this.autoCompletarPuertos && hayTelemetriaSwitch) {
      const slotsOcupados = new Set();
      for (const h of laboratorio.hosts) {
        if (h.slot) slotsOcupados.add(h.slot);
      }

      // 1. Equipos especiales detallados (mesas y switch auxiliar .42)
      const equiposEspeciales = [
        // Switch .42 (puerto 49)
        { nombre: 'UEA-C240', boca: 'sw42:port49', slot: 49 },

        // Switch .13 port34 (switch de mesa fila 5)
        { nombre: 'UEA-C244', boca: 'port34', slot: 33 },
        { nombre: 'UEA-C245', boca: 'port34', slot: 34 },
        { nombre: 'UEA-C246', boca: 'port34', slot: 35 },
        { nombre: 'UEA-C250', boca: 'port34', slot: 36 },
        { nombre: 'UEA-C421', boca: 'port34', slot: 37 },

        // Switch .13 fila 6 (rosetas individuales)
        { nombre: 'UEA-C271', boca: 'port41', slot: 41 },
        { nombre: 'UEA-C272', boca: 'port42', slot: 42 },
        { nombre: 'UEA-C273', boca: 'port43', slot: 43 },
        { nombre: 'UEA-C277', boca: 'port44', slot: 44 }
      ];

      for (const eq of equiposEspeciales) {
        if (!slotsOcupados.has(eq.slot) && !laboratorio.hosts.some(h => h.nombre === eq.nombre)) {
          const idPuesto = `puesto-${eq.slot}`;
          const puestoDestino = laboratorio.obtenerPuesto(idPuesto);
          if (!puestoDestino) continue;
          const switchAsignado = puestoDestino ? puestoDestino.obtenerSwitch() : null;

          const infoBoca = (mapaPuertos && (mapaPuertos[eq.boca] || mapaPuertos[`10.10.136.42:${eq.boca}`]))
            ? (mapaPuertos[eq.boca] || mapaPuertos[`10.10.136.42:${eq.boca}`])
            : {
              port: parseInt(eq.boca.replace(/\D/g, ''), 10) || 99,
              portName: eq.boca,
              link: 'DESCONOCIDO',
              speed: 0,
              source: 'unreachable'
            };

          const host = new Host({
            id: `inv-${eq.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            nombre: eq.nombre,
            ip: null,
            mac: null,
            bocaSwitch: eq.boca,
            soportaWoL: true,
            red: this.redesPorDefecto[0],
            enlaceFisico: infoBoca
          });

          host.evaluarEstado({
            osOnline: false,
            amtOnline: false,
            conn: 0,
            modoLaboratorio: this.modoActual,
            alcancePractica: this.alcanceActual,
            puesto: puestoDestino,
            switchAsignado
          });
          laboratorio.agregarHost(host);

          if (!puestoDestino.estaOcupado()) {
            puestoDestino.alojarHost(host);
            host.puestoId = puestoDestino.id;
            host.slot = eq.slot;
            slotsOcupados.add(eq.slot);
          }
        }
      }

      // 2. Autocompletar puestos del switch principal (.13: port1 al port48)
      for (let numPuerto = 1; numPuerto <= 48; numPuerto++) {
        if (numPuerto === 47) continue; // Puerto 47 no se usa en este laboratorio
        if (slotsOcupados.has(numPuerto)) continue;

        const idPuesto = `puesto-${numPuerto}`;
        const puestoDestino = laboratorio.obtenerPuesto(idPuesto);
        if (!puestoDestino) continue;
        const switchAsignado = puestoDestino ? puestoDestino.obtenerSwitch() : null;

        const boca = `port${numPuerto}`;
        const infoBoca = (mapaPuertos && mapaPuertos[boca]) ? mapaPuertos[boca] : {
          port: numPuerto,
          portName: boca,
          link: 'DESCONOCIDO',
          speed: 0,
          source: 'unreachable'
        };

        const nombreHost = `Puesto-${String(numPuerto).padStart(2, '0')}`;
        const host = new Host({
          id: `puesto-port-${numPuerto}`,
          nombre: nombreHost,
          ip: null,
          mac: null,
          bocaSwitch: boca,
          soportaWoL: true,
          red: this.redesPorDefecto[0],
          enlaceFisico: infoBoca
        });

        host.evaluarEstado({
          osOnline: false,
          amtOnline: false,
          conn: 0,
          modoLaboratorio: this.modoActual,
          alcancePractica: this.alcanceActual,
          puesto: puestoDestino,
          switchAsignado
        });
        laboratorio.agregarHost(host);

        if (!puestoDestino.estaOcupado()) {
          puestoDestino.alojarHost(host);
          host.puestoId = puestoDestino.id;
          host.slot = numPuerto;
          slotsOcupados.add(numPuerto);
        }
      }

      // 3. Switch auxiliar .39 (puertos 1 al 7 -> slots 50 a 56)
      for (let pIdx = 1; pIdx <= 7; pIdx++) {
        const slotDestino = 49 + pIdx; // 50..56
        if (slotsOcupados.has(slotDestino)) continue;

        const idPuesto = `puesto-${slotDestino}`;
        const puestoDestino = laboratorio.obtenerPuesto(idPuesto);
        if (!puestoDestino) continue;
        const switchAsignado = puestoDestino ? puestoDestino.obtenerSwitch() : null;

        const boca = `sw39:port${pIdx}`;
        const infoBoca = (mapaPuertos && (mapaPuertos[boca] || mapaPuertos[`10.10.136.39:port${pIdx}`]))
          ? (mapaPuertos[boca] || mapaPuertos[`10.10.136.39:port${pIdx}`])
          : {
            port: pIdx,
            portName: boca,
            link: 'DESCONOCIDO',
            speed: 0,
            source: 'unreachable'
          };

        const nombreHost = `Puesto-Aux${pIdx}`;
        const host = new Host({
          id: `puesto-sw39-${pIdx}`,
          nombre: nombreHost,
          ip: null,
          mac: null,
          bocaSwitch: boca,
          soportaWoL: true,
          red: this.redesPorDefecto[0],
          enlaceFisico: infoBoca
        });

        host.evaluarEstado({
          osOnline: false,
          amtOnline: false,
          conn: 0,
          modoLaboratorio: this.modoActual,
          alcancePractica: this.alcanceActual,
          puesto: puestoDestino,
          switchAsignado
        });
        laboratorio.agregarHost(host);

        if (!puestoDestino.estaOcupado()) {
          puestoDestino.alojarHost(host);
          host.puestoId = puestoDestino.id;
          host.slot = slotDestino;
          slotsOcupados.add(slotDestino);
        }
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
