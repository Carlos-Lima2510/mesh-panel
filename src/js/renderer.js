export class DashboardRenderer {
  constructor(gridElementId, kpiIds) {
    this.grid = document.getElementById(gridElementId);
    this.kpiV = document.getElementById(kpiIds.v);
    this.kpiA = document.getElementById(kpiIds.a);
    this.kpiG = document.getElementById(kpiIds.g);
    this.kpiN = document.getElementById(kpiIds.n);
  }

  render(puestosMap, metricas = null) {
    this.grid.innerHTML = '';
    let v = 0, a = 0, g = 0, n = 0;

    puestosMap.forEach(p => {
      if (p.estado === 'VERDE') v++;
      else if (p.estado === 'AMARILLO') a++;
      else if (p.estado === 'GRIS') g++;
      else n++;

      const card = document.createElement('div');
      card.className = `card ${p.estado}`;
      card.innerHTML = `
        <div>
          <div class="card-top">
            <strong>${p.nombre}</strong>
            <span class="badge ${p.estado}">${p.estado}</span>
          </div>
          <div style="margin-top: 10px;">
            <div class="row"><span>Red:</span><span>${p.red ? p.red.nombre : 'General'}</span></div>
            <div class="row"><span>MeshAgent:</span><span>${p.telemetria?.os_online ? 'ON' : 'OFF'}</span></div>
            <div class="row"><span>Switch:</span><span>${p.telemetria?.switch ? `P${p.telemetria.switch.port} (${p.telemetria.switch.link} ${p.telemetria.switch.speed}M)` : 'N/A'}</span></div>
            <div class="row"><span>IP OS:</span><span>${p.telemetria?.ip_reportada || 'N/A'}</span></div>
          </div>
        </div>
        <div>
          <div class="diag">${p.diagnostico || ''}</div>
          ${p.accion ? `
            <div style="margin-top: 8px; font-size: 0.82rem; padding: 6px; background: rgba(0,0,0,0.04); border-radius: 4px; border-left: 3px solid currentColor;">
              <strong>Acción:</strong> ${p.accion.descripcion}
              ${p.accion.ejecutable ? `<button style="margin-top: 6px; width: 100%; padding: 5px; cursor: pointer; border-radius: 4px; border: 1px solid #aaa; background: #fff; font-weight: bold;" onclick="window.ejecutarWoL('${p.node_id}')">⚡ Despertar (WoL)</button>` : ''}
            </div>` : ''}
        </div>
      `;
      this.grid.appendChild(card);
    });

    if (metricas) {
      if (this.kpiV) this.kpiV.textContent = metricas.verde;
      if (this.kpiA) this.kpiA.textContent = metricas.amarillo;
      if (this.kpiG) this.kpiG.textContent = metricas.gris;
      if (this.kpiN) this.kpiN.textContent = metricas.naranja;
    } else {
      if (this.kpiV) this.kpiV.textContent = v;
      if (this.kpiA) this.kpiA.textContent = a;
      if (this.kpiG) this.kpiG.textContent = g;
      if (this.kpiN) this.kpiN.textContent = n;
    }
  }
}