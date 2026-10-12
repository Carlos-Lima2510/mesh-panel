function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const CLASSROOM_ROWS = [
  { label: 'F1', left: [1, 2, 3, 4, 5], right: [6, 7, 8, 9, 10] },
  { label: 'F2', left: [11, 12, 13, 14, 15], right: [16, 17, 18, 19, 20] },
  { label: 'F3', left: [21, 22, 23, 24, 25], right: [26, 27, 28, 29, 30] },
  { label: 'F4', left: [31, 32, 33, 34, 35], right: [36, 37, 38, 39, 40] },
  { label: 'F5', left: [41, 42, 43, 44, 45], right: [46, 47, 48, 49, 50] },
  { label: 'F6', left: [51, 52, 53], right: [54, 55, 56] }
];

export class DashboardRenderer {
  constructor(containerId = 'classroom-grid', kpiIds = {}) {
    this.classroomGrid = document.getElementById(containerId);

    this.kpiT = document.getElementById(kpiIds.t || 'kT');
    this.kpiV = document.getElementById(kpiIds.v || 'kV');
    this.kpiA = document.getElementById(kpiIds.a || 'kA');
    this.kpiG = document.getElementById(kpiIds.g || 'kG');
    this.kpiN = document.getElementById(kpiIds.n || 'kN');

    this.counterEl = document.getElementById('filter-counter');
    this.resetBtn = document.getElementById('btn-reset-filters');

    this.slotElements = new Map();
    this.currentDistribucionId = null;

    this.editMode = false;
    this.selectedSlotForMove = null;
    this.currentSlotToHost = new Map();
    this.onMoveHost = null;

    this.inicializarEstructuraMapa();
  }

  inicializarEstructuraMapa() {
    if (!this.classroomGrid) return;
    this.classroomGrid.innerHTML = '';
    this.slotElements.clear();

    CLASSROOM_ROWS.forEach(rowData => {
      const rowEl = document.createElement('div');
      rowEl.className = 'classroom-row';

      const labelEl = document.createElement('div');
      labelEl.className = 'row-label';
      labelEl.textContent = rowData.label;
      rowEl.appendChild(labelEl);

      const leftBlock = document.createElement('div');
      leftBlock.className = 'row-block';
      rowData.left.forEach(slotNum => {
        const slotCard = this._crearSlotCard(`puesto-${slotNum}`, slotNum);
        leftBlock.appendChild(slotCard);
        this.slotElements.set(`puesto-${slotNum}`, slotCard);
      });
      for (let i = rowData.left.length; i < 5; i++) {
        const ghost = document.createElement('div');
        ghost.className = 'card-compact card-ghost';
        leftBlock.appendChild(ghost);
      }
      rowEl.appendChild(leftBlock);

      const aisleEl = document.createElement('div');
      aisleEl.className = 'aisle-divider';
      rowEl.appendChild(aisleEl);

      const rightBlock = document.createElement('div');
      rightBlock.className = 'row-block';
      rowData.right.forEach(slotNum => {
        const slotCard = this._crearSlotCard(`puesto-${slotNum}`, slotNum);
        rightBlock.appendChild(slotCard);
        this.slotElements.set(`puesto-${slotNum}`, slotCard);
      });
      for (let i = rowData.right.length; i < 5; i++) {
        const ghost = document.createElement('div');
        ghost.className = 'card-compact card-ghost';
        rightBlock.appendChild(ghost);
      }
      rowEl.appendChild(rightBlock);

      this.classroomGrid.appendChild(rowEl);
    });
  }

  reconstruirEstructura(dist) {
    if (!this.classroomGrid) return;
    this.classroomGrid.innerHTML = '';
    this.slotElements.clear();

    const headersEl = document.getElementById('classroom-headers');
    const isClassicAula = !dist || dist.id === 'dist-aula-56';

    if (isClassicAula) {
      if (headersEl) headersEl.style.display = 'grid';
      this.inicializarEstructuraMapa();
      return;
    }

    if (headersEl) headersEl.style.display = 'none';

    const filas = dist.filas || 6;
    const columnas = dist.columnas || 10;
    const puestosPorCoord = new Map();

    if (Array.isArray(dist.puestos)) {
      dist.puestos.forEach(p => {
        puestosPorCoord.set(`${p.fila},${p.columna}`, p);
      });
    }

    for (let f = 1; f <= filas; f++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'classroom-row';

      const labelEl = document.createElement('div');
      labelEl.className = 'row-label';
      labelEl.textContent = `F${f}`;
      rowEl.appendChild(labelEl);

      const blockEl = document.createElement('div');
      blockEl.className = 'row-block';
      blockEl.style.display = 'grid';
      blockEl.style.gridTemplateColumns = `repeat(${columnas}, minmax(130px, 1fr))`;
      blockEl.style.gap = '8px';

      for (let c = 1; c <= columnas; c++) {
        const puesto = puestosPorCoord.get(`${f},${c}`);
        if (puesto) {
          const numSlot = parseInt(puesto.id.replace('puesto-', ''), 10) || `${f}-${c}`;
          const slotCard = this._crearSlotCard(puesto.id, numSlot);
          blockEl.appendChild(slotCard);
          this.slotElements.set(puesto.id, slotCard);
        } else {
          const ghost = document.createElement('div');
          ghost.className = 'card-compact card-ghost';
          blockEl.appendChild(ghost);
        }
      }

      rowEl.appendChild(blockEl);
      this.classroomGrid.appendChild(rowEl);
    }
  }

  _crearSlotCard(slotKey, displayNum = null) {
    const slotCard = document.createElement('div');
    slotCard.className = 'card-compact card-empty';
    slotCard.dataset.slot = slotKey;
    slotCard.dataset.num = displayNum || slotKey;

    slotCard.addEventListener('dragstart', (e) => {
      if (!this.editMode) {
        e.preventDefault();
        return;
      }
      const host = this.currentSlotToHost.get(slotKey);
      if (!host) {
        e.preventDefault();
        return;
      }
      slotCard.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', JSON.stringify({ hostId: host.node_id, fromSlot: slotKey }));
      e.dataTransfer.effectAllowed = 'move';
    });

    slotCard.addEventListener('dragend', () => {
      slotCard.classList.remove('is-dragging');
      document.querySelectorAll('.card-compact').forEach(c => c.classList.remove('drag-over'));
    });

    slotCard.addEventListener('dragover', (e) => {
      if (!this.editMode) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slotCard.classList.add('drag-over');
    });

    slotCard.addEventListener('dragleave', () => {
      slotCard.classList.remove('drag-over');
    });

    slotCard.addEventListener('drop', (e) => {
      if (!this.editMode) return;
      e.preventDefault();
      slotCard.classList.remove('drag-over');
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data && data.hostId && data.fromSlot !== slotKey) {
          if (typeof this.onMoveHost === 'function') {
            this.onMoveHost(data.hostId, slotKey);
          }
        }
      } catch (_) {}
    });

    slotCard.addEventListener('click', (e) => {
      if (e.target.closest('.btn-action')) return;
      if (!this.editMode) return;

      if (!this.selectedSlotForMove) {
        const host = this.currentSlotToHost.get(slotKey);
        if (host) {
          this.selectedSlotForMove = { hostId: host.node_id, slotKey };
          slotCard.classList.add('slot-selected-move');
        }
      } else {
        const prev = this.selectedSlotForMove;
        this.selectedSlotForMove = null;
        document.querySelectorAll('.slot-selected-move').forEach(el => el.classList.remove('slot-selected-move'));

        if (prev.slotKey !== slotKey && typeof this.onMoveHost === 'function') {
          this.onMoveHost(prev.hostId, slotKey);
        }
      }
    });

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

  matches(puesto, filter = 'ALL', query = '') {
    if (!puesto) return false;

    if (filter !== 'ALL' && puesto.estado !== filter) {
      return false;
    }

    if (!query) return true;

    const q = query.toLowerCase().trim();
    const nombre = (puesto.nombre || '').toLowerCase();
    const ip = (puesto.telemetria?.ip_reportada || '').toLowerCase();
    const mac = (puesto.telemetria?.mac || '').toLowerCase();
    const boca = (puesto.boca_switch || '').toLowerCase();
    const port = puesto.telemetria?.switch?.port !== undefined ? String(puesto.telemetria.switch.port) : '';
    const red = (puesto.red?.nombre || '').toLowerCase();
    const diag = (puesto.diagnostico || '').toLowerCase();

    return (
      nombre.includes(q) ||
      ip.includes(q) ||
      mac.includes(q) ||
      boca.includes(q) ||
      port === q ||
      (`p${port}`).toLowerCase().includes(q) ||
      red.includes(q) ||
      diag.includes(q)
    );
  }

  generarCompactCardHtml(p, slotDisplay) {
    const estadoLabels = {
      VERDE: 'Operativo',
      AMARILLO: 'DHCP/Práct.',
      GRIS: 'Standby',
      NARANJA: 'Descon.'
    };
    const badgeLabel = estadoLabels[p.estado] || p.estado;
    const switchShort = p.telemetria?.switch
      ? `P${p.telemetria.switch.port} (${p.telemetria.switch.speed}M)`
      : (p.boca_switch || 'N/A');
    const ipStr = p.telemetria?.ip_reportada || 'Sin IP';
    const osOnline = p.telemetria?.os_online ? 'ON' : 'OFF';
    const slotStr = typeof slotDisplay === 'number' ? String(slotDisplay).padStart(2, '0') : String(slotDisplay);

    let bottomActionHtml = '';
    if (this.editMode) {
      bottomActionHtml = `<div class="drag-handle-hint">✥ Arrastra o haz clic</div>`;
    } else if (p.accion && p.accion.ejecutable) {
      if (p.accion.tipo === 'POWER_OFF') {
        bottomActionHtml = `<button type="button" class="btn-action btn-power-off" onclick="window.ejecutarPowerOff('${escapeHtml(p.node_id)}')">🛑 Apagar</button>`;
      } else if (p.accion.tipo === 'WAKE_ON_LAN') {
        bottomActionHtml = `<button type="button" class="btn-action btn-wol" onclick="window.ejecutarWoL('${escapeHtml(p.node_id)}')">⚡ WoL</button>`;
      } else {
        bottomActionHtml = `<button type="button" class="btn-action btn-wol" onclick="window.ejecutarWoL('${escapeHtml(p.node_id)}')">${escapeHtml(p.accion.tipo)}</button>`;
      }
    } else {
      bottomActionHtml = `<div class="diag-compact" title="${escapeHtml(p.diagnostico || '')}">${escapeHtml(p.diagnostico || 'Operativo')}</div>`;
    }

    return `
      <div>
        <div class="card-top">
          <div class="card-title">
            <span class="slot-badge">#${slotStr}</span>
            <strong class="host-name" title="${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)}</strong>
          </div>
          <span class="badge ${p.estado}">${badgeLabel}</span>
        </div>
        <div class="card-body">
          <div class="row"><span>Switch:</span><span>${escapeHtml(switchShort)}</span></div>
          <div class="row"><span>IP:</span><span>${escapeHtml(ipStr)}</span></div>
          <div class="row"><span>Mesh:</span><span>${osOnline}</span></div>
        </div>
      </div>
      <div class="card-bottom">
        ${bottomActionHtml}
      </div>
    `;
  }

  generarEmptySlotHtml(slotDisplay) {
    const slotStr = typeof slotDisplay === 'number' ? String(slotDisplay).padStart(2, '0') : String(slotDisplay);
    const bottomHint = this.editMode
      ? `<div class="drag-handle-hint">Soltar aquí</div>`
      : `<div class="diag-compact" title="Puesto disponible">Disponible</div>`;

    return `
      <div>
        <div class="card-top">
          <div class="card-title">
            <span class="slot-badge">#${slotStr}</span>
            <strong class="host-name">Puesto ${slotStr}</strong>
          </div>
          <span class="badge EMPTY">Libre</span>
        </div>
        <div class="card-body">
          <div class="row"><span>Switch:</span><span>${slotStr}</span></div>
          <div class="row"><span>IP:</span><span>Sin asignar</span></div>
          <div class="row"><span>Mesh:</span><span>OFF</span></div>
        </div>
      </div>
      <div class="card-bottom">
        ${bottomHint}
      </div>
    `;
  }

  render(puestosMap, metricas = null, options = {}) {
    const filter = options.filter || 'ALL';
    const query = options.query || '';
    const hasFilter = filter !== 'ALL' || Boolean(query && query.trim());
    const distribucion = options.distribucion || null;
    const distId = distribucion ? distribucion.id : 'dist-aula-56';

    if (this.currentDistribucionId !== distId) {
      this.reconstruirEstructura(distribucion);
      this.currentDistribucionId = distId;
    }

    if (options.editMode !== undefined) {
      this.editMode = Boolean(options.editMode);
    }
    if (options.onMoveHost) {
      this.onMoveHost = options.onMoveHost;
    }

    let totalV = 0, totalA = 0, totalG = 0, totalN = 0;
    let visibleCount = 0;
    const totalCount = puestosMap.size;

    const slotToHost = this.construirSlotMap(puestosMap);
    this.currentSlotToHost = slotToHost;

    puestosMap.forEach(p => {
      if (p.estado === 'VERDE') totalV++;
      else if (p.estado === 'AMARILLO') totalA++;
      else if (p.estado === 'GRIS') totalG++;
      else totalN++;

      if (this.matches(p, filter, query)) {
        visibleCount++;
      }
    });

    for (const [key, slotCard] of this.slotElements.entries()) {
      const host = slotToHost.get(key);
      const displayNum = slotCard.dataset.num || key;

      slotCard.setAttribute('draggable', (this.editMode && Boolean(host)) ? 'true' : 'false');
      if (this.editMode) {
        slotCard.classList.add('in-edit-mode');
      } else {
        slotCard.classList.remove('in-edit-mode', 'slot-selected-move', 'drag-over');
      }

      if (host) {
        const isMatch = this.matches(host, filter, query);
        slotCard.className = `card-compact ${host.estado}${this.editMode ? ' in-edit-mode' : ''}`;
        slotCard.innerHTML = this.generarCompactCardHtml(host, displayNum);

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
        slotCard.className = `card-compact card-empty${this.editMode ? ' in-edit-mode' : ''}`;
        slotCard.innerHTML = this.generarEmptySlotHtml(displayNum);
        if (hasFilter) {
          slotCard.classList.add('dimmed');
          slotCard.classList.remove('match-highlight');
        } else {
          slotCard.classList.remove('dimmed', 'match-highlight');
        }
      }
    }

    const totalDesks = this.slotElements.size;
    if (this.counterEl) {
      this.counterEl.innerHTML = `Mostrando <strong>${visibleCount}</strong> de <strong>${totalCount}</strong> puestos (Capacidad plano: ${totalDesks})`;
    }

    if (this.resetBtn) {
      this.resetBtn.style.display = hasFilter ? 'inline-block' : 'none';
    }

    if (metricas) {
      if (this.kpiT) this.kpiT.textContent = metricas.total || totalCount;
      if (this.kpiV) this.kpiV.textContent = metricas.verde;
      if (this.kpiA) this.kpiA.textContent = metricas.amarillo;
      if (this.kpiG) this.kpiG.textContent = metricas.gris;
      if (this.kpiN) this.kpiN.textContent = metricas.naranja;
    } else {
      if (this.kpiT) this.kpiT.textContent = totalCount;
      if (this.kpiV) this.kpiV.textContent = totalV;
      if (this.kpiA) this.kpiA.textContent = totalA;
      if (this.kpiG) this.kpiG.textContent = totalG;
      if (this.kpiN) this.kpiN.textContent = totalN;
    }
  }
}