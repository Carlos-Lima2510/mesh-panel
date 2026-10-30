const Router = require('./Router');

function registrarRutas({
  laboratorioController,
  powerController,
  switchController
}) {
  const router = new Router();

  router.get('/api/laboratorio', (req, res) => laboratorioController.obtener(req, res));
  router.get('/api/devices', (req, res) => laboratorioController.obtener(req, res));
  router.post('/api/laboratorio/scan', (req, res) => laboratorioController.escanear(req, res));
  router.post('/api/scan-now', (req, res) => laboratorioController.escanear(req, res));
  router.post('/api/devices', (req, res) => laboratorioController.escanear(req, res));
  router.post('/api/refresh', (req, res) => laboratorioController.escanear(req, res));
  router.post('/api/laboratorio/modo', (req, res) => laboratorioController.cambiarModo(req, res));

  router.post('/api/puestos/mover', (req, res) => laboratorioController.moverPuesto(req, res));
  // Alias de compatibilidad hacia atrás
  router.post('/api/distribuciones/mover', (req, res) => laboratorioController.moverPuesto(req, res));

  router.post('/api/power/wake', (req, res) => powerController.wake(req, res));
  router.post('/api/power/off', (req, res) => powerController.powerOff(req, res));
  router.post('/api/power/shutdown', (req, res) => powerController.powerOff(req, res));

  router.get('/api/switch', (req, res) => switchController.obtenerPuertos(req, res));
  router.post('/api/switch', (req, res) => switchController.configurarBoca(req, res));

  router.get('/events', (req, res) => laboratorioController.flujoEventos(req, res));

  return router;
}

module.exports = registrarRutas;
