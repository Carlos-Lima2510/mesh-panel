import { DashboardRenderer } from './renderer.js';
import { SseClient } from './sse-client.js';

const puestos = new Map();
let activeFilter = 'ALL';
let searchQuery = '';
let lastMetricas = null;
let lastDistribucionActiva = null;
let isEditMode = false;

const connBadge = document.getElementById('conn-status');
const btnScan = document.getElementById('btn-scan');
const scanText = document.getElementById('btn-scan-text');
const scanIcon = document.getElementById('btn-scan-icon');

const btnModeClase = document.getElementById('btn-mode-clase');
const btnModePractica = document.getElementById('btn-mode-practica');

const selectDistribucion = document.getElementById('select-distribucion');
const btnAddDistribucion = document.getElementById('btn-add-distribucion');
const btnDelDistribucion = document.getElementById('btn-del-distribucion');
const modalDistribucion = document.getElementById('modal-distribucion');
const formNuevaDistribucion = document.getElementById('form-nueva-distribucion');
const btnCloseModalDist = document.getElementById('btn-close-modal-dist');
const btnCancelModalDist = document.getElementById('btn-cancel-modal-dist');

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
    btnModePractica.classList.add('active-practica');
    btnModeClase.classList.remove('active-clase');
  } else {
    btnModeClase.classList.add('active-clase');
    btnModePractica.classList.remove('active-practica');
  }
}

function sincronizarDistribuciones(distribuciones, activa) {
  if (!selectDistribucion || !Array.isArray(distribuciones) || distribuciones.length === 0) return;

  const activaId = activa ? activa.id : null;
  const opcionesActuales = Array.from(selectDistribucion.options).map(o => o.value);
  const idsNuevos = distribuciones.map(d => d.id);

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

function actualizarVista() {
  renderer.render(puestos, lastMetricas, {
    filter: activeFilter,
    query: searchQuery,
    editMode: isEditMode,
    distribucion: lastDistribucionActiva,
    onMoveHost: moverHost,
    onReset: resetearFiltros
  });
}

function resetearFiltros() {
  activeFilter = 'ALL';
  searchQuery = '';
  if (searchInput) searchInput.value = '';
  if (btnClearSearch) btnClearSearch.style.display = 'none';
  actualizarBotonesFiltro('ALL');
  actualizarVista();
}

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

async function moverHost(hostId, targetSlot) {
  try {
    setStatusBadge(`Reubicando en puesto #${targetSlot}...`);
    const res = await fetch(`${DAEMON_URL}/api/distribuciones/mover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_id: hostId, puesto_id: targetSlot })
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

function procesarDatosLaboratorio(lab) {
  if (!lab) return;

  if (Array.isArray(lab.hosts)) {
    puestos.clear();
    lab.hosts.forEach(p => puestos.set(p.node_id, p));
  }

  lastDistribucionActiva = lab.distribucion_activa;
  actualizarBotonesModo(lab.modo);
  sincronizarDistribuciones(lab.distribuciones, lab.distribucion_activa);
  lastMetricas = lab.metricas;
  actualizarVista();

  const timeStr = new Date().toLocaleTimeString();
  const nombreDist = lab.distribucion_activa ? lab.distribucion_activa.nombre : 'Aula';
  setStatusBadge(`${lab.nombre} [${lab.modo}] | ${nombreDist} | ${timeStr}`);
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

function abrirModalDistribucion() {
  if (modalDistribucion) {
    modalDistribucion.style.display = 'flex';
    const inputNombre = document.getElementById('dist-nombre');
    if (inputNombre) {
      inputNombre.value = '';
      inputNombre.focus();
    }
    const inputId = document.getElementById('dist-id');
    if (inputId) inputId.value = '';
  }
}

function cerrarModalDistribucion() {
  if (modalDistribucion) {
    modalDistribucion.style.display = 'none';
  }
}

if (selectDistribucion) {
  selectDistribucion.addEventListener('change', (e) => {
    cambiarDistribucion(e.target.value);
  });
}

if (btnAddDistribucion) {
  btnAddDistribucion.addEventListener('click', abrirModalDistribucion);
}

if (btnCloseModalDist) {
  btnCloseModalDist.addEventListener('click', cerrarModalDistribucion);
}

if (btnCancelModalDist) {
  btnCancelModalDist.addEventListener('click', cerrarModalDistribucion);
}

if (modalDistribucion) {
  modalDistribucion.addEventListener('click', (e) => {
    if (e.target === modalDistribucion) cerrarModalDistribucion();
  });
}

const inputNombreDist = document.getElementById('dist-nombre');
const inputIdDist = document.getElementById('dist-id');
if (inputNombreDist && inputIdDist) {
  inputNombreDist.addEventListener('input', () => {
    const slug = inputNombreDist.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    inputIdDist.placeholder = slug ? `dist-${slug}` : 'dist-mi-aula';
  });
}

if (formNuevaDistribucion) {
  formNuevaDistribucion.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('dist-nombre').value.trim();
    let id = document.getElementById('dist-id').value.trim();
    const filas = parseInt(document.getElementById('dist-filas').value, 10) || 4;
    const columnas = parseInt(document.getElementById('dist-columnas').value, 10) || 6;
    const estrategia = document.getElementById('dist-tipo-puestos').value || 'completa';

    if (!nombre) {
      alert('Debe proporcionar un nombre para la distribución.');
      return;
    }

    if (!id) {
      const slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      id = slug ? `dist-${slug}` : `dist-${Date.now()}`;
    }

    const puestosNuevos = [];
    let slotNum = 1;

    if (estrategia === 'completa') {
      for (let f = 1; f <= filas; f++) {
        for (let c = 1; c <= columnas; c++) {
          puestosNuevos.push({
            id: `puesto-${slotNum}`,
            etiqueta: `Puesto ${String(slotNum).padStart(2, '0')}`,
            fila: f,
            columna: c
          });
          slotNum++;
        }
      }
    } else if (estrategia === 'pasillo') {
      const leftCols = Math.max(1, Math.floor(columnas / 2));
      const rightCols = Math.max(1, columnas - leftCols);
      for (let f = 1; f <= filas; f++) {
        for (let c = 1; c <= leftCols; c++) {
          puestosNuevos.push({
            id: `puesto-${slotNum}`,
            etiqueta: `Puesto ${String(slotNum).padStart(2, '0')}`,
            fila: f,
            columna: c
          });
          slotNum++;
        }
        for (let c = 1; c <= rightCols; c++) {
          puestosNuevos.push({
            id: `puesto-${slotNum}`,
            etiqueta: `Puesto ${String(slotNum).padStart(2, '0')}`,
            fila: f,
            columna: c + leftCols + 1
          });
          slotNum++;
        }
      }
    } else if (estrategia === 'alternos') {
      for (let f = 1; f <= filas; f++) {
        for (let c = 1; c <= columnas; c++) {
          if ((f + c) % 2 === 0) {
            puestosNuevos.push({
              id: `puesto-${slotNum}`,
              etiqueta: `Examen ${String(slotNum).padStart(2, '0')}`,
              fila: f,
              columna: c
            });
            slotNum++;
          }
        }
      }
    }

    try {
      setStatusBadge(`Creando plano '${nombre}'...`);
      const res = await fetch(`${DAEMON_URL}/api/distribuciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          nombre,
          filas,
          columnas: estrategia === 'pasillo' ? columnas + 1 : columnas,
          puestos: puestosNuevos
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'No fue posible registrar la distribución');
      }

      await cambiarDistribucion(id);
      cerrarModalDistribucion();
      formNuevaDistribucion.reset();
      setStatusBadge(`Distribución '${nombre}' creada y activada`);
    } catch (err) {
      alert(`[!] Error: ${err.message}`);
      setStatusBadge('Error creando distribución', true);
    }
  });
}

if (btnDelDistribucion) {
  btnDelDistribucion.addEventListener('click', async () => {
    if (!lastDistribucionActiva) return;
    if (lastDistribucionActiva.id === 'dist-aula-56') {
      alert('La distribución estándar del aula (56 puestos) no se puede eliminar.');
      return;
    }

    if (!confirm(`¿Deseas eliminar la distribución activa "${lastDistribucionActiva.nombre}"?`)) {
      return;
    }

    try {
      setStatusBadge(`Eliminando ${lastDistribucionActiva.id}...`);
      const res = await fetch(`${DAEMON_URL}/api/distribuciones`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lastDistribucionActiva.id })
      });
      const data = await res.json();
      if (data.success) {
        setStatusBadge('Distribución eliminada');
        fetchDevices();
      } else {
        alert(`[!] Error: ${data.error || 'No se pudo eliminar'}`);
      }
    } catch (err) {
      alert(`[!] Error de red: ${err.message}`);
    }
  });
}

if (btnToggleEdit) {
  btnToggleEdit.addEventListener('click', () => toggleModoEdicion());
}

if (btnDoneEdit) {
  btnDoneEdit.addEventListener('click', () => toggleModoEdicion(false));
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