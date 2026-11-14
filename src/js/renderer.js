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

    const headerLeft = document.getElementById('header-left-col');
    const headerRight = document.getElementById('header-right-col');
    if (headerLeft) headerLeft.textContent = `Hilera Izquierda (${this.colsHilera} cols)`;
    if (headerRight) headerRight.textContent = `Hilera Derecha (${this.colsHilera} cols)`;

    let slotCounter = 1;

    for (let f = 1; f <= this.filas; f++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'classroom-row';

      // Etiqueta izquierda de fila
      const labelLeft = document.createElement('div');
      labelLeft.className = 'row-label';
      labelLeft.textContent = `F${f}`;
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

      // Pasillo central (EN EL MEDIO SIEMPRE)
      const aisleEl = document.createElement('div');
      aisleEl.className = 'aisle-divider';
      rowEl.appendChild(aisleEl);

      // Bloque de mesas derecho (exactamente el mismo número de columnas para simetría total)
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

      // Etiqueta derecha de fila (para centrado geométrico perfecto del pasillo en medio)
      const labelRight = document.createElement('div');
      labelRight.className = 'row-label';
      labelRight.textContent = `F${f}`;
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

  construirSlotMap(puestosMap) {
    const slotToHost = new Map();
    const unassigned = [];

    puestosMap.forEach(p => {
      let assignedKey = null;

      if (p.puesto_id && this.slotElements.has(p.puesto_id)) {
        assignedKey = p.puesto_id;
      } else if (typeof p.slot === 'number') {
        const candidate = `puesto-${p.slot}`;
        if (this.slotElements.has(candidate)) {
          assignedKey = candidate;
        }
      }

      if (!assignedKey && p.boca_switch) {
        const slotMatch = p.boca_switch.match(/port0*(\d+)/i);
        if (slotMatch) {
          const num = parseInt(slotMatch[1], 10);
          const candidate = `puesto-${num}`;
          if (this.slotElements.has(candidate)) assignedKey = candidate;
        }
      }

      if (assignedKey && !slotToHost.has(assignedKey)) {
        slotToHost.set(assignedKey, p);
      } else {
        unassigned.push(p);
      }
    });

    for (const key of this.slotElements.keys()) {
      if (unassigned.length === 0) break;
      if (!slotToHost.has(key)) {
        slotToHost.set(key, unassigned.shift());
      }
    }

    return slotToHost;
  }

  matches(puesto, query = '') {
    if (!puesto) return false;
    if (!query) return true;

    const q = query.toLowerCase().trim();
    const nombre = (puesto.nombre || '').toLowerCase();
    const ip = (puesto.telemetria?.ip_reportada || '').toLowerCase();
    const mac = (puesto.telemetria?.mac || '').toLowerCase();
    const boca = (puesto.boca_switch || '').toLowerCase();
    const port = puesto.telemetria?.switch?.port !== undefined ? String(puesto.telemetria.switch.port) : '';
    const swAsignado = (puesto.telemetria?.switch_asignado || '').toLowerCase();
    const red = (puesto.red?.nombre || '').toLowerCase();
    const diag = (puesto.diagnostico || '').toLowerCase();

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
            <span class="slot-badge">#${slotStr}</span>
            <span class="host-name text-muted">Libre</span>
          </div>
          <span class="status-dot EMPTY" title="Puesto libre"></span>
        </div>
        <div class="card-body">
          <div class="row"><span>IP:</span><span>---</span></div>
          <div class="row"><span>Boca:</span><span>port${num}</span></div>
          <div class="row row-switch">
            <span>Switch:</span>
            <select class="switch-select ${swBadgeClass}" onchange="window.cambiarSwitchPuesto('${escapeHtml(puestoId)}', this.value)" title="Asignar switch a ${escapeHtml(puestoId)}">
              ${selectOptions}
            </select>
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
            <span class="slot-badge">#${slotStr}</span>
            <span class="host-name" title="${escapeHtml(p.nombre || 'PC-???')}">${escapeHtml(p.nombre || 'PC-???')}</span>
          </div>
          <span class="status-dot ${p.estado || 'GRIS'}" title="${escapeHtml(p.diagnostico || p.estado || 'Estado')}"></span>
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
          <div class="row row-switch">
            <span>Switch:</span>
            <select class="switch-select ${swBadgeClass}" onchange="window.cambiarSwitchPuesto('${escapeHtml(puestoId)}', this.value)" title="Asignar switch a ${escapeHtml(puestoId)}">
              ${selectOptions}
            </select>
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

      if (host) {
        const isMatch = this.matches(host, query);
        slotCard.className = `card-compact ${host.estado}`;
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
        slotCard.className = 'card-compact card-empty';
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
