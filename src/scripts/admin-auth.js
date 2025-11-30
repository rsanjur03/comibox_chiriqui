import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app } from '../lib/firebase.js';

const auth = getAuth(app);

const init = () => {
  const panelLogin = document.getElementById('panel-login');
  const btnLogin = document.getElementById('btn-login-google');

  btnLogin?.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Persistencia más robusta para evitar problemas con sessionStorage
      await setPersistence(auth, browserLocalPersistence);
      // Intentar primero con popup (más confiable en entornos con partición de estado)
      await signInWithPopup(auth, provider);
      console.debug('[auth] signInWithPopup ok');
    } catch (popupErr) {
      console.warn('[auth] Popup falló, intento redirect como fallback...', popupErr);
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectErr) {
        console.error('[auth] Redirect también falló', redirectErr);
        alert('No se pudo iniciar sesión. Revisa permisos y vuelve a intentar.');
      }
    }
  });

  // Manejar resultados de redirección
  getRedirectResult(auth).then(res => {
    if (res && res.user) {
      console.debug('[auth] getRedirectResult user ok');
    }
  }).catch(err => {
    // Ignorar error de estado inicial faltante (típico cuando sessionStorage está bloqueado)
    const msg = String(err && (err.message || err.code || err));
    if (msg && msg.toLowerCase().includes('missing initial state')) return;
    console.warn('getRedirectResult error', err);
  });

  onAuthStateChanged(auth, (user) => {
    console.debug('[auth] onAuthStateChanged', !!user);
    if (user) {
      window.location.href = '/admin/boxeadores';
    } else {
      if (panelLogin) panelLogin.style.display = 'block';
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
