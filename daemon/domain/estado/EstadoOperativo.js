const Estado = require('./Estado');
const Accion = require('../Accion');

class EstadoOperativo extends Estado {
  constructor(diagnostico = 'Puesto 100% operativo (MeshAgent conectado al servidor).') {
    super({
      color: 'VERDE',
      categoria: 'OPERATIVO',
      diagnostico
    });
  }

  obtenerAccion() {
    return Accion.powerOff();
  }

  esOperativo() {
    return true;
  }
}

module.exports = EstadoOperativo;
