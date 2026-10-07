/**
 * SwitchService: Servicio de telemetría de infraestructura de red (Switch).
 * 
 * Soporta dos modos:
 * 1. 'mock': Simulación local de puertos y velocidades (ideal para desarrollo/pruebas).
 * 2. 'snmp': Consulta real al switch físico mediante SNMP (BulkGet de ifOperStatus e ifHighSpeed).
 */
class SwitchService {
  constructor(config = {}) {
    this.mode = config.mode || 'mock';
    this.host = config.host || '127.0.0.1';
    this.community = config.community || 'public';

    // Tabla de puertos simulados por defecto (Mapeo por nombre de host o IP)
    // Permite probar inmediatamente los 3 escenarios en máquinas sin AMT:
    // - Port UP @ 1000 Mbps: Encendido con enlace Gigabit
    // - Port UP @ 10 Mbps: Apagado en Standby (WoL)
    // - Port DOWN @ 0 Mbps: Cable desconectado físicamente
    this.mockPorts = new Map([
      ['UEA-C226', { port: 1, link: 'UP', speed: 1000 }],
      ['UEA-C232', { port: 2, link: 'UP', speed: 1000 }],
      ['UEA-C234', { port: 3, link: 'UP', speed: 1000 }],
      ['UEA-C236', { port: 4, link: 'UP', speed: 10 }],    // Standby WoL
      ['UEA-C403', { port: 5, link: 'DOWN', speed: 0 }]    // Cable desconectado
    ]);
  }

  /**
   * Obtiene la telemetría del puerto del switch asociado a un dispositivo.
   * @param {Object} dev Dispositivo con { nombre, ip, node_id }
   * @returns {Promise<Object|null>} { port: number, link: 'UP'|'DOWN', speed: number }
   */
  async getPortForDevice(dev) {
    if (this.mode === 'mock') {
      const name = dev.name || dev.nombre;
      const ip = dev.ip || dev.ip_reportada;

      if (name && this.mockPorts.has(name)) {
        return { ...this.mockPorts.get(name) };
      }
      if (ip && this.mockPorts.has(ip)) {
        return { ...this.mockPorts.get(ip) };
      }

      // Si no está registrado explícitamente, asigna un puerto simulado por defecto (UP @ 1G)
      return { port: 99, link: 'UP', speed: 1000, default: true };
    }

    if (this.mode === 'snmp') {
      // Stub para consulta SNMPv2c BulkGet real
      // (Preparado para integrarse con net-snmp o llamadas snmpget)
      return null;
    }

    return null;
  }

  /**
   * Actualiza el estado de un puerto simulado en tiempo de ejecución.
   * Permite simular cambios de cable (desconectar/conectar) al instante.
   */
  setMockPort(key, { port, link, speed }) {
    const current = this.mockPorts.get(key) || { port: 1, link: 'UP', speed: 1000 };
    const updated = {
      port: port !== undefined ? port : current.port,
      link: link !== undefined ? link.toUpperCase() : current.link,
      speed: speed !== undefined ? parseInt(speed, 10) : current.speed
    };
    this.mockPorts.set(key, updated);
    return updated;
  }

  /**
   * Obtiene todos los puertos configurados.
   */
  getAllMockPorts() {
    const result = {};
    for (const [key, val] of this.mockPorts.entries()) {
      result[key] = val;
    }
    return result;
  }
}

module.exports = SwitchService;
