<div align=right>

<sub>[Al inicio](/README.md) / [Modelo del dominio](/RUP/00-modelo-del-dominio/README.md) / [Requisitos](/RUP/01-requisitos/README.md) / Análisis / Diseño / Desarrollo</sub><br><sub>OpSys -- Plataforma de supervisión y observabilidad en tiempo real de puestos de trabajo en laboratorios docentes compartidos.</sub>

</div>

# OpSys - Requisitos del Sistema y Casos de Uso

## Información de la fase
* **Proyecto:** OpSys - Plataforma de Supervisión y Configuración de un Laboratorio Docente Compartido
* **Fase RUP:** Requisitos / Casos de Uso
* **Versión:** 1.0
* **Fecha:** 2026-11-17
* **Autor:** Equipo de desarrollo

---

## 1. Organización de la Fase de Requisitos

La disciplina de Requisitos se divide en dos niveles complementarios de modelado y documentación:

```text
RUP/01-requisitos/
├── 00-actores-casos-uso/          # Modelo global de actores, catálogo de CUs y navegación
│   ├── README.md                  # Documento concentrador de actores y contexto
│   ├── actoresCasosUsoAdmin.puml  # Diagrama de Actores y Casos de Uso
│   └── diagrama-de-contexto.puml  # Diagrama de Contexto de la interfaz
└── 01-detalle-casos-uso/          # Fichas detalladas y prototipos por caso de uso
    └── consultarEstadoPuestos/    # Ficha, especificación formal y wireframe
```

---

## 2. Caminos Principales

### [00 - Actores, Catálogo y Diagrama de Contexto](00-actores-casos-uso/README.md)
* **Contenido:**
  * Identificación y caracterización estricta de actores (`UsuarioNoLogueado` y `Administrador`), excluyendo sistemas externos según la frontera del sistema.
  * Catálogo consolidado de los **8 casos de uso** del sistema organizados por áreas funcionales.
  * Diagrama de Contexto de la interfaz de usuario (`SESION_CERRADA`, `SISTEMA_DISPONIBLE`, `PUESTO_ABIERTO`).
  * Matriz de trazabilidad con decisiones arquitectónicas (**ADR-001**, **ADR-002**, **ADR-004**).
* 👉 **[Acceder al Modelo de Actores y Diagrama de Contexto](00-actores-casos-uso/README.md)**

---

### [01 - Detalle y Prototipado de Casos de Uso](01-detalle-casos-uso/README.md)
* **Contenido:**
  * Especificación formal paso a paso mediante diagramas de estados (gramática estricta de interacción Actor-Sistema con nodos `<<choice>>`).
  * Prototipos navegables de interfaz de usuario diseñados en PlantUML Salt.
  * Fichas descriptivas normalizadas con atributos, objetivos, pre/postcondiciones y referencias.
  * Tabla de seguimiento del estado de detallado de los 8 casos de uso.
* 👉 **[Acceder al Detalle de Casos de Uso y Prototipos](01-detalle-casos-uso/README.md)**
