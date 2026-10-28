# INTUR Estelí · productos turísticos innovadores y sostenibles

Sitio estático preparado para GitHub Pages y preguntas privadas con Firebase. Conserva la conferencia académica, el logo institucional, las notas, navegación de teclado y las **49 diapositivas originales**. La presentación añade pausas con QR al completar cada bloque de siete diapositivas y una bandeja privada de preguntas en directo. La conferencia incluye el caso de La Garnacha.

## Estado honesto

El proyecto Firebase `proyectos-silvio` ya existe. El código web se entrega preparado, pero Firebase todavía requiere terminar la app web, Authentication, Firestore, UID de moderación y App Check. Hasta completar esos pasos, el formulario deshabilita el envío y el panel no inicia sesión. **No está publicado ni probado en producción; no compartir aún el QR como operativo.** No se suben contraseñas, cuentas, claves privadas ni credenciales administrativas.

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

1. En Firebase Console, agregá una **aplicación web** al proyecto y copiá `apiKey`, `authDomain`, `projectId`, `appId` y `messagingSenderId` desde el objeto de configuración del SDK.
2. Pegá esos identificadores en `assets/config.js`, sustituyendo `REEMPLAZAR_API_KEY` y los demás marcadores. Son configuración pública del cliente web, no una contraseña. No añadas aquí archivos de cuenta de servicio, claves privadas ni contraseñas.
3. En **Authentication → Sign-in method**, habilitá `Anonymous` y `Email/Password`. No habilites registro público por correo. En **Configuración → Dominios autorizados**, agregá el dominio `USUARIO.github.io` que corresponda a la cuenta del repositorio.
4. En **Firestore Database**, crea la base de datos de producción en `us-central1` (región seleccionada). Luego publica `firestore.rules` desde el editor de reglas de la consola o con Firebase CLI. No cambies a reglas abiertas.
5. En **Authentication → Users**, crea tu usuario moderador. Copiá su **UID**, nunca la contraseña. En `firestore.rules`, reemplazá `REEMPLAZAR_UID_MODERADOR` por ese UID y vuelve a publicar las reglas. El panel no tiene registro de administradores.
6. En App Check, registra la aplicación web con **reCAPTCHA Enterprise**. En `assets/config.js`, pega su clave pública del sitio en `appCheckSiteKey`. Observa métricas y luego activa la aplicación de App Check para Cloud Firestore en Firebase Console. Primero comprueba que envíos y escucha ya funcionan; una clave/registro incorrectos harán que Firestore rechace solicitudes cuando esté enforced.
7. Confirma el identificador de proyecto en el archivo `firebase.json`/Firebase CLI, despliega las reglas y ejecuta las pruebas indicadas abajo antes de abrir la aplicación.

### Firebase CLI y reglas

Instala una versión actual de Node.js y Firebase CLI, autentícate con tu cuenta y selecciona el proyecto:

```sh
npm install
npx firebase login
npx firebase use proyectos-silvio
npx firebase deploy --only firestore:rules
npm run test:rules
```

Las pruebas locales usan un proyecto de demostración `demo-intur-esteli`, Firestore Emulator y Authentication Emulator; no borran ni modifican datos de producción. Java debe estar instalado para Firestore Emulator. Las pruebas de reglas modelan el UID administrador como `moderator-demo` en memoria, por lo que no alteran el UID real de producción.

## Publicar en GitHub Pages

1. Crea un repositorio independiente para esta conferencia y agrega el contenido de esta carpeta en la raíz de la rama `main`.
2. En **Settings → Pages**, configura despliegue desde `main` y carpeta raíz (`/`). Espera a que GitHub publique el sitio en HTTPS.
3. Copia la URL final completa a `publicSiteBase` en `assets/config.js`, incluyendo la subruta del repositorio y una `/` final; por ejemplo `https://USUARIO.github.io/NOMBRE-REPO/`. Haz commit. No sustituyas esta dirección por una URL inventada.
4. La URL visible del formulario y el QR se generan en la página a partir de la ruta relativa `preguntas.html`; respeta automáticamente la subruta de GitHub Pages.
5. Prueba `index.html`, el formulario desde un teléfono, `moderador.html`, Firestore en tiempo real y los avisos en dos navegadores antes de la capacitación.

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
