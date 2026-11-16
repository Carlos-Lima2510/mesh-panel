class Switch {
  constructor({
    id,
    nombre,
    tipo = 'GESTIONADO',
    totalPuertos = 48,
    ipGestion = null,
    red = null
  }) {
    if (!id || !nombre) {
      throw new Error('Un Switch requiere obligatoriamente identificador (id) y nombre.');
    }

    this.id = id;
    this.nombre = nombre;
    this.tipo = tipo === 'NO_GESTIONADO' ? 'NO_GESTIONADO' : 'GESTIONADO';
    this.totalPuertos = Number.isInteger(totalPuertos) && totalPuertos > 0 ? totalPuertos : 48;
    this.ipGestion = ipGestion;
    this.red = red;

    // Mapa de asignación física: puerto (1..totalPuertos) -> puestoId
    this.puertosOcupados = new Map();
  }

  conectarPuesto(puerto, puestoId) {
    if (!puerto || puerto < 1 || puerto > this.totalPuertos) {
      throw new Error(
        `Puerto ${puerto} fuera de rango para el switch '${this.nombre}' (1-${this.totalPuertos}).`
      );
    }

    if (!puestoId) {
      throw new Error('Debe especificar un puestoId válido para conectar al switch.');
    }

    // Invariante de No-Colisión Física: un puerto solo puede alojar un cable/puesto
    const ocupanteActual = this.puertosOcupados.get(puerto);
    if (ocupanteActual && ocupanteActual !== puestoId) {
      throw new Error(
        `Conflicto en ${this.nombre}: El puerto ${puerto} ya está asignado al puesto '${ocupanteActual}'.`
      );
    }

    this.puertosOcupados.set(puerto, puestoId);
  }

  desconectarPuesto(puerto) {
    this.puertosOcupados.delete(puerto);
  }

  obtenerPuestoEnPuerto(puerto) {
    return this.puertosOcupados.get(puerto) || null;
  }

  puertosLibres() {
    return this.totalPuertos - this.puertosOcupados.size;
  }

  estaLleno() {
    return this.puertosLibres() === 0;
  }

  esGestionado() {
    return this.tipo === 'GESTIONADO';
  }

  esperaMeshCentral() {
    if (this.red && this.red.esAislada) {
      return false;
    }
    if (this.tipo === 'NO_GESTIONADO') {
      return false;
    }
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      tipo: this.tipo,
      total_puertos: this.totalPuertos,
      puertos_ocupados: this.puertosOcupados.size,
      puertos_libres: this.puertosLibres(),
      ip_gestion: this.ipGestion,
      es_gestionado: this.esGestionado(),
      espera_meshcentral: this.esperaMeshCentral(),
      red: this.red ? (this.red.toJSON ? this.red.toJSON() : this.red) : null
    };
  }
}

module.exports = Switch;
