const assert = require('assert');
const SnmpSwitchProvider = require('../daemon/infrastructure/network/SnmpSwitchProvider');

async function testSnmpSwitchProvider() {
  console.log('[*] Iniciando pruebas unitarias de SnmpSwitchProvider (net-snmp)...');

  // Test 1: Instanciación y parsing de host:puerto
  const provider1 = new SnmpSwitchProvider({ host: 'virtual-switch:1616', community: 'public' });
  assert.strictEqual(provider1.host, 'virtual-switch:1616');
  assert.strictEqual(provider1.community, 'public');

  const provider2 = new SnmpSwitchProvider({ host: '10.20.0.1', community: 'secret' });
  assert.strictEqual(provider2.host, '10.20.0.1');

  // Test 2: Fallback cuando no hay conexión (ej. host inalcanzable con timeout)
  const providerTimeout = new SnmpSwitchProvider({ host: '127.0.0.1:19999', community: 'public' });
  const estadoBocaFallback = await providerTimeout.obtenerEstadoBoca('port3');
  assert.deepStrictEqual(estadoBocaFallback, {
    port: 3,
    portName: 'port3',
    link: 'UP',
    speed: 1000,
    source: 'snmp_fallback'
  });

  const todosPuertosFallback = await providerTimeout.obtenerTodosLosPuertos();
  assert.deepStrictEqual(todosPuertosFallback, {});
  providerTimeout._cerrarSesion();

  // Test 3: Mapeo de bocas y estados con simulación interna de _consultarSubtree
  const providerMock = new SnmpSwitchProvider({ host: 'dummy-switch:161', community: 'public' });

  // Simular respuestas de net-snmp
  providerMock._consultarSubtree = async (oid) => {
    if (oid === '1.3.6.1.2.1.2.2.1.2') {
      // ifDescr: port1 (UP), port2 (DOWN), eth0 (ignorado)
      return {
        error: null,
        varbinds: [
          { oid: '1.3.6.1.2.1.2.2.1.2.1', value: Buffer.from('port1') },
          { oid: '1.3.6.1.2.1.2.2.1.2.2', value: Buffer.from('port2') },
          { oid: '1.3.6.1.2.1.2.2.1.2.3', value: Buffer.from('eth0') } // Debe ser ignorado por no empezar por 'port'
        ]
      };
    }
    if (oid === '1.3.6.1.2.1.2.2.1.8') {
      // ifOperStatus: 1 = UP, 2 = DOWN
      return {
        error: null,
        varbinds: [
          { oid: '1.3.6.1.2.1.2.2.1.8.1', value: 1 },
          { oid: '1.3.6.1.2.1.2.2.1.8.2', value: 2 },
          { oid: '1.3.6.1.2.1.2.2.1.8.3', value: 1 }
        ]
      };
    }
    return { error: new Error('OID desconocido'), varbinds: [] };
  };

  const todos = await providerMock.obtenerTodosLosPuertos();
  assert.strictEqual(Object.keys(todos).length, 2, 'Debe procesar solo port1 y port2');

  assert.deepStrictEqual(todos['port1'], {
    port: 1,
    portName: 'port1',
    link: 'UP',
    speed: 1000,
    source: 'snmp_real'
  });

  assert.deepStrictEqual(todos['port2'], {
    port: 2,
    portName: 'port2',
    link: 'DOWN',
    speed: 0,
    source: 'snmp_real'
  });

  const estadoPort1 = await providerMock.obtenerEstadoBoca('port1');
  assert.strictEqual(estadoPort1.link, 'UP');
  assert.strictEqual(estadoPort1.speed, 1000);

  const estadoPort2 = await providerMock.obtenerEstadoBoca('port2');
  assert.strictEqual(estadoPort2.link, 'DOWN');
  assert.strictEqual(estadoPort2.speed, 0);

  // Test 4: Comprobación de caché (dentro de los 3000 ms no vuelve a consultar)
  let consultasSubtree = 0;
  providerMock._consultarSubtree = async () => {
    consultasSubtree++;
    return { error: null, varbinds: [] };
  };

  await providerMock.obtenerTodosLosPuertos();
  assert.strictEqual(consultasSubtree, 0, 'No debe consultar _consultarSubtree si la caché es reciente');

  console.log('✔ Todas las pruebas de SnmpSwitchProvider pasaron con éxito.');
}

testSnmpSwitchProvider().catch((err) => {
  console.error('✘ Error en prueba:', err);
  process.exit(1);
});
