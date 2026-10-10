const Estado = require('./Estado');
const Accion = require('../Accion');

class EstadoDesconectado extends Estado {
  constructor(diagnostico = 'Cable desconectado físicamente.') {
    super({
      color: 'NARANJA',
      categoria: 'DESCONECTADO_O_AISLADO',
      diagnostico
    });
  }

  obtenerAccion() {
    return Accion.inspeccionCable();
  }
}

module.exports = EstadoDesconectado;
