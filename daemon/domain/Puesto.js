class Puesto {
  constructor({ id, etiqueta = null, fila = 1, columna = 1, host = null }) {
    if (!id) {
      throw new Error('Un Puesto requiere obligatoriamente un identificador.');
    }
    this.id = id;
    this.etiqueta = etiqueta || `Puesto ${id}`;
    this.fila = fila;
    this.columna = columna;
    this.host = host;
  }

  alojarHost(host) {
    if (!host) {
      throw new Error('Debe proporcionar un Host válido para alojar en el puesto.');
    }
    this.host = host;
  }

  desocupar() {
    const hostPrevio = this.host;
    this.host = null;
    return hostPrevio;
  }

  estaOcupado() {
    return this.host !== null;
  }

  obtenerHost() {
    return this.host;
  }

  toJSON() {
    return {
      id: this.id,
      etiqueta: this.etiqueta,
      fila: this.fila,
      columna: this.columna,
      ocupado: this.estaOcupado(),
      host: this.host ? this.host.toJSON() : null
    };
  }
}

module.exports = Puesto;
