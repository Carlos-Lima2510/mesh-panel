# OpSys - Modelo del dominio

## Información del artefacto
* **Proyecto:** OpSys - Plataforma de Supervisión y Configuración de un Laboratorio Docente Compartido 
* **Fase RUP:** Inicio (Inception)
* **Versión:** 1.1
* **Fecha:** 2026-11-10
* **Autor:** Equipo de desarrollo

---

## 1. Diagrama de Clases

Modela las entidades conceptuales del laboratorio docente, asegurando puestos físicos fijos, desacoplamiento de red en desconexión y navegación transitiva `Laboratorio -> Puesto -> Host`.

<div align="center">
  <img src="../../images/00-modelo-del-dominio/diagrama-clases.svg" alt="Diagrama de Clases" />
  <p><em>Fuente: <a href="diagrama-clases.puml">diagrama-clases.puml</a></em></p>
</div>

---

## 2. Diagrama de Objetos

Instancia canónica 1:1 que valida el modelo con exactamente un objeto por clase, reflejando valores representativos de los atributos del sistema.

<div align="center">
  <img src="../../images/00-modelo-del-dominio/diagrama-objetos.svg" alt="Diagrama de Objetos" />
  <p><em>Fuente: <a href="diagrama-objetos.puml">diagrama-objetos.puml</a></em></p>
</div>

---

## 3. Diagrama de Estados del Host

Modela el ciclo de vida telemático del equipo informático, estructurado bajo el superestado `Conectado a Red Docente` para evitar solapamiento de transiciones físicas y lógicas.

<div align="center">
  <img src="../../images/00-modelo-del-dominio/diagrama-estados/diagrama-estados-host.svg" alt="Diagrama de Estados del Host" />
  <p><em>Fuente: <a href="diagrama-estados/diagrama-estados-host.puml">diagrama-estados/diagrama-estados-host.puml</a></em></p>
</div>

---

## 4. Diagrama de Estados del Laboratorio

Modela la alternancia del contexto operativo del aula entre sesión ordinaria (`ModoClase`) y sesión de redes en switch secundario (`ModoPractica`).

<div align="center">
  <img src="../../images/00-modelo-del-dominio/diagrama-estados/diagrama-estados-laboratorio.svg" alt="Diagrama de Estados del Laboratorio" />
  <p><em>Fuente: <a href="diagrama-estados/diagrama-estados-laboratorio.puml">diagrama-estados/diagrama-estados-laboratorio.puml</a></em></p>
</div>

---

## 5. Decisiones Arquitectónicas y de Dominio (ADR)

* **[ADR-001: Justificación y Acotamiento de Acciones, Trazabilidad y Rol Administrador](../../docs/adr/ADR-001-acotamiento-acciones-trazabilidad.md)**: Justificación del acotamiento del rol Administrador, la retirada de la clase Acción y el patrón transaccional alternativo para auditoría.
* **[ADR-002: Acotamiento de Control de Energía (WoL vs. Apagado), Realidad Hardware Dell y Justificación Científica](../../docs/adr/ADR-002-acotamiento-control-energia-hardware.md)**: Justificación técnico-científica del retiro de apagado remoto por limitación física de hardware Dell OptiPlex (sin Intel AMT), asimetría de red y bifurcación de encendido.
* **[ADR-003: Arquitectura de Remediación de Red (GPO Startup con Rollback vs. Bajo Demanda) y Exclusión del Switch](../../docs/adr/ADR-003-arquitectura-remediacion-gpo-exclusion-switch.md)**: Justificación de la inviabilidad de remediación remota bajo demanda por destino compartido (*fate sharing*), el descarte de scripts de apagado ante apagados forzados en torre, la adopción del script de inicio con rollback transaccional para proteger prácticas de alumnos, y la exclusión definitiva del `Switch` del dominio.
* **[Matriz Documental General del Proyecto](../../docs/matriz-documental-general.md)**: Marco general de revisión sistemática y base documental de literatura técnica (2016-2026).
  * **[Matriz Específica: Control de Energía y Apagado](../../docs/matrices-documentales/matriz-referencias-apagado.md)**: Evaluación sistemática de literatura sobre mecanismos de control energético con agente, fuera de banda y sin agente.
  * **[Matriz Específica: Plataforma Microsoft y Windows Internals](../../docs/matrices-documentales/matriz-referencias-plataforma-microsoft.md)**: Evaluación de diagnósticos DHCP y comportamiento de WoL / Fast Startup en Windows 10/11.
  * **[Dossier Técnico: Plataforma Microsoft Learn](../../docs/doc/DOC-01-microsoft-windows-internals-dhcp-wol.md)**: Análisis técnico exhaustivo de eventos del sistema, comandos PowerShell y gestión de energía NDIS.
