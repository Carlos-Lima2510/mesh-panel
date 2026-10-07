export class DashboardRenderer {
  constructor(gridElementId, kpiIds) {
    this.grid = document.getElementById(gridElementId);
    this.kpiV = document.getElementById(kpiIds.v);
    this.kpiA = document.getElementById(kpiIds.a);
    this.kpiG = document.getElementById(kpiIds.g);
    this.kpiN = document.getElementById(kpiIds.n);
  }

  render(puestosMap) {
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
            <div class="row"><span>MeshAgent:</span><span>${p.telemetria?.os_online ? 'ON' : 'OFF'}</span></div>
            <div class="row"><span>Intel AMT:</span><span>${p.telemetria?.amt_online ? 'ON' : 'OFF'}</span></div>
            <div class="row"><span>Switch:</span><span>${p.telemetria?.switch ? `P${p.telemetria.switch.port} (${p.telemetria.switch.link} ${p.telemetria.switch.speed}M)` : 'N/A'}</span></div>
            <div class="row"><span>IP OS:</span><span>${p.telemetria?.ip_reportada || 'N/A'}</span></div>
          </div>
        </div>
        <div>
          <div class="diag">${p.diagnostico || ''}</div>
        </div>
      `;
      this.grid.appendChild(card);
    });

    if (this.kpiV) this.kpiV.textContent = v;
    if (this.kpiA) this.kpiA.textContent = a;
    if (this.kpiG) this.kpiG.textContent = g;
    if (this.kpiN) this.kpiN.textContent = n;
  }
}