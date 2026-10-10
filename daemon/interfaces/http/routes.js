const Router = require('./Router');

function registrarRutas({
  laboratorioController,
  distribucionController,
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

  router.get('/api/distribuciones', (req, res) => distribucionController.listar(req, res));
  router.post('/api/distribuciones/activar', (req, res) => distribucionController.activar(req, res));
  router.post('/api/distribuciones/mover', (req, res) => distribucionController.mover(req, res));

  router.post('/api/power/wake', (req, res) => powerController.wake(req, res));
  router.post('/api/power/off', (req, res) => powerController.powerOff(req, res));
  router.post('/api/power/shutdown', (req, res) => powerController.powerOff(req, res));

  router.get('/api/switch', (req, res) => switchController.obtenerPuertos(req, res));
  router.post('/api/switch', (req, res) => switchController.configurarBoca(req, res));

  router.get('/events', (req, res) => laboratorioController.flujoEventos(req, res));

  return router;
}

module.exports = registrarRutas;
