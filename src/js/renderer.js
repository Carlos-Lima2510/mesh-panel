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
  { label: 'F1', left: [1, 2, 3, 4], right: [5, 6, 7, 8] },
  { label: 'F2', left: [9, 10, 11, 12], right: [13, 14, 15, 16] },
  { label: 'F3', left: [17, 18, 19, 20], right: [21, 22, 23, 24] },
  { label: 'F4', left: [25, 26, 27, 28], right: [29, 30, 31, 32] },
  { label: 'F5', left: [33, 34, 35, 36], right: [37, 38, 39, 40] }
];

export class DashboardRenderer {
  constructor(containerId = 'classroom-grid') {
    this.classroomGrid = document.getElementById(containerId);
    this.slotElements = new Map();
    this.currentSlotToHost = new Map();

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
      rowEl.appendChild(rightBlock);

      this.classroomGrid.appendChild(rowEl);
    });
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

  generarEmptySlotHtml(num) {
    const slotStr = String(num).padStart(2, '0');
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
          <div class="row"><span>Boca:</span><span>---</span></div>
          <div class="row"><span>Red:</span><span>Red Docencia</span></div>
        </div>
      </div>
      <div class="card-bottom">
        <div class="diag-compact" title="Mesa disponible">Disponible</div>
      </div>
    `;
  }

  generarCompactCardHtml(p, slotNum) {
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

    const redNombre = p.red?.nombre || (p.red?.es_aislada ? 'Red Prácticas' : 'Red Docencia');

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
          <div class="row">
            <span>Red:</span>
            <span title="${escapeHtml(redNombre)}">${escapeHtml(redNombre)}</span>
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

    const slotToHost = this.construirSlotMap(puestosMap);
    this.currentSlotToHost = slotToHost;

    for (const [key, slotCard] of this.slotElements.entries()) {
      const host = slotToHost.get(key);
      const displayNum = slotCard.dataset.num || key;

      if (host) {
        const isMatch = this.matches(host, query);
        slotCard.className = `card-compact ${host.estado}`;
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
        slotCard.className = 'card-compact card-empty';
        slotCard.innerHTML = this.generarEmptySlotHtml(displayNum);
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
