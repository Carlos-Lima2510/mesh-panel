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

const btnAsignarSwitch = document.getElementById('btn-asignar-switch');
const btnAsignarSwitchText = document.getElementById('btn-asignar-switch-text');
const btnEncenderSeleccionados = document.getElementById('btn-encender-seleccionados');
const btnEncenderSeleccionadosText = document.getElementById('btn-encender-seleccionados-text');

// Modal Asignar Puestos a Switch (CU-04)
const modalAsignarSwitch = document.getElementById('modal-asignar-switch');
const modalAsignarCount = document.getElementById('modal-asignar-count');
const modalAsignarChips = document.getElementById('modal-asignar-chips');
const btnModalAsignarClose = document.getElementById('btn-modal-asignar-close');
const btnModalAsignarCancel = document.getElementById('btn-modal-asignar-cancel');
const btnModalAsignarConfirm = document.getElementById('btn-modal-asignar-confirm');

const btnDimensionarToggle = document.getElementById('btn-dimensionar-toggle');
const btnDimensionarLabel = document.getElementById('btn-dimensionar-label');
const drawerDimensiones = document.getElementById('drawer-dimensiones');

const btnSelectAll = document.getElementById('btn-select-all');
const btnLogout = document.getElementById('btn-logout');

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

// Elementos del Modal de Detalle de Puesto (Wireframe RUP consultarDetallePuesto)
const modalDetallePuesto = document.getElementById('modal-detalle-puesto');
const modalPuestoNombre = document.getElementById('modal-puesto-nombre');
const modalEstadoBadge = document.getElementById('modal-estado-badge');
const modalEstadoTexto = document.getElementById('modal-estado-texto');
const modalIp = document.getElementById('modal-ip');
const modalMac = document.getElementById('modal-mac');
const modalAgente = document.getElementById('modal-agente');
const modalAgenteTexto = document.getElementById('modal-agente-texto');
const modalSwitchFisico = document.getElementById('modal-switch-fisico');
const modalSwitchPuerto = document.getElementById('modal-switch-puerto');
const btnModalToggleSwitch = document.getElementById('btn-modal-toggle-switch');
const modalDiagText = document.getElementById('modal-diag-text');
const btnModalWol = document.getElementById('btn-modal-wol');
const btnModalClose = document.getElementById('btn-modal-close');
const btnModalDismiss = document.getElementById('btn-modal-dismiss');

let puestoModalActivo = null;

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

function actualizarBotonesAsignacion(totalSel) {
  if (btnAsignarSwitch && btnAsignarSwitchText) {
    if (totalSel > 0) {
      btnAsignarSwitchText.textContent = `Asignar a switch (${totalSel})`;
      btnAsignarSwitch.classList.add('has-selection');
    } else {
      btnAsignarSwitchText.textContent = 'Asignar a switch';
      btnAsignarSwitch.classList.remove('has-selection');
    }
  }

  if (btnEncenderSeleccionados && btnEncenderSeleccionadosText) {
    if (totalSel > 0) {
      btnEncenderSeleccionadosText.textContent = `Encender (${totalSel})`;
      btnEncenderSeleccionados.classList.add('has-selection');
    } else {
      btnEncenderSeleccionadosText.textContent = 'Encender';
      btnEncenderSeleccionados.classList.remove('has-selection');
    }
  }
}

window.togglePuestoSeleccionado = function (puestoId, isChecked) {
  const totalSel = renderer.toggleSeleccion(puestoId, isChecked);
  actualizarBotonesAsignacion(totalSel);
};

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
  if (btnDimensionarLabel) {
    btnDimensionarLabel.textContent = `Dimensionar: ${labFilas}×${labColumnas}`;
  }
  if (inputRangeHasta && (!inputRangeHasta.value || parseInt(inputRangeHasta.value, 10) > totalCalculado)) {
    inputRangeHasta.value = Math.min(20, totalCalculado);
    inputRangeHasta.max = totalCalculado;
  }

  actualizarBotonesModo(lab.modo);
  lastMetricas = lab.metricas;
  actualizarVista();

  // Si el modal de inspección está abierto, refrescar su contenido en vivo
  if (puestoModalActivo && modalDetallePuesto && modalDetallePuesto.style.display === 'flex') {
    window.abrirDetallePuesto(puestoModalActivo.nodeId, puestoModalActivo.puestoId, true);
  }

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
      if (scanText) scanText.textContent = 'Consultar estado';
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

// ==============================================================================
// GESTIÓN DEL MODAL: ASIGNAR PUESTOS A SWITCH (CU-04 según Wireframe RUP)
// ==============================================================================
function abrirModalAsignarSwitch() {
  const seleccionados = renderer.obtenerPuestosSeleccionados();
  if (!seleccionados || seleccionados.length === 0) {
    alert('Selecciona primero uno o más puestos en la cuadrícula para asignarlos a un switch.');
    return;
  }

  const nombres = seleccionados.map(id => {
    const pf = puestosFisicos.find(x => x.id === id || String(x.slot) === String(id));
    if (pf && pf.etiqueta) return pf.etiqueta;
    for (const h of puestos.values()) {
      if (h.puesto_id === id || String(h.slot) === String(id)) {
        return h.nombre || h.etiqueta || `PC-${id}`;
      }
    }
    return `Puesto #${id}`;
  });

  if (modalAsignarCount) {
    modalAsignarCount.textContent = seleccionados.length === 1 ? '1 puesto' : `${seleccionados.length} puestos`;
  }

  if (modalAsignarChips) {
    modalAsignarChips.innerHTML = '';
    const MAX_VISIBLES = 8;
    const visibles = nombres.slice(0, MAX_VISIBLES);
    const restantes = nombres.length - MAX_VISIBLES;

    visibles.forEach(nom => {
      const chip = document.createElement('span');
      chip.className = 'chip-puesto';
      chip.textContent = nom;
      modalAsignarChips.appendChild(chip);
    });

    if (restantes > 0) {
      const moreChip = document.createElement('span');
      moreChip.className = 'chip-more';
      moreChip.textContent = `+${restantes} más`;
      moreChip.title = nombres.slice(MAX_VISIBLES).join(', ');
      modalAsignarChips.appendChild(moreChip);
    }
  }

  const radioDocente = document.getElementById('radio-switch-docente');
  if (radioDocente) radioDocente.checked = true;

  if (modalAsignarSwitch) {
    modalAsignarSwitch.style.display = 'flex';
  }
}

function cerrarModalAsignarSwitch() {
  if (modalAsignarSwitch) {
    modalAsignarSwitch.style.display = 'none';
  }
}

async function confirmarAsignarSwitch() {
  const seleccionados = renderer.obtenerPuestosSeleccionados();
  if (!seleccionados || seleccionados.length === 0) {
    cerrarModalAsignarSwitch();
    return;
  }

  const selectedRadio = document.querySelector('input[name="target-switch"]:checked');
  const targetSwitch = selectedRadio ? selectedRadio.value : 'sw-docente';
  const switchLabel = targetSwitch === 'sw-practicas' ? 'Switch de Prácticas' : 'Switch Universitario';

  try {
    setStatusBadge(`Asignando ${seleccionados.length} puestos a ${switchLabel}...`);
    if (btnModalAsignarConfirm) {
      btnModalAsignarConfirm.disabled = true;
      btnModalAsignarConfirm.textContent = 'Asignando...';
    }

    const res = await fetch(`${DAEMON_URL}/api/puestos/asignar-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puesto_ids: seleccionados,
        switch_id: targetSwitch
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Fallo al asignar puestos al switch.');
    }

    renderer.limpiarSeleccion();
    actualizarBotonesAsignacion(0);
    cerrarModalAsignarSwitch();

    if (data.laboratorio) {
      procesarDatosLaboratorio(data.laboratorio);
    } else {
      await fetchDevices();
    }

    setStatusBadge(`✓ ${seleccionados.length} puestos asignados a ${switchLabel}`);
  } catch (err) {
    console.error('[-] Error al asignar switch:', err);
    alert(`Error al asignar switch: ${err.message}`);
    setStatusBadge('Error al asignar switch', true);
  } finally {
    if (btnModalAsignarConfirm) {
      btnModalAsignarConfirm.disabled = false;
      btnModalAsignarConfirm.textContent = 'Confirmar';
    }
  }
}

if (btnAsignarSwitch) {
  btnAsignarSwitch.addEventListener('click', abrirModalAsignarSwitch);
}
if (btnModalAsignarClose) {
  btnModalAsignarClose.addEventListener('click', cerrarModalAsignarSwitch);
}
if (btnModalAsignarCancel) {
  btnModalAsignarCancel.addEventListener('click', cerrarModalAsignarSwitch);
}
if (btnModalAsignarConfirm) {
  btnModalAsignarConfirm.addEventListener('click', confirmarAsignarSwitch);
}
if (modalAsignarSwitch) {
  modalAsignarSwitch.addEventListener('click', (e) => {
    if (e.target === modalAsignarSwitch) cerrarModalAsignarSwitch();
  });
}

// Acción Granular conjunta: [ ⚡ Encender ] para encendido masivo de puestos seleccionados en Standby
if (btnEncenderSeleccionados) {
  btnEncenderSeleccionados.addEventListener('click', async () => {
    const seleccionados = renderer.obtenerPuestosSeleccionados();
    if (!seleccionados || seleccionados.length === 0) {
      alert('Selecciona primero uno o más puestos haciendo clic sobre sus tarjetas para encenderlos con Wake-on-LAN.');
      return;
    }

    const nodosAEncender = [];
    for (const puestoId of seleccionados) {
      for (const h of puestos.values()) {
        if (h.puesto_id === puestoId || `puesto-${h.slot}` === puestoId) {
          if ((h.estado === 'GRIS' || h.estado === 'AMARILLO') && h.soporta_wol !== false) {
            nodosAEncender.push(h);
          }
          break;
        }
      }
    }

    if (nodosAEncender.length === 0) {
      alert('Ninguno de los puestos seleccionados se encuentra en Standby o listo para recibir Wake-on-LAN.');
      return;
    }

    try {
      setStatusBadge(`Enviando Wake-on-LAN a ${nodosAEncender.length} equipos...`);
      for (const h of nodosAEncender) {
        await fetch(`${DAEMON_URL}/api/power/wake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node_id: h.node_id })
        });
      }
      setStatusBadge(`Paquetes Wake-on-LAN emitidos hacia ${nodosAEncender.length} puestos.`);
      setTimeout(fetchDevices, 1000);
    } catch (err) {
      console.error('[-] Error encendiendo puestos seleccionados:', err);
      setStatusBadge('Error al emitir Wake-on-LAN masivo', true);
    }
  });
}

// Conmutar panel de dimensionamiento
if (btnDimensionarToggle && drawerDimensiones) {
  btnDimensionarToggle.addEventListener('click', () => {
    const isHidden = drawerDimensiones.style.display === 'none';
    drawerDimensiones.style.display = isHidden ? 'block' : 'none';
    btnDimensionarToggle.classList.toggle('active', isHidden);
  });
}

// Seleccionar todos los puestos visibles
if (btnSelectAll) {
  btnSelectAll.addEventListener('click', () => {
    const allIds = Array.from(renderer.slotElements.keys());
    const totalSel = renderer.seleccionarTodos(allIds);
    actualizarBotonesAsignacion(totalSel);
    btnSelectAll.textContent = totalSel > 0 ? '☒ Deseleccionar todos' : '☑ Seleccionar todos';
  });
}

// Botón Cerrar Sesión
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (confirm('¿Deseas cerrar la sesión de administración de OpSys?')) {
      setStatusBadge('Sesión finalizada. Recargando...');
      setTimeout(() => window.location.reload(), 400);
    }
  });
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
  if (btnDimensionarLabel) {
    btnDimensionarLabel.textContent = `Dimensionar: ${labFilas}×${labColumnas}`;
  }
  if (inputRangeHasta) {
    inputRangeHasta.max = total;
  }

  renderer.inicializarEstructuraMapa(labFilas, labColsHilera);
  actualizarVista();
  setStatusBadge(`Cuadrícula: ${labFilas} filas × ${colsHilera}+${colsHilera} cols (${total} puestos)`);

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

/* ==============================================================================
   CONTROLADOR DEL MODAL DE DETALLE DE PUESTO (WIREFRAME RUP consultarDetallePuesto)
   ============================================================================== */
window.abrirDetallePuesto = function (nodeId, puestoId, isSilentRefresh = false) {
  if (!modalDetallePuesto) return;

  puestoModalActivo = { nodeId, puestoId };

  // 1. Localizar el host correspondiente
  let host = null;
  if (nodeId && puestos.has(nodeId)) {
    host = puestos.get(nodeId);
  } else if (puestoId) {
    for (const h of puestos.values()) {
      if (h.puesto_id === puestoId || `puesto-${h.slot}` === puestoId) {
        host = h;
        break;
      }
    }
  }

  // 2. Localizar el puesto físico si existe
  const pf = puestosFisicos.find(p => p.id === puestoId);

  if (host) {
    const nombre = host.nombre || puestoId || 'Puesto';
    if (modalPuestoNombre) modalPuestoNombre.textContent = `Detalle de Puesto: ${nombre}`;

    // Estado visual del host
    const estado = host.estado || 'GRIS';
    if (modalEstadoBadge) {
      modalEstadoBadge.className = `modal-estado-pill ${estado}`;
      const dot = modalEstadoBadge.querySelector('.status-dot');
      if (dot) dot.className = `status-dot ${estado}`;
    }

    const estadoMap = {
      VERDE: 'OPERATIVO',
      GRIS: 'STANDBY',
      AMARILLO: 'PRÁCTICAS / DHCP',
      NARANJA: 'DESCONECTADO'
    };
    if (modalEstadoTexto) modalEstadoTexto.textContent = estadoMap[estado] || estado;

    // Red Lógica (IPv4, MAC, Agente)
    if (modalIp) modalIp.textContent = host.telemetria?.ip_reportada || host.ip || '---';
    if (modalMac) modalMac.textContent = host.telemetria?.mac || host.mac || '---';

    const connVal = parseInt(host.telemetria?.conn, 10) || 0;
    const isConn = (connVal & 1) !== 0;
    if (modalAgente) {
      if (isConn) {
        modalAgente.className = 'modal-agent-badge online';
        if (modalAgenteTexto) modalAgenteTexto.textContent = 'En línea';
      } else {
        modalAgente.className = 'modal-agent-badge offline';
        if (modalAgenteTexto) modalAgenteTexto.textContent = 'Fuera de línea';
      }
    }

    // Red Física (Switch Físico, Puerto)
    const swInfo = host.telemetria?.switch || {};
    if (modalSwitchFisico) {
      modalSwitchFisico.textContent = host.switch_fisico || swInfo.ip || '10.10.136.13 (R1_SW3)';
    }

    const portName = host.boca_switch || swInfo.portName || (swInfo.port ? `port${swInfo.port}` : 'No asignado');
    const speedStr = swInfo.speed ? `${swInfo.speed} - ` : (swInfo.link === 'up' ? '1000 Mbps - ' : '');
    const linkStr = (swInfo.link || 'DOWN').toUpperCase();
    if (modalSwitchPuerto) {
      modalSwitchPuerto.textContent = `${portName} (${speedStr}${linkStr})`;
    }

    // Switch Asignado (Toggle interactivo directo)
    const isPracticas = pf?.switch_id === 'sw-practicas' ||
      host.red?.es_aislada === true ||
      (host.telemetria?.switch_asignado && host.telemetria.switch_asignado.toLowerCase().includes('práctica'));

    if (btnModalToggleSwitch) {
      if (isPracticas) {
        btnModalToggleSwitch.className = 'btn-switch-assigned practicas';
        btnModalToggleSwitch.textContent = 'Switch Prácticas';
        btnModalToggleSwitch.title = 'Asignado a Switch Prácticas. Clic para cambiar a Switch Universitario.';
      } else {
        btnModalToggleSwitch.className = 'btn-switch-assigned docente';
        btnModalToggleSwitch.textContent = 'Switch Universitario';
        btnModalToggleSwitch.title = 'Asignado a Switch Universitario. Clic para cambiar a Switch Prácticas.';
      }

      btnModalToggleSwitch.onclick = async () => {
        const nuevoSwitch = isPracticas ? 'sw-docente' : 'sw-practicas';
        btnModalToggleSwitch.disabled = true;
        btnModalToggleSwitch.textContent = 'Cambiando...';
        await window.cambiarSwitchPuesto(puestoId || host.puesto_id, nuevoSwitch);
        btnModalToggleSwitch.disabled = false;
        window.abrirDetallePuesto(host.node_id, puestoId || host.puesto_id, true);
      };
    }

    // Diagnóstico Detallado
    if (modalDiagText) {
      modalDiagText.textContent = host.diagnostico ||
        (isConn
          ? 'Enlace eléctrico PHY activo a 1 Gbps en Switch Universitario y sesión de agente activa. El puesto se encuentra completamente disponible para la sesión docente.'
          : 'Equipo sin sesión activa de agente o cable de red desconectado de la roseta docente.');
    }

    // Botón Wake-on-LAN:
    // Si está OPERATIVO (VERDE), el puesto ya está encendido: botón desactivado según wireframe.
    if (btnModalWol) {
      if (estado === 'VERDE') {
        btnModalWol.disabled = true;
        btnModalWol.classList.add('disabled');
        btnModalWol.title = 'El equipo ya se encuentra encendido y operativo';
        btnModalWol.onclick = null;
      } else {
        btnModalWol.disabled = false;
        btnModalWol.classList.remove('disabled');
        btnModalWol.title = 'Enviar paquete Wake-on-LAN para encender el equipo';
        btnModalWol.onclick = () => window.ejecutarWoL(host.node_id);
      }
    }

  } else {
    // Puesto libre sin equipo vinculado
    if (modalPuestoNombre) modalPuestoNombre.textContent = `Detalle de Puesto: ${puestoId || 'Libre'}`;
    if (modalEstadoBadge) {
      modalEstadoBadge.className = 'modal-estado-pill EMPTY';
      const dot = modalEstadoBadge.querySelector('.status-dot');
      if (dot) dot.className = 'status-dot EMPTY';
    }
    if (modalEstadoTexto) modalEstadoTexto.textContent = 'LIBRE';

    if (modalIp) modalIp.textContent = '---';
    if (modalMac) modalMac.textContent = '---';
    if (modalAgente) {
      modalAgente.className = 'modal-agent-badge offline';
      if (modalAgenteTexto) modalAgenteTexto.textContent = 'Sin Host';
    }

    if (modalSwitchFisico) modalSwitchFisico.textContent = '10.10.136.13 (R1_SW3)';
    if (modalSwitchPuerto) modalSwitchPuerto.textContent = `${pf?.boca_switch || 'No asignado'} (DOWN)`;

    const isPracticas = pf?.switch_id === 'sw-practicas';
    if (btnModalToggleSwitch) {
      btnModalToggleSwitch.className = `btn-switch-assigned ${isPracticas ? 'practicas' : 'docente'}`;
      btnModalToggleSwitch.textContent = isPracticas ? 'Switch Prácticas' : 'Switch Universitario';
      btnModalToggleSwitch.onclick = async () => {
        const nuevoSwitch = isPracticas ? 'sw-docente' : 'sw-practicas';
        await window.cambiarSwitchPuesto(puestoId, nuevoSwitch);
        window.abrirDetallePuesto(null, puestoId, true);
      };
    }

    if (modalDiagText) {
      modalDiagText.textContent = 'Mesa de laboratorio disponible. No existe equipo informático vinculado a este puesto.';
    }
    if (btnModalWol) {
      btnModalWol.disabled = true;
      btnModalWol.classList.add('disabled');
      btnModalWol.title = 'Sin host para emitir Wake-on-LAN';
      btnModalWol.onclick = null;
    }
  }

  if (modalDetallePuesto) {
    modalDetallePuesto.style.display = 'flex';
  }
};

function cerrarModalDetalle() {
  if (modalDetallePuesto) {
    modalDetallePuesto.style.display = 'none';
  }
  puestoModalActivo = null;
}

if (btnModalClose) btnModalClose.addEventListener('click', cerrarModalDetalle);
if (btnModalDismiss) btnModalDismiss.addEventListener('click', cerrarModalDetalle);
if (modalDetallePuesto) {
  modalDetallePuesto.addEventListener('click', (e) => {
    if (e.target === modalDetallePuesto) cerrarModalDetalle();
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalAsignarSwitch && modalAsignarSwitch.style.display === 'flex') {
      cerrarModalAsignarSwitch();
    } else if (modalDetallePuesto && modalDetallePuesto.style.display === 'flex') {
      cerrarModalDetalle();
    }
  }
});

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
