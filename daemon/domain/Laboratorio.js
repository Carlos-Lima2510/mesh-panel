class Laboratorio {
  /**
   * @param {Object} [params]
   * @param {string} [params.nombre='Laboratorio General']
   * @param {string} [params.modo='CLASE']
   */
  constructor({ nombre = 'Laboratorio General', modo = 'CLASE' } = {}) {
    this.nombre = nombre;
    this.modo = modo;
    this.redes = [];
    this.hosts = [];
  }

  establecerModo(modo) {
    this.modo = modo === 'PRACTICA' ? 'PRACTICA' : 'CLASE';
    for (const host of this.hosts) {
      if (host.telemetria) {
        host.evaluarEstado({
          osOnline: host.telemetria.os_online,
          amtOnline: host.telemetria.amt_online,
          pwr: host.telemetria.pwr,
          conn: host.telemetria.conn,
          modoLaboratorio: this.modo
        });
      }
    }
  }

  agregarRed(red) {
    this.redes.push(red);
  }

  obtenerRedDeIp(ip) {
    if (!ip) return null;
    return this.redes.find(r => r.contieneIp(ip)) || null;
  }

  agregarHost(host) {
    this.hosts.push(host);
  }

  obtenerHost(id) {
    return this.hosts.find(h => h.id === id);
  }

  obtenerMetricas() {
    const metricas = {
      total: this.hosts.length,
      verde: 0,
      amarillo: 0,
      gris: 0,
      naranja: 0
    };

    for (const host of this.hosts) {
      if (host.estado === 'VERDE') metricas.verde++;
      else if (host.estado === 'AMARILLO') metricas.amarillo++;
      else if (host.estado === 'GRIS') metricas.gris++;
      else metricas.naranja++;
    }

    return metricas;
  }

  toJSON() {
    return {
      nombre: this.nombre,
      modo: this.modo,
      metricas: this.obtenerMetricas(),
      redes: this.redes.map(r => r.toJSON()),
      hosts: this.hosts.map(h => h.toJSON())
    };
  }
}

module.exports = Laboratorio;
