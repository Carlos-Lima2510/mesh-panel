const Accion = require('../Accion');

class EstadoOperativo {
  constructor(
    diagnostico = 'Puesto 100% operativo (MeshAgent conectado al servidor).',
    accion = null
  ) {
    this.color = 'VERDE';
    this.categoria = 'OPERATIVO';
    this.diagnostico = diagnostico;
    this.accion = accion;
  }

  obtenerAccion() {
    return this.accion || Accion.powerOff();
  }

  esOperativo() {
    return true;
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

module.exports = EstadoOperativo;
