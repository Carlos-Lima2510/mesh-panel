const Accion = require('../Accion');

class EstadoRedAislada {
  constructor(diagnostico = 'Puesto en Red Aislada (cable conectado al switch de prácticas).') {
    this.color = 'AMARILLO';
    this.categoria = 'RED_AISLADA';
    this.diagnostico = diagnostico;
  }

  obtenerAccion() {
    return new Accion('NINGUNA', 'Puesto en sesión de prácticas en red aislada.', false);
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

module.exports = EstadoRedAislada;
