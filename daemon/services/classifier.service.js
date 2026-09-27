class ClassifierService {
  constructor(dhcpSubnet) {
    this.dhcpSubnet = dhcpSubnet;
  }

  evaluate(conn = 0, ip = '') {
    const osOnline = (conn & 1) !== 0;   // Bit 0: MeshAgent
    const amtOnline = (conn & 2) !== 0;  // Bit 1: Intel AMT
    const isDhcpValid = typeof ip === 'string' && ip.startsWith(this.dhcpSubnet);

    if (osOnline && isDhcpValid) {
      return {
        estado: 'VERDE',
        categoria: 'OPERATIVO',
        diagnostico: amtOnline
          ? 'Puesto 100% operativo (MeshAgent + Intel AMT)'
          : 'Puesto operativo (MeshAgent activo)',
        accion: 'none',
        telemetria: { os_online: true, amt_online: amtOnline, ip_reportada: ip, conn }
      };
    }

    if (amtOnline && (!osOnline || !isDhcpValid)) {
      return {
        estado: 'AMARILLO',
        categoria: 'FALLO_LOGICO',
        diagnostico: 'Fallo lógico. Hardware enlazado pero SO sin red corporativa.',
        accion: 'remediar_dhcp',
        telemetria: { os_online: false, amt_online: true, ip_reportada: ip, conn }
      };
    }

    return {
      estado: 'NARANJA',
      categoria: 'DESCONECTADO_O_AISLADO',
      diagnostico: 'Sin comunicación con el puesto. Revisar cable de red o alimentación.',
      accion: 'inspeccion_fisica',
      telemetria: { os_online: false, amt_online: false, ip_reportada: ip, conn }
    };
  }
}

module.exports = ClassifierService;