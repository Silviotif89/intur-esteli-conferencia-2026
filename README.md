# INTUR Estelí · productos turísticos innovadores y sostenibles

Sitio estático preparado para GitHub Pages y preguntas privadas con Firebase. Conserva la conferencia académica, el logo institucional, las notas, navegación de teclado y las **49 diapositivas originales**. La presentación añade pausas con QR al completar cada bloque de siete diapositivas y una bandeja privada de preguntas en directo. La conferencia incluye el caso de La Garnacha.

## Estado honesto

La app web y Firestore de `proyectos-silvio` ya están creadas; Firestore está en `us-central1`, los métodos anónimo y correo/contraseña están habilitados y la cuenta moderadora ya existe. El repositorio público y GitHub Pages ya están activos. Se verificó la carga de la presentación de 55 diapositivas, el QR con la URL real del formulario, el formulario público y la pantalla de acceso del moderador; estas páginas no produjeron errores de JavaScript. Las reglas con el UID de la cuenta administradora ya están publicadas en Firestore. **Aún no se confirma el envío y la recepción de una pregunta en producción:** falta iniciar sesión en el panel con la cuenta administradora y completar esa prueba. App Check quedó registrado con Fraud Defense/reCAPTCHA Enterprise y conectado al cliente web. El enforcement de Firestore se mantiene apagado hasta probar el flujo real y revisar métricas; las pruebas del emulador no pudieron ejecutarse en este equipo. No se suben contraseñas ni claves privadas.

## Rutas

- `index.html`: conferencia, 49 diapositivas originales más 6 pausas QR entre bloques, notas `N`, índice `O`, bandeja del expositor `P`, QR `Q` y pantalla completa `F`.
- Campana del expositor: aparece en la presentación; al iniciar sesión con la cuenta autorizada, el contador pendiente y la bandeja se actualizan con `onSnapshot`. La bandeja se puede cerrar para volver a la misma diapositiva.
- `✓ Respondida` quita la pregunta de la bandeja pendiente y la conserva como atendida en el panel administrativo. `× Descartar` elimina el documento de Firestore; solo lo permite el UID del moderador en reglas.
- `preguntas.html`: formulario adaptado a móvil. Usa Firebase Anonymous Auth sin pedir una cuenta al participante.
- `moderador.html`: acceso privado por correo y contraseña de Firebase Authentication; escucha Firestore en tiempo real, filtra pendientes/atendidas, recibe avisos mientras el panel está abierto, guarda respuesta y cierra sesión.
- `firestore.rules`: acceso denegado por defecto. Participantes anónimos solo pueden crear preguntas válidas; solo el UID configurado puede consultarlas, atenderlas y eliminarlas.
- `tests/firestore.rules.test.js`: pruebas del flujo y de acceso en Firebase Emulator Suite.

## Configuración de Firebase Console

Proyecto: `proyectos-silvio`.

1. La app web registrada es **INTUR Estelí · Conferencia**; la configuración pública ya está en `assets/config.js`. No es necesario volver a crearla.
2. El usuario moderador ya está creado en **Authentication → Users**; el UID está configurado en `firestore.rules`.
3. Las reglas `firestore.rules` ya están publicadas. Esa cuenta puede leer, responder y eliminar preguntas; los participantes solo pueden enviar preguntas válidas y no pueden leerlas ni borrarlas.
4. GitHub Pages está configurado desde `main`/raíz y el dominio `silviotif89.github.io` se agregó a **Authentication → Configuración → Dominios autorizados**. La URL real carga la presentación y el formulario.
5. App Check ya está registrado con **Fraud Defense/reCAPTCHA Enterprise**, limitado al dominio de GitHub Pages y con la clave pública configurada en `assets/config.js`. Revisa las métricas después de una prueba real antes de activar enforcement para Cloud Firestore.
6. Ejecuta las pruebas indicadas abajo. Java y una conexión local de loopback disponibles son necesarios para Firestore Emulator; en el equipo de desarrollo el emulador no logró iniciar.

### Firebase CLI y reglas

Instala una versión actual de Node.js y Firebase CLI, autentícate con tu cuenta y selecciona el proyecto:

```sh
npm install
npx firebase login
npx firebase use proyectos-silvio
npx firebase deploy --only firestore:rules
npm run test:rules
```

Las pruebas locales usan un proyecto de demostración `demo-intur-esteli`, Firestore Emulator y Authentication Emulator; no modifican datos de producción. Java debe estar instalado para Firestore Emulator. El UID de moderador se sustituye por `moderator-demo` solo al cargar reglas en memoria. En este equipo el emulador no arrancó por un error de conexión loopback, por lo que las pruebas automatizadas aún no tienen resultado confirmado.

## Publicar en GitHub Pages

1. El repositorio independiente ya está creado: [Silviotif89/intur-esteli-conferencia-2026](https://github.com/Silviotif89/intur-esteli-conferencia-2026). El código está en `main`.
2. GitHub Pages está publicado desde `main` y carpeta raíz (`/`); el build terminó correctamente y la URL fue verificada.
3. `assets/config.js` ya contiene la URL real `https://silviotif89.github.io/intur-esteli-conferencia-2026/`. El formulario y el QR usan esa ruta con la subcarpeta del repositorio.
4. La URL visible del formulario y el QR se generan en la página a partir de la ruta relativa `preguntas.html`; respeta automáticamente la subruta de GitHub Pages.
5. Antes de una capacitación, inicia sesión en `moderador.html` y prueba con una pregunta de prueba que aparezca en la campana en tiempo real, atiéndela y verifica las notificaciones en dos navegadores. App Check está integrado; el enforcement y el emulador de reglas aún requieren verificación.

## Seguridad, privacidad y límites

- Las preguntas y nombres son privados para el moderador; los participantes nunca pueden leerlas. La bandeja de la presentación es una herramienta del expositor y exige autenticación Firebase, igual que el panel independiente.
- Firestore Rules validan autenticación anónima, UID remitente, nombres (2–60), preguntas (10–1000), estado inicial, timestamp de servidor y esquema cerrado. El moderador solo puede completar respuesta/estado/fecha y no editar contenido del participante.
- El honeypot y la espera de 15 segundos solo son controles de interfaz; no son límites de servidor. App Check ayuda contra clientes no legítimos. Si se necesita limitación fuerte por persona/IP, implementar una Cloud Function y revisar plan/costos antes de activarla.
- Las notificaciones del navegador solo funcionan con permiso y mientras el panel esté abierto. No se prometen notificaciones push con la página cerrada.
- No hay dependencias ni llamadas Supabase en el proyecto final.

## Recursos oficiales

- [Firebase Web: añadir Firebase a una app](https://firebase.google.com/docs/web/setup)
- [Authentication anónima](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Listeners de Firestore en tiempo real](https://firebase.google.com/docs/firestore/query-data/listen)
- [App Check web con reCAPTCHA Enterprise](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [Pruebas de Security Rules](https://firebase.google.com/docs/rules/unit-tests)





