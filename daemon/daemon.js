const http = require('http');
const config = require('./config');

const MeshCentralAdapter = require('./infrastructure/meshcentral/MeshCentralAdapter');
const SnmpSwitchProvider = require('./infrastructure/network/SnmpSwitchProvider');
const SimulatedSwitchProvider = require('./infrastructure/network/SimulatedSwitchProvider');

const LaboratorioService = require('./application/LaboratorioService');

const SseBroadcaster = require('./interfaces/http/SseBroadcaster');
const LaboratorioController = require('./interfaces/http/controllers/LaboratorioController');
const DistribucionController = require('./interfaces/http/controllers/DistribucionController');
const PowerController = require('./interfaces/http/controllers/PowerController');
const SwitchController = require('./interfaces/http/controllers/SwitchController');
const registrarRutas = require('./interfaces/http/routes');

const meshAdapter = new MeshCentralAdapter({
  url: config.meshUrl,
  user: config.meshUser,
  pass: config.meshPass
});

const networkProvider = config.switchMode === 'simulado'
  ? new SimulatedSwitchProvider()
  : new SnmpSwitchProvider({ host: config.switchHost, community: config.switchCommunity });

const laboratorioService = new LaboratorioService({
  meshCentralAdapter: meshAdapter,
  networkProvider: networkProvider
});

const sseBroadcaster = new SseBroadcaster();

const laboratorioController = new LaboratorioController({
  laboratorioService,
  sseBroadcaster
});

const distribucionController = new DistribucionController({
  laboratorioService,
  sseBroadcaster
});

const powerController = new PowerController({
  laboratorioService
});

const switchController = new SwitchController({
  laboratorioService,
  networkProvider,
  switchMode: config.switchMode,
  sseBroadcaster
});

const router = registrarRutas({
  laboratorioController,
  distribucionController,
  powerController,
  switchController
});

const server = http.createServer((req, res) => router.handle(req, res));

const pollTimer = setInterval(async () => {
  if (sseBroadcaster.tieneClientes()) {
    try {
      const lab = await laboratorioService.obtenerLaboratorio({ forzar: true });
      sseBroadcaster.difundir('INIT', { laboratorio: lab.toJSON() });
    } catch (_) {}
  }
}, 5000);
if (pollTimer.unref) pollTimer.unref();

server.listen(config.port, '0.0.0.0', async () => {
  console.log(`[+] Servidor Daemon escuchando en http://0.0.0.0:${config.port}`);
  console.log(`[+] Modo de red: ${config.switchMode.toUpperCase()}`);

  try {
    const inicial = await laboratorioService.obtenerLaboratorio({ forzar: true });
    console.log(`[+] [ARRANQUE] Consulta inicial completada: ${inicial.hosts.length} hosts en ${inicial.nombre}.`);
  } catch (err) {
    console.warn(`[!] [ARRANQUE] Consulta inicial fallida (${err.message}). A la espera de peticiones.`);
  }
});