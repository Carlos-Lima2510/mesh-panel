class DistribucionController {
  constructor({ laboratorioService, sseBroadcaster }) {
    this.service = laboratorioService;
    this.broadcaster = sseBroadcaster;
  }

  async listar(req, res) {
    const lab = await this.service.obtenerLaboratorio({ forzar: false });
    const distActiva = lab.obtenerDistribucionActiva();

    return res.json({
      success: true,
      distribuciones: lab.distribuciones.map(d => d.toJSON()),
      activa: distActiva ? distActiva.toJSON() : null
    });
  }

  async activar(req, res) {
    const id = req.body.id;
    if (!id) {
      return res.error('Debe proporcionar el identificador de la distribución a activar.', 400);
    }

    const lab = this.service.activarDistribucion(id);
    const datos = lab.toJSON();
    this.broadcaster.difundir('INIT', { laboratorio: datos });

    return res.json({ success: true, laboratorio: datos });
  }

  async mover(req, res) {
    const { host_id: hostId, puesto_id: puestoId, slot } = req.body;
    if (!hostId) {
      return res.error('Debe proporcionar el host_id del puesto a mover.', 400);
    }

    const destino = puestoId || (slot ? `puesto-${slot}` : null);
    if (!destino) {
      return res.error('Debe indicar el puesto destino (puesto_id o slot numérico).', 400);
    }

    const lab = this.service.moverPuesto(hostId, destino);
    const datos = lab.toJSON();
    this.broadcaster.difundir('INIT', { laboratorio: datos });

    return res.json({ success: true, laboratorio: datos });
  }
}

module.exports = DistribucionController;
