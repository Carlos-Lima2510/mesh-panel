class Estado {
  constructor() {
    if (new.target === Estado) {
      throw new TypeError('Estado es una interfaz de contrato y no puede instanciarse directamente.');
    }
  }

  static esInstancia(obj) {
    return Boolean(
      obj &&
      typeof obj.color === 'string' &&
      typeof obj.categoria === 'string' &&
      typeof obj.diagnostico === 'string' &&
      typeof obj.obtenerAccion === 'function' &&
      typeof obj.esOperativo === 'function' &&
      typeof obj.permiteAccionRemota === 'function' &&
      typeof obj.toJSON === 'function'
    );
  }
}

module.exports = Estado;
