import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from '/src/lib/firebase.js';

const auth = getAuth(app);

function renderUser(user) {
  const adminLink = document.getElementById('admin-link');
  const logoutBtn = document.getElementById('btn-logout');
  const adminNav = document.getElementById('admin-nav');

  if (user) {
    const name = user.displayName || user.email || 'Usuario';
    if (adminLink) adminLink.textContent = name;
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (adminNav) adminNav.classList.remove('hidden');
  } else {
    if (adminLink) adminLink.textContent = 'Admin';
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (adminNav) adminNav.classList.add('hidden');
  }
}

function wireEvents() {
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.href = '/admin';
      } catch (e) {
        console.error('No se pudo cerrar sesión', e);
        alert('No se pudo cerrar sesión.');
      }
    });
  }
}

function init() {
  wireEvents();
  renderUser(auth.currentUser);
  onAuthStateChanged(auth, (user) => {
    renderUser(user);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
