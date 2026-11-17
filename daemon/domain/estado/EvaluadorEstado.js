const EstadoOperativo = require('./EstadoOperativo');
const EstadoStandby = require('./EstadoStandby');
const EstadoFalloLogico = require('./EstadoFalloLogico');
const EstadoRedAislada = require('./EstadoRedAislada');
const EstadoDesconectado = require('./EstadoDesconectado');

class EvaluadorEstado {
  static evaluar({
    enlaceFisico,
    osOnline,
    amtOnline = false,
    pwr = null,
    red = null,
    modoLaboratorio = 'CLASE',
    switchAsignado = null,
    puesto = null
  }) {
    const sw = switchAsignado || (puesto && puesto.obtenerSwitch ? puesto.obtenerSwitch() : null);

    // Si el puesto tiene un switch asignado expresamente, su política prima sobre el modo global
    const esperaAislado = sw
      ? !sw.esperaMeshCentral()
      : (puesto && puesto.esperaEstarAislado ? puesto.esperaEstarAislado() : (modoLaboratorio === 'PRACTICA'));

    if (enlaceFisico.link === 'DOWN') {
      if (esperaAislado) {
        const detalle = sw ? ` en ${sw.nombre}` : ' (Modo Práctica activo)';
        return new EstadoRedAislada(`Puesto en Red Aislada${detalle}; cable conectado al switch de prácticas.`);
      }
      return new EstadoDesconectado(
        `Cable desconectado físicamente (Puerto ${enlaceFisico.port} en estado DOWN en el switch principal).`
      );
    }

    if (osOnline) {
      return new EstadoOperativo();
    }

    const apagadoPorMesh = amtOnline && pwr !== null && pwr !== 1;
    const apagadoPorSwitch = enlaceFisico.link === 'UP' && enlaceFisico.speed <= 100;

    if (apagadoPorMesh || apagadoPorSwitch) {
      return new EstadoStandby(enlaceFisico.port, enlaceFisico.speed);
    }

    if (enlaceFisico.link === 'UP' && enlaceFisico.speed >= 1000) {
      if (esperaAislado || (red && red.esAislada)) {
        const nombreRed = red ? red.nombre : (sw ? sw.nombre : 'Red Aislada');
        return new EstadoRedAislada(
          `Puesto en ${nombreRed}. Cable a 1 Gbps pero en segmento aislado sin salida a MeshCentral.`
        );
      }
      const nombreRed = red ? ' en ' + red.nombre : '';
      return new EstadoFalloLogico(
        `Fallo lógico o DHCP${nombreRed}. Cable a 1 Gbps pero el agente no conecta con MeshCentral.`
      );
    }

    return new EstadoDesconectado('Sin comunicación. Cable desconectado o puesto sin red.');
  }
}

module.exports = EvaluadorEstado;
