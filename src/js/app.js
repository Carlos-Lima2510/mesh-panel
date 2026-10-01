import { DashboardRenderer } from './renderer.js';
import { SseClient } from './sse-client.js';

const puestos = new Map();
const connBadge = document.getElementById('conn-status');
const btnScan = document.getElementById('btn-scan');
const scanText = document.getElementById('btn-scan-text');
const scanIcon = document.getElementById('btn-scan-icon');

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

export async function fetchDevices() {
  if (btnScan) {
    btnScan.disabled = true;
    if (scanIcon) scanIcon.textContent = '⏳';
    if (scanText) scanText.textContent = 'Consultando MeshCentral...';
  }

  try {
    const res = await fetch(`${DAEMON_URL}/api/devices`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    if (Array.isArray(data.puestos)) {
      puestos.clear();
      data.puestos.forEach(p => puestos.set(p.node_id, p));
      renderer.render(puestos);
      const timeStr = new Date().toLocaleTimeString();
      setStatusBadge(`Actualizado: ${timeStr}`);
    }
  } catch (err) {
    console.error('[-] Error al consultar dispositivos a demanda:', err);
    setStatusBadge('Error al contactar daemon', true);
  } finally {
    if (btnScan) {
      btnScan.disabled = false;
      if (scanIcon) scanIcon.textContent = '🔄';
      if (scanText) scanText.textContent = 'Consultar Estado Puestos';
    }
  }
}

if (btnScan) {
  btnScan.addEventListener('click', fetchDevices);
}

const client = new SseClient(DAEMON_URL, {
  onOpen: () => {
  },
  onError: () => {
  },
  onData: (data) => {
    if (data.tipo === 'INIT' && Array.isArray(data.puestos)) {
      puestos.clear();
      data.puestos.forEach(p => puestos.set(p.node_id, p));
      renderer.render(puestos);
    } else if (data.tipo === 'UPDATE' && data.puesto) {
      puestos.set(data.puesto.node_id, data.puesto);
      renderer.render(puestos);
    }
  }
});

client.connect();

fetchDevices();