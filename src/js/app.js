import { DashboardRenderer } from './renderer.js';
import { SseClient } from './sse-client.js';

const puestos = new Map();
let activeFilter = 'ALL';
let searchQuery = '';
let lastMetricas = null;
let isEditMode = false;

const connBadge = document.getElementById('conn-status');
const btnScan = document.getElementById('btn-scan');
const scanText = document.getElementById('btn-scan-text');
const scanIcon = document.getElementById('btn-scan-icon');

const btnModeClase = document.getElementById('btn-mode-clase');
const btnModePractica = document.getElementById('btn-mode-practica');

const selectDistribucion = document.getElementById('select-distribucion');
const btnToggleEdit = document.getElementById('btn-toggle-edit');
const btnDoneEdit = document.getElementById('btn-done-edit');
const editBanner = document.getElementById('edit-mode-banner');

const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const btnResetFilters = document.getElementById('btn-reset-filters');
const kpiButtons = document.querySelectorAll('.kpi-box .kpi');

const renderer = new DashboardRenderer('classroom-grid', {
  t: 'kT',
  v: 'kV',
  a: 'kA',
  g: 'kG',
  n: 'kN'
});

const DAEMON_URL = `http://${window.location.hostname || 'localhost'}:3001`;

/**
 * Actualiza el indicador visual de estado de conexión.
 */
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

/**
 * Sincroniza la apariencia visual de los botones de modo de laboratorio.
 */
function actualizarBotonesModo(modo) {
  if (!btnModeClase || !btnModePractica) return;
  if (modo === 'PRACTICA') {
    btnModePractica.classList.add('active-practica');
    btnModeClase.classList.remove('active-clase');
  } else {
    btnModeClase.classList.add('active-clase');
    btnModePractica.classList.remove('active-practica');
  }
}

/**
 * Sincroniza el selector de distribuciones espaciales.
 */
function sincronizarDistribuciones(distribuciones, activa) {
  if (!selectDistribucion || !Array.isArray(distribuciones) || distribuciones.length === 0) return;

  const activaId = activa ? activa.id : null;
  const opcionesActuales = Array.from(selectDistribucion.options).map(o => o.value);
  const idsNuevos = distribuciones.map(d => d.id);

  // Si cambiaron las opciones, regenerar
  const cambio = opcionesActuales.length !== idsNuevos.length ||
    idsNuevos.some((id, idx) => opcionesActuales[idx] !== id);

  if (cambio) {
    selectDistribucion.innerHTML = '';
    distribuciones.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `${d.nombre} (${d.total_puestos || d.puestos?.length || 56})`;
      selectDistribucion.appendChild(opt);
    });
  }

  if (activaId && selectDistribucion.value !== activaId) {
    selectDistribucion.value = activaId;
  }
}

/**
 * Sincroniza la clase activa en los botones KPI de filtrado rápido.
 */
function actualizarBotonesFiltro(filtro) {
  kpiButtons.forEach(btn => {
    const f = btn.dataset.filter || 'ALL';
    if (f === filtro) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Dispara el renderizado reactivo con los filtros, modo de edición y búsqueda activos.
 */
function actualizarVista() {
  renderer.render(puestos, lastMetricas, {
    filter: activeFilter,
    query: searchQuery,
    editMode: isEditMode,
    onMoveHost: moverHost,
    onReset: resetearFiltros
  });
}

/**
 * Restablece todos los filtros de búsqueda y estado.
 */
function resetearFiltros() {
  activeFilter = 'ALL';
  searchQuery = '';
  if (searchInput) searchInput.value = '';
  if (btnClearSearch) btnClearSearch.style.display = 'none';
  actualizarBotonesFiltro('ALL');
  actualizarVista();
}

/**
 * Alterna el modo interactivo de reorganización espacial.
 */
function toggleModoEdicion(forzar = null) {
  isEditMode = forzar !== null ? forzar : !isEditMode;

  if (btnToggleEdit) {
    if (isEditMode) {
      btnToggleEdit.classList.add('active-editing');
      const text = btnToggleEdit.querySelector('#btn-edit-text');
      if (text) text.textContent = 'Editando...';
    } else {
      btnToggleEdit.classList.remove('active-editing');
      const text = btnToggleEdit.querySelector('#btn-edit-text');
      if (text) text.textContent = 'Reorganizar';
    }
  }

  if (editBanner) {
    editBanner.style.display = isEditMode ? 'flex' : 'none';
  }

  actualizarVista();
}

/**
 * Mueve un host a una nueva ubicación o intercambia puestos mediante la API.
 */
async function moverHost(hostId, targetSlot) {
  try {
    setStatusBadge(`Reubicando en puesto #${targetSlot}...`);
    const res = await fetch(`${DAEMON_URL}/api/distribuciones/mover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_id: hostId, slot: targetSlot })
    });
    const data = await res.json();
    if (data.success && data.laboratorio) {
      procesarDatosLaboratorio(data.laboratorio);
      setStatusBadge(`Puesto #${targetSlot} actualizado con éxito`);
    } else {
      alert(`[!] Error al mover puesto: ${data.error || 'Error desconocido'}`);
    }
  } catch (err) {
    console.error('[-] Error reubicando puesto:', err);
    setStatusBadge('Error al mover puesto', true);
  }
}

/**
 * Cambia la distribución espacial activa (plano).
 */
async function cambiarDistribucion(id) {
  try {
    setStatusBadge(`Cambiando plano a ${id}...`);
    const res = await fetch(`${DAEMON_URL}/api/distribuciones/activar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success && data.laboratorio) {
      procesarDatosLaboratorio(data.laboratorio);
      setStatusBadge(`Plano activo: ${data.laboratorio.distribucion_activa?.nombre || id}`);
    }
  } catch (err) {
    console.error('[-] Error activando distribución:', err);
    setStatusBadge('Error al cambiar plano', true);
  }
}

/**
 * Procesa la carga de datos del agregado Laboratorio.
 */
function procesarDatosLaboratorio(lab) {
  if (!lab) return;

  if (Array.isArray(lab.hosts)) {
    puestos.clear();
    lab.hosts.forEach(p => puestos.set(p.node_id, p));
  }

  actualizarBotonesModo(lab.modo);
  sincronizarDistribuciones(lab.distribuciones, lab.distribucion_activa);
  lastMetricas = lab.metricas;
  actualizarVista();

  const timeStr = new Date().toLocaleTimeString();
  const nombreDist = lab.distribucion_activa ? lab.distribucion_activa.nombre : 'Aula';
  setStatusBadge(`${lab.nombre} [${lab.modo}] | ${nombreDist} | ${timeStr}`);
}

/**
 * Consulta el estado consolidado del laboratorio al daemon backend.
 */
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

/**
 * Envía el cambio de modo operativo (CLASE / PRACTICA) al backend.
 */
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

// -----------------------------------------------------------------------------
// EVENT LISTENERS: Distribuciones y Modo Reorganización
// -----------------------------------------------------------------------------

if (selectDistribucion) {
  selectDistribucion.addEventListener('change', (e) => {
    cambiarDistribucion(e.target.value);
  });
}

if (btnToggleEdit) {
  btnToggleEdit.addEventListener('click', () => toggleModoEdicion());
}

if (btnDoneEdit) {
  btnDoneEdit.addEventListener('click', () => toggleModoEdicion(false));
}

// -----------------------------------------------------------------------------
// EVENT LISTENERS: Búsqueda y Filtros Interactivos
// -----------------------------------------------------------------------------

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

if (btnResetFilters) {
  btnResetFilters.addEventListener('click', resetearFiltros);
}

kpiButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetFilter = btn.dataset.filter || 'ALL';
    if (activeFilter === targetFilter && targetFilter !== 'ALL') {
      activeFilter = 'ALL';
    } else {
      activeFilter = targetFilter;
    }
    actualizarBotonesFiltro(activeFilter);
    actualizarVista();
  });
});

if (btnScan) {
  btnScan.addEventListener('click', fetchDevices);
}

if (btnModeClase) {
  btnModeClase.addEventListener('click', () => cambiarModo('CLASE'));
}

if (btnModePractica) {
  btnModePractica.addEventListener('click', () => cambiarModo('PRACTICA'));
}

/**
 * Emisión de paquete mágico Wake-on-LAN
 */
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

/**
 * Apagado remoto del equipo mediante MeshCentral
 */
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

// -----------------------------------------------------------------------------
// CLIENTE SSE EN TIEMPO REAL
// -----------------------------------------------------------------------------
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

// Carga inicial
fetchDevices();