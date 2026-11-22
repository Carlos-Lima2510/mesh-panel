class Puesto {
  constructor({
    id,
    etiqueta = null,
    fila = 1,
    columna = 1,
    hilera = null,
    toma = null,
    switchAsignado = null,
    puertoSwitch = null,
    red = null,
    host = null
  }) {
    if (!id) {
      throw new Error('Un Puesto requiere obligatoriamente un identificador.');
    }
    this.id = id;
    this.etiqueta = etiqueta || `Puesto ${id}`;
    this.fila = fila;
    this.columna = columna;
    this.hilera = hilera || (columna <= 4 ? 'IZQUIERDA' : 'DERECHA');
    this.toma = toma || `ROS-${id}`;
    this.switchAsignado = switchAsignado;
    this.puertoSwitch = puertoSwitch;
    this.red = red;
    this.host = host;

    if (this.switchAsignado && this.puertoSwitch) {
      this.switchAsignado.conectarPuesto(this.puertoSwitch, this.id);
    }
  }

  asignarSwitch(unSwitch, puerto) {
    if (!unSwitch) {
      throw new Error('Debe proporcionar una instancia válida de Switch.');
    }

    if (this.switchAsignado && this.puertoSwitch) {
      this.switchAsignado.desconectarPuesto(this.puertoSwitch);
    }

    unSwitch.conectarPuesto(puerto, this.id);
    this.switchAsignado = unSwitch;
    this.puertoSwitch = puerto;
  }

  desconectarSwitch() {
    if (this.switchAsignado && this.puertoSwitch) {
      this.switchAsignado.desconectarPuesto(this.puertoSwitch);
    }
    this.switchAsignado = null;
    this.puertoSwitch = null;
  }

  obtenerSwitch() {
    return this.switchAsignado;
  }

  estaEnModoPractica(modoLab, alcanceLab = 'COMPLETO') {
    if (modoLab !== 'PRACTICA') return false;
    if (!alcanceLab || alcanceLab === 'COMPLETO') return true;
    return this.hilera === alcanceLab;
  }

  esperaEstarAislado(modoLab = 'CLASE', alcanceLab = 'COMPLETO') {
    if (this.switchAsignado && !this.switchAsignado.esperaMeshCentral()) {
      return true;
    }
    return this.estaEnModoPractica(modoLab, alcanceLab);
  }

  conectarRed(red) {
    this.red = red;
  }

  desconectarRed() {
    this.red = null;
  }

  obtenerRed() {
    return this.red;
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
      hilera: this.hilera,
      toma: this.toma,
      switch_id: this.switchAsignado ? this.switchAsignado.id : null,
      switch_nombre: this.switchAsignado ? this.switchAsignado.nombre : null,
      puerto_switch: this.puertoSwitch,
      red: this.red ? (this.red.toJSON ? this.red.toJSON() : this.red) : null,
      ocupado: this.estaOcupado(),
      host: this.host ? this.host.toJSON() : null
    };
  }
}

module.exports = Puesto;
