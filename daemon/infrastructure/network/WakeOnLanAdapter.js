const dgram = require('dgram');

/**
 * Adaptador de infraestructura para encendido remoto mediante Wake-on-LAN (WoL).
 * Construye y emite paquetes mágicos UDP estándar (102 bytes) directamente a la
 * dirección MAC física del host, sin requerir agentes MeshCentral ni sistema operativo activo.
 */
class WakeOnLanAdapter {
  /**
   * @param {Object} [opciones]
   * @param {string[]} [opciones.broadcastAddresses] Direcciones IP de difusión
   * @param {number[]} [opciones.ports] Puertos UDP estándar (habitualmente 9 y 7)
   */
  constructor({
    broadcastAddresses = ['255.255.255.255', '172.22.255.255', '192.168.122.255'],
    ports = [9, 7]
  } = {}) {
    this.broadcastAddresses = broadcastAddresses;
    this.ports = ports;
  }

  /**
   * Construye el buffer estándar de 102 bytes para el Magic Packet.
   * - 6 bytes de 0xFF (sincronización de trama física)
   * - 16 repeticiones consecutivas de la dirección MAC binaria de 6 bytes
   *
   * @param {string} mac Dirección MAC en cualquier formato legible (ej: "20:88:10:71:fc:3d")
   * @returns {Buffer} Buffer de 102 bytes
   */
  static crearMagicPacket(mac) {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Dirección MAC no proporcionada o formato no válido.');
    }

    const macLimpia = mac.replace(/[^0-9a-fA-F]/g, '');
    if (macLimpia.length !== 12) {
      throw new Error(`Dirección MAC inválida: "${mac}". Debe contener exactamente 12 dígitos hexadecimales.`);
    }

    const macBuffer = Buffer.from(macLimpia, 'hex');
    const magicPacket = Buffer.alloc(102);

    // 6 bytes de 0xFF
    magicPacket.fill(0xff, 0, 6);

    // 16 repeticiones consecutivas
    for (let i = 0; i < 16; i++) {
      macBuffer.copy(magicPacket, 6 + i * 6);
    }

    return magicPacket;
  }

  /**
   * Normaliza la dirección MAC al formato estándar con dos puntos (XX:XX:XX:XX:XX:XX).
   *
   * @param {string} mac Dirección MAC en cualquier formato
   * @returns {string} MAC normalizada en mayúsculas
   */
  static formatearMac(mac) {
    const limpia = (mac || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    if (limpia.length !== 12) return mac;
    return limpia.match(/.{1,2}/g).join(':');
  }

  /**
   * Determina si una cadena dada corresponde a un formato de dirección MAC válido.
   *
   * @param {string} cadena
   * @returns {boolean}
   */
  static esMacValida(cadena) {
    if (!cadena || typeof cadena !== 'string') return false;
    const limpia = cadena.replace(/[^0-9a-fA-F]/g, '');
    return limpia.length === 12;
  }

  /**
   * Emite el Magic Packet a las direcciones de difusión configuradas.
   *
   * @param {string} mac Dirección MAC física del host
   * @param {Object} [opciones] Opciones de envío por llamada
   * @param {string[]} [opciones.addresses] Sobrescribe las IPs de difusión
   * @param {number[]} [opciones.ports] Sobrescribe los puertos de difusión
   * @returns {Promise<{ success: boolean, mac: string, bytes: number, destinos: string[], salida: string }>}
   */
  async enviarMagicPacket(mac, opciones = {}) {
    const packet = WakeOnLanAdapter.crearMagicPacket(mac);
    const macFormateada = WakeOnLanAdapter.formatearMac(mac);

    const addresses = (opciones.addresses && opciones.addresses.length > 0)
      ? opciones.addresses
      : this.broadcastAddresses;

    const ports = (opciones.ports && opciones.ports.length > 0)
      ? opciones.ports
      : this.ports;

    const destinos = [];
    for (const addr of addresses) {
      for (const p of ports) {
        destinos.push({ address: addr, port: p });
      }
    }

    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

      socket.on('error', (err) => {
        console.error('[!] [WakeOnLanAdapter] Error en socket UDP:', err.message);
        try { socket.close(); } catch (_) {}
        reject(err);
      });

      socket.bind(() => {
        try {
          socket.setBroadcast(true);
        } catch (err) {
          console.warn('[!] [WakeOnLanAdapter] No se pudo activar SO_BROADCAST:', err.message);
        }

        const envios = destinos.map(({ address, port }) => {
          return new Promise((resEnvio) => {
            socket.send(packet, 0, packet.length, port, address, (err) => {
              if (err) {
                console.warn(`[-] [WakeOnLanAdapter] Error enviando a ${address}:${port} -> ${err.message}`);
                resEnvio({ address, port, success: false, error: err.message });
              } else {
                resEnvio({ address, port, success: true });
              }
            });
          });
        });

        Promise.all(envios)
          .then((resultados) => {
            try { socket.close(); } catch (_) {}
            const exitosos = resultados.filter(r => r.success);
            const total = resultados.length;

            if (exitosos.length === 0) {
              const msg = `Fallo al emitir Magic Packet a todos los destinos (${total} intentados).`;
              console.error(`[-] [WakeOnLanAdapter] ${msg}`);
              resolve({
                success: false,
                mac: macFormateada,
                salida: msg,
                detalles: resultados
              });
            } else {
              const msg = `Magic Packet WoL emitido con éxito hacia ${macFormateada} (${exitosos.length}/${total} destinos alcanzados).`;
              console.log(`[+] [WakeOnLanAdapter] ${msg}`);
              resolve({
                success: true,
                mac: macFormateada,
                bytes: packet.length,
                salida: msg,
                destinos: exitosos.map(e => `${e.address}:${e.port}`)
              });
            }
          })
          .catch((err) => {
            try { socket.close(); } catch (_) {}
            reject(err);
          });
      });
    });
  }
}

module.exports = WakeOnLanAdapter;
