class ClassifierService {
  /**
   * Clasifica el puesto basándose en los bits de 'conn' según los 3 escenarios:
   *
   * Definición de bits de MeshCentral:
   * - Bit 0 (1): MeshAgent (SO) conectado
   * - Bit 1 (2): Intel AMT CIRA conectado
   * - Bit 2 (4): Intel AMT local conectado
   * - Bit 3 (8): Intel AMT Relay conectado
   *
   * Parámetro 'linkAlive':
   * Discrimina de forma instantánea cuando conn = 4 (Agente OFF + AMT ON).
   * - Si linkAlive es false: El cable físico fue arrancado (AMT no contesta a nivel de red,
   *   y su conexión en MeshCentral solo está esperando el timeout de CIRA/WSMAN de 30-45s).
   *   Se clasifica de inmediato como NARANJA (evitando el parpadeo transitorio en AMARILLO).
   * - Si linkAlive es true: El cable sigue conectado y AMT responde activamente en hardware,
   *   pero el SO está incomunicado -> AMARILLO confirmado (Fallo Lógico DHCP).
   */
  evaluate(conn = 0, ip = '', linkAlive = true) {
    const connInt = parseInt(conn, 10) || 0;
    const rawOsOnline = (connInt & 1) !== 0;     // Bit 0 (1): MeshAgent
    const amtCira = (connInt & 2) !== 0;         // Bit 1 (2): Intel AMT CIRA
    const amtLocal = (connInt & 4) !== 0;        // Bit 2 (4): Intel AMT Local
    const amtRelay = (connInt & 8) !== 0;        // Bit 3 (8): Intel AMT Relay
    const amtOnline = amtCira || amtLocal || amtRelay; // AMT activo

    let amtType = 'none';
    if (amtLocal) amtType = 'local';
    else if (amtCira) amtType = 'cira';
    else if (amtRelay) amtType = 'relay';

    // Escenario 1: Operativo (Agente y AMT ambos en línea)
    if (rawOsOnline && amtOnline) {
      return {
        estado: 'VERDE',
        categoria: 'OPERATIVO',
        diagnostico: `Puesto 100% operativo (MeshAgent + Intel AMT ${amtType})`,
        accion: 'none',
        telemetria: { os_online: true, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt }
      };
    }

    // Escenario 2 o Escenario 3: Agente caído con AMT aparentemente vivo en MeshCentral
    if (!rawOsOnline && amtOnline) {
      // Si la comprobación de enlace físico demuestra que el cable fue arrancado:
      if (!linkAlive) {
        return {
          estado: 'NARANJA',
          categoria: 'DESCONECTADO_O_AISLADO',
          diagnostico: 'Desconexión física detectada (sin respuesta de enlace en el cable; socket AMT de MeshCentral en espera de cierre).',
          accion: 'inspeccion_fisica',
          telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, cable_unplugged: true }
        };
      }

      // Si el enlace físico responde (cable conectado y AMT activo en hardware):
      return {
        estado: 'AMARILLO',
        categoria: 'FALLO_LOGICO',
        diagnostico: `Fallo lógico. Cable de red conectado (Intel AMT ${amtType} activo), pero agente del SO caído (posible fallo DHCP).`,
        accion: 'remediar_dhcp',
        telemetria: { os_online: false, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt }
      };
    }

    // Escenario 3 (Subcaso corte abrupto donde AMT cayó antes que el agente: conn === 1)
    if (rawOsOnline && !amtOnline) {
      return {
        estado: 'NARANJA',
        categoria: 'DESCONECTADO_O_AISLADO',
        diagnostico: 'Desconexión física abrupta detectada (enlace AMT caído; socket del SO en espera de timeout de MeshCentral).',
        accion: 'inspeccion_fisica',
        telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, socket_zombie: true }
      };
    }

    // Escenario 3: Ambos completamente desconectados (conn === 0)
    return {
      estado: 'NARANJA',
      categoria: 'DESCONECTADO_O_AISLADO',
      diagnostico: 'Sin comunicación. Cable desconectado o puesto en red aislada.',
      accion: 'inspeccion_fisica',
      telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt }
    };
  }
}

module.exports = ClassifierService;