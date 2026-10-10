const Accion = require('../Accion');

class Estado {
  constructor({ color, categoria, diagnostico }) {
    if (new.target === Estado) {
      throw new TypeError('Estado es una clase abstracta y no puede instanciarse directamente.');
    }
    this.color = color;
    this.categoria = categoria;
    this.diagnostico = diagnostico;
  }

  obtenerAccion() {
    return Accion.ninguna();
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

module.exports = Estado;
