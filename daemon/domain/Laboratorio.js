const Distribucion = require('./Distribucion');

class Laboratorio {
  constructor({ nombre = 'Laboratorio General', modo = 'CLASE' } = {}) {
    this.nombre = nombre;
    this.modo = modo;
    this.redes = [];
    this.hosts = [];
    this.distribuciones = [];
    this.distribucionActivaId = null;
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

  agregarDistribucion(distribucion) {
    this.distribuciones.push(distribucion);
    if (this.distribuciones.length === 1 || distribucion.activa) {
      this.establecerDistribucionActiva(distribucion.id);
    }
  }

  eliminarDistribucion(id) {
    const idx = this.distribuciones.findIndex(d => d.id === id);
    if (idx !== -1) {
      const eliminada = this.distribuciones.splice(idx, 1)[0];
      if (this.distribucionActivaId === id) {
        this.distribucionActivaId = this.distribuciones.length > 0 ? this.distribuciones[0].id : null;
      }
      return eliminada;
    }
    return null;
  }

  obtenerDistribucion(id) {
    return this.distribuciones.find(d => d.id === id) || null;
  }

  establecerDistribucionActiva(id) {
    const encontrada = this.obtenerDistribucion(id);
    if (!encontrada) {
      throw new Error(`La distribución '${id}' no existe en este laboratorio.`);
    }

    this.distribucionActivaId = id;
    for (const dist of this.distribuciones) {
      dist.activa = (dist.id === id);
    }
  }

  obtenerDistribucionActiva() {
    if (!this.distribucionActivaId) return null;
    return this.obtenerDistribucion(this.distribucionActivaId);
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
      const color = host.color;
      if (color === 'VERDE') metricas.verde++;
      else if (color === 'AMARILLO') metricas.amarillo++;
      else if (color === 'GRIS') metricas.gris++;
      else metricas.naranja++;
    }

    return metricas;
  }

  toJSON() {
    const distActiva = this.obtenerDistribucionActiva();
    return {
      nombre: this.nombre,
      modo: this.modo,
      metricas: this.obtenerMetricas(),
      redes: this.redes.map(r => r.toJSON()),
      hosts: this.hosts.map(h => h.toJSON()),
      distribuciones: this.distribuciones.map(d => d.toJSON()),
      distribucion_activa: distActiva ? distActiva.toJSON() : null
    };
  }
}

module.exports = Laboratorio;
