class ClassifierService {
  evaluate(conn = 0, ip = '', linkAlive = true, pwr = null, amtProvisioned = true) {
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
        telemetria: { os_online: true, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt, pwr }
      };
    }

    // Escenario 1 (Variante sin Intel AMT aprovisionado):
    // Si el PC tiene agente en línea y no dispone de AMT aprovisionado (state !== 2)
    if (rawOsOnline && !amtOnline && !amtProvisioned) {
      return {
        estado: 'VERDE',
        categoria: 'OPERATIVO',
        diagnostico: 'Puesto operativo (MeshAgent activo, sin Intel AMT aprovisionado)',
        accion: 'none',
        telemetria: { os_online: true, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, pwr }
      };
    }

    // Escenario 2 / Apagado / Corte: Agente caído con AMT activo en MeshCentral
    if (!rawOsOnline && amtOnline) {
      // Si la placa base está físicamente apagada (ACPI S5 / Soft-Off):
      if (pwr === 0) {
        return {
          estado: 'GRIS',
          categoria: 'APAGADO',
          diagnostico: `Equipo apagado (S5 / Soft-Off). Cable conectado y gestión Intel AMT ${amtType} en standby.`,
          accion: 'encender_remoto',
          telemetria: { os_online: false, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt, pwr: 0 }
        };
      }

      // Si la placa está encendida pero no responde al ping (cable físico desconectado):
      if (!linkAlive) {
        return {
          estado: 'NARANJA',
          categoria: 'DESCONECTADO_O_AISLADO',
          diagnostico: 'Desconexión física detectada (sin respuesta de enlace en el cable; socket AMT de MeshCentral en espera de cierre).',
          accion: 'inspeccion_fisica',
          telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, cable_unplugged: true, pwr }
        };
      }

      // Si la placa está encendida y responde al ping (cable conectado pero SO mudo):
      return {
        estado: 'AMARILLO',
        categoria: 'FALLO_LOGICO',
        diagnostico: `Fallo lógico. Cable de red conectado (Intel AMT ${amtType} activo), pero agente del SO caído (posible fallo DHCP).`,
        accion: 'remediar_dhcp',
        telemetria: { os_online: false, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt, pwr }
      };
    }

    // Escenario 3 (Subcaso corte abrupto en máquina con AMT aprovisionado):
    if (rawOsOnline && !amtOnline && amtProvisioned) {
      return {
        estado: 'NARANJA',
        categoria: 'DESCONECTADO_O_AISLADO',
        diagnostico: 'Desconexión física abrupta detectada (enlace AMT caído; socket del SO en espera de timeout de MeshCentral).',
        accion: 'inspeccion_fisica',
        telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, socket_zombie: true, pwr }
      };
    }

    // Escenario 3: Ambos completamente desconectados (conn === 0)
    return {
      estado: 'NARANJA',
      categoria: 'DESCONECTADO_O_AISLADO',
      diagnostico: 'Sin comunicación. Cable desconectado o puesto en red aislada.',
      accion: 'inspeccion_fisica',
      telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, pwr }
    };
  }
}

module.exports = ClassifierService;