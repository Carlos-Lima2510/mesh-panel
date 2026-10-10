const Estado = require('./Estado');
const Accion = require('../Accion');

class EstadoRedAislada extends Estado {
  constructor(diagnostico = 'Puesto en Red Aislada (cable conectado al switch de prácticas).') {
    super({
      color: 'AMARILLO',
      categoria: 'RED_AISLADA',
      diagnostico
    });
  }

  obtenerAccion() {
    return new Accion('NINGUNA', 'Puesto en sesión de prácticas en red aislada.', false);
  }
}

module.exports = EstadoRedAislada;
