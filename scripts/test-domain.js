const assert = require('assert');

const Accion = require('../daemon/domain/Accion');
const Red = require('../daemon/domain/Red');
const {
  Estado,
  EstadoOperativo,
  EstadoStandby,
  EstadoFalloLogico,
  EstadoRedAislada,
  EstadoDesconectado,
  EvaluadorEstado
} = require('../daemon/domain/estado');
const Host = require('../daemon/domain/Host');
const Puesto = require('../daemon/domain/Puesto');
const Distribucion = require('../daemon/domain/Distribucion');
const Laboratorio = require('../daemon/domain/Laboratorio');
const LaboratorioService = require('../daemon/application/LaboratorioService');
const SseBroadcaster = require('../daemon/interfaces/http/SseBroadcaster');
const LaboratorioController = require('../daemon/interfaces/http/controllers/LaboratorioController');
const DistribucionController = require('../daemon/interfaces/http/controllers/DistribucionController');
const registrarRutas = require('../daemon/interfaces/http/routes');

assert.throws(() => new Estado({ color: 'X', categoria: 'Y', diagnostico: 'Z' }), TypeError);

const estVerde = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 1, link: 'UP', speed: 1000 },
  osOnline: true
});
assert.strictEqual(estVerde instanceof EstadoOperativo, true);
assert.strictEqual(estVerde.color, 'VERDE');
assert.strictEqual(estVerde.esOperativo(), true);
assert.strictEqual(estVerde.obtenerAccion().tipo, 'POWER_OFF');
assert.strictEqual(estVerde.permiteAccionRemota(), true);

const estGris = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 2, link: 'UP', speed: 100 },
  osOnline: false
});
assert.strictEqual(estGris instanceof EstadoStandby, true);
assert.strictEqual(estGris.color, 'GRIS');
assert.strictEqual(estGris.esOperativo(), false);
assert.strictEqual(estGris.obtenerAccion().tipo, 'WAKE_ON_LAN');
assert.strictEqual(estGris.permiteAccionRemota(), true);

const estNaranja = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 3, link: 'DOWN', speed: 0 },
  osOnline: false,
  modoLaboratorio: 'CLASE'
});
assert.strictEqual(estNaranja instanceof EstadoDesconectado, true);
assert.strictEqual(estNaranja.color, 'NARANJA');
assert.strictEqual(estNaranja.obtenerAccion().tipo, 'INSPECCION_CABLE');
assert.strictEqual(estNaranja.permiteAccionRemota(), false);

const estAislada = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 3, link: 'DOWN', speed: 0 },
  osOnline: false,
  modoLaboratorio: 'PRACTICA'
});
assert.strictEqual(estAislada instanceof EstadoRedAislada, true);
assert.strictEqual(estAislada.color, 'AMARILLO');
assert.strictEqual(estAislada.categoria, 'RED_AISLADA');
assert.strictEqual(estAislada.obtenerAccion().tipo, 'NINGUNA');

const redDocente = new Red({ id: 'r-doc', nombre: 'Red Docente', subred: '192.168.1.', esAislada: false });
const estDhcp = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 4, link: 'UP', speed: 1000 },
  osOnline: false,
  red: redDocente,
  modoLaboratorio: 'CLASE'
});
assert.strictEqual(estDhcp instanceof EstadoFalloLogico, true);
assert.strictEqual(estDhcp.color, 'AMARILLO');
assert.strictEqual(estDhcp.categoria, 'FALLO_LOGICO');
assert.strictEqual(estDhcp.obtenerAccion().tipo, 'REMEDIAR_DHCP');

const host1 = new Host({
  id: 'node-pc-01',
  nombre: 'UEA-C236',
  bocaSwitch: 'port4',
  red: redDocente,
  enlaceFisico: { port: 4, link: 'UP', speed: 100 }
});

host1.evaluarEstado({ osOnline: false, modoLaboratorio: 'CLASE' });
assert.strictEqual(host1.color, 'GRIS');
assert.strictEqual(host1.categoria, 'APAGADO');
assert.strictEqual(host1.accion.tipo, 'WAKE_ON_LAN');

host1.evaluarEstado({ osOnline: true, modoLaboratorio: 'CLASE' });
assert.strictEqual(host1.color, 'VERDE');
assert.strictEqual(host1.accion.tipo, 'POWER_OFF');

const jsonHost = host1.toJSON();
assert.strictEqual(jsonHost.node_id, 'node-pc-01');
assert.strictEqual(jsonHost.estado, 'VERDE');
assert.strictEqual(jsonHost.accion.tipo, 'POWER_OFF');
assert.strictEqual(jsonHost.accion.ejecutable, true);

const puestoA = new Puesto({ id: 'puesto-1', etiqueta: 'Mesa 01', fila: 1, columna: 1 });
assert.strictEqual(puestoA.estaOcupado(), false);
assert.strictEqual(puestoA.obtenerHost(), null);

puestoA.alojarHost(host1);
assert.strictEqual(puestoA.estaOcupado(), true);
assert.strictEqual(puestoA.obtenerHost().nombre, 'UEA-C236');

const desalojado = puestoA.desocupar();
assert.strictEqual(desalojado.id, 'node-pc-01');
assert.strictEqual(puestoA.estaOcupado(), false);

const dist = new Distribucion({
  id: 'dist-lab-1',
  nombre: 'Disposición Clásica 2026',
  filas: 2,
  columnas: 2
});

const p1 = dist.crearPuesto({ id: 'p-1', fila: 1, columna: 1 });
const p2 = dist.crearPuesto({ id: 'p-2', fila: 1, columna: 2 });
const p3 = dist.crearPuesto({ id: 'p-3', fila: 2, columna: 1 });

assert.throws(() => {
  dist.crearPuesto({ id: 'p-colision', fila: 1, columna: 1 });
}, /Conflicto de posición/);

const host2 = new Host({ id: 'node-pc-02', nombre: 'UEA-C403' });

dist.ubicarHost(host1, 'p-1');
dist.ubicarHost(host2, 'p-2');

assert.strictEqual(dist.obtenerPuestoDeHost('node-pc-01').id, 'p-1');
assert.strictEqual(dist.obtenerPuestoDeHost('node-pc-02').id, 'p-2');

dist.moverHost('node-pc-01', 'p-3');
assert.strictEqual(p1.estaOcupado(), false);
assert.strictEqual(p3.estaOcupado(), true);
assert.strictEqual(dist.obtenerPuestoDeHost('node-pc-01').id, 'p-3');

dist.intercambiarPuestos('p-2', 'p-3');
assert.strictEqual(p2.obtenerHost().nombre, 'UEA-C236');
assert.strictEqual(p3.obtenerHost().nombre, 'UEA-C403');

const integridad = dist.validarIntegridad();
assert.strictEqual(integridad.valida, true);

const lab = new Laboratorio({ nombre: 'Laboratorio de Telemática' });
lab.agregarRed(redDocente);

const redAislada = new Red({ id: 'r-aisl', nombre: 'Red Prácticas', subred: '10.0.99.', esAislada: true });
lab.agregarRed(redAislada);

const hostCableQuitado = new Host({
  id: 'node-pc-down',
  nombre: 'UEA-C999',
  enlaceFisico: { port: 9, link: 'DOWN', speed: 0 }
});
hostCableQuitado.evaluarEstado({ osOnline: false, modoLaboratorio: lab.modo });

lab.agregarHost(host1);
lab.agregarHost(hostCableQuitado);

lab.agregarDistribucion(dist);
assert.strictEqual(lab.obtenerDistribucionActiva().id, 'dist-lab-1');

let metricas = lab.obtenerMetricas();
assert.strictEqual(metricas.total, 2);
assert.strictEqual(metricas.verde, 1);
assert.strictEqual(metricas.naranja, 1);
assert.strictEqual(metricas.amarillo, 0);

lab.establecerModo('PRACTICA');

assert.strictEqual(hostCableQuitado.color, 'AMARILLO');
assert.strictEqual(hostCableQuitado.categoria, 'RED_AISLADA');

metricas = lab.obtenerMetricas();
assert.strictEqual(metricas.verde, 1);
assert.strictEqual(metricas.naranja, 0);
assert.strictEqual(metricas.amarillo, 1);

const mockMeshAdapter = {
  listarDispositivos: async () => [
    { id: 'dev-1', name: 'UEA-C226', ip: '192.168.122.10', conn: 1 },
    { id: 'dev-2', name: 'UEA-C232', ip: '192.168.122.11', conn: 0 }
  ],
  despertarDispositivo: async (id) => ({ success: true, id }),
  apagarDispositivo: async (id) => ({ success: true, id })
};

const mockNetworkProvider = {
  obtenerTodosLosPuertos: async () => ({
    port1: { port: 1, portName: 'port1', link: 'UP', speed: 1000 },
    port2: { port: 2, portName: 'port2', link: 'UP', speed: 100 }
  })
};

(async () => {
  const service = new LaboratorioService({
    meshCentralAdapter: mockMeshAdapter,
    networkProvider: mockNetworkProvider
  });

  const labObtenido = await service.obtenerLaboratorio({ forzar: true });
  assert.strictEqual(labObtenido.hosts.length, 2);
  assert.strictEqual(labObtenido.distribuciones.length, 2);

  const distActiva = labObtenido.obtenerDistribucionActiva();
  assert.strictEqual(distActiva.nombre, 'Disposición Aula (56 Puestos)');
  assert.strictEqual(distActiva.puestos.size, 56);

  service.moverPuesto('dev-1', 'puesto-2');
  const puesto2 = distActiva.obtenerPuesto('puesto-2');
  assert.strictEqual(puesto2.obtenerHost().nombre, 'UEA-C226');

  const sseBroadcaster = new SseBroadcaster();
  const labCtrl = new LaboratorioController({ laboratorioService: service, sseBroadcaster });
  const distCtrl = new DistribucionController({ laboratorioService: service, sseBroadcaster });

  const router = registrarRutas({
    laboratorioController: labCtrl,
    distribucionController: distCtrl,
    powerController: {},
    switchController: {}
  });

  let responseBody = '';
  const mockRes = {
    setHeader: () => {},
    writeHead: () => {},
    end: (str) => { responseBody = str; }
  };

  await router.handle({ method: 'GET', url: '/api/laboratorio', on: () => {} }, mockRes);
  const responseData = JSON.parse(responseBody);
  assert.strictEqual(responseData.success, true);
  assert.strictEqual(responseData.laboratorio.hosts.length, 2);

  console.log('✔ Todas las pruebas unitarias y de integración pasaron con éxito.');
  process.exit(0);
})();
