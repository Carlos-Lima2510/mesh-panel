class Laboratorio {
  constructor({ nombre = 'Laboratorio General', modo = 'CLASE' } = {}) {
    this.nombre = nombre;
    this.modo = modo;
    this.redes = [];
    this.hosts = [];
    this.puestos = new Map();
  }

  establecerModo(modo) {
    this.modo = modo === 'PRACTICA' ? 'PRACTICA' : 'CLASE';
    for (const host of this.hosts) {
      if (host.telemetria) {
        host.evaluarEstado({
          osOnline: host.telemetria.os_online,
          amtOnline: host.telemetria.amt_online,
          pwr: host.telemetria.pwr,
          conn: host.telemetria.conn,
          modoLaboratorio: this.modo
        });
      }
    }
  }

  agregarRed(red) {
    this.redes.push(red);
  }

  obtenerRedDeIp(ip) {
    if (!ip) return null;
    return this.redes.find(r => r.contieneIp(ip)) || null;
  }

  obtenerRed(id) {
    return this.redes.find(r => r.id === id) || null;
  }

  agregarHost(host) {
    this.hosts.push(host);
  }

  obtenerHost(id) {
    return this.hosts.find(h => h.id === id);
  }

  agregarPuesto(puesto) {
    if (!puesto || !puesto.id) {
      throw new Error('Debe proporcionar un Puesto válido con identificador.');
    }

    // Invariante: no pueden solaparse dos puestos en la misma coordenada
    for (const pExistente of this.puestos.values()) {
      if (pExistente.id !== puesto.id &&
          pExistente.fila === puesto.fila &&
          pExistente.columna === puesto.columna) {
        throw new Error(
          `Conflicto de posición: las coordenadas (${puesto.fila}, ${puesto.columna}) ya están asignadas a '${pExistente.id}'.`
        );
      }
    }

    this.puestos.set(puesto.id, puesto);
  }

  obtenerPuesto(id) {
    return this.puestos.get(id) || null;
  }

  listarPuestos() {
    return Array.from(this.puestos.values());
  }

  obtenerPuestoDeHost(hostId) {
    for (const puesto of this.puestos.values()) {
      const h = puesto.obtenerHost();
      if (h && (h.id === hostId || h.node_id === hostId)) {
        return puesto;
      }
    }
    return null;
  }

  alojarHostEnPuesto(host, idPuesto) {
    const puesto = this.obtenerPuesto(idPuesto);
    if (!puesto) {
      throw new Error(`El puesto '${idPuesto}' no existe en este laboratorio.`);
    }

    const puestoPrevio = this.obtenerPuestoDeHost(host.id);
    if (puestoPrevio && puestoPrevio.id !== idPuesto) {
      puestoPrevio.desocupar();
    }

    puesto.alojarHost(host);
  }

  moverHost(hostId, idPuestoDestino) {
    const puestoDestino = this.obtenerPuesto(idPuestoDestino);
    if (!puestoDestino) {
      throw new Error(`El puesto destino '${idPuestoDestino}' no existe.`);
    }

    const puestoOrigen = this.obtenerPuestoDeHost(hostId);
    const host = this.obtenerHost(hostId) || (puestoOrigen ? puestoOrigen.obtenerHost() : null);

    if (!host) {
      throw new Error(`Host '${hostId}' no encontrado.`);
    }

    const hostEnDestino = puestoDestino.obtenerHost();

    if (hostEnDestino && puestoOrigen) {
      // Intercambio automático
      puestoOrigen.desocupar();
      puestoDestino.desocupar();

      puestoDestino.alojarHost(host);
      puestoOrigen.alojarHost(hostEnDestino);

      host.puestoId = puestoDestino.id;
      hostEnDestino.puestoId = puestoOrigen.id;
    } else {
      if (puestoOrigen) {
        puestoOrigen.desocupar();
      }
      puestoDestino.alojarHost(host);
      host.puestoId = puestoDestino.id;
    }

    return this;
  }

  intercambiarPuestos(idPuestoA, idPuestoB) {
    const puestoA = this.obtenerPuesto(idPuestoA);
    const puestoB = this.obtenerPuesto(idPuestoB);

    if (!puestoA || !puestoB) {
      throw new Error('Ambos puestos deben existir para realizar el intercambio.');
    }

    const hostA = puestoA.desocupar();
    const hostB = puestoB.desocupar();

    if (hostA) {
      puestoB.alojarHost(hostA);
      hostA.puestoId = puestoB.id;
    }
    if (hostB) {
      puestoA.alojarHost(hostB);
      hostB.puestoId = puestoA.id;
    }

    return this;
  }

  obtenerMetricas() {
    const metricas = {
      total: this.hosts.length,
      verde: 0,
      amarillo: 0,
      gris: 0,
      naranja: 0
    };

    for (const host of this.hosts) {
      const color = host.color;
      if (color === 'VERDE') metricas.verde++;
      else if (color === 'AMARILLO') metricas.amarillo++;
      else if (color === 'GRIS') metricas.gris++;
      else metricas.naranja++;
    }

    return metricas;
  }

  toJSON() {
    return {
      nombre: this.nombre,
      modo: this.modo,
      metricas: this.obtenerMetricas(),
      redes: this.redes.map(r => r.toJSON()),
      hosts: this.hosts.map(h => h.toJSON()),
      puestos: this.listarPuestos().map(p => p.toJSON())
    };
  }
}

module.exports = Laboratorio;
