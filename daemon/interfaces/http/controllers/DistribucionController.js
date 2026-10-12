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

  async crear(req, res) {
    const { id, nombre, filas, columnas, puestos } = req.body;
    if (!id || !nombre) {
      return res.error('Se requiere proporcionar id y nombre para la distribución.', 400);
    }

    const nueva = this.service.crearDistribucion({ id, nombre, filas, columnas, puestos });
    const lab = await this.service.obtenerLaboratorio({ forzar: true });
    this.broadcaster.difundir('INIT', { laboratorio: lab.toJSON() });

    return res.json({ success: true, distribucion: nueva.toJSON() }, 201);
  }

  async actualizar(req, res) {
    const { id } = req.body;
    if (!id) {
      return res.error('Se requiere proporcionar el identificador (id) de la distribución.', 400);
    }

    const actualizada = this.service.actualizarDistribucion(id, req.body);
    const lab = await this.service.obtenerLaboratorio({ forzar: true });
    this.broadcaster.difundir('INIT', { laboratorio: lab.toJSON() });

    return res.json({ success: true, distribucion: actualizada.toJSON() });
  }

  async eliminar(req, res) {
    const { id } = req.body;
    if (!id) {
      return res.error('Se requiere proporcionar el identificador (id) de la distribución a eliminar.', 400);
    }

    const eliminada = this.service.eliminarDistribucion(id);
    const lab = await this.service.obtenerLaboratorio({ forzar: true });
    this.broadcaster.difundir('INIT', { laboratorio: lab.toJSON() });

    return res.json({ success: true, id_eliminado: eliminada.id });
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
