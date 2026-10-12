const Accion = require('../Accion');

class EstadoFalloLogico {
  constructor(diagnostico = 'Fallo lógico o DHCP. Cable a 1 Gbps pero el agente no conecta con MeshCentral.') {
    this.color = 'AMARILLO';
    this.categoria = 'FALLO_LOGICO';
    this.diagnostico = diagnostico;
  }

  obtenerAccion() {
    return Accion.remediarDhcp();
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

module.exports = EstadoFalloLogico;
