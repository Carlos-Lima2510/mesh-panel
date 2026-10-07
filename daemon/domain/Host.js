const Accion = require('./Accion');

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

    this.estado = 'NARANJA';
    this.categoria = 'DESCONECTADO_O_AISLADO';
    this.diagnostico = '';
    this.accion = Accion.inspeccionCable();
    this.telemetria = {};
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

    if (this.enlaceFisico.link === 'DOWN') {
      if (modoLaboratorio === 'PRACTICA') {
        this.estado = 'AMARILLO';
        this.categoria = 'RED_AISLADA';
        this.diagnostico = `Puesto en Red Aislada (Modo Práctica activo; cable conectado al switch de prácticas).`;
        this.accion = new Accion('NINGUNA', 'Puesto en sesión de prácticas en red aislada.', false);
        return;
      }

      this.estado = 'NARANJA';
      this.categoria = 'DESCONECTADO_O_AISLADO';
      this.diagnostico = `Cable desconectado físicamente (Puerto ${this.enlaceFisico.port} en estado DOWN en el switch principal).`;
      this.accion = Accion.inspeccionCable();
      return;
    }

    if (osOnline) {
      this.estado = 'VERDE';
      this.categoria = 'OPERATIVO';
      this.diagnostico = 'Puesto 100% operativo (MeshAgent conectado al servidor).';
      this.accion = Accion.ninguna();
      return;
    }

    const apagadoPorMesh = amtOnline && pwr !== null && pwr !== 1;
    const apagadoPorSwitch = this.enlaceFisico.link === 'UP' && this.enlaceFisico.speed <= 100;

    if (apagadoPorMesh || apagadoPorSwitch) {
      this.estado = 'GRIS';
      this.categoria = 'APAGADO';
      this.diagnostico = `Equipo apagado en Standby (Puerto ${this.enlaceFisico.port} a ${this.enlaceFisico.speed} Mbps; listo para Wake-on-LAN).`;
      this.accion = Accion.wakeOnLan();
      return;
    }

    if (this.enlaceFisico.link === 'UP' && this.enlaceFisico.speed >= 1000) {
      if (this.red && this.red.esAislada) {
        this.estado = 'AMARILLO';
        this.categoria = 'RED_AISLADA';
        this.diagnostico = `Puesto en ${this.red.nombre}. Cable a 1 Gbps pero en segmento aislado sin salida a MeshCentral.`;
        this.accion = new Accion('NINGUNA', 'Puesto en red aislada intencionada.', false);
        return;
      }

      this.estado = 'AMARILLO';
      this.categoria = 'FALLO_LOGICO';
      this.diagnostico = `Fallo lógico o DHCP${this.red ? ' en ' + this.red.nombre : ''}. Cable a 1 Gbps pero el agente no conecta con MeshCentral.`;
      this.accion = Accion.remediarDhcp();
      return;
    }

    this.estado = 'NARANJA';
    this.categoria = 'DESCONECTADO_O_AISLADO';
    this.diagnostico = 'Sin comunicación. Cable desconectado o puesto sin red.';
    this.accion = Accion.inspeccionCable();
  }

  toJSON() {
    return {
      node_id: this.id,
      nombre: this.nombre,
      estado: this.estado,
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
