import { configured, configMessage, moderatorLogin, moderatorLogout, observeModeratorAuth, subscribeQuestions, saveAnswer, deleteQuestion } from './qa-api.js';

const $ = selector => document.querySelector(selector);
const bell = $('#qaBell'), badge = $('#qaBadge'), overlay = $('#qaOverlay');
const loginBox = $('#qaLoginBox'), loginForm = $('#qaLogin'), inbox = $('#qaInbox');
const list = $('#qaQuestionList'), connection = $('#qaConnection'), status = $('#qaStatus');
let moderator = null, stopQuestions = null, questions = [], ready = false, toastTimer;

function setMessage(message, error = false) {
  status.textContent = message;
  status.classList.toggle('error', error);
}
function openPanel() {
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  if (!moderator && configured) setTimeout(() => $('#qaEmail').focus(), 30);
}
function closePanel() {
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  bell.focus();
}
function countPending() {
  const count = questions.filter(question => question.status === 'pendiente').length;
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.classList.toggle('is-empty', count === 0);
  bell.setAttribute('aria-label', `Abrir preguntas recibidas; ${count} pendientes`);
  $('#qaPendingCount').textContent = String(count);
}
function toastNew(n) {
  const toast = $('#toast');
  toast.textContent = n === 1 ? 'Llegó una pregunta nueva' : `Llegaron ${n} preguntas nuevas`;
  toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3600);
}
function startListening() {
  if (!moderator) return;
  stopQuestions?.();
  stopQuestions = null;
  ready = false;
  connection.textContent = 'Conectando a la bandeja en tiempo real…';
  stopQuestions = subscribeQuestions(snapshot => {
    const before = questions.filter(question => question.status === 'pendiente').length;
    questions = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    const after = questions.filter(question => question.status === 'pendiente').length;
    countPending();
    renderQuestions();
    connection.textContent = 'Conectado · preguntas actualizadas en tiempo real';
    $('#qaArrivalStatus').textContent = after ? 'Las nuevas aparecen arriba; atendelas o descartalas.' : 'En espera de preguntas nuevas';
    if (ready && after > before) toastNew(after - before);
    ready = true;
  }, error => {
    connection.textContent = 'No se pudo conectar a la bandeja';
    const text = error.code === 'permission-denied'
      ? 'Esta cuenta no tiene permiso para ver preguntas. Revisa el UID del moderador en firestore.rules.'
      : 'No fue posible actualizar las preguntas. Comprueba la conexión e intenta de nuevo.';
    setMessage(text, true);
    console.error(error);
  });
}
function renderQuestions() {
  list.replaceChildren();
  const pending = questions.filter(question => question.status === 'pendiente');
  if (!pending.length) {
    const empty = document.createElement('div');
    empty.className = 'qaEmpty';
    empty.textContent = questions.length ? '¡Bandeja al día! No quedan preguntas pendientes.' : 'Todavía no llegan preguntas. El contador se actualizará en cuanto envíen una.';
    list.append(empty);
    return;
  }
  for (const question of pending) {
    const card = document.createElement('article');
    card.className = 'qaQuestionCard';
    const head = document.createElement('div');
    head.className = 'qaQuestionTop';
    const who = document.createElement('span');
    who.className = 'qaQuestionName';
    who.textContent = question.name || 'Participante';
    const time = document.createElement('time');
    const created = question.createdAt?.toDate?.();
    time.textContent = created ? created.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }) : 'Recibida';
    head.append(who, time);
    const body = document.createElement('p');
    body.className = 'qaQuestionText';
    body.textContent = question.question || '';
    const actions = document.createElement('div');
    actions.className = 'qaQuestionActions';
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'qaMark';
    done.textContent = '✓ Respondida';
    done.setAttribute('aria-label', `Marcar como respondida la pregunta de ${question.name || 'participante'}`);
    done.addEventListener('click', async () => {
      done.disabled = true;
      try {
        await saveAnswer(question.id, '', moderator.uid);
        setMessage('Marcada como respondida; salió de la bandeja pendiente.');
      } catch (error) {
        setMessage('No se pudo marcar como respondida. Comprueba tu autorización y conexión.', true);
        done.disabled = false;
        console.error(error);
      }
    });
    const discard = document.createElement('button');
    discard.type = 'button';
    discard.className = 'qaDiscard';
    discard.textContent = '× Descartar';
    discard.setAttribute('aria-label', `Eliminar pregunta de ${question.name || 'participante'}`);
    discard.addEventListener('click', async () => {
      discard.disabled = true;
      try {
        await deleteQuestion(question.id);
        setMessage('Pregunta descartada y eliminada.');
      } catch (error) {
        setMessage('No se pudo eliminar la pregunta. Comprueba tu autorización y conexión.', true);
        discard.disabled = false;
        console.error(error);
      }
    });
    actions.append(done, discard);
    card.append(head, body, actions);
    list.append(card);
  }
}

bell.addEventListener('click', openPanel);
$('#qaClose').addEventListener('click', closePanel);
overlay.addEventListener('click', event => { if (event.target === overlay) closePanel(); });
$('#qaLogout').addEventListener('click', async () => {
  stopQuestions?.(); stopQuestions = null; moderator = null; questions = []; countPending();
  try { await moderatorLogout(); } catch (error) { console.error(error); }
});
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!configured) return;
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Verificando…';
  $('#qaLoginStatus').textContent = '';
  try {
    await moderatorLogin($('#qaEmail').value.trim(), $('#qaPassword').value);
    $('#qaPassword').value = '';
  } catch (error) {
    $('#qaLoginStatus').textContent = 'No se pudo iniciar sesión. Revisa el correo y la contraseña de la cuenta autorizada.';
    console.error(error);
  } finally {
    button.disabled = false;
    button.textContent = 'Entrar y ver preguntas';
  }
});

$('#qaClose').addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });
if (!configured) {
  $('#qaLoginStatus').textContent = configMessage;
  loginForm.querySelector('button').disabled = true;
} else {
  observeModeratorAuth(user => {
    moderator = user;
    if (user) {
      bell.classList.add('is-ready');
      loginBox.classList.add('hidden');
      inbox.classList.remove('hidden');
      $('#qaLogout').classList.remove('hidden');
      setMessage('');
      startListening();
    } else {
      stopQuestions?.(); stopQuestions = null; questions = []; ready = false; countPending();
      bell.classList.remove('is-ready');
      inbox.classList.add('hidden');
      loginBox.classList.remove('hidden');
      $('#qaLogout').classList.add('hidden');
      connection.textContent = 'Iniciá sesión para consultar las preguntas privadas.';
    }
  }, error => { setMessage('No se pudo comprobar la sesión del moderador.', true); console.error(error); })
    .catch(error => { setMessage('Firebase Authentication no está disponible. Revisa la configuración del proyecto.', true); console.error(error); });
}
