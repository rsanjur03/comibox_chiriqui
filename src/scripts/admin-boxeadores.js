import { app, db, storage } from '/src/lib/firebase.js';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const auth = getAuth(app);

const qs = (sel) => document.querySelector(sel);

async function mostrarListaBoxeadores() {
  const listaBoxeadoresDiv = qs('#lista-boxeadores-div');
  try {
    listaBoxeadoresDiv.innerHTML = '<p class="text-gray-400">Cargando...</p>';
    const q = query(collection(db, 'boxeadores'), orderBy('nombre'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      listaBoxeadoresDiv.innerHTML = '<p class="text-gray-400">No hay boxeadores registrados.</p>';
      return;
    }
    let tableHTML = '<table class="w-full text-sm text-left text-gray-400">';
    tableHTML += '<thead class="text-xs text-gray-400 uppercase bg-gray-700"><tr><th scope="col" class="py-3 px-6">Foto</th><th scope="col" class="py-3 px-6">Nombre</th><th scope="col" class="py-3 px-6">Récord</th><th scope="col" class="py-3 px-6">País/Prov.</th><th scope="col" class="py-3 px-6">Acciones</th></tr></thead><tbody>';
    snapshot.forEach(d => {
      const boxeador = d.data();
      const foto = boxeador.fotoURL ? `<img src="${boxeador.fotoURL}" alt="foto" class="w-10 h-10 rounded-full object-cover">` : '<div class="w-10 h-10 rounded-full bg-gray-700"></div>';
      const isDebutante = boxeador.victorias === 0 && boxeador.derrotas === 0 && boxeador.empates === 0;
      const vKO = boxeador.victoriasKO > 0 ? `(${boxeador.victoriasKO})` : '';
      const dKO = boxeador.derrotasKO > 0 ? `(${boxeador.derrotasKO})` : '';
      const recordDisplay = isDebutante ? '<span class="text-yellow-400">Debutante</span>' : `${boxeador.victorias}${vKO}-${boxeador.derrotas}${dKO}-${boxeador.empates}`;
      const locationDisplay = `${boxeador.provincia || 'N/D'} / ${boxeador.paisProcedencia || 'N/D'}`;
      tableHTML += `<tr class="bg-gray-800 border-b border-gray-700 hover:bg-gray-700"><td class="py-4 px-6">${foto}</td><td class="py-4 px-6 font-medium text-white">${boxeador.nombre}</td><td class="py-4 px-6">${recordDisplay}</td><td class="py-4 px-6">${locationDisplay}</td><td class="py-4 px-6"><button type="button" class="btn-borrar-boxeador font-medium text-red-400 hover:underline mr-4" data-id="${d.id}">Borrar</button><button type="button" class="btn-editar-boxeador font-medium text-blue-400 hover:underline" data-id="${d.id}">Editar</button></td></tr>`;
    });
    tableHTML += '</tbody></table>';
    listaBoxeadoresDiv.innerHTML = tableHTML;
    document.querySelectorAll('.btn-borrar-boxeador').forEach(btn => btn.addEventListener('click', () => borrarBoxeador(btn.dataset.id)));
    document.querySelectorAll('.btn-editar-boxeador').forEach(btn => btn.addEventListener('click', () => cargarBoxeadorParaEdicion(btn.dataset.id)));
  } catch (error) {
    console.error('Error al mostrar lista de boxeadores: ', error);
    listaBoxeadoresDiv.innerHTML = '<p class="text-red-500">Error al cargar la lista.</p>';
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
    if (docSnap.exists()) {
      const b = docSnap.data();
      qs('#nombre').value = b.nombre || '';
      qs('#alias').value = b.alias || '';
      qs('#fechaNacimiento').value = b.fechaNacimiento || '';
      qs('#guardia').value = b.guardia || 'Ortodoxo';
      qs('#altura').value = b.altura || '';
      qs('#alcance').value = b.alcance || '';
      qs('#victorias').value = b.victorias ?? 0;
      qs('#derrotas').value = b.derrotas ?? 0;
      qs('#empates').value = b.empates ?? 0;
      qs('#victoriasKO').value = b.victoriasKO ?? 0;
      qs('#derrotasKO').value = b.derrotasKO ?? 0;
      qs('#paisProcedencia').value = b.paisProcedencia || '';
      qs('#provincia').value = b.provincia || '';

      if (b.fotoURL) {
        imgFotoPreview.src = b.fotoURL;
        imgFotoPreview.style.display = 'block';
        iconFotoPreview.style.display = 'none';
        inputFotoUrl.value = b.fotoURL;
      } else {
        imgFotoPreview.src = '';
        imgFotoPreview.style.display = 'none';
        iconFotoPreview.style.display = 'block';
        inputFotoUrl.value = '';
      }
      inputEditIdBoxeador.value = id;
      btnGuardarBoxeador.innerText = 'Actualizar Cambios';
      qs('#btn-cancelar-edicion-boxeador').style.display = 'inline-block';
      formBoxeador.scrollIntoView({ behavior: 'smooth' });
    } else {
      alert('No se encontró el boxeador.');
    }
  } catch (error) {
    console.error('Error al cargar boxeador para editar: ', error);
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
  const btnGuardarBoxeador = qs('#btn-guardar-boxeador');
  let fotoURL = inputFotoUrl.value;
  btnGuardarBoxeador.innerText = 'Guardando...';
  btnGuardarBoxeador.disabled = true;
  try {
    const file = inputFotoFile.files[0];
    if (file) {
      btnGuardarBoxeador.innerText = 'Subiendo foto...';
      const storageRef = ref(storage, `boxer-photos/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      fotoURL = await getDownloadURL(storageRef);
    }
    btnGuardarBoxeador.innerText = 'Guardando datos...';
    const data = {
      nombre: qs('#nombre').value,
      alias: qs('#alias').value,
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
