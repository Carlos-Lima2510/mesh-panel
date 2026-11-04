const Accion = require('../Accion');

class EstadoDesconectado {
  constructor(diagnostico = 'Cable desconectado físicamente.') {
    this.color = 'NARANJA';
    this.categoria = 'DESCONECTADO_O_AISLADO';
    this.diagnostico = diagnostico;
  }

  obtenerAccion() {
    return Accion.inspeccionCable();
  }

  esOperativo() {
    return false;
  }

  permiteAccionRemota() {
    return false;
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

module.exports = EstadoDesconectado;
