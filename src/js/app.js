import { DashboardRenderer } from './renderer.js';
import { SseClient } from './sse-client.js';

const puestos = new Map();
const connBadge = document.getElementById('conn-status');
const btnScan = document.getElementById('btn-scan');
const scanText = document.getElementById('btn-scan-text');
const scanIcon = document.getElementById('btn-scan-icon');

const btnModeClase = document.getElementById('btn-mode-clase');
const btnModePractica = document.getElementById('btn-mode-practica');

const renderer = new DashboardRenderer('grid', {
  v: 'kV',
  a: 'kA',
  g: 'kG',
  n: 'kN'
});

const DAEMON_URL = `http://${window.location.hostname || 'localhost'}:3001`;

function setStatusBadge(text, isOffline = false) {
  if (!connBadge) return;
  if (isOffline) {
    connBadge.classList.add('offline');
  } else {
    connBadge.classList.remove('offline');
  }
  const span = connBadge.querySelector('span:last-child');
  if (span) span.textContent = text;
}

function actualizarBotonesModo(modo) {
  if (!btnModeClase || !btnModePractica) return;
  if (modo === 'PRACTICA') {
    btnModePractica.style.background = '#8b5cf6';
    btnModePractica.style.color = '#fff';
    btnModeClase.style.background = 'transparent';
    btnModeClase.style.color = '#475569';
  } else {
    btnModeClase.style.background = '#2563eb';
    btnModeClase.style.color = '#fff';
    btnModePractica.style.background = 'transparent';
    btnModePractica.style.color = '#475569';
  }
}

export async function fetchDevices() {
  if (btnScan) {
    btnScan.disabled = true;
    if (scanIcon) scanIcon.textContent = '⏳';
    if (scanText) scanText.textContent = 'Consultando Laboratorio...';
  }

  try {
    const res = await fetch(`${DAEMON_URL}/api/laboratorio`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    const lab = data.laboratorio;
    if (lab && Array.isArray(lab.hosts)) {
      actualizarBotonesModo(lab.modo);
      puestos.clear();
      lab.hosts.forEach(p => puestos.set(p.node_id, p));
      renderer.render(puestos, lab.metricas);
      const timeStr = new Date().toLocaleTimeString();
      setStatusBadge(`${lab.nombre} [Modo ${lab.modo}] | ${timeStr}`);
    }
  } catch (err) {
    console.error('[-] Error al consultar laboratorio:', err);
    setStatusBadge('Error al contactar daemon', true);
  } finally {
    if (btnScan) {
      btnScan.disabled = false;
      if (scanIcon) scanIcon.textContent = '🔄';
      if (scanText) scanText.textContent = 'Consultar Estado Puestos';
    }
  }
}

async function cambiarModo(modo) {
  try {
    setStatusBadge(`Cambiando a Modo ${modo}...`);
    const res = await fetch(`${DAEMON_URL}/api/laboratorio/modo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modo })
    });
    const data = await res.json();
    if (data.success && data.laboratorio) {
      actualizarBotonesModo(data.laboratorio.modo);
      puestos.clear();
      data.laboratorio.hosts.forEach(p => puestos.set(p.node_id, p));
      renderer.render(puestos, data.laboratorio.metricas);
      const timeStr = new Date().toLocaleTimeString();
      setStatusBadge(`${data.laboratorio.nombre} [Modo ${data.laboratorio.modo}] | ${timeStr}`);
    }
  } catch (err) {
    console.error('[-] Error al cambiar modo:', err);
    setStatusBadge('Error al cambiar modo', true);
  }
}

if (btnScan) {
  btnScan.addEventListener('click', fetchDevices);
}

if (btnModeClase) {
  btnModeClase.addEventListener('click', () => cambiarModo('CLASE'));
}

if (btnModePractica) {
  btnModePractica.addEventListener('click', () => cambiarModo('PRACTICA'));
}

window.ejecutarWoL = async function (nodeId) {
  try {
    setStatusBadge('Enviando Wake-on-LAN...');
    const res = await fetch(`${DAEMON_URL}/api/power/wake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: nodeId })
    });
    const data = await res.json();
    if (data.success) {
      alert(`[+] Paquete Wake-on-LAN emitido con éxito hacia el host.`);
    } else {
      alert(`[!] Error emitiendo WoL: ${data.error}`);
    }
    fetchDevices();
  } catch (err) {
    alert(`[!] Error de red: ${err.message}`);
  }
};

const client = new SseClient(DAEMON_URL, {
  onOpen: () => {
  },
  onError: () => {
  },
  onData: (data) => {
    if (data.tipo === 'INIT' && data.laboratorio) {
      const lab = data.laboratorio;
      actualizarBotonesModo(lab.modo);
      puestos.clear();
      lab.hosts.forEach(p => puestos.set(p.node_id, p));
      renderer.render(puestos, lab.metricas);
    }
  }
});

client.connect();

fetchDevices();