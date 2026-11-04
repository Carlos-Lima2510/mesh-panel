const EstadoOperativo = require('./EstadoOperativo');
const EstadoStandby = require('./EstadoStandby');
const EstadoFalloLogico = require('./EstadoFalloLogico');
const EstadoRedAislada = require('./EstadoRedAislada');
const EstadoDesconectado = require('./EstadoDesconectado');

class EvaluadorEstado {
  static evaluar({ enlaceFisico, osOnline, amtOnline = false, pwr = null, red = null, modoLaboratorio = 'CLASE' }) {
    if (enlaceFisico.link === 'DOWN') {
      if (modoLaboratorio === 'PRACTICA') {
        return new EstadoRedAislada('Puesto en Red Aislada (Modo Práctica activo; cable conectado al switch de prácticas).');
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
      if (red && red.esAislada) {
        return new EstadoRedAislada(
          `Puesto en ${red.nombre}. Cable a 1 Gbps pero en segmento aislado sin salida a MeshCentral.`
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
