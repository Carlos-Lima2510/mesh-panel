/**
 * DashboardRenderer
 * Renderizado de la distribución del laboratorio (56 puestos físicos en 2 hileras de 5 columnas)
 * con tarjetas de tamaño estrictamente idéntico tanto para puestos activos como vacíos.
 */

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
    this.emptyStateEl = null;

    // Crear la estructura física de 56 escritorios
    this.inicializarEstructuraMapa();
  }

  /**
   * Genera las 6 filas con el pasillo central y los 56 escritorios de tamaño uniforme.
   */
  inicializarEstructuraMapa() {
    if (!this.classroomGrid || this.classroomGrid.children.length > 0) return;

    CLASSROOM_ROWS.forEach(rowData => {
      const rowEl = document.createElement('div');
      rowEl.className = 'classroom-row';

      // Etiqueta de Fila (F1, F2...)
      const labelEl = document.createElement('div');
      labelEl.className = 'row-label';
      labelEl.textContent = rowData.label;
      rowEl.appendChild(labelEl);

      // Bloque Izquierdo (5 columnas exactas)
      const leftBlock = document.createElement('div');
      leftBlock.className = 'row-block';
      rowData.left.forEach(slotNum => {
        const slotCard = document.createElement('div');
        slotCard.className = 'card-compact card-empty';
        slotCard.dataset.slot = slotNum;
        leftBlock.appendChild(slotCard);
        this.slotElements.set(slotNum, slotCard);
      });
      // Rellenar huecos libres en fila 6 para mantener las 5 columnas idénticas
      for (let i = rowData.left.length; i < 5; i++) {
        const ghost = document.createElement('div');
        ghost.className = 'card-compact card-ghost';
        leftBlock.appendChild(ghost);
      }
      rowEl.appendChild(leftBlock);

      // Pasillo Central
      const aisleEl = document.createElement('div');
      aisleEl.className = 'aisle-divider';
      rowEl.appendChild(aisleEl);

      // Bloque Derecho (5 columnas exactas)
      const rightBlock = document.createElement('div');
      rightBlock.className = 'row-block';
      rowData.right.forEach(slotNum => {
        const slotCard = document.createElement('div');
        slotCard.className = 'card-compact card-empty';
        slotCard.dataset.slot = slotNum;
        rightBlock.appendChild(slotCard);
        this.slotElements.set(slotNum, slotCard);
      });
      // Rellenar huecos libres en fila 6
      for (let i = rowData.right.length; i < 5; i++) {
        const ghost = document.createElement('div');
        ghost.className = 'card-compact card-ghost';
        rightBlock.appendChild(ghost);
      }
      rowEl.appendChild(rightBlock);

      this.classroomGrid.appendChild(rowEl);
    });
  }

  /**
   * Resuelve el slot físico (1 a 56) de cada host.
   */
  construirSlotMap(puestosMap) {
    const slotToHost = new Map();
    const unassigned = [];

    puestosMap.forEach(p => {
      let slot = null;
      if (typeof p.slot === 'number' && p.slot >= 1 && p.slot <= 56) {
        slot = p.slot;
      } else if (typeof p.posicion === 'number' && p.posicion >= 1 && p.posicion <= 56) {
        slot = p.posicion;
      } else if (p.boca_switch && /^port0*([1-9]|[1-4][0-9]|5[0-6])$/i.test(p.boca_switch)) {
        slot = parseInt(p.boca_switch.replace(/^port0*/i, ''), 10);
      } else if (p.nombre) {
        const match = p.nombre.match(/(?:pc|puesto|host|uea|c)?[-_\s]?0*([1-9]|[1-4][0-9]|5[0-6])$/i);
        if (match) {
          slot = parseInt(match[1], 10);
        }
      }

      if (slot && slot >= 1 && slot <= 56 && !slotToHost.has(slot)) {
        slotToHost.set(slot, p);
      } else {
        unassigned.push(p);
      }
    });

    // Puestos sin número explícito se asignan a slots libres
    let nextFreeSlot = 1;
    unassigned.forEach(p => {
      while (nextFreeSlot <= 56 && slotToHost.has(nextFreeSlot)) {
        nextFreeSlot++;
      }
      if (nextFreeSlot <= 56) {
        slotToHost.set(nextFreeSlot, p);
        nextFreeSlot++;
      }
    });

    return slotToHost;
  }

  /**
   * Comprueba si un puesto cumple los filtros activos.
   */
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

  /**
   * HTML de tarjeta de puesto activo (geometría y filas idénticas a la vacía).
   */
  generarCompactCardHtml(p, slotNum) {
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
    const slotStr = String(slotNum).padStart(2, '0');

    let bottomActionHtml = '';
    if (p.accion && p.accion.ejecutable) {
      bottomActionHtml = `<button type="button" class="btn-wol" onclick="window.ejecutarWoL('${escapeHtml(p.node_id)}')">⚡ WoL</button>`;
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

  /**
   * HTML de puesto libre/vacío (geometría y filas idénticas a la activa).
   */
  generarEmptySlotHtml(slotNum) {
    const slotStr = String(slotNum).padStart(2, '0');
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
          <div class="row"><span>Switch:</span><span>port${slotNum}</span></div>
          <div class="row"><span>IP:</span><span>Sin asignar</span></div>
          <div class="row"><span>Mesh:</span><span>OFF</span></div>
        </div>
      </div>
      <div class="card-bottom">
        <div class="diag-compact" title="Puesto disponible">Disponible</div>
      </div>
    `;
  }

  /**
   * Renderiza el laboratorio con tamaño estrictamente idéntico para todos los escritorios.
   */
  render(puestosMap, metricas = null, options = {}) {
    const filter = options.filter || 'ALL';
    const query = options.query || '';
    const hasFilter = filter !== 'ALL' || Boolean(query && query.trim());

    let totalV = 0, totalA = 0, totalG = 0, totalN = 0;
    let visibleCount = 0;
    const totalCount = puestosMap.size;

    const slotToHost = this.construirSlotMap(puestosMap);

    // Contabilizar métricas locales
    puestosMap.forEach(p => {
      if (p.estado === 'VERDE') totalV++;
      else if (p.estado === 'AMARILLO') totalA++;
      else if (p.estado === 'GRIS') totalG++;
      else totalN++;

      if (this.matches(p, filter, query)) {
        visibleCount++;
      }
    });

    // Renderizar los 56 escritorios
    for (let slotNum = 1; slotNum <= 56; slotNum++) {
      const slotCard = this.slotElements.get(slotNum);
      if (!slotCard) continue;

      const host = slotToHost.get(slotNum);
      if (host) {
        const isMatch = this.matches(host, filter, query);
        slotCard.className = `card-compact ${host.estado}`;
        slotCard.innerHTML = this.generarCompactCardHtml(host, slotNum);

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
        slotCard.innerHTML = this.generarEmptySlotHtml(slotNum);
        if (hasFilter) {
          slotCard.classList.add('dimmed');
          slotCard.classList.remove('match-highlight');
        } else {
          slotCard.classList.remove('dimmed', 'match-highlight');
        }
      }
    }

    // Actualizar contadores
    if (this.counterEl) {
      this.counterEl.innerHTML = `Mostrando <strong>${visibleCount}</strong> de <strong>${totalCount}</strong> puestos (Total aula: 56)`;
    }

    if (this.resetBtn) {
      this.resetBtn.style.display = hasFilter ? 'inline-block' : 'none';
    }

    // Actualizar KPIs
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