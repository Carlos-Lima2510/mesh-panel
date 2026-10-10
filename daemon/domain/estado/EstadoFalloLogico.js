const Estado = require('./Estado');
const Accion = require('../Accion');

class EstadoFalloLogico extends Estado {
  constructor(diagnostico = 'Fallo lógico o DHCP. Cable a 1 Gbps pero el agente no conecta con MeshCentral.') {
    super({
      color: 'AMARILLO',
      categoria: 'FALLO_LOGICO',
      diagnostico
    });
  }

  obtenerAccion() {
    return Accion.remediarDhcp();
  }
}

module.exports = EstadoFalloLogico;
