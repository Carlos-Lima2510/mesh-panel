class ClassifierService {
  evaluate(conn = 0, ip = '', linkAlive = true, pwr = null, amtProvisioned = true, switchPort = null) {
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

    // 1. Equipos con Agente y AMT activos
    if (rawOsOnline && amtOnline) {
      return {
        estado: 'VERDE',
        categoria: 'OPERATIVO',
        diagnostico: `Puesto 100% operativo (MeshAgent + Intel AMT ${amtType})`,
        accion: 'none',
        telemetria: { os_online: true, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt, pwr, switch: switchPort }
      };
    }

    // 2. Equipos sin AMT pero con Agente activo (ej. Dell 631-ADPL encendidos)
    if (rawOsOnline && !amtOnline && !amtProvisioned) {
      return {
        estado: 'VERDE',
        categoria: 'OPERATIVO',
        diagnostico: 'Puesto operativo (MeshAgent activo, sin Intel AMT aprovisionado)',
        accion: 'none',
        telemetria: { os_online: true, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, pwr, switch: switchPort }
      };
    }

    // 3. Equipos con AMT activo pero Agente caído
    if (!rawOsOnline && amtOnline) {
      // A) Si el switch reporta que la boca física está DOWN, prima el corte de cable físico
      if (switchPort && switchPort.link === 'DOWN') {
        return {
          estado: 'NARANJA',
          categoria: 'DESCONECTADO_O_AISLADO',
          diagnostico: `Desconexión física confirmada por el switch (Puerto ${switchPort.port} en estado DOWN; socket AMT en espera de cierre).`,
          accion: 'inspeccion_fisica',
          telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, cable_unplugged: true, pwr, switch: switchPort }
        };
      }

      // B) Si la placa base está físicamente apagada en modo Soft-Off / Standby (pwr !== 1, ej. pwr = 6, 8 o 0):
      if (pwr !== 1 && pwr !== null && pwr !== undefined) {
        return {
          estado: 'GRIS',
          categoria: 'APAGADO',
          diagnostico: `Equipo apagado (Soft-Off / Standby). Cable conectado y gestión Intel AMT ${amtType} en standby.`,
          accion: 'encender_remoto',
          telemetria: { os_online: false, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt, pwr, switch: switchPort }
        };
      }

      // C) Si el cable no responde a sondeo físico (cable desconectado sin confirmación de switch):
      if (!linkAlive) {
        return {
          estado: 'NARANJA',
          categoria: 'DESCONECTADO_O_AISLADO',
          diagnostico: 'Desconexión física detectada (sin respuesta de enlace en el cable; socket AMT de MeshCentral en espera de cierre).',
          accion: 'inspeccion_fisica',
          telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, cable_unplugged: true, pwr, switch: switchPort }
        };
      }

      // D) La placa base SÍ está encendida (pwr === 1), pero el agente no conecta: Fallo Lógico o Red Aislada
      if (linkAlive && ip) {
        return {
          estado: 'AMARILLO',
          categoria: 'RED_AISLADA',
          diagnostico: `Red aislada / Fallo de salida. Cable conectado (Intel AMT ${amtType} activo) y responde ping en LAN local, pero sin conexión a MeshCentral.`,
          accion: 'verificar_enrutamiento',
          telemetria: { os_online: false, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt, pwr, switch: switchPort }
        };
      }

      return {
        estado: 'AMARILLO',
        categoria: 'FALLO_LOGICO',
        diagnostico: `Fallo lógico. Cable de red conectado (Intel AMT ${amtType} activo), pero agente del SO caído (posible fallo DHCP).`,
        accion: 'remediar_dhcp',
        telemetria: { os_online: false, amt_online: true, amt_type: amtType, ip_reportada: ip, conn: connInt, pwr, switch: switchPort }
      };
    }

    // 4. Agente supuestamente vivo pero AMT caído en máquina con AMT (Corte abrupto / socket zombie)
    if (rawOsOnline && !amtOnline && amtProvisioned) {
      return {
        estado: 'NARANJA',
        categoria: 'DESCONECTADO_O_AISLADO',
        diagnostico: 'Desconexión física abrupta detectada (enlace AMT caído; socket del SO en espera de timeout de MeshCentral).',
        accion: 'inspeccion_fisica',
        telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, socket_zombie: true, pwr, switch: switchPort }
      };
    }

    // 5. Equipos sin comunicación (conn = 0 o sin AMT): Desambiguación mediante Telemetría de Switch
    if (switchPort) {
      if (switchPort.link === 'DOWN') {
        return {
          estado: 'NARANJA',
          categoria: 'DESCONECTADO_O_AISLADO',
          diagnostico: `Desconexión física confirmada por el switch (Puerto ${switchPort.port} en estado DOWN).`,
          accion: 'inspeccion_fisica',
          telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, cable_unplugged: true, pwr, switch: switchPort }
        };
      }

      // Enlace a 10 Mbps o 100 Mbps: Standby de Wake-on-LAN (Equipo apagado con cable)
      if (switchPort.link === 'UP' && switchPort.speed <= 100) {
        return {
          estado: 'GRIS',
          categoria: 'APAGADO',
          diagnostico: `Equipo apagado (Soft-Off / Standby). Cable conectado físicamente al switch (Puerto ${switchPort.port} a ${switchPort.speed} Mbps; modo WoL activo).`,
          accion: 'encender_remoto_wol',
          telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, pwr, switch: switchPort }
        };
      }

      // Enlace a 1 Gbps: PC encendido con cable, pero agente de MeshCentral no responde
      if (switchPort.link === 'UP' && switchPort.speed >= 1000) {
        if (linkAlive) {
          return {
            estado: 'AMARILLO',
            categoria: 'RED_AISLADA',
            diagnostico: `Red aislada / Fallo de salida. Cable conectado (Puerto ${switchPort.port} a ${switchPort.speed} Mbps) y responde ping en LAN local, pero sin conexión al servidor MeshCentral.`,
            accion: 'verificar_enrutamiento',
            telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, pwr, switch: switchPort }
          };
        } else {
          return {
            estado: 'AMARILLO',
            categoria: 'FALLO_LOGICO',
            diagnostico: `Fallo lógico / DHCP. Cable conectado físicamente (Puerto ${switchPort.port} a ${switchPort.speed} Mbps), pero el SO no tiene red lógica o el agente está caído.`,
            accion: 'remediar_dhcp',
            telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, pwr, switch: switchPort }
          };
        }
      }
    }

    // Fallback general sin datos de switch
    return {
      estado: 'NARANJA',
      categoria: 'DESCONECTADO_O_AISLADO',
      diagnostico: 'Sin comunicación. Cable desconectado o puesto en red aislada.',
      accion: 'inspeccion_fisica',
      telemetria: { os_online: false, amt_online: false, amt_type: 'none', ip_reportada: ip, conn: connInt, pwr, switch: switchPort }
    };
  }
}

module.exports = ClassifierService;