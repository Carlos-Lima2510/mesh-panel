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
    const { modo, alcance } = req.body || {};
    const nuevoModo = (modo === 'PRACTICA' || modo === 'CABLEADO') ? modo : 'CLASE';
    const lab = this.service.establecerModo(nuevoModo, alcance);
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

  async asignarSwitch(req, res) {
    try {
      const { puesto_ids, puesto_id, switch_id, asignaciones, desde, hasta } = req.body || {};

      if (desde && hasta && switch_id) {
        const lab = this.service.asignarRangoSwitch(desde, hasta, switch_id);
        const datos = lab.toJSON();
        this.broadcaster.difundir('INIT', { laboratorio: datos });
        return res.json({ success: true, laboratorio: datos });
      }

      if (Array.isArray(asignaciones) && asignaciones.length > 0) {
        let lab = null;
        for (const item of asignaciones) {
          const targetSwitch = item.switch_id;
          const targetPuestos = item.puesto_ids || (item.puesto_id ? [item.puesto_id] : null);
          if (targetPuestos && targetSwitch) {
            lab = this.service.asignarSwitchAPuestos(targetPuestos, targetSwitch);
          }
        }
        const datos = lab ? lab.toJSON() : (this.service.ultimoLaboratorio ? this.service.ultimoLaboratorio.toJSON() : null);
        this.broadcaster.difundir('INIT', { laboratorio: datos });
        return res.json({ success: true, laboratorio: datos });
      }

      const targetSwitch = switch_id;
      const targetPuestos = puesto_ids || (puesto_id ? [puesto_id] : null);

      if (!targetPuestos || !targetSwitch) {
        return res.status(400).json({
          success: false,
          error: 'Debe especificar puesto_ids (array), puesto_id y switch_id, asignaciones o rango (desde, hasta).'
        });
      }

      const lab = this.service.asignarSwitchAPuestos(targetPuestos, targetSwitch);
      const datos = lab.toJSON();
      this.broadcaster.difundir('INIT', { laboratorio: datos });
      return res.json({ success: true, laboratorio: datos });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async configurarDimensiones(req, res) {
    try {
      const { filas, columnas, columnas_hilera } = req.body || {};
      const c = columnas_hilera || columnas;
      if (!filas || !c) {
        return res.status(400).json({
          success: false,
          error: 'Debe especificar filas y columnas.'
        });
      }
      const lab = await this.service.configurarDimensiones(filas, columnas, columnas_hilera);
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
