const http = require('http');
const config = require('./config');

const MeshCentralAdapter = require('./infrastructure/meshcentral/MeshCentralAdapter');
const SnmpSwitchProvider = require('./infrastructure/network/SnmpSwitchProvider');
const SimulatedSwitchProvider = require('./infrastructure/network/SimulatedSwitchProvider');
const WakeOnLanAdapter = require('./infrastructure/network/WakeOnLanAdapter');

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
  : new SnmpSwitchProvider({
      version: config.snmpVersion,
      switches: config.snmpSwitches,
      user: config.snmpUser,
      authKey: config.snmpAuthKey,
      authProto: config.snmpAuthProto,
      privKey: config.snmpPrivKey,
      privProto: config.snmpPrivProto,
      host: config.switchHost,
      community: config.switchCommunity
    });

const wolAdapter = new WakeOnLanAdapter({
  broadcastAddresses: config.wolBroadcastAddresses,
  ports: [9, 7]
});

const laboratorioService = new LaboratorioService({
  meshCentralAdapter: meshAdapter,
  networkProvider: networkProvider,
  wakeOnLanAdapter: wolAdapter,
  filas: 7,
  columnasHilera: 4,
  autoCompletarPuertos: config.switchMode === 'snmp',
  excluirSubred: config.excluirSubnet,
  modoDespliegue: config.modoDespliegue
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

const PORT = config.port || 3001;
server.listen(PORT, () => {
  console.log(`[*] Daemon de telemetría y observabilidad escuchando en http://0.0.0.0:${PORT}`);
});

function apagarGracefully() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', apagarGracefully);
process.on('SIGTERM', apagarGracefully);
