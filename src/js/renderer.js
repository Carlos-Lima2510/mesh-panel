function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class DashboardRenderer {
  constructor(containerId = 'classroom-grid') {
    this.classroomGrid = document.getElementById(containerId);
    this.slotElements = new Map();
    this.currentSlotToHost = new Map();
    this.puestosSeleccionados = new Set();
    this.filas = 5;
    this.colsHilera = 4;
    this.columnas = 8;

    this.inicializarEstructuraMapa(this.filas, this.colsHilera);
  }

  inicializarEstructuraMapa(filas = 5, colsHilera = 4) {
    if (!this.classroomGrid) return;
    this.filas = parseInt(filas, 10) || 5;
    this.colsHilera = parseInt(colsHilera, 10) || 4;
    this.columnas = this.colsHilera * 2;
    this.classroomGrid.innerHTML = '';
    this.slotElements.clear();

    // Actualizar encabezados según el wireframe:
    // . | Col 1 | Col 2 | Col 3 | === PASILLO CENTRAL === | Col 4 | Col 5 | Col 6
    const headersContainer = document.getElementById('classroom-headers');
    if (headersContainer) {
      let leftColsHtml = '';
      for (let c = 1; c <= this.colsHilera; c++) {
        leftColsHtml += `<div class="col-header-cell">Col ${c}</div>`;
      }
      let rightColsHtml = '';
      for (let c = 1; c <= this.colsHilera; c++) {
        rightColsHtml += `<div class="col-header-cell">Col ${this.colsHilera + c}</div>`;
      }

      headersContainer.innerHTML = `
        <div class="corner-header">Fila</div>
        <div class="col-header-block" style="--cols-hilera: ${this.colsHilera}">${leftColsHtml}</div>
        <div class="aisle-header">=== PASILLO CENTRAL ===</div>
        <div class="col-header-block" style="--cols-hilera: ${this.colsHilera}">${rightColsHtml}</div>
        <div class="corner-header">Fila</div>
      `;
    }

    let slotCounter = 1;

    for (let f = 1; f <= this.filas; f++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'classroom-row';

      // Etiqueta izquierda de fila (según wireframe: Fila 1, Fila 2...)
      const labelLeft = document.createElement('div');
      labelLeft.className = 'row-label';
      labelLeft.textContent = `Fila ${f}`;
      rowEl.appendChild(labelLeft);

      // Bloque de mesas izquierdo
      const leftBlock = document.createElement('div');
      leftBlock.className = 'row-block';
      leftBlock.style.setProperty('--cols-hilera', this.colsHilera);
      for (let c = 1; c <= this.colsHilera; c++) {
        const slotCard = this._crearSlotCard(`puesto-${slotCounter}`, slotCounter);
        leftBlock.appendChild(slotCard);
        this.slotElements.set(`puesto-${slotCounter}`, slotCard);
        slotCounter++;
      }
      rowEl.appendChild(leftBlock);

      // Pasillo central con la estructura visual exacta del wireframe: ║ Pasillo ║
      const aisleEl = document.createElement('div');
      aisleEl.className = 'aisle-divider';
      aisleEl.innerHTML = `<span class="aisle-text">║ Pasillo ║</span>`;
      rowEl.appendChild(aisleEl);

      // Bloque de mesas derecho (simetría garantizada con pasillo en medio)
      const rightBlock = document.createElement('div');
      rightBlock.className = 'row-block';
      rightBlock.style.setProperty('--cols-hilera', this.colsHilera);
      for (let c = 1; c <= this.colsHilera; c++) {
        const slotCard = this._crearSlotCard(`puesto-${slotCounter}`, slotCounter);
        rightBlock.appendChild(slotCard);
        this.slotElements.set(`puesto-${slotCounter}`, slotCard);
        slotCounter++;
      }
      rowEl.appendChild(rightBlock);

      // Etiqueta derecha de fila
      const labelRight = document.createElement('div');
      labelRight.className = 'row-label';
      labelRight.textContent = `Fila ${f}`;
      rowEl.appendChild(labelRight);

      this.classroomGrid.appendChild(rowEl);
    }
  }

  _crearSlotCard(slotKey, displayNum = null) {
    const slotCard = document.createElement('div');
    slotCard.className = 'card-compact card-empty';
    slotCard.dataset.slot = slotKey;
    slotCard.dataset.num = displayNum || slotKey;
    return slotCard;
  }

  toggleSeleccion(puestoId, isSelected) {
    if (isSelected) {
      this.puestosSeleccionados.add(puestoId);
    } else {
      this.puestosSeleccionados.delete(puestoId);
    }
    const card = this.slotElements.get(puestoId);
    if (card) {
      if (isSelected) card.classList.add('selected');
      else card.classList.remove('selected');
      const chk = card.querySelector(`input[data-puesto-id="${puestoId}"]`);
      if (chk) chk.checked = isSelected;
    }
    return this.puestosSeleccionados.size;
  }

  obtenerPuestosSeleccionados() {
    return Array.from(this.puestosSeleccionados);
  }

  limpiarSeleccion() {
    this.puestosSeleccionados.clear();
    for (const card of this.slotElements.values()) {
      card.classList.remove('selected');
      const chk = card.querySelector('.slot-checkbox');
      if (chk) chk.checked = false;
    }
  }

  seleccionarTodos(puestoIds) {
    const todosYaSeleccionados = puestoIds.length > 0 && puestoIds.every(id => this.puestosSeleccionados.has(id));
    if (todosYaSeleccionados) {
      puestoIds.forEach(id => this.puestosSeleccionados.delete(id));
    } else {
      puestoIds.forEach(id => this.puestosSeleccionados.add(id));
    }
    for (const [id, card] of this.slotElements.entries()) {
      const isSel = this.puestosSeleccionados.has(id);
      if (isSel) card.classList.add('selected');
      else card.classList.remove('selected');
      const chk = card.querySelector(`input[data-puesto-id="${id}"]`);
      if (chk) chk.checked = isSel;
    }
    return this.puestosSeleccionados.size;
  }

  construirSlotMap(puestosMap) {
    const slotToHost = new Map();
    const unassigned = [];

    puestosMap.forEach(p => {
      let assignedKey = null;

      if (p.puesto_id && this.slotElements.has(p.puesto_id)) {
        assignedKey = p.puesto_id;
      } else if (p.slot) {
        const candidateKey = `puesto-${p.slot}`;
        if (this.slotElements.has(candidateKey)) {
          assignedKey = candidateKey;
        }
      }

      if (assignedKey && !slotToHost.has(assignedKey)) {
        slotToHost.set(assignedKey, p);
      } else {
        unassigned.push(p);
      }
    });

    for (const p of unassigned) {
      for (const key of this.slotElements.keys()) {
        if (!slotToHost.has(key)) {
          slotToHost.set(key, p);
          break;
        }
      }
    }

    return slotToHost;
  }

  matches(p, query) {
    if (!query || !query.trim()) return true;
    const q = query.toLowerCase().trim();

    const nombre = (p.nombre || '').toLowerCase();
    const ip = (p.telemetria?.ip_reportada || p.ip || '').toLowerCase();
    const mac = (p.telemetria?.mac || p.mac || '').toLowerCase();
    const boca = (p.boca_switch || '').toLowerCase();
    const port = String(p.telemetria?.switch?.port || '');
    const swAsignado = (p.telemetria?.switch_asignado || '').toLowerCase();
    const red = (p.red?.nombre || '').toLowerCase();
    const diag = (p.diagnostico || '').toLowerCase();

    return (
      nombre.includes(q) ||
      ip.includes(q) ||
      mac.includes(q) ||
      boca.includes(q) ||
      port === q ||
      (`p${port}`).toLowerCase().includes(q) ||
      swAsignado.includes(q) ||
      red.includes(q) ||
      diag.includes(q)
    );
  }

  generarEmptySlotHtml(num, puestoFisico = null, switchesList = []) {
    const slotStr = String(num).padStart(2, '0');
    const puestoId = puestoFisico?.id || `puesto-${num}`;
    const swIdActual = puestoFisico?.switch_id || 'sw-docente';
    const isSwPracticas = swIdActual === 'sw-practicas';
    const swBadgeClass = isSwPracticas ? 'practicas' : 'docente';
    const tomaStr = puestoFisico?.toma || `ROS-${slotStr}`;
    const isSelected = this.puestosSeleccionados.has(puestoId);

    const selectOptions = (Array.isArray(switchesList) && switchesList.length > 0)
      ? switchesList.map(sw => `<option value="${escapeHtml(sw.id)}" ${sw.id === swIdActual ? 'selected' : ''}>${escapeHtml(sw.nombre || sw.id)}</option>`).join('')
      : `
        <option value="sw-docente" ${!isSwPracticas ? 'selected' : ''}>Sw. Docente</option>
        <option value="sw-practicas" ${isSwPracticas ? 'selected' : ''}>Sw. Prácticas</option>
      `;

    return `
      <div>
        <div class="card-top">
          <div class="card-title">
            <label class="slot-checkbox-label" title="Seleccionar puesto ${escapeHtml(puestoId)}">
              <input type="checkbox" class="slot-checkbox" data-puesto-id="${escapeHtml(puestoId)}" ${isSelected ? 'checked' : ''} onchange="window.togglePuestoSeleccionado('${escapeHtml(puestoId)}', this.checked)">
              <span class="custom-checkbox"></span>
            </label>
            <span class="status-dot EMPTY" title="Puesto libre"></span>
            <span class="host-name text-muted">Libre</span>
          </div>
          <span class="slot-badge">#${slotStr}</span>
        </div>
        <div class="card-body">
          <div class="row"><span>IP:</span><span>---</span></div>
          <div class="row"><span>Boca:</span><span>port${num}</span></div>
          <div class="row">
            <span>Switch:</span>
            <span class="badge-switch ${swBadgeClass}">${escapeHtml(isSwPracticas ? 'Sw. Prácticas' : 'Sw. Docente')}</span>
          </div>
        </div>
      </div>
      <div class="card-bottom">
        <div class="diag-compact" title="Mesa disponible (${escapeHtml(tomaStr)})">Disponible</div>
      </div>
    `;
  }

  generarCompactCardHtml(p, slotNum, puestoFisico = null, switchesList = []) {
    const slotStr = String(slotNum).padStart(2, '0');
    const sw = p.telemetria?.switch || {};
    const linkStr = sw.link ? sw.link.toUpperCase() : 'DOWN';
    const portName = p.boca_switch || (sw.portName ? sw.portName : `p${sw.port || '?'}`);

    const connVal = parseInt(p.telemetria?.conn, 10) || 0;
    const isConnAgent = (connVal & 1) !== 0;

    let bottomActionHtml = '';
    const accion = p.accion || {};

    if (accion.ejecutable && accion.tipo === 'POWER_OFF') {
      bottomActionHtml = `
        <button type="button" class="btn-action btn-power-off" onclick="window.ejecutarPowerOff('${escapeHtml(p.node_id)}')">
          🛑 Apagar
        </button>`;
    } else if (accion.ejecutable && accion.tipo === 'WAKE_ON_LAN') {
      bottomActionHtml = `
        <button type="button" class="btn-action btn-wol" onclick="window.ejecutarWoL('${escapeHtml(p.node_id)}')">
          ⚡ WoL
        </button>`;
    } else {
      const diagText = p.diagnostico || (isConnAgent ? 'PC Operativo' : 'Desconectado');
      bottomActionHtml = `<div class="diag-compact" title="${escapeHtml(diagText)}">${escapeHtml(diagText)}</div>`;
    }

    const puestoId = p.puesto_id || puestoFisico?.id || `puesto-${slotNum}`;
    const swIdActual = puestoFisico?.switch_id || (p.telemetria?.switch_asignado?.toLowerCase().includes('práctica') ? 'sw-practicas' : 'sw-docente');
    const isSwPracticas = swIdActual === 'sw-practicas' || (p.red?.es_aislada === true);
    const swBadgeClass = isSwPracticas ? 'practicas' : 'docente';
    const isSelected = this.puestosSeleccionados.has(puestoId);

    const selectOptions = (Array.isArray(switchesList) && switchesList.length > 0)
      ? switchesList.map(sw => `<option value="${escapeHtml(sw.id)}" ${sw.id === swIdActual ? 'selected' : ''}>${escapeHtml(sw.nombre || sw.id)}</option>`).join('')
      : `
        <option value="sw-docente" ${!isSwPracticas ? 'selected' : ''}>Sw. Docente</option>
        <option value="sw-practicas" ${isSwPracticas ? 'selected' : ''}>Sw. Prácticas</option>
      `;

    return `
      <div>
        <div class="card-top">
          <div class="card-title">
            <label class="slot-checkbox-label" title="Seleccionar puesto ${escapeHtml(puestoId)}">
              <input type="checkbox" class="slot-checkbox" data-puesto-id="${escapeHtml(puestoId)}" ${isSelected ? 'checked' : ''} onchange="window.togglePuestoSeleccionado('${escapeHtml(puestoId)}', this.checked)">
              <span class="custom-checkbox"></span>
            </label>
            <span class="status-dot ${p.estado || 'GRIS'}" title="${escapeHtml(p.diagnostico || p.estado || 'Estado')}"></span>
            <span class="host-name" title="${escapeHtml(p.nombre || 'PC-???')}">${escapeHtml(p.nombre || 'PC-???')}</span>
          </div>
          <span class="slot-badge">#${slotStr}</span>
        </div>
        <div class="card-body">
          <div class="row">
            <span>IP:</span>
            <span title="${escapeHtml(p.telemetria?.ip_reportada || '---')}">${escapeHtml(p.telemetria?.ip_reportada || '---')}</span>
          </div>
          <div class="row">
            <span>Boca:</span>
            <span title="${escapeHtml(portName)} (${linkStr})">${escapeHtml(portName)} (${linkStr})</span>
          </div>
          <div class="row">
            <span>Switch:</span>
            <span class="badge-switch ${swBadgeClass}">${escapeHtml(isSwPracticas ? 'Sw. Prácticas' : 'Sw. Docente')}</span>
          </div>
        </div>
      </div>
      <div class="card-bottom">
        ${bottomActionHtml}
      </div>
    `;
  }

  render(puestosMap, metricas = null, options = {}) {
    const query = options.query || '';
    const hasFilter = Boolean(query && query.trim());
    const puestosFisicos = options.puestosFisicos || [];
    const switchesList = options.switches || [];
    const filas = parseInt(options.filas, 10) || this.filas || 5;
    const colsHilera = parseInt(options.columnas_hilera || options.colsHilera, 10) ||
      (options.columnas ? Math.ceil(parseInt(options.columnas, 10) / 2) : (this.colsHilera || 4));

    if (filas !== this.filas || colsHilera !== this.colsHilera || this.slotElements.size !== (filas * colsHilera * 2)) {
      this.inicializarEstructuraMapa(filas, colsHilera);
    }

    // Actualizar métricas cuantitativas en la barra superior del wireframe
    if (metricas) {
      const elOperativos = document.getElementById('metric-operativos');
      const elStandby = document.getElementById('metric-standby');
      const elPracticas = document.getElementById('metric-practicas');
      const elDesconectados = document.getElementById('metric-desconectados');
      const elTotal = document.getElementById('metric-total');
      const elDesconocidoPill = document.getElementById('metric-pill-desconocido');
      const elDesconocido = document.getElementById('metric-desconocido');

      if (elOperativos) elOperativos.textContent = metricas.verde ?? 0;
      if (elStandby) elStandby.textContent = metricas.gris ?? 0;
      if (elPracticas) elPracticas.textContent = metricas.amarillo ?? 0;
      if (elDesconectados) elDesconectados.textContent = metricas.naranja ?? 0;
      if (elTotal) elTotal.textContent = metricas.total ?? 0;

      if (elDesconocidoPill && elDesconocido) {
        if (metricas.desconocido && metricas.desconocido > 0) {
          elDesconocidoPill.style.display = 'inline-flex';
          elDesconocido.textContent = metricas.desconocido;
        } else {
          elDesconocidoPill.style.display = 'none';
        }
      }
    }

    const puestosFisicosMap = new Map();
    if (Array.isArray(puestosFisicos)) {
      puestosFisicos.forEach(pf => puestosFisicosMap.set(pf.id, pf));
    }

    const slotToHost = this.construirSlotMap(puestosMap);
    this.currentSlotToHost = slotToHost;

    for (const [key, slotCard] of this.slotElements.entries()) {
      const host = slotToHost.get(key);
      const displayNum = slotCard.dataset.num || key;
      const puestoFisico = puestosFisicosMap.get(key);
      const isSelected = this.puestosSeleccionados.has(key);

      if (host) {
        const isMatch = this.matches(host, query);
        slotCard.className = `card-compact ${host.estado}${isSelected ? ' selected' : ''}`;
        slotCard.innerHTML = this.generarCompactCardHtml(host, displayNum, puestoFisico, switchesList);

        if (hasFilter) {
          if (isMatch) {
            slotCard.classList.remove('dimmed');
            slotCard.classList.add('match-highlight');
          } else {
            slotCard.classList.add('dimmed');
            slotCard.classList.remove('match-highlight');
          }
        } else {
          slotCard.classList.remove('dimmed', 'match-highlight');
        }
      } else {
        slotCard.className = `card-compact card-empty${isSelected ? ' selected' : ''}`;
        slotCard.innerHTML = this.generarEmptySlotHtml(displayNum, puestoFisico, switchesList);
        if (hasFilter) {
          slotCard.classList.add('dimmed');
          slotCard.classList.remove('match-highlight');
        } else {
          slotCard.classList.remove('dimmed', 'match-highlight');
        }
      }
    }
  }
}
