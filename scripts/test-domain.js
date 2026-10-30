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
const Laboratorio = require('../daemon/domain/Laboratorio');
const LaboratorioService = require('../daemon/application/LaboratorioService');
const SseBroadcaster = require('../daemon/interfaces/http/SseBroadcaster');
const LaboratorioController = require('../daemon/interfaces/http/controllers/LaboratorioController');
const registrarRutas = require('../daemon/interfaces/http/routes');

// 1. Verificación de jerarquía de estados y polimorfismo
assert.throws(() => new Estado(), TypeError);

const estVerde = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 1, link: 'UP', speed: 1000 },
  osOnline: true
});
assert.strictEqual(estVerde instanceof EstadoOperativo, true);
assert.strictEqual(Estado.esInstancia(estVerde), true);
assert.strictEqual(estVerde.color, 'VERDE');
assert.strictEqual(estVerde.esOperativo(), true);
assert.strictEqual(estVerde.obtenerAccion().tipo, 'POWER_OFF');
assert.strictEqual(estVerde.permiteAccionRemota(), true);

const estGris = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 2, link: 'UP', speed: 100 },
  osOnline: false
});
assert.strictEqual(estGris instanceof EstadoStandby, true);
assert.strictEqual(Estado.esInstancia(estGris), true);
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
assert.strictEqual(Estado.esInstancia(estNaranja), true);
assert.strictEqual(estNaranja.color, 'NARANJA');
assert.strictEqual(estNaranja.obtenerAccion().tipo, 'INSPECCION_CABLE');
assert.strictEqual(estNaranja.permiteAccionRemota(), false);

const estAislada = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 3, link: 'DOWN', speed: 0 },
  osOnline: false,
  modoLaboratorio: 'PRACTICA'
});
assert.strictEqual(estAislada instanceof EstadoRedAislada, true);
assert.strictEqual(Estado.esInstancia(estAislada), true);
assert.strictEqual(estAislada.color, 'AMARILLO');
assert.strictEqual(estAislada.categoria, 'RED_AISLADA');
assert.strictEqual(estAislada.obtenerAccion().tipo, 'NINGUNA');

const redDocente = new Red({ id: 'r-doc', nombre: 'Red Docente', subred: '192.168.1.', esAislada: false });
const redAislada = new Red({ id: 'r-aisl', nombre: 'Red Prácticas', subred: '10.0.99.', esAislada: true });

const estDhcp = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 4, link: 'UP', speed: 1000 },
  osOnline: false,
  red: redDocente,
  modoLaboratorio: 'CLASE'
});
assert.strictEqual(estDhcp instanceof EstadoFalloLogico, true);
assert.strictEqual(Estado.esInstancia(estDhcp), true);
assert.strictEqual(estDhcp.color, 'AMARILLO');
assert.strictEqual(estDhcp.categoria, 'FALLO_LOGICO');
assert.strictEqual(estDhcp.obtenerAccion().tipo, 'REMEDIAR_DHCP');

// 2. Verificación de Host
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

// 3. Verificación de Puesto (conectarRed, alojarHost, etc.)
const puestoA = new Puesto({ id: 'puesto-1', etiqueta: 'Puesto 01', fila: 1, columna: 1 });
puestoA.conectarRed(redDocente);
assert.strictEqual(puestoA.obtenerRed().id, 'r-doc');
assert.strictEqual(puestoA.estaOcupado(), false);
assert.strictEqual(puestoA.obtenerHost(), null);

puestoA.alojarHost(host1);
assert.strictEqual(puestoA.estaOcupado(), true);
assert.strictEqual(puestoA.obtenerHost().nombre, 'UEA-C236');

const desalojado = puestoA.desocupar();
assert.strictEqual(desalojado.id, 'node-pc-01');
assert.strictEqual(puestoA.estaOcupado(), false);

// 4. Verificación de Laboratorio (posee directamente Puestos y Redes)
const lab = new Laboratorio({ nombre: 'Laboratorio de Telemática' });
lab.agregarRed(redDocente);
lab.agregarRed(redAislada);

const p1 = new Puesto({ id: 'p-1', fila: 1, columna: 1 });
const p2 = new Puesto({ id: 'p-2', fila: 1, columna: 2 });
const p3 = new Puesto({ id: 'p-3', fila: 2, columna: 1 });

lab.agregarPuesto(p1);
lab.agregarPuesto(p2);
lab.agregarPuesto(p3);

// Invariante de solape de coordenadas
assert.throws(() => {
  lab.agregarPuesto(new Puesto({ id: 'p-colision', fila: 1, columna: 1 }));
}, /Conflicto de posición/);

const host2 = new Host({ id: 'node-pc-02', nombre: 'UEA-C403' });
lab.agregarHost(host1);
lab.agregarHost(host2);

lab.alojarHostEnPuesto(host1, 'p-1');
lab.alojarHostEnPuesto(host2, 'p-2');

assert.strictEqual(lab.obtenerPuestoDeHost('node-pc-01').id, 'p-1');
assert.strictEqual(lab.obtenerPuestoDeHost('node-pc-02').id, 'p-2');

lab.moverHost('node-pc-01', 'p-3');
assert.strictEqual(p1.estaOcupado(), false);
assert.strictEqual(p3.estaOcupado(), true);
assert.strictEqual(lab.obtenerPuestoDeHost('node-pc-01').id, 'p-3');

lab.intercambiarPuestos('p-2', 'p-3');
assert.strictEqual(p2.obtenerHost().nombre, 'UEA-C236');
assert.strictEqual(p3.obtenerHost().nombre, 'UEA-C403');

// 5. Verificación de modo del laboratorio y métricas
const hostCableQuitado = new Host({
  id: 'node-pc-down',
  nombre: 'UEA-C999',
  enlaceFisico: { port: 9, link: 'DOWN', speed: 0 }
});
hostCableQuitado.evaluarEstado({ osOnline: false, modoLaboratorio: lab.modo });
lab.agregarHost(hostCableQuitado);

let metricas = lab.obtenerMetricas();
assert.strictEqual(metricas.total, 3);
assert.strictEqual(metricas.verde, 1);
assert.strictEqual(metricas.naranja, 2);

lab.establecerModo('PRACTICA');
assert.strictEqual(hostCableQuitado.color, 'AMARILLO');
assert.strictEqual(hostCableQuitado.categoria, 'RED_AISLADA');

metricas = lab.obtenerMetricas();
assert.strictEqual(metricas.verde, 1);
assert.strictEqual(metricas.naranja, 0);
assert.strictEqual(metricas.amarillo, 2);

// 6. Verificación de LaboratorioService y mapa fijo de 40 puestos
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

  // Verificamos que el aula fija tiene exactamente 40 puestos (5 filas x 2 hileras de 4 cols)
  const puestosAula = labObtenido.listarPuestos();
  assert.strictEqual(puestosAula.length, 40);

  const puesto1 = labObtenido.obtenerPuesto('puesto-1');
  assert.strictEqual(puesto1.fila, 1);
  assert.strictEqual(puesto1.columna, 1);
  assert.strictEqual(puesto1.hilera, 'IZQUIERDA');

  const puesto5 = labObtenido.obtenerPuesto('puesto-5');
  assert.strictEqual(puesto5.fila, 1);
  assert.strictEqual(puesto5.columna, 5);
  assert.strictEqual(puesto5.hilera, 'DERECHA');

  const puesto40 = labObtenido.obtenerPuesto('puesto-40');
  assert.strictEqual(puesto40.fila, 5);
  assert.strictEqual(puesto40.columna, 8);
  assert.strictEqual(puesto40.hilera, 'DERECHA');

  // Movimiento de puesto en el aula fija
  service.moverPuesto('dev-1', 'puesto-2');
  const puesto2 = labObtenido.obtenerPuesto('puesto-2');
  assert.strictEqual(puesto2.obtenerHost().nombre, 'UEA-C226');

  // 7. Verificación de controladores HTTP y endpoints
  const sseBroadcaster = new SseBroadcaster();
  const labCtrl = new LaboratorioController({ laboratorioService: service, sseBroadcaster });

  const router = registrarRutas({
    laboratorioController: labCtrl,
    powerController: {},
    switchController: {}
  });

  let responseBody = '';
  let responseStatus = 200;
  const mockRes = {
    setHeader: () => {},
    writeHead: (st) => { responseStatus = st; },
    end: (str) => { responseBody = str; }
  };

  // GET /api/laboratorio
  await router.handle({ method: 'GET', url: '/api/laboratorio', on: () => {} }, mockRes);
  const responseData = JSON.parse(responseBody);
  assert.strictEqual(responseData.success, true);
  assert.strictEqual(responseData.laboratorio.hosts.length, 2);
  assert.strictEqual(responseData.laboratorio.puestos.length, 40);

  // POST /api/puestos/mover
  const reqMover = {
    method: 'POST',
    url: '/api/puestos/mover',
    on: (evt, cb) => {
      if (evt === 'data') cb(Buffer.from(JSON.stringify({
        host_id: 'dev-1',
        puesto_id: 'puesto-10'
      })));
      if (evt === 'end') cb();
    }
  };
  await router.handle(reqMover, mockRes);
  const respMover = JSON.parse(responseBody);
  assert.strictEqual(respMover.success, true);
  assert.strictEqual(respMover.laboratorio.puestos.find(p => p.id === 'puesto-10').host.nombre, 'UEA-C226');

  console.log('✔ Todas las pruebas unitarias y de integración pasaron con éxito.');
  process.exit(0);
})();
