class SwitchController {
  constructor({ laboratorioService, networkProvider, switchMode, sseBroadcaster }) {
    this.service = laboratorioService;
    this.networkProvider = networkProvider;
    this.switchMode = switchMode;
    this.broadcaster = sseBroadcaster;
  }

  async obtenerPuertos(req, res) {
    const puertos = await this.service.obtenerPuertosRed();
    return res.json({
      success: true,
      modo: this.switchMode,
      puertos
    });
  }

  async configurarBoca(req, res) {
    if (this.switchMode === 'simulado' && this.networkProvider.establecerEstadoBoca) {
      const boca = req.body.boca || ('port' + req.body.port);
      this.networkProvider.establecerEstadoBoca(boca, {
        link: req.body.link,
        speed: req.body.speed
      });
    }

    const lab = await this.service.obtenerLaboratorio({ forzar: true });
    const datos = lab.toJSON();
    this.broadcaster.difundir('INIT', { laboratorio: datos });

    return res.json({ success: true, laboratorio: datos });
  }
}

module.exports = SwitchController;
