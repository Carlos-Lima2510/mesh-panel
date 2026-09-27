import { DashboardRenderer } from './renderer.js';
import { SseClient } from './sse-client.js';

const puestos = new Map();
const connBadge = document.getElementById('conn-status');

const renderer = new DashboardRenderer('grid', {
  v: 'kV',
  a: 'kA',
  n: 'kN'
});

const client = new SseClient(`http://${window.location.hostname}:3001`, {
  onOpen: () => {
    connBadge.classList.remove('offline');
    connBadge.querySelector('span:last-child').textContent = 'Canal de Eventos Activo';
  },
  onError: () => {
    connBadge.classList.add('offline');
    connBadge.querySelector('span:last-child').textContent = 'Reconectando daemon...';
  },
  onData: (data) => {
    if (data.tipo === 'INIT') {
      puestos.clear();
      data.puestos.forEach(p => puestos.set(p.node_id, p));
    } else if (data.tipo === 'UPDATE') {
      puestos.set(data.puesto.node_id, data.puesto);
    }
    renderer.render(puestos);
  }
});

client.connect();