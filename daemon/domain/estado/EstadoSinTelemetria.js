const Accion = require('../Accion');

class EstadoSinTelemetria {
  constructor(diagnostico = 'Sin telemetría de red. Switch inalcanzable.') {
    this.color = 'DESCONOCIDO';
    this.categoria = 'SIN_TELEMETRIA';
    this.diagnostico = diagnostico;
  }

  obtenerAccion() {
    return Accion.verificarInfraestructura();
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

module.exports = EstadoSinTelemetria;
