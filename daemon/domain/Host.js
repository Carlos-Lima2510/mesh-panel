const { EstadoDesconectado, EvaluadorEstado } = require('./estado');

class Host {
  constructor({
    id,
    nombre,
    ip = null,
    mac = null,
    bocaSwitch = 'port99',
    soportaWoL = true,
    red = null,
    enlaceFisico = { port: 99, portName: 'port99', link: 'UP', speed: 1000, source: 'default' }
  }) {
    this.id = id;
    this.nombre = nombre;
    this.ip = ip;
    this.mac = mac;
    this.bocaSwitch = bocaSwitch;
    this.soportaWoL = soportaWoL;
    this.red = red;
    this.enlaceFisico = enlaceFisico;

    this.estado = new EstadoDesconectado('Estado inicial no evaluado.');
    this.telemetria = {};
    this.slot = null;
    this.puestoId = null;
  }

  get accion() {
    return this.estado.obtenerAccion();
  }

  get color() {
    return this.estado.color;
  }

  get categoria() {
    return this.estado.categoria;
  }

  get diagnostico() {
    return this.estado.diagnostico;
  }

  evaluarEstado({ osOnline, amtOnline = false, pwr = null, conn = 0, modoLaboratorio = 'CLASE' }) {
    this.telemetria = {
      os_online: osOnline,
      amt_online: amtOnline,
      switch: {
        port: this.enlaceFisico.port,
        portName: this.enlaceFisico.portName,
        link: this.enlaceFisico.link,
        speed: this.enlaceFisico.speed,
        source: this.enlaceFisico.source
      },
      red_asignada: this.red ? this.red.nombre : 'No identificada',
      modo_laboratorio: modoLaboratorio,
      ip_reportada: this.ip,
      mac: this.mac,
      conn,
      pwr
    };

    this.estado = EvaluadorEstado.evaluar({
      enlaceFisico: this.enlaceFisico,
      osOnline,
      amtOnline,
      pwr,
      red: this.red,
      modoLaboratorio
    });
  }

  toJSON() {
    return {
      node_id: this.id,
      nombre: this.nombre,
      slot: this.slot,
      puesto_id: this.puestoId,
      estado: this.color,
      categoria: this.categoria,
      diagnostico: this.diagnostico,
      boca_switch: this.bocaSwitch,
      red: this.red ? this.red.toJSON() : null,
      accion: {
        tipo: this.accion.tipo,
        descripcion: this.accion.descripcion,
        ejecutable: this.accion.ejecutable
      },
      telemetria: this.telemetria
    };
  }
}

module.exports = Host;
