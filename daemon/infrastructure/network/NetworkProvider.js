class NetworkProvider {

  async obtenerEstadoBoca(boca) {
    throw new Error('Método obtenerEstadoBoca debe ser implementado por la subclase');
  }

  async obtenerTodosLosPuertos() {
    throw new Error('Método obtenerTodosLosPuertos debe ser implementado por la subclase');
  }
}

module.exports = NetworkProvider;
