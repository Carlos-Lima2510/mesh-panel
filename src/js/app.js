import { DashboardRenderer } from './renderer.js';
import { SseClient } from './sse-client.js';

const puestos = new Map();
let puestosFisicos = [];
let switchesDisponibles = [];
let labFilas = 5;
let labColsHilera = 4;
let labColumnas = 8;
let searchQuery = '';
let lastMetricas = null;

const connBadge = document.getElementById('conn-status');
const btnScan = document.getElementById('btn-scan');
const scanText = document.getElementById('btn-scan-text');
const scanIcon = document.getElementById('btn-scan-icon');

const btnModeClase = document.getElementById('btn-mode-clase');
const btnModePractica = document.getElementById('btn-mode-practica');
const btnModeCableado = document.getElementById('btn-mode-cableado');

const inputFilas = document.getElementById('input-filas');
const inputColumnas = document.getElementById('input-columnas');
const btnAplicarCuadricula = document.getElementById('btn-aplicar-cuadricula');

const inputRangeDesde = document.getElementById('input-range-desde');
const inputRangeHasta = document.getElementById('input-range-hasta');
const selectRangeSwitch = document.getElementById('select-range-switch');
const btnAplicarRangoSwitch = document.getElementById('btn-aplicar-rango-switch');

const totalPuestosBadge = document.getElementById('total-puestos-badge');
const gridDimsBadge = document.getElementById('grid-dims-badge');

const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');

const renderer = new DashboardRenderer('classroom-grid');

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
  btnModeClase.classList.remove('active-clase');
  btnModePractica.classList.remove('active-practica');
  if (btnModeCableado) btnModeCableado.classList.remove('active-cableado');

  if (modo === 'PRACTICA') {
    btnModePractica.classList.add('active-practica');
  } else if (modo === 'CABLEADO') {
    if (btnModeCableado) btnModeCableado.classList.add('active-cableado');
  } else {
    btnModeClase.classList.add('active-clase');
  }
}

function actualizarVista() {
  renderer.render(puestos, lastMetricas, {
    query: searchQuery,
    puestosFisicos,
    switches: switchesDisponibles,
    filas: labFilas,
    colsHilera: labColsHilera,
    columnas_hilera: labColsHilera,
    columnas: labColumnas
  });
}

function actualizarSelectRangeOptions() {
  if (!selectRangeSwitch || !Array.isArray(switchesDisponibles) || switchesDisponibles.length === 0) return;
  const currentVal = selectRangeSwitch.value;
  selectRangeSwitch.innerHTML = switchesDisponibles.map(sw => `
    <option value="${sw.id}" ${sw.id === currentVal ? 'selected' : ''}>${sw.nombre || sw.id}</option>
  `).join('');
}

function procesarDatosLaboratorio(lab) {
  if (!lab) return;

  if (Array.isArray(lab.hosts)) {
    puestos.clear();
    lab.hosts.forEach(p => puestos.set(p.node_id, p));
  }

  if (Array.isArray(lab.puestos)) {
    puestosFisicos = lab.puestos;
  }

  if (Array.isArray(lab.switches)) {
    switchesDisponibles = lab.switches;
    actualizarSelectRangeOptions();
  }

  if (typeof lab.filas === 'number') labFilas = lab.filas;
  if (typeof lab.columnas_hilera === 'number') {
    labColsHilera = lab.columnas_hilera;
    labColumnas = labColsHilera * 2;
  } else if (typeof lab.columnas === 'number') {
    labColsHilera = Math.ceil(lab.columnas / 2);
    labColumnas = labColsHilera * 2;
  }

  if (inputFilas && document.activeElement !== inputFilas) {
    inputFilas.value = labFilas;
  }
  if (inputColumnas && document.activeElement !== inputColumnas) {
    inputColumnas.value = labColsHilera;
  }

  const totalCalculado = puestosFisicos.length || (labFilas * labColumnas);
  if (totalPuestosBadge) {
    totalPuestosBadge.textContent = `${totalCalculado} Puestos (${labFilas}F × ${labColsHilera}+${labColsHilera}C)`;
  }
  if (gridDimsBadge) {
    gridDimsBadge.textContent = `${labFilas} Filas × ${labColsHilera}+${labColsHilera} Cols`;
  }
  if (inputRangeHasta && (!inputRangeHasta.value || parseInt(inputRangeHasta.value, 10) > totalCalculado)) {
    inputRangeHasta.value = Math.min(20, totalCalculado);
    inputRangeHasta.max = totalCalculado;
  }

  actualizarBotonesModo(lab.modo);
  lastMetricas = lab.metricas;
  actualizarVista();

  const timeStr = new Date().toLocaleTimeString();
  setStatusBadge(`${lab.nombre} [${lab.modo}] (${labFilas}F × ${labColsHilera}+${labColsHilera}C) | ${timeStr}`);
}

export async function fetchDevices() {
  if (btnScan) {
    btnScan.disabled = true;
    if (scanIcon) scanIcon.textContent = '⏳';
    if (scanText) scanText.textContent = 'Consultando...';
  }

  try {
    const res = await fetch(`${DAEMON_URL}/api/laboratorio`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    if (data.laboratorio) {
      procesarDatosLaboratorio(data.laboratorio);
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
      procesarDatosLaboratorio(data.laboratorio);
    }
  } catch (err) {
    console.error('[-] Error al cambiar modo:', err);
    setStatusBadge('Error al cambiar modo', true);
  }
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (btnClearSearch) {
      btnClearSearch.style.display = searchQuery ? 'block' : 'none';
    }
    actualizarVista();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchQuery = '';
      if (btnClearSearch) btnClearSearch.style.display = 'none';
      actualizarVista();
    }
  });
}

if (btnClearSearch) {
  btnClearSearch.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    searchQuery = '';
    btnClearSearch.style.display = 'none';
    if (searchInput) searchInput.focus();
    actualizarVista();
  });
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

if (btnModeCableado) {
  btnModeCableado.addEventListener('click', () => cambiarModo('CABLEADO'));
}

window.cambiarSwitchPuesto = async function (puestoId, switchId) {
  try {
    setStatusBadge(`Asignando ${puestoId} a ${switchId}...`);
    const res = await fetch(`${DAEMON_URL}/api/puestos/asignar-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puesto_id: puestoId,
        switch_id: switchId
      })
    });
    const data = await res.json();
    if (data.success && data.laboratorio) {
      procesarDatosLaboratorio(data.laboratorio);
    }
  } catch (err) {
    console.error('[-] Error asignando switch a puesto:', err);
    setStatusBadge('Error al asignar switch', true);
  }
};

async function aplicarDimensionesCuadricula() {
  const filas = parseInt(inputFilas?.value, 10);
  const colsHilera = parseInt(inputColumnas?.value, 10);
  if (!filas || !colsHilera || filas < 1 || colsHilera < 1) {
    alert('Introduce dimensiones válidas (mínimo 1 fila y 1 columna por hilera).');
    return;
  }

  // 1. Actualización visual instantánea en el cliente (0ms) con pasillo en medio siempre
  labFilas = filas;
  labColsHilera = colsHilera;
  labColumnas = colsHilera * 2;
  const total = labFilas * labColumnas;

  if (totalPuestosBadge) {
    totalPuestosBadge.textContent = `${total} Puestos (${labFilas}F × ${colsHilera}+${colsHilera}C)`;
  }
  if (gridDimsBadge) {
    gridDimsBadge.textContent = `${labFilas} Filas × ${colsHilera}+${colsHilera} Cols`;
  }
  if (inputRangeHasta) {
    inputRangeHasta.max = total;
  }

  renderer.inicializarEstructuraMapa(labFilas, labColsHilera);
  actualizarVista();
  setStatusBadge(`Cuadrícula: ${labFilas} filas × ${colsHilera}+${colsHilera} cols (${total} puestos)`);

  // 2. Sincronización con el daemon backend
  try {
    const res = await fetch(`${DAEMON_URL}/api/laboratorio/dimensiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filas: labFilas,
        columnas: labColumnas,
        columnas_hilera: labColsHilera
      })
    });
    const data = await res.json();
    if (data.success && data.laboratorio) {
      procesarDatosLaboratorio(data.laboratorio);
    }
  } catch (err) {
    console.error('[-] Error sincronizando dimensiones con el daemon:', err);
  }
}

async function aplicarRangoSwitch() {
  const desde = parseInt(inputRangeDesde?.value, 10);
  const hasta = parseInt(inputRangeHasta?.value, 10);
  const switchId = selectRangeSwitch?.value || 'sw-docente';
  if (!desde || !hasta || desde < 1 || hasta < desde) {
    alert('Introduce un rango válido (desde ≤ hasta).');
    return;
  }
  try {
    setStatusBadge(`Asignando puestos #${desde} a #${hasta} a ${switchId}...`);
    const res = await fetch(`${DAEMON_URL}/api/puestos/asignar-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desde, hasta, switch_id: switchId })
    });
    const data = await res.json();
    if (data.success && data.laboratorio) {
      procesarDatosLaboratorio(data.laboratorio);
    }
  } catch (err) {
    console.error('[-] Error asignando rango de switches:', err);
    setStatusBadge('Error al asignar switch por rango', true);
  }
}

if (btnAplicarCuadricula) {
  btnAplicarCuadricula.addEventListener('click', aplicarDimensionesCuadricula);
}

[inputFilas, inputColumnas].forEach(inp => {
  if (inp) {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') aplicarDimensionesCuadricula();
    });
  }
});

if (btnAplicarRangoSwitch) {
  btnAplicarRangoSwitch.addEventListener('click', aplicarRangoSwitch);
}

[inputRangeDesde, inputRangeHasta].forEach(inp => {
  if (inp) {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') aplicarRangoSwitch();
    });
  }
});

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
      const msg = (data.resultado && data.resultado.salida) || 'Paquete Wake-on-LAN emitido con éxito hacia el host.';
      alert(`[+] ${msg}`);
    } else {
      const msg = (data.resultado && data.resultado.salida) || data.error || 'Error desconocido';
      alert(`[!] Error emitiendo WoL: ${msg}`);
    }
    fetchDevices();
  } catch (err) {
    alert(`[!] Error de red: ${err.message}`);
  }
};

window.ejecutarPowerOff = async function (nodeId) {
  if (!confirm('¿Confirmas el apagado remoto de este equipo?')) {
    return;
  }
  try {
    setStatusBadge('Enviando orden de apagado...');
    const res = await fetch(`${DAEMON_URL}/api/power/off`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: nodeId, accion: 'POWER_OFF' })
    });
    const data = await res.json();
    if (data.success) {
      const msg = (data.resultado && data.resultado.salida) || 'Orden de apagado enviada con éxito hacia el host.';
      alert(`[+] ${msg}`);
    } else {
      const msg = (data.resultado && data.resultado.salida) || data.error || 'Error desconocido';
      alert(`[!] Error al apagar equipo: ${msg}`);
    }
    fetchDevices();
  } catch (err) {
    alert(`[!] Error de red: ${err.message}`);
  }
};

const client = new SseClient(`${DAEMON_URL}/events`, {
  onOpen: () => {
    setStatusBadge('En vivo (SSE conectado)');
  },
  onError: () => {
    setStatusBadge('Reconectando SSE...', true);
  },
  onData: (data) => {
    if (data.tipo === 'INIT' && data.laboratorio) {
      procesarDatosLaboratorio(data.laboratorio);
    }
  }
});

client.connect();

fetchDevices();
