class Red {
  constructor({ id, nombre, subred, esAislada = false }) {
    this.id = id;
    this.nombre = nombre;
    this.subred = subred;
    this.esAislada = esAislada;
  }

  contieneIp(ip) {
    if (!ip) return false;
    return ip.startsWith(this.subred);
  }

  permiteSalidaMeshCentral() {
    return !this.esAislada;
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      subred: this.subred,
      es_aislada: this.esAislada
    };
  }
}

module.exports = Red;
