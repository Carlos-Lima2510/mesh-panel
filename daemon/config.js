module.exports = {
  mesh: {
    url: process.env.MESH_URL || 'wss://127.0.0.1:443/',
    user: process.env.MESH_USER || 'Carlos',
    pass: process.env.MESH_PASS || 'Cfal25100@09',
  },
  network: {
    dhcpSubnet: process.env.DHCP_SUBNET || '192.168.122.',
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    heartbeatIntervalMs: 25000,
    reconnectDelayMs: 5000,
  },
  switch: {
    mode: process.env.SWITCH_MODE || 'snmp',
    host: process.env.SWITCH_HOST || 'virtual-switch:1616',
    community: process.env.SWITCH_COMMUNITY || 'public',
  }
};