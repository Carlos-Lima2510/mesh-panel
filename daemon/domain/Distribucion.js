const Puesto = require('./Puesto');

class Distribucion {
  constructor({ id, nombre, filas = 5, columnas = 12, activa = true, puestos = [] } = {}) {
    if (!id || !nombre) {
      throw new Error('Una Distribución requiere obligatoriamente un id y un nombre.');
    }
    this.id = id;
    this.nombre = nombre;
    this.filas = filas;
    this.columnas = columnas;
    this.activa = activa;
    this.puestos = new Map();

    for (const p of puestos) {
      this.agregarPuesto(p);
    }
  }

  agregarPuesto(puesto) {
    if (this.puestos.has(puesto.id)) {
      throw new Error(`Ya existe un puesto con el ID '${puesto.id}' en la distribución '${this.nombre}'.`);
    }

    const ocupante = this.obtenerPuestoPorCoordenada(puesto.fila, puesto.columna);
    if (ocupante) {
      throw new Error(
        `Conflicto de posición: La coordenada (${puesto.fila}, ${puesto.columna}) ya está ocupada por el puesto '${ocupante.id}'.`
      );
    }

    this.puestos.set(puesto.id, puesto);
  }

  crearPuesto({ id, etiqueta = null, fila, columna, host = null }) {
    const puesto = new Puesto({ id, etiqueta, fila, columna, host });
    this.agregarPuesto(puesto);
    return puesto;
  }

  eliminarPuesto(idPuesto) {
    const puesto = this.obtenerPuesto(idPuesto);
    if (puesto) {
      this.puestos.delete(idPuesto);
      return puesto;
    }
    return null;
  }

  obtenerPuesto(id) {
    return this.puestos.get(id) || null;
  }

  obtenerPuestoPorCoordenada(fila, columna) {
    for (const puesto of this.puestos.values()) {
      if (puesto.fila === fila && puesto.columna === columna) {
        return puesto;
      }
    }
    return null;
  }

  obtenerPuestoDeHost(hostId) {
    for (const puesto of this.puestos.values()) {
      if (puesto.host && puesto.host.id === hostId) {
        return puesto;
      }
    }
    return null;
  }

  ubicarHost(host, idPuesto) {
    const puestoDestino = this.obtenerPuesto(idPuesto);
    if (!puestoDestino) {
      throw new Error(`Puesto '${idPuesto}' no existe en la distribución '${this.nombre}'.`);
    }

    const puestoPrevio = this.obtenerPuestoDeHost(host.id);
    if (puestoPrevio && puestoPrevio.id !== idPuesto) {
      puestoPrevio.desocupar();
    }

    puestoDestino.alojarHost(host);
  }

  moverHost(hostId, idPuestoDestino) {
    const puestoActual = this.obtenerPuestoDeHost(hostId);
    if (!puestoActual) {
      throw new Error(`El host '${hostId}' no está ubicado en ningún puesto de la distribución.`);
    }

    const puestoDestino = this.obtenerPuesto(idPuestoDestino);
    if (!puestoDestino) {
      throw new Error(`El puesto destino '${idPuestoDestino}' no existe.`);
    }

    const host = puestoActual.desocupar();
    puestoDestino.alojarHost(host);
  }

  intercambiarPuestos(idPuestoA, idPuestoB) {
    const puestoA = this.obtenerPuesto(idPuestoA);
    const puestoB = this.obtenerPuesto(idPuestoB);

    if (!puestoA || !puestoB) {
      throw new Error('Uno o ambos puestos no existen para realizar el intercambio.');
    }

    const hostA = puestoA.host;
    puestoA.host = puestoB.host;
    puestoB.host = hostA;
  }

  desocuparPuesto(idPuesto) {
    const puesto = this.obtenerPuesto(idPuesto);
    if (puesto) {
      return puesto.desocupar();
    }
    return null;
  }

  listarPuestos() {
    return Array.from(this.puestos.values()).sort((a, b) => {
      if (a.fila !== b.fila) return a.fila - b.fila;
      return a.columna - b.columna;
    });
  }

  validarIntegridad() {
    const coordenadas = new Set();
    const hostsRegistrados = new Set();

    for (const puesto of this.puestos.values()) {
      const coordKey = `${puesto.fila},${puesto.columna}`;
      if (coordenadas.has(coordKey)) {
        return { valida: false, motivo: `Coordenada duplicada detectada: (${puesto.fila}, ${puesto.columna}).` };
      }
      coordenadas.add(coordKey);

      if (puesto.host) {
        if (hostsRegistrados.has(puesto.host.id)) {
          return { valida: false, motivo: `El Host '${puesto.host.id}' está asignado a más de un puesto simultáneamente.` };
        }
        hostsRegistrados.add(puesto.host.id);
      }
    }

    return { valida: true };
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      filas: this.filas,
      columnas: this.columnas,
      activa: this.activa,
      total_puestos: this.puestos.size,
      puestos: this.listarPuestos().map(p => p.toJSON())
    };
  }
}

module.exports = Distribucion;
