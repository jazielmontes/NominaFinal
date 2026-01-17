// ===================== 🔐 LOGIN =====================
if (localStorage.getItem('auth') !== 'true') {
  window.location.href = 'login.html';
}

// ===================== ESTADO =====================
const state = {
  empleados: [],
  asistencia: {}
};

// ===================== STORAGE =====================
function save() {
  localStorage.setItem('nomina_state', JSON.stringify(state));
}

function load() {
  const data = localStorage.getItem('nomina_state');
  if (data) {
    const parsed = JSON.parse(data);
    state.empleados = parsed.empleados || [];
    state.asistencia = parsed.asistencia || {};
  } else {
    state.empleados = [
      { id: 1, nombre: 'Ana Pérez', tarifa: 75 },
      { id: 2, nombre: 'Juan López', tarifa: 70 }
    ];
    state.asistencia = {};
    save();
  }
}

// ===================== UTIL =====================
function diffHoras(e, s) {
  if (!e || !s) return 0;
  const [eh, em] = e.split(':').map(Number);
  const [sh, sm] = s.split(':').map(Number);
  return Math.max(0, (sh * 60 + sm - (eh * 60 + em)) / 60);
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.classList.add('hidden');
  t.textContent = msg;
  setTimeout(() => t.classList.remove('hidden'), 10);
  setTimeout(() => t.classList.add('hidden'), 2000);
}

// ===================== VISTAS =====================
function setView(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.add('hidden'));
  document.getElementById(`vista-${v}`).classList.remove('hidden');
}

document.querySelectorAll('nav button[data-view]').forEach(b => {
  b.onclick = () => setView(b.dataset.view);
});

// ===================== LOGOUT =====================
document.getElementById('logout').onclick = () => {
  localStorage.removeItem('auth');
  window.location.href = 'login.html';
};

// ===================== ASISTENCIA =====================
function ensureFecha(fecha) {
  if (!state.asistencia[fecha]) {
    state.asistencia[fecha] = state.empleados.map(e => ({
      id: e.id,
      entrada: '',
      salida: '',
      estado: 'Ausente'
    }));
    save();
  }
}

function renderAsistencia(fecha) {
  ensureFecha(fecha);
  const tbody = document.getElementById('tbody-asistencia');
  tbody.innerHTML = '';

  state.asistencia[fecha].forEach(r => {
    const emp = state.empleados.find(e => e.id === r.id);
    if (!emp) return;

    tbody.innerHTML += `
      <tr>
        <td>${emp.nombre}</td>
        <td><input type="time" data-id="${r.id}" data-k="entrada" value="${r.entrada}"></td>
        <td><input type="time" data-id="${r.id}" data-k="salida" value="${r.salida}"></td>
        <td>
          <select data-id="${r.id}" data-k="estado">
            <option ${r.estado === 'Presente' ? 'selected' : ''}>Presente</option>
            <option ${r.estado === 'Ausente' ? 'selected' : ''}>Ausente</option>
            <option ${r.estado === 'Retardo' ? 'selected' : ''}>Retardo</option>
          </select>
        </td>
      </tr>`;
  });
}

document.getElementById('fecha').onchange = e => {
  renderAsistencia(e.target.value);
};

document.getElementById('tbody-asistencia').oninput = e => {
  const fecha = document.getElementById('fecha').value;
  const { id, k } = e.target.dataset;
  if (!k) return;
  const r = state.asistencia[fecha].find(x => x.id == id);
  r[k] = e.target.value;
  save();
};

// ===================== NÓMINA =====================
function renderNomina() {
  const tbody = document.getElementById('tbody-nomina');
  tbody.innerHTML = '';

  state.empleados.forEach(emp => {
    let horas = 0, dias = 0;

    Object.values(state.asistencia).forEach(d => {
      const r = d.find(x => x.id === emp.id);
      if (!r || r.estado === 'Ausente') return;
      const h = diffHoras(r.entrada, r.salida);
      if (h > 0) { horas += h; dias++; }
    });

    const descuento = 150;
    const neto = horas * emp.tarifa - descuento;

    tbody.innerHTML += `
      <tr>
        <td>${emp.nombre}</td>
        <td>${dias}</td>
        <td>${horas.toFixed(2)}</td>
        <td>$${emp.tarifa}</td>
        <td>$${descuento}</td>
        <td>$${neto.toFixed(2)}</td>
      </tr>`;
  });
}

document.getElementById('recalcularNomina').onclick = () => {
  renderNomina();
  toast('Nómina recalculada');
};

// ===================== EMPLEADOS =====================
function renderEmpleados() {
  const tbody = document.getElementById('tbody-empleados');
  tbody.innerHTML = '';

  state.empleados.forEach(e => {
    tbody.innerHTML += `
      <tr>
        <td>${e.id}</td>
        <td>${e.nombre}</td>
        <td>$${e.tarifa}</td>
        <td style="text-align:right">
          <button data-id="${e.id}">
            <i class="bi bi-trash-fill" style="color:red"></i>
          </button>
        </td>
      </tr>`;
  });
}

document.getElementById('agregarEmpleado').onclick = () => {
  const nombre = document.getElementById('emp-nombre').value.trim();
  const tarifa = Number(document.getElementById('emp-tarifa').value);

  if (!nombre || tarifa <= 0) return;

  const emp = { id: Date.now(), nombre, tarifa };
  state.empleados.push(emp);

  Object.values(state.asistencia).forEach(dia => {
    dia.push({
      id: emp.id,
      entrada: '',
      salida: '',
      estado: 'Ausente'
    });
  });

  save();
  renderEmpleados();
  renderAsistencia(document.getElementById('fecha').value);
  toast('Empleado agregado');

  document.getElementById('emp-nombre').value = '';
  document.getElementById('emp-tarifa').value = '';
};


document.getElementById('tbody-empleados').onclick = e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = Number(btn.dataset.id);

  state.empleados = state.empleados.filter(e => e.id !== id);
  Object.values(state.asistencia).forEach(d =>
    d.splice(d.findIndex(x => x.id === id), 1)
  );

  save();
  renderEmpleados();
  renderNomina();
  toast('Empleado eliminado');
};

// ===================== INIT =====================
load();
const hoy = new Date().toISOString().slice(0, 10);
fecha.value = hoy;
renderAsistencia(hoy);
renderEmpleados();
renderNomina();
