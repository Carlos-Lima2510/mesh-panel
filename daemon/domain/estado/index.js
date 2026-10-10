const Estado = require('./Estado');
const EstadoOperativo = require('./EstadoOperativo');
const EstadoStandby = require('./EstadoStandby');
const EstadoFalloLogico = require('./EstadoFalloLogico');
const EstadoRedAislada = require('./EstadoRedAislada');
const EstadoDesconectado = require('./EstadoDesconectado');
const EvaluadorEstado = require('./EvaluadorEstado');

module.exports = {
  Estado,
  EstadoOperativo,
  EstadoStandby,
  EstadoFalloLogico,
  EstadoRedAislada,
  EstadoDesconectado,
  EvaluadorEstado
};
