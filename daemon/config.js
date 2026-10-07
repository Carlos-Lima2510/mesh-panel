module.exports = {
  meshUrl: process.env.MESH_URL || 'wss://127.0.0.1:443/',
  meshUser: process.env.MESH_USER || 'Carlos',
  meshPass: process.env.MESH_PASS || 'Cfal25100@09',

  port: parseInt(process.env.PORT, 10) || 3001,

  switchMode: process.env.SWITCH_MODE || 'snmp',

  switchHost: process.env.SWITCH_HOST || 'virtual-switch:1616',
  switchCommunity: process.env.SWITCH_COMMUNITY || 'public'
};