import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 1. Leemos las variables de entorno que acabas de crear
const firebaseConfig = {
  apiKey: "AIzaSyCG6eJ6n0cqMwM4RPWxtkzgOS1lrvgUmq8",
  authDomain: "comibox-chiriqui.firebaseapp.com",
  projectId: "comibox-chiriqui",
  storageBucket: "comibox-chiriqui.firebasestorage.app",
  messagingSenderId: "470144673330",
  appId: "1:470144673330:web:8df9e11a2855b39e8abe2b",
};

// 2. Inicializa Firebase
// Usamos getApps() para evitar que se reinicie en cada recarga (HMR)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 3. Exportamos app y la base de datos (db) para usarla en nuestras páginas
export { app };
export const db = getFirestore(app);
export const storage = getStorage(app);

// Exportar getAuth para usar en otros archivos
export { getAuth } from "firebase/auth";
