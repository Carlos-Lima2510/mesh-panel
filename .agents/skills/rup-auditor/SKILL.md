---
name: rup-auditor
description: >-
  Auditor de élite y experto metodológico en RUP (Rational Unified Process) para
  identificación, estructuración y especificación formal de Actores y Casos de Uso.
  Especializado en el estándar académico de Ingeniería del Software (IdSw / Masías),
  diagramas de especificación formal (Statecharts PlantUML con <<choice>>), diagramas de
  contexto de navegación, prototipado en PlantUML Salt y política de espejo SVG.
---

# Auditor RUP de Élite: Actores, Casos de Uso y Prototipos

Este manual y guía de auditoría consolida las directrices de la disciplina de Requisitos de **RUP**, el temario académico de **Ingeniería del Software (IdSw)** y los patrones de referencia de proyectos canónicos (**pyCeldaPublico**, **pySigHor**, **DocuTrace** y **pyTetris**).

---

## 1. El Núcleo Metodológico: La Rúbrica de Requisitos (30% - 40% - 30%)

Toda auditoría evalúa las tres dimensiones del proceso según la rúbrica oficial:

| Dimensión | Peso | Qué se evalúa |
| :--- | :---: | :--- |
| **1. Identificación y Estructura** | **30%** | Actores como roles, casos de uso bien nombrados (`verboEnInfinitivo()`), paquetes temáticos y relaciones (`<<include>>`, `<<extend>>` con condición y punto de extensión). |
| **2. Detalle y Especificación** | **40%** | Flujo principal (happy path), flujos alternativos y excepciones exhaustivas con `<<choice>>`, precondiciones, postcondiciones y prototipos Salt coherentes. |
| **3. Trazabilidad y Riesgo** | **30%** | Trazabilidad bidireccional con el Modelo del Dominio (MDD), coherencia con el Diagrama de Contexto y gestión de riesgos/precondiciones bloqueantes. |

### Factores de Ajuste Oficiales
* **(+1.0)** Excelente trazabilidad entre casos de uso y modelo del dominio.
* **(+1.0)** Documentación excepcionalmente clara, formal y enlaces relativos 100% funcionales.
* **(-1.0)** Inconsistencia entre diagramas (`.puml`) y especificaciones escritas (`README.md`).
* **(-1.0)** Mezcla de niveles de abstracción (introducir detalles de base de datos, consultas SQL o lógica interna de backend).
* **(-1.0)** Detalles prematuros de UI en la especificación formal (mencionar clics, ratón, botones específicos en vez de verbos abstractos).

---

## 2. Los Actores: Reglas y Distinciones Críticas

1. **Actores como Roles, no Personas:** Representan roles externos que interactúan directamente con el sistema (ej. `Administrador`, `Profesor`, `Docente`).
2. **Separación de Estados de Autenticación:**
   * `UsuarioNoLogueado` es quien invoca `iniciarSesion()`.
   * El actor autenticado (ej. `Admin` o `Profesor`) **nunca** invoca `iniciarSesion()`; solo invoca `cerrarSesion()` y los casos de uso autorizados para su rol.
3. **Actor Tiempo / Cron:** Si una acción se ejecuta automáticamente sin intervención humana (ej. escaneo periódico o copias de seguridad automáticas), se modela con el actor secundario `Tiempo`.
4. **Empaquetamiento en Diagramas de Casos de Uso:**
   * En diagramas PlantUML, agrupar los casos de uso en `package` conceptuales (`package Acceso`, `package Catalogo`, `package Configuracion`).
   * No mezclar todos los actores en una "telaraña" inmanejable: dividir vistas por actor (`actoresCasosUsoAdmin.puml`, `actoresCasosUsoProfesor.puml`).

---

## 3. Diagramas de Contexto (Context Navigation Automaton)

En el estándar de IdSw (pyCelda / pySigHor), el **Diagrama de Contexto** no es un diagrama de cajas genérico, sino un **Autómata de Navegación de Estados de Interfaz**:

* **Directiva PlantUML:** `left to right direction` y `skinparam linetype polyline`.
* **Nomenclatura de Estados:** Siempre en **MAYÚSCULAS_CON_GUION_BAJO** (ej. `SESION_CERRADA`, `SISTEMA_DISPONIBLE`, `AULA_CONSULTADA`, `PUESTOS_SELECCIONADOS`).
* **Transiciones:** Cada flecha representa la invocación exacta de un caso de uso:
  ```plantuml
  SESION_CERRADA --> SISTEMA_DISPONIBLE : iniciarSesion()
  SISTEMA_DISPONIBLE --> PUESTOS_CONSULTADOS : consultarEstadoPuestos()
  ```
* **Self-Loops Explícitos:** Si un caso de uso falla o se cancela y regresa a la misma pantalla sin cambiar de estado, se modela explícitamente:
  ```plantuml
  SESION_CERRADA --> SESION_CERRADA : iniciarSesion() [credenciales erróneas]
  ```

---

## 4. Especificación Formal de Casos de Uso (`especificacion.puml`)

Cada caso de uso detallado cuenta con un diagrama de estados formal (Statechart) con la siguiente anatomía estricta:

```plantuml
@startuml <nombreCasoUso>

skinparam linetype polyline

state ESTADO_ORIGEN
state ESTADO_DESTINO_EXITO as "ESTADO_DESTINO"
state ESTADO_DESTINO_ERROR as "ESTADO_ORIGEN"

ESTADO_ORIGEN -[#green]-> <nombreCasoUso>
note on link
<b>Actor</b> solicita ...
end note

state <nombreCasoUso> as "<nombreCasoUso>()" {

    state c <<choice>>

    [*] -[#green]-> c

    c -[#green]-> [*]
    note on link
    [precondiciones y validaciones correctas]
    <b>Sistema</b> presenta ...
    end note

    c -[#red]-> [*]
    note on link
    [condición de fallo / excepción 1]
    <b>Sistema</b> presenta mensaje de error ...
    end note

    c -[#orange]-> [*]
    note on link
    [condición alternativa / excepción 2]
    <b>Sistema</b> presenta advertencia ...
    end note
}

<nombreCasoUso> -[#green]-> ESTADO_DESTINO_EXITO
<nombreCasoUso> -[#red]-> ESTADO_DESTINO_ERROR
note on link
autómata vuelve al origen tras rechazo
end note

@enduml
```

### Reglas de Oro de `especificacion.puml`:
1. **Nodos `<<choice>>` Obligatorios:** Las bifurcaciones no son estados intermedios; se modelan con pseudonodos de elección `<<choice>>`.
2. **Código de Color en Enlaces:**
   * `-[#green]->` para el camino feliz (*Happy path*).
   * `-[#red]->` para fallos de precondición o bloqueos críticos.
   * `-[#orange]->` para caminos alternativos o excepciones no fatales.
3. **Estados Externos Visibles:** Siempre mostrar el estado previo y los estados de salida esperados en el Diagrama de Contexto.
4. **Listas y Enumeraciones con Bullet Point Canónico `•` (Estándar pySigHor):**
   Al enumerar acciones permitidas, campos a introducir o datos presentados dentro de una nota de transición (o en la especificación/conversación detallada del caso de uso):
   * Es **obligatorio** utilizar el bullet point tipográfico `•` (Unicode `\u2022`).
   * Queda **terminantemente prohibido** utilizar guiones (`-`), asteriscos (`*`) o números correlativos (`1.`, `2.`) para desglosar ítems en las notas de interacción.
   * *Ejemplo en PlantUML (`especificacion.puml`):*
     ```plantuml
     note on link
     <b>Sistema</b> permite solicitar:
     • el encendido remoto de un puesto en Standby
     • la consulta de la ficha técnica y detalle de un puesto
     <b>Sistema</b> permite introducir:
     • fila
     • columna
     end note
     ```
   * *Ejemplo en tablas de conversación Markdown (`README.md`):*
     `• campo 1<br>• campo 2`

---

## 5. Gramática Estricta de Verbos (Indicaciones vs. Contraindicaciones)

Esta es la regla más exigente del temario de Requisitos. **No se permiten desviaciones:**

### Indicaciones (Verbos Permitidos):
| El Actor ÚNICAMENTE: | El Sistema ÚNICAMENTE: |
| :--- | :--- |
| **`introduce`** (datos, credenciales, formularios) | **`permite introducir`** (habilita campos) |
| **`solicita`** (ejecutar acción, navegar, confirmar) | **`permite solicitar`** (habilita botón o enlace) |
| **`solicita introducir`** | **`presenta`** / **`muestra`** / **`visualiza`** (pantallas, datos, avisos) |

### Contraindicaciones (Faltas Graves):
* ❌ **Prohibido modelar pensamientos del actor:**  
  *Incorrecto:* *"El administrador decide si apagar o reiniciar"*, *"El usuario revisa la lista y piensa qué puesto encender"*.  
  *Justificación:* El software no programa ni puede controlar los pensamientos humanos.
* ❌ **Prohibido fugar detalles técnicos de backend o base de datos:**  
  *Incorrecto:* *"Se graba el registro en la base de datos SQL"*, *"Se ejecuta la llamada SNMP"*, *"El sistema valida el token JWT"*.  
  *Justificación:* Pertenece a las disciplinas de Análisis, Diseño e Implementación. En requisitos es una decisión prematura.
* ❌ **Prohibido lenguaje prematuro de widgets o hardware de entrada en la especificación:**  
  *Incorrecto:* *"El usuario hace click en el botón rojo"*, *"Arrastra con el ratón el cuadro"*.  
  *Justificación:* Los controles específicos pertenecen al prototipo (Salt/Wireframe). En la especificación se usa *«Actor solicita...»*.
* ❌ **Prohibido usar guiones (`-`), asteriscos (`*`) o números correlativos (`1.`, `2.`) en enumeraciones de interacción:**  
  *Incorrecto:* `- usuario`, `* contraseña`, `1. encender puesto`.  
  *Justificación:* El estándar canónico de referencia (**pySigHor**) prescribe el uso exclusivo del bullet point tipográfico `•` para preservar la limpieza visual y uniformidad en las notas del autómata y tablas del caso de uso.

---

## 6. Prototipado de Interfaz de Usuario (`wireframes.puml` con PlantUML Salt)

1. **Cabecera Normalizada:** `@startsalt <nombreCasoUso>-wireframe`.
2. **Sintaxis de Controles Salt Limpia:**
   * Checkbox desmarcado: `[ ]`
   * Checkbox marcado: `[X]`
   * Botones: `[ Texto Boton ]`
   * Campos de texto: `" valor por defecto "`
   * Menús / pestañas: `{/ Pestaña1 | <b>PestañaActiva</b> | Pestaña3 }`
3. **Distribución Espacial Coherente con el Dominio:**  
   Si el dominio representa un aula física con pasillo central (como OpSys / MeshPanel), el wireframe en Salt debe plasmar visualmente el pasillo central separando las dos bancadas de puestos:
   ```plantuml
   @startsalt dimensionarCuadricula-wireframe
   {
     <b>DISPOSICIÓN ESPACIAL DEL AULA (56 PUESTOS)</b>
     ====
     {
       {#
         <b>Fila 1</b> | [X] M01 | [X] M02 | [X] M03 | . | [X] M04 | [X] M05 | [X] M06
         <b>Fila 2</b> | [X] M07 | [X] M08 | [X] M09 | . | [X] M10 | [X] M11 | [X] M12
       }
     }
     ====
     { [ Aplicar Cambios ] | [ Cancelar ] }
   }
   @endsalt
   ```
4. **Coherencia 1:1:** Cada dato o mensaje que la especificación diga que el sistema *«presenta»* debe tener su representación visible en el prototipo Salt.

---

## 7. Estructura de Directorios y Política de Espejo

Cada caso de uso debe respetar la estructura de carpetas:

```
RUP/01-requisitos/01-detalle-casos-uso/<nombreCasoUso>/
├── README.md              # Ficha técnica, descripción, pre/postcondiciones y enlaces
├── especificacion.puml    # Autómata Statechart con <<choice>>
└── wireframes.puml        # Prototipo visual PlantUML Salt

images/01-requisitos/01-detalle-casos-uso/<nombreCasoUso>/
├── especificacion.svg     # Vectorial compilado de especificacion.puml
└── wireframes.svg         # Vectorial compilado de wireframes.puml
```

* **Regla de Enlaces:** El archivo `README.md` debe contener enlaces relativos funcionales:
  * Al código fuente `.puml` local.
  * Al diagrama de contexto del actor.
  * A los ADRs que justifiquen las decisiones de negocio.

### Compilación Oficial de Diagramas PlantUML (Estilo Vectorial PlantText con Fondo Blanco)
* **Regla Inquebrantable:** NUNCA ejecutar el comando local `/usr/bin/plantuml -tsvg` o `plantuml -tsvg`. La versión del paquete local del sistema es obsoleta (2020) y genera diagramas bitmap pixelados, notas amarillentas y sombras pesadas.
* **Compilador Oficial:** Usar SIEMPRE `python3 scripts/compile-plantuml.py <origen.puml> <destino.svg>` o confiar en el hook automático `.agents/hooks.json` (`scripts/auto-compile-plantuml.py`). Ambos compilan directamente contra el motor moderno (PlantText / PlantUML 1.2026.x), garantizando gráficos vectoriales puros, fondo blanco (`background:#FFFFFF`), tipografía nítida y notas color crema claro oficiales.

---

## 8. Procedimiento de Auditoría Paso a Paso

Cuando se audite un caso de uso o conjunto de artefactos:

1. **Paso 1: Análisis Estructural y Política de Espejo**
   * Verificar existencia de `README.md`, `especificacion.puml`, `wireframes.puml`.
   * Verificar presencia de sus gemelos `especificacion.svg` y `wireframes.svg` en `images/`.
2. **Paso 2: Auditoría Gramatical y Tipográfica de la Especificación**
   * Buscar y señalar cualquier verbo prohibido (*hace clic, pulsa, decide, graba en base de datos, envía snmp*).
   * Validar que solo se usen las parejas: `solicita`/`permite solicitar`, `introduce`/`permite introducir`, `presenta`.
   * Verificar que toda enumeración de campos, opciones o acciones (en notas de `especificacion.puml` o tablas de `README.md`) utilice rigurosamente el bullet point `•` estilo **pySigHor**, señalando como falta cualquier guion (`-`), asterisco (`*`) o número correlativo.
3. **Paso 3: Validación del Autómata Formal**
   * Comprobar que los estados estén en mayúsculas.
   * Verificar que las bifurcaciones usen `<<choice>>`.
   * Verificar notas con guardas `[condición]` en ramas verde, roja y naranja.
   * Comprobar formato de listas dentro de las notas (`•`).
4. **Paso 4: Auditoría del Wireframe Salt**
   * Comprobar sintaxis estándar (`[]`, `[X]`, alineación, pasillo si aplica).
   * Comprobar consistencia con los datos descritos en el flujo principal.
5. **Paso 5: Emisión de Veredicto con Puntuación (0 a 10)**
   * Desglosar nota según la rúbrica (30% Identificación, 40% Detalle, 30% Trazabilidad).
   * Aplicar factores de ajuste (+1 / -1).
   * Proporcionar las correcciones exactas en formato *drop-in replacement*.
