import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app-check.js";
import {
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  browserSessionPersistence,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const cfg = window.INTUR_QA_CONFIG || {};
const EVENT_QUESTION_PREFIX = /^\[\[event:([a-z0-9-]+)\]\]\s*/i;
export const configured = Boolean(
  cfg.apiKey && cfg.projectId && cfg.appId
    && !String(cfg.apiKey).startsWith("REEMPLAZAR")
    && !String(cfg.appId).startsWith("REEMPLAZAR")
);
export const configMessage = "La bandeja todavía no está conectada. Revisá la configuración pública de Firebase.";

const appCheckInstances = new WeakMap();

function createClient(name, session = false) {
  if (!configured) throw new Error(configMessage);
  const options = {
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    appId: cfg.appId,
    messagingSenderId: cfg.messagingSenderId
  };
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

export async function submitQuestion(name, question, eventId = null) {
  const { auth, db, persistence } = createClient("intur-public-questions");
  const event = eventId ? String(eventId).toLowerCase() : "";
  if (event && !/^[a-z0-9-]{1,80}$/.test(event)) throw new Error("Identificador de taller no válido.");
  const questionText = String(question).trim();
  if (questionText.length < 10 || questionText.length > (event ? 900 : 1000)) {
    throw new Error("La pregunta debe tener entre 10 y 900 caracteres.");
  }
  await setPersistence(auth, persistence);
  if (!auth.currentUser) await signInAnonymously(auth);
  const user = auth.currentUser;
  if (!user) throw new Error("No se pudo crear la sesión anónima.");

  const scopedQuestion = event ? `[[event:${event}]] ${questionText}` : questionText;
  await addDoc(collection(db, "preguntas"), {
    senderUid: user.uid,
    name: String(name).trim(),
    question: scopedQuestion,
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

function scopedSnapshot(snapshot, eventId) {
  const requestedEvent = eventId ? String(eventId).toLowerCase() : "";
  const visibleItems = new Map();
  const docs = snapshot.docs.flatMap(item => {
    const original = item.data() || {};
    const question = String(original.question || "");
    const match = question.match(EVENT_QUESTION_PREFIX);
    const actualEvent = match?.[1]?.toLowerCase() || "";
    if (requestedEvent ? actualEvent !== requestedEvent : Boolean(actualEvent)) return [];
    const visibleData = {
      ...original,
      question: match ? question.replace(EVENT_QUESTION_PREFIX, "") : question
    };
    const visibleItem = { id: item.id, data: () => visibleData };
    visibleItems.set(item.id, visibleItem);
    return [visibleItem];
  });
  const changes = snapshot.docChanges()
    .flatMap(change => {
      const visibleItem = visibleItems.get(change.doc.id);
      return visibleItem ? [{ type: change.type, doc: visibleItem }] : [];
    });
  return { docs, docChanges: () => changes };
}

export function subscribeQuestions(next, error, eventId = null) {
  const { db } = createClient("intur-moderator-session", true);
  const source = query(collection(db, "preguntas"), orderBy("createdAt", "desc"));
  return onSnapshot(source, snapshot => next(scopedSnapshot(snapshot, eventId)), error);
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

