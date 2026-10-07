const { exec } = require('child_process');

/**
 * SwitchService: Servicio de telemetría de infraestructura de red (Switch).
 * 
 * Soporta dos modos:
 * 1. 'mock': Simulación local en memoria.
 * 2. 'snmp': Consulta real a un Switch físico o virtual por protocolo SNMP (UDP 161).
 *    Realiza consultas estándar a MIB-II (ifDescr, ifOperStatus e ifHighSpeed).
 */
class SwitchService {
  constructor(config = {}) {
    this.mode = config.mode || 'snmp';
    this.host = config.host || 'virtual-switch';
    this.community = config.community || 'public';

    // Mapeo de Puesto (MeshCentral) a Boca de red física del Switch (port1 .. port8)
    this.deviceToPortMap = new Map([
      ['UEA-C226', 'port1'],
      ['UEA-C232', 'port2'],
      ['UEA-C234', 'port3'],
      ['UEA-C236', 'port4'],
      ['UEA-C403', 'port5']
    ]);

    // Caché en memoria para no saturar el switch en consultas simultáneas
    this.snmpCache = null;
    this.lastSnmpFetch = 0;

    // Tabla mock de respaldo
    this.mockPorts = new Map([
      ['UEA-C226', { port: 1, link: 'UP', speed: 1000 }],
      ['UEA-C232', { port: 2, link: 'UP', speed: 1000 }],
      ['UEA-C234', { port: 3, link: 'UP', speed: 1000 }],
      ['UEA-C236', { port: 4, link: 'UP', speed: 10 }],
      ['UEA-C403', { port: 5, link: 'UP', speed: 1000 }]
    ]);
  }

  /**
   * Ejecuta un comando en shell devolviendo una Promesa
   */
  _execCmd(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, { timeout: 3000 }, (error, stdout) => {
        if (error) return reject(error);
        resolve(stdout.trim());
      });
    });
  }

  /**
   * Consulta el Switch en tiempo real vía SNMP (protocolo UDP 161)
   */
  async fetchSnmpSwitchData() {
    const now = Date.now();
    if (this.snmpCache && (now - this.lastSnmpFetch < 2000)) {
      return this.snmpCache;
    }

    try {
      const host = this.host;
      const comm = this.community;

      // Consultar nombres de interfaces, estado operativo y velocidad por SNMP
      const [descrRaw, statusRaw, speedRaw] = await Promise.all([
        this._execCmd(`snmpwalk -v2c -c ${comm} -Oqn ${host} 1.3.6.1.2.1.2.2.1.2`).catch(() => ''),
        this._execCmd(`snmpwalk -v2c -c ${comm} -Oqn ${host} 1.3.6.1.2.1.2.2.1.8`).catch(() => ''),
        this._execCmd(`snmpwalk -v2c -c ${comm} -Oqn ${host} 1.3.6.1.2.1.31.1.1.1.15`).catch(() => '')
      ]);

      const ifNames = new Map();
      descrRaw.split('\n').forEach(line => {
        const match = line.match(/\.1\.3\.6\.1\.2\.1\.2\.2\.1\.2\.(\d+)\s+"?([^"\s]+)"?/);
        if (match) ifNames.set(match[1], match[2]);
      });

      const ifStatus = new Map();
      statusRaw.split('\n').forEach(line => {
        const match = line.match(/\.1\.3\.6\.1\.2\.1\.2\.2\.1\.8\.(\d+)\s+([a-zA-Z0-9]+)/);
        if (match) {
          const val = match[2].toLowerCase();
          const isUp = val === '1' || val === 'up';
          ifStatus.set(match[1], isUp ? 1 : 2);
        }
      });

      const ifSpeed = new Map();
      speedRaw.split('\n').forEach(line => {
        const match = line.match(/\.1\.3\.6\.1\.2\.1\.31\.1\.1\.1\.15\.(\d+)\s+(\d+)/);
        if (match) ifSpeed.set(match[1], parseInt(match[2], 10));
      });

      const portsMap = new Map();
      for (const [idx, name] of ifNames.entries()) {
        const statusVal = ifStatus.get(idx) || 2; // 1 = UP, 2 = DOWN
        const speedVal = ifSpeed.get(idx) || (statusVal === 1 ? 1000 : 0);

        // Extraer número de puerto (ej. port5 -> 5)
        const portNumMatch = name.match(/port(\d+)/i);
        const portNumber = portNumMatch ? parseInt(portNumMatch[1], 10) : parseInt(idx, 10);

        portsMap.set(name, {
          port: portNumber,
          portName: name,
          link: statusVal === 1 ? 'UP' : 'DOWN',
          speed: statusVal === 1 ? speedVal : 0,
          source: 'snmp_real'
        });
      }

      this.snmpCache = portsMap;
      this.lastSnmpFetch = now;
      return portsMap;
    } catch (err) {
      console.warn(`[!] [SNMP] Error consultando switch en ${this.host}: ${err.message}.`);
      return null;
    }
  }

  /**
   * Obtiene la telemetría del puerto del switch para un puesto
   */
  async getPortForDevice(dev) {
    const name = dev.name || dev.nombre;

    if (this.mode === 'snmp') {
      const snmpPorts = await this.fetchSnmpSwitchData();
      if (snmpPorts) {
        const portName = this.deviceToPortMap.get(name);
        if (portName && snmpPorts.has(portName)) {
          return { ...snmpPorts.get(portName) };
        }
      }
    }

    // Modo Mock o Fallback
    if (name && this.mockPorts.has(name)) {
      return { ...this.mockPorts.get(name), source: 'mock' };
    }

    return { port: 99, link: 'UP', speed: 1000, default: true, source: 'default' };
  }

  setMockPort(key, { port, link, speed }) {
    const current = this.mockPorts.get(key) || { port: 1, link: 'UP', speed: 1000 };
    const updated = {
      port: port !== undefined ? port : current.port,
      link: link !== undefined ? link.toUpperCase() : current.link,
      speed: speed !== undefined ? parseInt(speed, 10) : current.speed,
      source: 'mock'
    };
    this.mockPorts.set(key, updated);
    return updated;
  }

  getAllMockPorts() {
    const result = {};
    for (const [key, val] of this.mockPorts.entries()) {
      result[key] = val;
    }
    return result;
  }
}

module.exports = SwitchService;
