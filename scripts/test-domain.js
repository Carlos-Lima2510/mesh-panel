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
  EstadoSinTelemetria,
  EvaluadorEstado
} = require('../daemon/domain/estado');
const Host = require('../daemon/domain/Host');
const Puesto = require('../daemon/domain/Puesto');
const Switch = require('../daemon/domain/Switch');
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

// Verificación de Modo Pre-despliegue / Verificación física de cableado
const estCableadoUp = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 5, link: 'UP', speed: 1000 },
  osOnline: false,
  modoLaboratorio: 'CABLEADO'
});
assert.strictEqual(estCableadoUp instanceof EstadoOperativo, true);
assert.strictEqual(estCableadoUp.color, 'VERDE');
assert.strictEqual(estCableadoUp.categoria, 'OPERATIVO');
assert.strictEqual(estCableadoUp.obtenerAccion().tipo, 'NINGUNA');
assert.strictEqual(estCableadoUp.permiteAccionRemota(), false);

const estCableadoDown = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 6, link: 'DOWN', speed: 0 },
  osOnline: false,
  modoLaboratorio: 'CABLEADO'
});
assert.strictEqual(estCableadoDown instanceof EstadoDesconectado, true);
assert.strictEqual(estCableadoDown.color, 'NARANJA');

// Verificación de EstadoSinTelemetria (Switch inalcanzable / sin telemetría de Capa 1)
const estSinTelemetria = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 7, link: 'DESCONOCIDO', speed: 0, source: 'unreachable' },
  osOnline: false,
  modoLaboratorio: 'CLASE'
});
assert.strictEqual(estSinTelemetria instanceof EstadoSinTelemetria, true);
assert.strictEqual(Estado.esInstancia(estSinTelemetria), true);
assert.strictEqual(estSinTelemetria.color, 'DESCONOCIDO');
assert.strictEqual(estSinTelemetria.categoria, 'SIN_TELEMETRIA');
assert.strictEqual(estSinTelemetria.obtenerAccion().tipo, 'VERIFICAR_INFRAESTRUCTURA');
assert.strictEqual(estSinTelemetria.permiteAccionRemota(), false);

// Si no hay enlaceFisico en absoluto y el SO está apagado -> EstadoSinTelemetria
const estSinEnlace = EvaluadorEstado.evaluar({
  enlaceFisico: null,
  osOnline: false
});
assert.strictEqual(estSinEnlace instanceof EstadoSinTelemetria, true);

// Si el switch está inalcanzable pero el agente de MeshCentral sí responde -> EstadoOperativo
const estSwitchCaidoPeroOsVivo = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 8, link: 'DESCONOCIDO', source: 'unreachable' },
  osOnline: true
});
assert.strictEqual(estSwitchCaidoPeroOsVivo instanceof EstadoOperativo, true);
assert.strictEqual(estSwitchCaidoPeroOsVivo.color, 'VERDE');

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

// Verificación de Modo Práctica con Alcance (Aulas Híbridas: Hilera Izquierda vs Hilera Derecha)
const puestoIzq = new Puesto({ id: 'p-izq', fila: 1, columna: 2, hilera: 'IZQUIERDA' });
const puestoDer = new Puesto({ id: 'p-der', fila: 1, columna: 7, hilera: 'DERECHA' });
assert.strictEqual(puestoIzq.estaEnModoPractica('PRACTICA', 'IZQUIERDA'), true);
assert.strictEqual(puestoDer.estaEnModoPractica('PRACTICA', 'IZQUIERDA'), false);
assert.strictEqual(puestoIzq.estaEnModoPractica('PRACTICA', 'DERECHA'), false);
assert.strictEqual(puestoDer.estaEnModoPractica('PRACTICA', 'DERECHA'), true);
assert.strictEqual(puestoIzq.estaEnModoPractica('PRACTICA', 'COMPLETO'), true);
assert.strictEqual(puestoDer.estaEnModoPractica('PRACTICA', 'COMPLETO'), true);
assert.strictEqual(puestoIzq.estaEnModoPractica('CLASE', 'IZQUIERDA'), false);

const estIzqEnPractica = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 10, link: 'DOWN' },
  osOnline: false,
  modoLaboratorio: 'PRACTICA',
  alcancePractica: 'IZQUIERDA',
  puesto: puestoIzq
});
assert.strictEqual(estIzqEnPractica instanceof EstadoRedAislada, true);
assert.strictEqual(estIzqEnPractica.color, 'AMARILLO');

const estDerEnClase = EvaluadorEstado.evaluar({
  enlaceFisico: { port: 20, link: 'DOWN' },
  osOnline: false,
  modoLaboratorio: 'PRACTICA',
  alcancePractica: 'IZQUIERDA',
  puesto: puestoDer
});
assert.strictEqual(estDerEnClase instanceof EstadoDesconectado, true);
assert.strictEqual(estDerEnClase.color, 'NARANJA');

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

  // POST /api/puestos/asignar-switch
  const reqAsignarSwitch = {
    method: 'POST',
    url: '/api/puestos/asignar-switch',
    on: (evt, cb) => {
      if (evt === 'data') cb(Buffer.from(JSON.stringify({
        puesto_ids: ['puesto-1', 'puesto-2', 'puesto-3'],
        switch_id: 'sw-practicas'
      })));
      if (evt === 'end') cb();
    }
  };
  await router.handle(reqAsignarSwitch, mockRes);
  const respAsignar = JSON.parse(responseBody);
  assert.strictEqual(respAsignar.success, true);
  const puesto1Sw = respAsignar.laboratorio.puestos.find(p => p.id === 'puesto-1');
  assert.strictEqual(puesto1Sw.switch_id, 'sw-practicas');
  assert.strictEqual(puesto1Sw.switch_nombre, 'Switch Banco de Prácticas');

  // Test de asignaciones en lote (Modo Híbrido atómico)
  const reqAsignarBatch = {
    method: 'POST',
    url: '/api/puestos/asignar-switch',
    on: (evt, cb) => {
      if (evt === 'data') cb(Buffer.from(JSON.stringify({
        asignaciones: [
          { puesto_ids: ['puesto-1'], switch_id: 'sw-01' },
          { puesto_ids: ['puesto-2', 'puesto-3'], switch_id: 'sw-practicas' }
        ]
      })));
      if (evt === 'end') cb();
    }
  };
  await router.handle(reqAsignarBatch, mockRes);
  const respBatch = JSON.parse(responseBody);
  assert.strictEqual(respBatch.success, true);
  assert.strictEqual(respBatch.laboratorio.puestos.find(p => p.id === 'puesto-1').switch_id, 'sw-01');
  assert.strictEqual(respBatch.laboratorio.puestos.find(p => p.id === 'puesto-2').switch_id, 'sw-practicas');
  assert.strictEqual(respBatch.laboratorio.puestos.find(p => p.id === 'puesto-3').switch_id, 'sw-practicas');

  // Test de configuración dinámica de dimensiones (6 filas x 10 columnas = 60 puestos)
  const reqDimensiones = {
    method: 'POST',
    url: '/api/laboratorio/dimensiones',
    on: (evt, cb) => {
      if (evt === 'data') cb(Buffer.from(JSON.stringify({ filas: 6, columnas: 10 })));
      if (evt === 'end') cb();
    }
  };
  await router.handle(reqDimensiones, mockRes);
  const respDim = JSON.parse(responseBody);
  assert.strictEqual(respDim.success, true);
  assert.strictEqual(respDim.laboratorio.filas, 6);
  assert.strictEqual(respDim.laboratorio.columnas, 10);
  assert.strictEqual(respDim.laboratorio.puestos.length, 60);

  // Test de asignación por rango (5 puestos a prácticas y 55 a docente)
  const reqRangoPracticas = {
    method: 'POST',
    url: '/api/puestos/asignar-switch',
    on: (evt, cb) => {
      if (evt === 'data') cb(Buffer.from(JSON.stringify({ desde: 1, hasta: 5, switch_id: 'sw-practicas' })));
      if (evt === 'end') cb();
    }
  };
  await router.handle(reqRangoPracticas, mockRes);
  const respRango = JSON.parse(responseBody);
  assert.strictEqual(respRango.success, true);
  const practicasCount = respRango.laboratorio.puestos.filter(p => p.switch_id === 'sw-practicas').length;
  assert.strictEqual(practicasCount, 5);

  // 8. Verificación de la entidad Switch e Invariantes de No-Colisión (ADR-004)
  assert.throws(() => new Switch({}), Error);
  const swDocente = new Switch({
    id: 'sw-docente',
    nombre: 'Switch Principal Docente',
    tipo: 'GESTIONADO',
    totalPuertos: 48,
    ipGestion: '10.0.0.2',
    red: new Red({ id: 'red-uni', nombre: 'Red Universidad', subred: '10.0.0.0', esAislada: false })
  });
  assert.strictEqual(swDocente.esGestionado(), true);
  assert.strictEqual(swDocente.esperaMeshCentral(), true);
  assert.strictEqual(swDocente.puertosLibres(), 48);

  const swPracticas = new Switch({
    id: 'sw-practicas',
    nombre: 'Switch Banco de Prácticas',
    tipo: 'NO_GESTIONADO',
    totalPuertos: 24,
    ipGestion: null,
    red: new Red({ id: 'red-aislada', nombre: 'Red Prácticas', subred: '192.168.2.0', esAislada: true })
  });
  assert.strictEqual(swPracticas.esGestionado(), false);
  assert.strictEqual(swPracticas.esperaMeshCentral(), false);

  // Invariante de rango de puertos
  assert.throws(() => swDocente.conectarPuesto(0, 'puesto-01'), Error);
  assert.throws(() => swDocente.conectarPuesto(49, 'puesto-01'), Error);

  // Invariante de No-Colisión física
  swDocente.conectarPuesto(1, 'puesto-01');
  assert.strictEqual(swDocente.obtenerPuestoEnPuerto(1), 'puesto-01');
  assert.strictEqual(swDocente.puertosLibres(), 47);
  // Asignar otro puesto al mismo puerto debe lanzar conflicto
  assert.throws(() => swDocente.conectarPuesto(1, 'puesto-02'), /Conflicto/);

  // Idempotencia: el mismo puesto en el mismo puerto no debe lanzar error
  swDocente.conectarPuesto(1, 'puesto-01');

  // 9. Verificación de Puesto conectado a Switch y migración de switch
  const p1 = new Puesto({ id: 'puesto-01', fila: 1, columna: 1, toma: 'ROS-01' });
  p1.asignarSwitch(swDocente, 2);
  assert.strictEqual(p1.obtenerSwitch().id, 'sw-docente');
  assert.strictEqual(p1.puertoSwitch, 2);
  assert.strictEqual(swDocente.obtenerPuestoEnPuerto(2), 'puesto-01');

  // Al reasignar el puesto a otro switch, se debe liberar la boca anterior
  p1.asignarSwitch(swPracticas, 1);
  assert.strictEqual(p1.obtenerSwitch().id, 'sw-practicas');
  assert.strictEqual(p1.puertoSwitch, 1);
  assert.strictEqual(swDocente.obtenerPuestoEnPuerto(2), null);
  assert.strictEqual(swPracticas.obtenerPuestoEnPuerto(1), 'puesto-01');
  assert.strictEqual(p1.esperaEstarAislado(), true);

  // 10. Verificación de Diagnóstico Contextual por Puesto (ADR-004 Aula Híbrida)
  // Puesto en Switch Docente con boca DOWN -> DESCONECTADO (naranja)
  const estDocenteDown = EvaluadorEstado.evaluar({
    enlaceFisico: { port: 5, link: 'DOWN', speed: 0 },
    osOnline: false,
    switchAsignado: swDocente,
    modoLaboratorio: 'CLASE'
  });
  assert.strictEqual(estDocenteDown instanceof EstadoDesconectado, true);
  assert.strictEqual(estDocenteDown.color, 'NARANJA');

  // Puesto en Switch Prácticas con boca DOWN -> RED_AISLADA (amarillo) AUNQUE EL MODO GLOBAL SEA 'CLASE'
  const estPracticasHibrido = EvaluadorEstado.evaluar({
    enlaceFisico: { port: 5, link: 'DOWN', speed: 0 },
    osOnline: false,
    switchAsignado: swPracticas,
    modoLaboratorio: 'CLASE' // Aula híbrida: el modo global es clase, pero este puesto opera en prácticas
  });
  assert.strictEqual(estPracticasHibrido instanceof EstadoRedAislada, true);
  assert.strictEqual(estPracticasHibrido.color, 'AMARILLO');

  // 11. Verificación de Laboratorio albergando Switches
  const labConSwitches = new Laboratorio({ nombre: 'Laboratorio Telemática' });
  labConSwitches.agregarSwitch(swDocente).agregarSwitch(swPracticas);
  assert.strictEqual(labConSwitches.listarSwitches().length, 2);
  assert.strictEqual(labConSwitches.obtenerSwitch('sw-docente').totalPuertos, 48);
  const jsonLab = labConSwitches.toJSON();
  assert.strictEqual(jsonLab.switches.length, 2);
  assert.strictEqual(jsonLab.switches[0].id, 'sw-docente');

  // 12. Verificación de robustez ante switch inalcanzable (sin telemetría de Capa 1)
  const serviceSinRed = new LaboratorioService({
    meshCentralAdapter: { listarDispositivos: async () => [] },
    networkProvider: { obtenerTodosLosPuertos: async () => ({}) },
    autoCompletarPuertos: true
  });
  const labSinRed = await serviceSinRed.obtenerLaboratorio({ forzar: true });
  // Si no hay respuesta del switch ni de MeshCentral, no debe inventar hosts falsos en naranja
  assert.strictEqual(labSinRed.hosts.length, 0, 'No debe autocompletar hosts falsos si el switch no respondió');
  assert.strictEqual(labSinRed.obtenerSwitch('sw-01').alcanzable, false);
  assert.strictEqual(labSinRed.obtenerMetricas().naranja, 0);

  // Con telemetría real del switch, sí autocompleta los puestos
  const serviceConRed = new LaboratorioService({
    meshCentralAdapter: { listarDispositivos: async () => [] },
    networkProvider: {
      obtenerTodosLosPuertos: async () => ({
        port1: { port: 1, portName: 'port1', link: 'UP', speed: 1000, source: 'snmp_real' },
        port2: { port: 2, portName: 'port2', link: 'DOWN', speed: 0, source: 'snmp_real' }
      })
    },
    autoCompletarPuertos: true,
    filas: 5,
    columnasHilera: 4
  });
  const labConRed = await serviceConRed.obtenerLaboratorio({ forzar: true });
  assert.strictEqual(labConRed.obtenerSwitch('sw-01').alcanzable, true);
  assert.strictEqual(labConRed.hosts.length > 0, true);

  console.log('✔ Todas las pruebas unitarias y de integración pasaron con éxito.');
  process.exit(0);
})();
