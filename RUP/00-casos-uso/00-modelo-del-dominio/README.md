# OpSys - Modelo del dominio

## Información del artefacto
* **Proyecto:** OpSys - Plataforma de Supervisión y Configuración de un Laboratorio Docente Compartido 
* **Fase RUP:** Inicio (Inception)
* **Versión:** 1.0
* **Fecha:** 2026-10-12
* **Autor:** Equipo de desarrollo

---

## 1. Diagrama de Clases

Modela las entidades conceptuales del laboratorio docente, asegurando puestos físicos fijos, desacoplamiento de red en desconexión y navegación transitiva `Laboratorio -> Puesto -> Host`.

<div align="center">
  <img src="../../../images/00-casos-uso/00-modelo-del-dominio/diagrama-clases.svg" alt="Diagrama de Clases" />
  <p><em>Fuente: <a href="diagrama-clases.puml">diagrama-clases.puml</a></em></p>
</div>

---

## 2. Diagrama de Objetos

Instancia canónica 1:1 que valida el modelo con exactamente un objeto por clase, reflejando valores representativos de los atributos del sistema.

<div align="center">
  <img src="../../../images/00-casos-uso/00-modelo-del-dominio/diagrama-objetos.svg" alt="Diagrama de Objetos" />
  <p><em>Fuente: <a href="diagrama-objetos.puml">diagrama-objetos.puml</a></em></p>
</div>

---

## 3. Diagrama de Estados del Host

Modela el ciclo de vida telemático del equipo informático, estructurado bajo el superestado `Conectado a Red Docente` para evitar solapamiento de transiciones físicas y lógicas.

<div align="center">
  <img src="../../../images/00-casos-uso/00-modelo-del-dominio/diagrama-estados/diagrama-estados-host.svg" alt="Diagrama de Estados del Host" />
  <p><em>Fuente: <a href="diagrama-estados/diagrama-estados-host.puml">diagrama-estados/diagrama-estados-host.puml</a></em></p>
</div>

---

## 4. Diagrama de Estados del Laboratorio

Modela la alternancia del contexto operativo del aula entre sesión ordinaria (`ModoClase`) y sesión de redes en switch secundario (`ModoPractica`).

<div align="center">
  <img src="../../../images/00-casos-uso/00-modelo-del-dominio/diagrama-estados/diagrama-estados-laboratorio.svg" alt="Diagrama de Estados del Laboratorio" />
  <p><em>Fuente: <a href="diagrama-estados/diagrama-estados-laboratorio.puml">diagrama-estados/diagrama-estados-laboratorio.puml</a></em></p>
</div>
