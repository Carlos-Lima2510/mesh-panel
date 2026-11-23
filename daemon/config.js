module.exports = {
  meshUrl: process.env.MESH_URL,
  meshUser: process.env.MESH_USER,
  meshPass: process.env.MESH_PASS,

  port: parseInt(process.env.PORT, 10) || 3001,

  switchMode: process.env.SWITCH_MODE || 'snmp',

  switchHost: process.env.SWITCH_HOST || '10.10.136.13',
  switchCommunity: process.env.SWITCH_COMMUNITY || 'public',

  snmpVersion: process.env.SNMP_VERSION ? parseInt(process.env.SNMP_VERSION, 10) : 3,
  snmpUser: process.env.SNMP_USER,
  snmpAuthKey: process.env.SNMP_AUTH_KEY,
  snmpAuthProto: (process.env.SNMP_AUTH_PROTO || 'sha').toLowerCase(),
  snmpPrivKey: process.env.SNMP_PRIV_KEY,
  snmpPrivProto: (process.env.SNMP_PRIV_PROTO || 'aes').toLowerCase(),

  dhcpSubnet: process.env.DHCP_SUBNET || '192.168.122.',
  excluirSubnet: process.env.EXCLUIR_SUBNET || '172.22.',

  // Modo pre-despliegue / verificación física de cableado
  modoDespliegue: process.env.MODO_DESPLIEGUE === 'true' || process.env.MODO_DESPLIEGUE === 'cableado',

  snmpSwitches: (process.env.SNMP_SWITCHES || '10.10.136.13,10.10.136.42,10.10.136.39')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),

  wolBroadcastAddresses: (process.env.WOL_BROADCAST_ADDRESSES || '255.255.255.255,172.22.255.255,192.168.122.255')
    .split(',')
    .map(a => a.trim())
    .filter(Boolean)
};
