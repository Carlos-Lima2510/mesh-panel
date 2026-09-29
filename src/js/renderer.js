export class DashboardRenderer {
  constructor(gridElementId, kpiIds) {
    this.grid = document.getElementById(gridElementId);
    this.kpiV = document.getElementById(kpiIds.v);
    this.kpiA = document.getElementById(kpiIds.a);
    this.kpiN = document.getElementById(kpiIds.n);
  }

  render(puestosMap) {
    this.grid.innerHTML = '';
    let v = 0, a = 0, n = 0;

    puestosMap.forEach(p => {
      if (p.estado === 'VERDE') v++;
      else if (p.estado === 'AMARILLO') a++;
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
            <div class="row"><span>IP OS:</span><span>${p.telemetria?.ip_reportada || 'N/A'}</span></div>
          </div>
        </div>
        <div>
          <div class="diag">${p.diagnostico || ''}</div>
        </div>
      `;
      this.grid.appendChild(card);
    });

    this.kpiV.textContent = v;
    this.kpiA.textContent = a;
    this.kpiN.textContent = n;
  }
}