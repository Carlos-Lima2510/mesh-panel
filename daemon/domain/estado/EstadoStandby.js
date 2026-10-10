const Estado = require('./Estado');
const Accion = require('../Accion');

class EstadoStandby extends Estado {
  constructor(puerto = 99, velocidad = 100) {
    super({
      color: 'GRIS',
      categoria: 'APAGADO',
      diagnostico: `Equipo apagado en Standby (Puerto ${puerto} a ${velocidad} Mbps; listo para Wake-on-LAN).`
    });
    this.puerto = puerto;
    this.velocidad = velocidad;
  }

  obtenerAccion() {
    return Accion.wakeOnLan();
  }
}

module.exports = EstadoStandby;
