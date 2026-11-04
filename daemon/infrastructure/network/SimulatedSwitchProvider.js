const NetworkProvider = require('./NetworkProvider');

class SimulatedSwitchProvider extends NetworkProvider {
  constructor(puertosIniciales = {}) {
    super();
    this.puertos = new Map([
      ['port1', { port: 1, portName: 'port1', link: 'UP', speed: 1000, source: 'simulado' }],
      ['port2', { port: 2, portName: 'port2', link: 'UP', speed: 1000, source: 'simulado' }],
      ['port3', { port: 3, portName: 'port3', link: 'UP', speed: 1000, source: 'simulado' }],
      ['port4', { port: 4, portName: 'port4', link: 'UP', speed: 1000, source: 'simulado' }],
      ['port5', { port: 5, portName: 'port5', link: 'UP', speed: 10,   source: 'simulado' }],
      ['port6', { port: 6, portName: 'port6', link: 'UP', speed: 1000, source: 'simulado' }]
    ]);

    for (const [k, v] of Object.entries(puertosIniciales)) {
      this.puertos.set(k, { portName: k, source: 'simulado', ...v });
    }
  }

  async obtenerEstadoBoca(boca) {
    if (this.puertos.has(boca)) {
      return { ...this.puertos.get(boca) };
    }
    const num = parseInt(boca.replace('port', ''), 10) || 99;
    return { port: num, portName: boca, link: 'UP', speed: 1000, source: 'simulado' };
  }

  async obtenerTodosLosPuertos() {
    const obj = {};
    for (const [k, v] of this.puertos.entries()) {
      obj[k] = { ...v };
    }
    return obj;
  }

  establecerEstadoBoca(boca, { link, speed }) {
    const actual = this.puertos.get(boca) || { port: 99, portName: boca, link: 'UP', speed: 1000, source: 'simulado' };
    const nuevo = {
      ...actual,
      link: link !== undefined ? link.toUpperCase() : actual.link,
      speed: speed !== undefined ? parseInt(speed, 10) : actual.speed
    };
    this.puertos.set(boca, nuevo);
    return nuevo;
  }
}

module.exports = SimulatedSwitchProvider;
