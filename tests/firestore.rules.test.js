import fs from 'node:fs';
import { before, after, beforeEach, describe, it } from 'mocha';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { strict as assert } from 'node:assert';

const projectId = 'demo-intur-esteli';
let env;
const moderatorUid = 'moderator-demo';
const valid = uid => ({ senderUid: uid, name: 'Participante Demo', question: '¿Cómo se diseña una experiencia turística sostenible?', createdAt: serverTimestamp(), status: 'pendiente', answer: '', answeredAt: null, answeredBy: null });

before(async () => {
  let rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8').replace('nnVLalsGNmSDDmyLN7d7lFWBirL2', moderatorUid);
  env = await initializeTestEnvironment({ projectId, firestore: { rules, host: '127.0.0.1', port: 8080 } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

describe('reglas Firestore INTUR Estelí', () => {
  it('acepta una pregunta válida de visitante anónimo', async () => {
    const visitor = env.authenticatedContext('visitor-1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertSucceeds(setDoc(doc(visitor, 'preguntas', 'q1'), valid('visitor-1')));
  });
  it('deniega lectura, listado, edición y eliminación del visitante', async () => {
    await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'preguntas', 'q1'), { ...valid('visitor-1'), createdAt: new Date() }));
    const visitor = env.authenticatedContext('visitor-1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(getDoc(doc(visitor, 'preguntas', 'q1')));
    await assertFails(getDocs(collection(visitor, 'preguntas')));
    await assertFails(updateDoc(doc(visitor, 'preguntas', 'q1'), { status: 'atendida' }));
    await assertFails(deleteDoc(doc(visitor, 'preguntas', 'q1')));
  });
  it('deniega campos inesperados, textos largos y suplantación de UID', async () => {
    const visitor = env.authenticatedContext('visitor-2', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(setDoc(doc(visitor, 'preguntas', 'extra'), { ...valid('visitor-2'), role: 'admin' }));
    await assertFails(setDoc(doc(visitor, 'preguntas', 'long'), { ...valid('visitor-2'), name: 'x'.repeat(61) }));
    await assertFails(setDoc(doc(visitor, 'preguntas', 'spoof'), valid('somebody-else')));
  });
  it('permite al moderador autorizado leer y guardar respuesta, bloquea usuario ajeno', async () => {
    await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'preguntas', 'q1'), { senderUid: 'visitor-1', name: 'Participante Demo', question: '¿Cómo se diseña una experiencia turística sostenible?', createdAt: new Date(), status: 'pendiente', answer: '', answeredAt: null, answeredBy: null }));
    const visitor = env.authenticatedContext('other-user').firestore();
    await assertFails(getDocs(collection(visitor, 'preguntas')));
    const moderator = env.authenticatedContext(moderatorUid).firestore();
    await assertSucceeds(getDoc(doc(moderator, 'preguntas', 'q1')));
    await assertSucceeds(updateDoc(doc(moderator, 'preguntas', 'q1'), { answer: 'Gracias por la pregunta.', status: 'atendida', answeredAt: serverTimestamp(), answeredBy: moderatorUid }));
    await assertSucceeds(deleteDoc(doc(moderator, 'preguntas', 'q1')));
    await assertFails(getDoc(doc(moderator, 'preguntas', 'q1')));
  });
  it('emite la nueva pregunta al listener en tiempo real para el moderador', async () => {
    const moderator = env.authenticatedContext(moderatorUid).firestore();
    const event = new Promise((resolve, reject) => {
      const stop = onSnapshot(query(collection(moderator, 'preguntas'), orderBy('createdAt', 'desc')), snap => {
        if (snap.docChanges().some(change => change.type === 'added')) { stop(); resolve(snap.docs[0].data().question); }
      }, reject);
    });
    const visitor = env.authenticatedContext('visitor-3', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertSucceeds(setDoc(doc(visitor, 'preguntas', 'live'), valid('visitor-3')));
    assert.equal(await event, '¿Cómo se diseña una experiencia turística sostenible?');
  });
});

