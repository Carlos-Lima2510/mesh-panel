class Accion {

  constructor(tipo, descripcion, ejecutable = false) {
    this.tipo = tipo;
    this.descripcion = descripcion;
    this.ejecutable = ejecutable;
  }

  static ninguna() {
    return new Accion('NINGUNA', 'Puesto operativo. No requiere intervención.', false);
  }

  static wakeOnLan() {
    return new Accion('WAKE_ON_LAN', 'Equipo apagado en Standby. Listo para encendido remoto por Wake-on-LAN.', true);
  }

  static powerOff() {
    return new Accion('POWER_OFF', 'Equipo encendido en red docente. Listo para apagado remoto.', true);
  }

  static apagar() {
    return Accion.powerOff();
  }

  static remediarDhcp() {
    return new Accion('REMEDIAR_DHCP', 'Fallo lógico o DHCP. Enlace físico activo pero sin comunicación con MeshCentral.', false);
  }

  static inspeccionCable() {
    return new Accion('INSPECCION_CABLE', 'Enlace físico caído. Requiere inspección del cable de red en el puesto o switch.', false);
  }
}

module.exports = Accion;
