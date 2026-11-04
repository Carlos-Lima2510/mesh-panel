const Accion = require('../Accion');

class EstadoStandby {
  constructor(puerto = 99, velocidad = 100) {
    this.color = 'GRIS';
    this.categoria = 'APAGADO';
    this.puerto = puerto;
    this.velocidad = velocidad;
    this.diagnostico = `Equipo apagado en Standby (Puerto ${puerto} a ${velocidad} Mbps; listo para Wake-on-LAN).`;
  }

  obtenerAccion() {
    return Accion.wakeOnLan();
  }

  esOperativo() {
    return false;
  }

  permiteAccionRemota() {
    return this.obtenerAccion().ejecutable;
  }

  toJSON() {
    const accion = this.obtenerAccion();
    return {
      color: this.color,
      categoria: this.categoria,
      diagnostico: this.diagnostico,
      accion: {
        tipo: accion.tipo,
        descripcion: accion.descripcion,
        ejecutable: accion.ejecutable
      }
    };
  }
}

module.exports = EstadoStandby;
