class LaboratorioController {
  constructor({ laboratorioService, sseBroadcaster }) {
    this.service = laboratorioService;
    this.broadcaster = sseBroadcaster;
  }

  async obtener(req, res) {
    const lab = await this.service.obtenerLaboratorio({ forzar: false });
    return res.json({ success: true, laboratorio: lab.toJSON() });
  }

  async escanear(req, res) {
    const lab = await this.service.obtenerLaboratorio({ forzar: true });
    const datos = lab.toJSON();
    this.broadcaster.difundir('INIT', { laboratorio: datos });
    return res.json({ success: true, laboratorio: datos });
  }

  async cambiarModo(req, res) {
    const nuevoModo = req.body.modo === 'PRACTICA' ? 'PRACTICA' : 'CLASE';
    const lab = this.service.establecerModo(nuevoModo);
    const datos = lab.toJSON();
    this.broadcaster.difundir('INIT', { laboratorio: datos });
    return res.json({ success: true, laboratorio: datos });
  }

  async moverPuesto(req, res) {
    try {
      const { host_id, puesto_id, slot } = req.body || {};
      const destino = puesto_id || (slot ? `puesto-${slot}` : null);
      if (!host_id || !destino) {
        return res.status(400).json({ success: false, error: 'Se requiere host_id y puesto_id.' });
      }
      const lab = this.service.moverPuesto(host_id, destino);
      const datos = lab.toJSON();
      this.broadcaster.difundir('INIT', { laboratorio: datos });
      return res.json({ success: true, laboratorio: datos });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async flujoEventos(req, res) {
    let datosIniciales = null;
    try {
      const lab = await this.service.obtenerLaboratorio({ forzar: false });
      datosIniciales = lab.toJSON();
    } catch (_) {}

    this.broadcaster.conectar(req, res, datosIniciales);
  }
}

module.exports = LaboratorioController;
