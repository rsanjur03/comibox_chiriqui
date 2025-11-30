import { app, db, storage } from '/src/lib/firebase.js';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const auth = getAuth(app);

const qs = (sel) => document.querySelector(sel);

async function mostrarListaBoxeadores(eventoIdFiltro = '') {
  const listaBoxeadoresDiv = qs('#lista-boxeadores-div');

  // ✅ PROTECCIÓN TOTAL CONTRA NULL
  if (!listaBoxeadoresDiv) {
    console.error('❌ No se encontró #lista-boxeadores-div en el DOM');
    return;
  }

  try {
    console.log('🔄 Cargando lista de boxeadores...');
    listaBoxeadoresDiv.innerHTML = '<p class="text-gray-400">Cargando...</p>';

    // Cargar todos los boxeadores
    const snapshot = await getDocs(collection(db, 'boxeadores'));

    if (snapshot.empty) {
      listaBoxeadoresDiv.innerHTML = '<p class="text-gray-400">No hay boxeadores registrados.</p>';
      return;
    }

    // Convertir a array y ordenar por nombre legal alfabéticamente
    let boxeadores = [];
    snapshot.forEach(d => {
      const data = d.data();
      boxeadores.push({ id: d.id, ...data });
    });

    // Ordenar por nombreLegal alfabéticamente (con fallback a nombreBoxistico o nombre)
    boxeadores.sort((a, b) => {
      const nombreA = (a.nombreLegal || a.nombreBoxistico || a.nombre || '').toLowerCase();
      const nombreB = (b.nombreLegal || b.nombreBoxistico || b.nombre || '').toLowerCase();
      return nombreA.localeCompare(nombreB);
    });

    // Si hay filtro de evento, cargar peleas del evento y filtrar boxeadores
    if (eventoIdFiltro) {
      const peleasSnapshot = await getDocs(query(collection(db, 'peleas')));
      const boxeadoresEnEvento = new Set();

      peleasSnapshot.forEach(p => {
        const pelea = p.data();
        if (pelea.eventoId === eventoIdFiltro) {
          if (pelea.boxeadorA_Id) boxeadoresEnEvento.add(pelea.boxeadorA_Id);
          if (pelea.boxeadorB_Id) boxeadoresEnEvento.add(pelea.boxeadorB_Id);
        }
      });

      boxeadores = boxeadores.filter(b => boxeadoresEnEvento.has(b.id));
    }

    let html = `
      <table class="w-full text-sm text-left text-gray-400">
        <thead class="text-xs text-gray-400 uppercase bg-gray-700">
          <tr>
            <th class="py-3 px-6">Foto</th>
            <th class="py-3 px-6">Nombre Legal</th>
            <th class="py-3 px-6">Nombre Boxístico</th>
            <th class="py-3 px-6">Récord</th>
            <th class="py-3 px-6">País / Prov.</th>
            <th class="py-3 px-6">Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;

    boxeadores.forEach(boxeador => {
      const nombreBoxistico = boxeador.nombreBoxistico || boxeador.nombre || '—';
      const nombreLegal = boxeador.nombreLegal || '—';
      const cedula = boxeador.cedula || '—';

      const foto = boxeador.fotoURL
        ? `<img src="${boxeador.fotoURL}" class="w-10 h-10 rounded-full object-cover">`
        : '<div class="w-10 h-10 rounded-full bg-gray-700"></div>';

      const v = boxeador.victorias || 0;
      const drr = boxeador.derrotas || 0;
      const e = boxeador.empates || 0;
      const vKO = boxeador.victoriasKO > 0 ? `(${boxeador.victoriasKO})` : '';
      const dKO = boxeador.derrotasKO > 0 ? `(${boxeador.derrotasKO})` : '';

      const isDebutante = v === 0 && drr === 0 && e === 0;

      const recordDisplay = isDebutante
        ? '<span class="text-yellow-400">Debutante</span>'
        : `${v}${vKO}-${drr}${dKO}-${e}`;

      const locationDisplay = `${boxeador.provincia || 'N/D'} / ${boxeador.paisProcedencia || 'N/D'}`;

      html += `
        <tr class="bg-gray-800 border-b border-gray-700 hover:bg-gray-700">
          <td class="py-4 px-6">${foto}</td>
          <td class="py-4 px-6 font-medium text-white">
            <div class="font-bold">${nombreLegal}</div>
            <div class="text-xs text-gray-500">Cédula: ${cedula}</div>
          </td>
          <td class="py-4 px-6 font-medium text-blue-400">
            ${nombreBoxistico}
          </td>
          <td class="py-4 px-6">${recordDisplay}</td>
          <td class="py-4 px-6">${locationDisplay}</td>
          <td class="py-4 px-6">
            <button type="button" class="btn-borrar-boxeador font-medium text-red-400 hover:underline mr-4" data-id="${boxeador.id}">Borrar</button>
            <button type="button" class="btn-editar-boxeador font-medium text-blue-400 hover:underline" data-id="${boxeador.id}">Editar</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    listaBoxeadoresDiv.innerHTML = html;

    document.querySelectorAll('.btn-borrar-boxeador')
      .forEach(btn => btn.addEventListener('click', () => borrarBoxeador(btn.dataset.id)));

    document.querySelectorAll('.btn-editar-boxeador')
      .forEach(btn => btn.addEventListener('click', () => cargarBoxeadorParaEdicion(btn.dataset.id)));

    console.log('✅ Lista de boxeadores cargada correctamente');

  } catch (error) {
    console.error('❌ ERROR REAL al cargar la lista:', error);
    listaBoxeadoresDiv.innerHTML = '<p class="text-red-500">Error real al cargar la lista. Revisa la consola.</p>';
  }
}



async function borrarBoxeador(id) {
  if (!confirm('¿Estás seguro de que quieres borrar este boxeador?')) return;
  try {
    await deleteDoc(doc(db, 'boxeadores', id));
    mostrarListaBoxeadores();
  } catch (error) {
    console.error('Error al borrar boxeador: ', error);
  }
}

async function cargarBoxeadorParaEdicion(id) {
  const formBoxeador = qs('#form-boxeador');
  const inputEditIdBoxeador = qs('#boxeador-edit-id');
  const inputFotoUrl = qs('#boxeador-foto-url');
  const imgFotoPreview = qs('#boxeador-foto-preview');
  const iconFotoPreview = qs('#boxeador-foto-icon');
  const btnGuardarBoxeador = qs('#btn-guardar-boxeador');

  try {
    const docRef = doc(db, 'boxeadores', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert('No se encontró el boxeador.');
      return;
    }

    const b = docSnap.data();

    // ✅ CAMPOS NUEVOS (PROTEGIDOS)
    const cedulaInput = qs('#cedula');
    if (cedulaInput) cedulaInput.value = b.cedula || '';

    // Cédula Archivo
    const cedulaUrlInput = qs('#cedula-url');
    const cedulaPreviewContainer = qs('#cedula-preview-container');
    const cedulaLink = qs('#cedula-link');

    if (cedulaUrlInput) cedulaUrlInput.value = b.cedulaUrl || '';
    if (b.cedulaUrl && cedulaPreviewContainer && cedulaLink) {
      cedulaLink.href = b.cedulaUrl;
      cedulaPreviewContainer.classList.remove('hidden');
    } else if (cedulaPreviewContainer) {
      cedulaPreviewContainer.classList.add('hidden');
    }

    // Peso
    const pesoInput = qs('#peso');
    if (pesoInput) pesoInput.value = b.peso || '';

    const nombreLegalInput = qs('#nombreLegal');
    if (nombreLegalInput) nombreLegalInput.value = b.nombreLegal || '';

    const nombreBoxisticoInput = qs('#nombreBoxistico');
    if (nombreBoxisticoInput) nombreBoxisticoInput.value = b.nombreBoxistico || '';

    // ✅ CAMPOS EXISTENTES
    const nombreInput = qs('#nombre');
    if (nombreInput) nombreInput.value = b.nombreBoxistico || b.nombre || '';

    const aliasInput = qs('#alias');
    if (aliasInput) aliasInput.value = b.alias || '';

    const fechaInput = qs('#fechaNacimiento');
    if (fechaInput) fechaInput.value = b.fechaNacimiento || '';

    const guardiaInput = qs('#guardia');
    if (guardiaInput) guardiaInput.value = b.guardia || 'Ortodoxo';

    const alturaInput = qs('#altura');
    if (alturaInput) alturaInput.value = b.altura || '';

    const alcanceInput = qs('#alcance');
    if (alcanceInput) alcanceInput.value = b.alcance || '';

    const victoriasInput = qs('#victorias');
    if (victoriasInput) victoriasInput.value = b.victorias ?? 0;

    const derrotasInput = qs('#derrotas');
    if (derrotasInput) derrotasInput.value = b.derrotas ?? 0;

    const empatesInput = qs('#empates');
    if (empatesInput) empatesInput.value = b.empates ?? 0;

    const victoriasKOInput = qs('#victoriasKO');
    if (victoriasKOInput) victoriasKOInput.value = b.victoriasKO ?? 0;

    const derrotasKOInput = qs('#derrotasKO');
    if (derrotasKOInput) derrotasKOInput.value = b.derrotasKO ?? 0;

    const paisInput = qs('#paisProcedencia');
    if (paisInput) paisInput.value = b.paisProcedencia || '';

    const provinciaInput = qs('#provincia');
    if (provinciaInput) provinciaInput.value = b.provincia || '';

    // ✅ FOTO
    if (b.fotoURL && imgFotoPreview && iconFotoPreview && inputFotoUrl) {
      imgFotoPreview.src = b.fotoURL;
      imgFotoPreview.style.display = 'block';
      iconFotoPreview.style.display = 'none';
      inputFotoUrl.value = b.fotoURL;
    } else if (imgFotoPreview && iconFotoPreview && inputFotoUrl) {
      imgFotoPreview.src = '';
      imgFotoPreview.style.display = 'none';
      iconFotoPreview.style.display = 'block';
      inputFotoUrl.value = '';
    }

    // ✅ ESTADO EDICIÓN
    if (inputEditIdBoxeador) inputEditIdBoxeador.value = id;
    if (btnGuardarBoxeador) btnGuardarBoxeador.innerText = 'Actualizar Cambios';
    const btnCancelar = qs('#btn-cancelar-edicion-boxeador');
    if (btnCancelar) btnCancelar.style.display = 'inline-block';

    if (formBoxeador) {
      formBoxeador.scrollIntoView({ behavior: 'smooth' });
    }

  } catch (error) {
    console.error('❌ Error al cargar boxeador para editar:', error);
    alert('Error al cargar datos del boxeador.');
  }
}


function cancelarEdicionBoxeador() {
  const formBoxeador = qs('#form-boxeador');
  const inputEditIdBoxeador = qs('#boxeador-edit-id');
  const inputFotoUrl = qs('#boxeador-foto-url');
  const imgFotoPreview = qs('#boxeador-foto-preview');
  const iconFotoPreview = qs('#boxeador-foto-icon');
  const inputFotoFile = qs('#boxeador-foto-file');
  const btnGuardarBoxeador = qs('#btn-guardar-boxeador');

  formBoxeador.reset();
  qs('#cedula').value = '';
  qs('#cedula-url').value = '';
  qs('#cedula-file').value = '';
  qs('#cedula-preview-container').classList.add('hidden');
  qs('#peso').value = '';
  qs('#nombreLegal').value = '';
  qs('#nombreBoxistico').value = '';

  inputEditIdBoxeador.value = '';
  inputFotoUrl.value = '';
  imgFotoPreview.src = '';
  imgFotoPreview.style.display = 'none';
  iconFotoPreview.style.display = 'block';
  inputFotoFile.value = '';
  btnGuardarBoxeador.innerText = 'Guardar Boxeador';
  qs('#btn-cancelar-edicion-boxeador').style.display = 'none';
  qs('#victoriasKO').value = 0;
  qs('#derrotasKO').value = 0;
  qs('#victorias').value = 0;
  qs('#derrotas').value = 0;
  qs('#empates').value = 0;
}

async function handleSubmit(e) {
  e.preventDefault();
  const inputEditIdBoxeador = qs('#boxeador-edit-id');
  const inputFotoUrl = qs('#boxeador-foto-url');
  const inputFotoFile = qs('#boxeador-foto-file');
  const inputCedulaUrl = qs('#cedula-url');
  const inputCedulaFile = qs('#cedula-file');
  const btnGuardarBoxeador = qs('#btn-guardar-boxeador');

  let fotoURL = inputFotoUrl.value;
  let cedulaUrl = inputCedulaUrl.value;

  btnGuardarBoxeador.innerText = 'Guardando...';
  btnGuardarBoxeador.disabled = true;

  try {
    // 1. Subir Foto
    const file = inputFotoFile.files[0];
    if (file) {
      btnGuardarBoxeador.innerText = 'Subiendo foto...';
      const storageRef = ref(storage, `boxer-photos/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      fotoURL = await getDownloadURL(storageRef);
    }

    // 2. Subir Cédula
    const cedulaFile = inputCedulaFile.files[0];
    if (cedulaFile) {
      btnGuardarBoxeador.innerText = 'Subiendo documento...';
      const storageRef = ref(storage, `boxer-ids/${Date.now()}-${cedulaFile.name}`);
      await uploadBytes(storageRef, cedulaFile);
      cedulaUrl = await getDownloadURL(storageRef);
    }

    btnGuardarBoxeador.innerText = 'Guardando datos...';
    const data = {

      // ✅ NUEVOS CAMPOS PROFESIONALES
      cedula: qs('#cedula').value.trim(),
      cedulaUrl,
      peso: qs('#peso').value.trim(),
      nombreLegal: qs('#nombreLegal').value.trim(),
      nombreBoxistico: qs('#nombreBoxistico').value.trim(),

      // ✅ CAMPOS EXISTENTES
      nombre: qs('#nombreBoxistico').value.trim(), // compatibilidad con sistema actual
      alias: qs('#alias').value.trim(),
      fechaNacimiento: qs('#fechaNacimiento').value,
      guardia: qs('#guardia').value,
      altura: parseInt(qs('#altura').value) || 0,
      alcance: parseInt(qs('#alcance').value) || 0,
      victorias: parseInt(qs('#victorias').value) || 0,
      derrotas: parseInt(qs('#derrotas').value) || 0,
      empates: parseInt(qs('#empates').value) || 0,
      victoriasKO: parseInt(qs('#victoriasKO').value) || 0,
      derrotasKO: parseInt(qs('#derrotasKO').value) || 0,
      fotoURL,
      paisProcedencia: qs('#paisProcedencia').value,
      provincia: qs('#provincia').value,
    };


    if (data.victoriasKO > data.victorias) {
      alert('El número de Victorias por KO no puede ser mayor al total de Victorias.');
      btnGuardarBoxeador.disabled = false;
      btnGuardarBoxeador.innerText = 'Guardar Boxeador';
      return;
    }
    if (data.derrotasKO > data.derrotas) {
      alert('El número de Derrotas por KO no puede ser mayor al total de Derrotas.');
      btnGuardarBoxeador.disabled = false;
      btnGuardarBoxeador.innerText = 'Guardar Boxeador';
      return;
    }

    const editId = inputEditIdBoxeador.value;
    if (editId) {
      await updateDoc(doc(db, 'boxeadores', editId), data);
    } else {
      await addDoc(collection(db, 'boxeadores'), { ...data, fechaRegistro: new Date() });
    }
    cancelarEdicionBoxeador();
    mostrarListaBoxeadores();
  } catch (error) {
    console.error('Error al guardar boxeador: ', error);
    alert('Hubo un error al guardar.');
  } finally {
    btnGuardarBoxeador.disabled = false;
    btnGuardarBoxeador.innerText = 'Guardar Boxeador';
  }
}

function wireDom() {
  const formBoxeador = qs('#form-boxeador');
  const btnCancelarEdicionBoxeador = qs('#btn-cancelar-edicion-boxeador');
  const inputFotoFile = qs('#boxeador-foto-file');
  const imgFotoPreview = qs('#boxeador-foto-preview');
  const iconFotoPreview = qs('#boxeador-foto-icon');

  inputFotoFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imgFotoPreview.src = event.target.result;
        imgFotoPreview.style.display = 'block';
        iconFotoPreview.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  formBoxeador.addEventListener('submit', handleSubmit);
  btnCancelarEdicionBoxeador.addEventListener('click', cancelarEdicionBoxeador);

  // Conectar el filtro de evento
  const filtroEvento = qs('#filtro-evento');
  if (filtroEvento) {
    filtroEvento.addEventListener('change', (e) => {
      mostrarListaBoxeadores(e.target.value);
    });
  }
}

async function cargarEventosEnFiltro() {
  const filtroEvento = qs('#filtro-evento');
  if (!filtroEvento) return;

  try {
    const q = query(collection(db, 'eventos'), orderBy('fecha', 'desc'));
    const snapshot = await getDocs(q);

    snapshot.forEach(d => {
      const evento = d.data();
      const option = document.createElement('option');
      option.value = d.id;
      option.textContent = `${evento.fecha} - ${evento.nombre}`;
      filtroEvento.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar eventos:', error);
  }
}

function init() {
  const panelContenido = qs('#panel-contenido');
  const userEmailSpan = qs('#user-email');
  const btnLogout = qs('#btn-logout');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      panelContenido.style.display = 'block';
      if (userEmailSpan) userEmailSpan.textContent = user.email || '';
      mostrarListaBoxeadores();
      cargarEventosEnFiltro();
    } else {
      window.location.href = '/admin';
    }
  });

  btnLogout?.addEventListener('click', async () => {
    await signOut(auth);
  });

  wireDom();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
