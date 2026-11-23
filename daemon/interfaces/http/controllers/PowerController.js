class PowerController {
  constructor({ laboratorioService }) {
    this.service = laboratorioService;
  }

  async wake(req, res) {
    const nodeId = req.body.node_id;
    const mac = req.body.mac;
    const hostId = req.body.host_id || nodeId;

    if (!nodeId && !mac && !hostId) {
      return res.error('Falta el node_id, host_id o dirección mac del host a despertar.', 400);
    }

    const resultado = await this.service.ejecutarAccion(nodeId || hostId, 'WAKE_ON_LAN', { mac, hostId });
    const exito = Boolean(resultado && resultado.success);

    return res.json({ success: exito, resultado }, exito ? 200 : 400);
  }

  async powerOff(req, res) {
    const nodeId = req.body.node_id;
    if (!nodeId) {
      return res.error('Falta el node_id del host a apagar.', 400);
    }

    const resultado = await this.service.ejecutarAccion(nodeId, 'POWER_OFF');
    const exito = Boolean(resultado && resultado.success);

    return res.json({ success: exito, resultado }, exito ? 200 : 400);
  }
}

module.exports = PowerController;
