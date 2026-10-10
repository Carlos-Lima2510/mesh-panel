const Laboratorio = require('../domain/Laboratorio');
const Host = require('../domain/Host');
const Red = require('../domain/Red');
const Distribucion = require('../domain/Distribucion');

function crearDistribucionAula56(id = 'dist-aula-56', nombre = 'Disposición Aula (56 Puestos)') {
  const dist = new Distribucion({
    id,
    nombre,
    filas: 6,
    columnas: 10,
    activa: true
  });

  const CLASSROOM_ROWS = [
    { fila: 1, left: [1, 2, 3, 4, 5], right: [6, 7, 8, 9, 10] },
    { fila: 2, left: [11, 12, 13, 14, 15], right: [16, 17, 18, 19, 20] },
    { fila: 3, left: [21, 22, 23, 24, 25], right: [26, 27, 28, 29, 30] },
    { fila: 4, left: [31, 32, 33, 34, 35], right: [36, 37, 38, 39, 40] },
    { fila: 5, left: [41, 42, 43, 44, 45], right: [46, 47, 48, 49, 50] },
    { fila: 6, left: [51, 52, 53], right: [54, 55, 56] }
  ];

  CLASSROOM_ROWS.forEach(r => {
    r.left.forEach((slotNum, i) => {
      dist.crearPuesto({
        id: `puesto-${slotNum}`,
        etiqueta: `Puesto ${String(slotNum).padStart(2, '0')}`,
        fila: r.fila,
        columna: i + 1
      });
    });
    r.right.forEach((slotNum, i) => {
      dist.crearPuesto({
        id: `puesto-${slotNum}`,
        etiqueta: `Puesto ${String(slotNum).padStart(2, '0')}`,
        fila: r.fila,
        columna: i + 6
      });
    });
  });

  return dist;
}

function crearDistribucionExamen(id = 'dist-examen', nombre = 'Disposición Examen (Puestos Alternos)') {
  const dist = new Distribucion({
    id,
    nombre,
    filas: 6,
    columnas: 10,
    activa: false
  });

  for (let slot = 1; slot <= 56; slot += 2) {
    const fila = Math.floor((slot - 1) / 10) + 1;
    const columna = ((slot - 1) % 10) + 1;
    dist.crearPuesto({
      id: `puesto-${slot}`,
      etiqueta: `Examen ${String(slot).padStart(2, '0')}`,
      fila,
      columna
    });
  }

  return dist;
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
    this.distribucionActivaId = 'dist-aula-56';
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

    const distAula = crearDistribucionAula56();
    const distExamen = crearDistribucionExamen();

    distAula.activa = (this.distribucionActivaId === 'dist-aula-56');
    distExamen.activa = (this.distribucionActivaId === 'dist-examen');

    laboratorio.agregarDistribucion(distAula);
    laboratorio.agregarDistribucion(distExamen);
    try {
      laboratorio.establecerDistribucionActiva(this.distribucionActivaId);
    } catch (_) {
      this.distribucionActivaId = 'dist-aula-56';
      laboratorio.establecerDistribucionActiva('dist-aula-56');
    }

    const distActiva = laboratorio.obtenerDistribucionActiva();

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

      let idPuesto = this.asignacionPuestos.get(nodeId);
      if (!idPuesto) {
        const slotMatch = bocaAsignada.match(/port0*(\d+)/i) || nombre.match(/(?:pc|puesto|host|uea|c)?[-_\s]?0*([1-9]|[1-4][0-9]|5[0-6])$/i);
        const slotNum = slotMatch ? parseInt(slotMatch[1], 10) : null;
        if (slotNum && slotNum >= 1 && slotNum <= 56) {
          idPuesto = `puesto-${slotNum}`;
        }
      }

      let puestoDestino = idPuesto ? distActiva.obtenerPuesto(idPuesto) : null;
      if (!puestoDestino || puestoDestino.estaOcupado()) {
        for (const p of distActiva.listarPuestos()) {
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

  activarDistribucion(id) {
    this.distribucionActivaId = id;
    if (this.ultimoLaboratorio) {
      this.ultimoLaboratorio.establecerDistribucionActiva(id);
      return this.ultimoLaboratorio;
    }
    return this.obtenerLaboratorio({ forzar: true });
  }

  moverPuesto(hostId, idPuestoDestino) {
    if (!this.ultimoLaboratorio) {
      throw new Error('Laboratorio no inicializado aún.');
    }
    const dist = this.ultimoLaboratorio.obtenerDistribucionActiva();
    if (!dist) {
      throw new Error('No hay una distribución activa en el laboratorio.');
    }

    const host = this.ultimoLaboratorio.obtenerHost(hostId);
    if (!host) {
      throw new Error(`Host '${hostId}' no encontrado.`);
    }

    const idPuestoNorm = idPuestoDestino.startsWith('puesto-') ? idPuestoDestino : `puesto-${idPuestoDestino}`;
    const puestoDestino = dist.obtenerPuesto(idPuestoNorm);
    if (!puestoDestino) {
      throw new Error(`Puesto destino '${idPuestoNorm}' no existe en la distribución actual.`);
    }

    const puestoActual = dist.obtenerPuestoDeHost(hostId);
    const hostEnDestino = puestoDestino.obtenerHost();

    if (hostEnDestino && puestoActual) {
      dist.intercambiarPuestos(puestoActual.id, idPuestoNorm);
      host.puestoId = idPuestoNorm;
      host.slot = parseInt(idPuestoNorm.replace('puesto-', ''), 10) || null;
      hostEnDestino.puestoId = puestoActual.id;
      hostEnDestino.slot = parseInt(puestoActual.id.replace('puesto-', ''), 10) || null;
      this.asignacionPuestos.set(hostId, idPuestoNorm);
      this.asignacionPuestos.set(hostEnDestino.id, puestoActual.id);
    } else {
      dist.moverHost(hostId, idPuestoNorm);
      host.puestoId = idPuestoNorm;
      host.slot = parseInt(idPuestoNorm.replace('puesto-', ''), 10) || null;
      this.asignacionPuestos.set(hostId, idPuestoNorm);
    }

    return this.ultimoLaboratorio;
  }

  intercambiarPuestos(idPuestoA, idPuestoB) {
    if (!this.ultimoLaboratorio) {
      throw new Error('Laboratorio no inicializado aún.');
    }
    const dist = this.ultimoLaboratorio.obtenerDistribucionActiva();
    if (!dist) {
      throw new Error('No hay una distribución activa en el laboratorio.');
    }
    dist.intercambiarPuestos(idPuestoA, idPuestoB);
    return this.ultimoLaboratorio;
  }
}

module.exports = LaboratorioService;
