class ClassifierService {
  /**
   * Clasifica el puesto basándose estrictamente en los bits de 'conn' según los 3 escenarios:
   *
   * Definición de bits de MeshCentral (GetConnectivityState / SetConnectivityState):
   * - Bit 0 (1): MeshAgent (SO) conectado
   * - Bit 1 (2): Intel AMT CIRA conectado
   * - Bit 2 (4): Intel AMT local conectado
   * - Bit 3 (8): Intel AMT Relay conectado
   *
   * Regla de correlación física del aula:
   * Todos los puestos disponen de Intel AMT activado por hardware en el puerto de red.
   * Si el cable está desconectado, Intel AMT pierde el enlace de inmediato (conn & 14 === 0).
   * Si MeshCentral aún reporta MeshAgent activo (conn & 1 !== 0), se trata de un "socket zombie"
   * transitorio fruto de la desconexión abrupta (MeshCentral tarda minutos en purgarlo).
   *
   * Escenario 1: Operativo (VERDE) -> Agente activo (conn & 1) y AMT activo (conn & 14)
   * Escenario 2: Fallo Lógico DHCP (AMARILLO) -> Cable conectado (AMT activo conn & 14), pero Agente caído !(conn & 1)
   * Escenario 3: Desconectado / Aislado (NARANJA) -> AMT inactivo (tanto conn === 0 como conn === 1 por corte abrupto)
   */
  evaluate(conn = 0, ip = '') {
    const connInt = parseInt(conn, 10) || 0;
    const rawOsOnline = (connInt & 1) !== 0;     // Bit 0 (1): MeshAgent reportado por MeshCentral
    const amtCira = (connInt & 2) !== 0;         // Bit 1 (2): Intel AMT CIRA
    const amtLocal = (connInt & 4) !== 0;        // Bit 2 (4): Intel AMT Local
    const amtRelay = (connInt & 8) !== 0;        // Bit 3 (8): Intel AMT Relay
    const amtOnline = amtCira || amtLocal || amtRelay; // AMT activo (cualquier modalidad)

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

    // Escenario 2: Fallo Lógico / DHCP (Cable conectado con AMT activo, pero Agente del SO desconectado)
    if (!rawOsOnline && amtOnline) {
      return {
        estado: 'AMARILLO',
        categoria: 'FALLO_LOGICO',
        diagnostico: `Fallo lógico. Cable de red conectado (Intel AMT ${amtType} activo), pero agente del SO caído (posible fallo DHCP).`,
        accion: 'remediar_dhcp',
        telemetria: { os_online: false, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt }
      };
    }

    // Escenario 3 (Subcaso corte abrupto): AMT cayó al perder el enlace físico, pero el agente sigue como socket zombie en MeshCentral
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