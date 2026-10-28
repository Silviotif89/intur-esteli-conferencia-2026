import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app-check.js";
import { getAuth, inMemoryPersistence, setPersistence, signInAnonymously, signInWithEmailAndPassword, signOut, browserSessionPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const cfg = window.INTUR_QA_CONFIG || {};
export const configured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId && !String(cfg.apiKey).startsWith("REEMPLAZAR") && !String(cfg.appId).startsWith("REEMPLAZAR"));
export const configMessage = "El formulario todavía no está conectado. El administrador debe completar la configuración pública de Firebase en assets/config.js.";
const appCheckInstances = new WeakMap();

function createClient(name, session = false) {
  if (!configured) throw new Error(configMessage);
  const options = { apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, appId: cfg.appId, messagingSenderId: cfg.messagingSenderId };
  const app = getApps().find(existing => existing.name === name) || initializeApp(options, name);
  if (cfg.appCheckSiteKey && !appCheckInstances.has(app)) {
    appCheckInstances.set(app, initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(cfg.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true
    }));
  }
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { auth, db, persistence: session ? browserSessionPersistence : inMemoryPersistence };
}

export async function submitQuestion(name, question) {
  const { auth, db, persistence } = createClient("intur-public-questions");
  await setPersistence(auth, persistence);
  if (!auth.currentUser) await signInAnonymously(auth);
  const user = auth.currentUser;
  if (!user) throw new Error("No se pudo crear la sesión anónima.");
  await addDoc(collection(db, "preguntas"), {
    senderUid: user.uid,
    name, question,
    createdAt: serverTimestamp(),
    status: "pendiente",
    answer: "",
    answeredAt: null,
    answeredBy: null
  });
}

export async function moderatorLogin(email, password) {
  const { auth, persistence } = createClient("intur-moderator-session", true);
  await setPersistence(auth, persistence);
  return signInWithEmailAndPassword(auth, email, password);
}

export async function observeModeratorAuth(next, error) {
  const { auth, persistence } = createClient("intur-moderator-session", true);
  await setPersistence(auth, persistence);
  return onAuthStateChanged(auth, next, error);
}

export async function moderatorLogout() {
  const { auth } = createClient("intur-moderator-session", true);
  return signOut(auth);
}

export function subscribeQuestions(next, error) {
  const { db } = createClient("intur-moderator-session", true);
  return onSnapshot(query(collection(db, "preguntas"), orderBy("createdAt", "desc")), next, error);
}

export function saveAnswer(id, answer, uid) {
  const { db } = createClient("intur-moderator-session", true);
  return updateDoc(doc(db, "preguntas", id), {
    answer,
    status: "atendida",
    answeredAt: serverTimestamp(),
    answeredBy: uid
  });
}

export function deleteQuestion(id) {
  const { db } = createClient("intur-moderator-session", true);
  return deleteDoc(doc(db, "preguntas", id));
}
