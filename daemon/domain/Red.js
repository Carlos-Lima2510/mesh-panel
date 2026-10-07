class Red {
  /**
   * @param {Object} params
   * @param {string} params.id 
   * @param {string} params.nombre 
   * @param {string} params.subred 
   * @param {boolean} [params.esAislada=false] 
   */
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
