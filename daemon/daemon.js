const http = require('http');
const config = require('./config');

const MeshCentralAdapter = require('./infrastructure/meshcentral/MeshCentralAdapter');
const SnmpSwitchProvider = require('./infrastructure/network/SnmpSwitchProvider');
const SimulatedSwitchProvider = require('./infrastructure/network/SimulatedSwitchProvider');

const LaboratorioService = require('./application/LaboratorioService');

const SseBroadcaster = require('./interfaces/http/SseBroadcaster');
const LaboratorioController = require('./interfaces/http/controllers/LaboratorioController');
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

const PORT = config.port || 3001;
server.listen(PORT, () => {
  console.log(`[*] Daemon de telemetría y observabilidad escuchando en http://0.0.0.0:${PORT}`);
});

function apagarGracefully() {
  clearInterval(pollTimer);
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', apagarGracefully);
process.on('SIGTERM', apagarGracefully);
