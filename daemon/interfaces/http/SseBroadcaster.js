class SseBroadcaster {
  constructor() {
    this.clientes = [];
    this._iniciarHeartbeat();
  }

  conectar(req, res, datosIniciales = null) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (datosIniciales) {
      const payload = JSON.stringify({ tipo: 'INIT', laboratorio: datosIniciales });
      res.write(`data: ${payload}\n\n`);
    }

    this.clientes.push(res);

    req.on('close', () => {
      const idx = this.clientes.indexOf(res);
      if (idx !== -1) {
        this.clientes.splice(idx, 1);
      }
    });
  }

  difundir(tipo, data) {
    if (this.clientes.length === 0) return;
    const payload = JSON.stringify({ tipo, ...data });
    for (const res of this.clientes) {
      res.write(`data: ${payload}\n\n`);
    }
  }

  tieneClientes() {
    return this.clientes.length > 0;
  }

  _iniciarHeartbeat() {
    const timer = setInterval(() => {
      for (const res of this.clientes) {
        res.write(':heartbeat\n\n');
      }
    }, 25000);
    if (timer.unref) timer.unref();
  }
}

module.exports = SseBroadcaster;
