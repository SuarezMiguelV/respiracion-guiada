# Respiración Guiada — V2.23.1

Primera versión funcional del motor de sesión.

## Incluye
- Advertencia de seguridad.
- Configuración de 30/40/50/60 respiraciones.
- Configuración de 4 a 10 vueltas.
- Ritmo lento, normal y rápido.
- Guía de voz del navegador.
- Animación de inhalación/exhalación.
- Cronómetro de retención ascendente.
- Botón para terminar la retención.
- Recuperación automática de 15 segundos.
- Inicio automático de la siguiente vuelta.
- Resumen final con retención por vuelta, promedio y mayor retención.

## Cómo abrir

Debido a que JavaScript usa módulos ES, abre la carpeta con VS Code y usa Live Server.

1. Abre la carpeta `respiracion-guiada-v1` en VS Code.
2. Abre `index.html`.
3. Haz clic en `Go Live`.
4. Abre la dirección local que muestre Live Server.

## Siguiente etapa
- Pausar/reanudar sesión.
- Configuración personalizada de ritmo.
- Sonidos ambientales.
- Mejorar voz y sincronización.
- Guardado local.
- Firebase.
- Gráficas.
- PWA.

## Modo de prueba rápido

Para no esperar una sesión completa durante el desarrollo, agrega `?test=1` a la URL de Live Server.

Ejemplo:
`http://127.0.0.1:5500/index.html?test=1`

Esto habilita temporalmente:
- 3 respiraciones
- 2 vueltas
- ritmo rápido

Las opciones normales permanecen sin cambios cuando abres la app sin `?test=1`.


## Cambios V1.1
- Cuenta regresiva inicial 3, 2, 1, COMIENZA.
- Pausa inicial para evitar que la primera instrucción de voz quede cortada.
- Mayor contraste visual del círculo, especialmente al exhalar.
- Ritmos ajustados:
  - Más lento: 3.2 s inhalar + 3.2 s exhalar
  - Lento: 2.6 s + 2.6 s
  - Normal: 2.0 s + 2.0 s
  - Rápido: 1.5 s + 1.5 s
- Temporización interna basada en `performance.now()` para reducir desviaciones de los temporizadores.


## Cambios V1.2
- Se agregó un margen de 1.5 segundos para activar y escuchar las instrucciones de transición.
- "Prepárate" ahora tiene tiempo suficiente antes de iniciar la cuenta regresiva.
- "Comienza" termina antes de iniciar la primera respiración.
- La fase de retención muestra la pantalla primero, reproduce la instrucción y después inicia el cronómetro.
- La recuperación reproduce "Inhala profundamente y mantén" antes de comenzar los 15 segundos.
- Se evita cancelar automáticamente una instrucción hablada al iniciar la siguiente.
- Los ritmos de respiración de V1.1 no fueron modificados.


## Cambios V1.3
- Rediseño visual en paleta azul con fondo azul noche y círculos concéntricos inspirados en la referencia compartida.
- Mejor sincronización de voz y animación: las instrucciones de respiración ahora interrumpen la cola anterior para mantenerse alineadas con la fase visual actual.
- En la última respiración antes de la retención se muestra y se anuncia “ÚLTIMA”.
- Al terminar la recuperación de 15 segundos se muestra y se dice “¡SUELTA!”.
- Se mantienen los ritmos de respiración definidos en V1.1 y V1.2.


## Cambios V1.4
- La respiración utiliza ahora un solo círculo/halo continuo: ya no cambia el fondo ni parece cambiar de imagen entre fases.
- El mismo degradado azul, de claro a oscuro, se mueve como una unidad mediante expansión/contracción.
- INHALA contrae el halo.
- EXHALA expande el halo.
- Se eliminan los círculos concéntricos superpuestos durante la respiración.
- Se agrega un interruptor de Sonido en la barra superior de la sesión.
- El sonido puede activarse o desactivarse en cualquier momento.
- El interruptor de la sesión y la opción de guía de voz de configuración permanecen sincronizados.
- El control de sonido queda preparado para gobernar también música y sonidos ambientales en una versión posterior.


## Cambios V1.5
- INHALA ahora expande el círculo/halo.
- EXHALA ahora contrae el círculo/halo.
- Se mantiene el mismo degradado azul continuo, tiempos, voz y control de sonido.


## Cambios V1.6
- Después de decir “Prepárate”, la espera se reduce únicamente a 0.8 segundos.
- Todas las demás transiciones mantienen sus tiempos anteriores.
- “Suelta” se pronuncia más lentamente (rate 0.58) y ligeramente más grave.
- Se amplía la pausa posterior a “Suelta” para permitir que la frase termine de escucharse con calma.
- La arquitectura queda preparada para agregar más adelante estilos de voz configurables.


## Cambios V1.7
- En la última respiración, la voz dice únicamente “Última”.
- Ya no se pronuncia “Inhala” junto con “Última”; la indicación INHALA permanece solamente en pantalla.
- Después de “Suelta” ya no se dice ni se muestra “Exhala”.
- Si quedan vueltas pendientes, la transición dice únicamente “Prepárate para la siguiente vuelta”.


## Cambios V1.8
- Se elimina la voz “Prepárate para la siguiente vuelta” después de la recuperación.
- La transición entre recuperación y la siguiente vuelta queda silenciosa.
- Se agrega una opción independiente “Sonido de respiración”.
- Se agrega un control de “Respiración” durante la sesión para activarlo o desactivarlo en cualquier momento.
- La guía de voz y el sonido de respiración quedan como controles separados.
- Se crea `js/audio.js` para preparar la integración posterior de sonidos reales de inhalación y exhalación.
- En esta versión la opción de respiración es funcional como configuración/estado, pero los archivos de audio reales se agregarán en una etapa posterior.


## Cambios V1.9
- El cronómetro de retención empieza en el mismo instante en que comienza la indicación hablada “Retención”.
- Se elimina la espera previa de 1.5 segundos antes de iniciar el cronómetro de retención.
- “Suelta” ahora se reproduce con `rate 0.40`.
- Se mantiene `pitch 0.92` para que suene ligeramente más grave.


## Base oficial V2.2
V2.2 toma como referencia exacta funcional la versión V1.9.

No se realizaron cambios en:
- lógica de sesión;
- tiempos;
- animación;
- audio;
- retención;
- recuperación;
- controles;
- interfaz.

El único cambio es la identificación documental de la versión.


## Cambios V2.3 — Usuarios y Firebase Authentication

La sesión de respiración conserva el comportamiento de V2.2.

Se agregó:

- Crear usuario con nombre, correo y contraseña.
- Iniciar sesión.
- Cerrar sesión.
- Perfil básico guardado en Firestore.
- Todos los usuarios tienen exactamente las mismas opciones de respiración.
- Rol opcional `admin`.
- Panel de administración en modo lectura para consultar perfiles registrados.
- Reglas de Firestore incluidas en `firestore.rules`.

### 1. Crear/conectar Firebase

Puedes usar un proyecto Firebase nuevo para esta aplicación.

En Firebase Console:

1. Crea o abre el proyecto.
2. Project settings → Your apps → agrega una Web App.
3. Copia `firebaseConfig`.
4. Pégalo en `js/firebase-config.js`.

### 2. Authentication

Firebase Console → Authentication → Sign-in method:

Activa **Email/Password**.

### 3. Firestore

Crea Firestore Database.

Después publica las reglas incluidas en:

`firestore.rules`

### 4. Crear tu cuenta

Abre la aplicación con Live Server.

Selecciona:

`Crear usuario`

y registra nombre, correo y contraseña.

### 5. Convertir tu cuenta en administrador (opcional)

Todos los usuarios se crean inicialmente como:

`role: "user"`

Para practicar administración, después de crear tu cuenta:

1. Firebase Console → Firestore.
2. Abre `users`.
3. Abre tu documento de usuario.
4. Cambia el campo `role` de:
   `user`
   a:
   `admin`
5. Cierra sesión y vuelve a entrar.

Aparecerá el botón **Usuarios**.

El panel admin es deliberadamente de solo lectura en esta versión. No permite eliminar cuentas de Authentication desde el navegador.

### Nota sobre seguridad

No pongas claves de Service Account, contraseñas ni secretos privados en GitHub.

La configuración `firebaseConfig` de una aplicación web se utiliza del lado cliente. La protección de datos se realiza mediante Firebase Authentication y Firestore Security Rules.


## Cambios V2.4
- Se conserva la integración de usuarios y Firebase preparada en V2.3.
- Al terminar la última vuelta, después de “Suelta”, la aplicación cambia al Resumen.
- Sobre la pantalla Resumen se reproduce un mensaje final relajado:
  “Regresa a la normalidad moviéndote poco a poco. Comienza con tus manos y pies. Ten un buen día y una buena vida.”
- El mensaje final usa una velocidad de voz más pausada (`rate 0.72`) y tono ligeramente más grave (`pitch 0.94`).
- Se usa `interrupt:false` para no cortar “Suelta” si todavía está terminando.


## Cambios V2.5 — Guardado de sesiones

Cada sesión completada se guarda automáticamente en Firestore en:

`users/{uid}/sessions/{sessionId}`

Se almacenan:
- fecha y hora de inicio;
- fecha y hora de finalización;
- duración total;
- respiraciones por vuelta;
- vueltas programadas;
- vueltas completadas;
- ritmo seleccionado;
- estado de voz;
- estado del sonido de respiración;
- tiempos de retención;
- promedio de retención;
- mejor retención.

El Resumen muestra si la sesión se guardó correctamente.

### Importante

Actualiza en Firebase las reglas usando el nuevo archivo `firestore.rules`.

Si ya configuraste Firebase en tu V2.4 local, copia tu archivo real:

`js/firebase-config.js`

de V2.4 hacia V2.5.


## Cambios V2.6 — Historial y progreso básico
- Historial por usuario desde Firestore.
- Total de sesiones.
- Mejor retención histórica.
- Promedio general de retenciones.
- Tiempo total practicado.
- Lista de sesiones de más reciente a más antigua.
- Detalle de cada sesión y retenciones por vuelta.
- No requiere nuevas reglas respecto a V2.5.
- Las gráficas quedan para V2.7.


## Cambios V2.7 — Estadísticas y gráficas

Se amplió Historial con:
- sesiones realizadas en los últimos 7 días;
- vueltas acumuladas;
- gráfica de evolución por sesión:
  - retención promedio;
  - mejor retención;
- gráfica de promedio histórico de retención por vuelta.

Las gráficas usan Chart.js 4.4.7 por CDN.

No se modificaron:
- motor de respiración;
- voz;
- temporización;
- reglas de Firestore;
- estructura de guardado de sesiones.

### Firebase

No requiere publicar reglas nuevas respecto a V2.5/V2.6.

### Configuración

Como en las versiones anteriores, copia tu archivo real:
`js/firebase-config.js`
de tu V2.6 local a V2.7 antes de probar.


## Cambios V2.8 — Preferencias por usuario

Cada usuario conserva automáticamente en Firestore:
- respiraciones por vuelta;
- número de vueltas;
- ritmo;
- guía de voz activada/desactivada;
- sonido de respiración activado/desactivado.

Se guardan dentro del documento:
`users/{uid}`

Campos principales:
`preferences.breaths`
`preferences.rounds`
`preferences.pace`
`preferences.voice`
`preferences.breathingSound`
`preferencesUpdatedAt`

Los usuarios creados antes de V2.8 reciben automáticamente las preferencias predeterminadas al iniciar sesión por primera vez con esta versión.

El guardado utiliza una espera breve de 350 ms para evitar escrituras innecesarias cuando se modifican controles.

`?test=1` no guarda 3 respiraciones / 2 vueltas / ritmo rápido como preferencias personales.

### Firebase Rules

No es necesario modificar ni volver a publicar las reglas de V2.7.
Las reglas existentes ya permiten al propietario actualizar su documento sin cambiar su rol.

### Configuración

Copia tu archivo real:
`js/firebase-config.js`

desde tu V2.7 local hacia V2.8 antes de probar.


## Cambios V2.9 — Audio de respiración real

El interruptor "Sonido de respiración" ya funciona.

Características:
- sonido suave de inhalación;
- sonido suave de exhalación;
- sincronización con la duración real de cada fase;
- funciona en todos los ritmos;
- control de volumen de 0 a 100%;
- volumen independiente de la guía de voz;
- activación/desactivación durante la sesión;
- el sonido se detiene inmediatamente si se desactiva o se finaliza la sesión;
- volumen guardado como preferencia del usuario en Firestore.

El audio se genera localmente en el navegador con Web Audio API.
No usa MP3, WAV ni servicios externos.

Preferencia nueva:
`preferences.breathingSoundVolume`

Valor predeterminado:
`0.35` (35%).

### Firebase Rules

No es necesario cambiar ni volver a publicar las reglas.
El nuevo valor se almacena dentro del mismo objeto `preferences`.

### Configuración

Copia tu archivo real:
`js/firebase-config.js`

desde tu V2.8 local hacia V2.9 antes de probar.

### Prueba recomendada

1. Activa Sonido de respiración.
2. Deja el volumen en 35%.
3. Prueba primero con `?test=1`.
4. Comprueba que INHALA y EXHALA tengan sonidos diferentes.
5. Cambia el volumen y verifica que se conserve al cerrar sesión y volver a entrar.


## Cambios V2.10 — Control de volumen de voz y respiración

Se agregó:
- control de volumen para la guía de voz;
- control independiente para el sonido de respiración;
- ambos controles en Configurar sesión;
- ambos controles también dentro de la pantalla de respiración INHALA / EXHALA;
- sincronización bidireccional:
  - cambiar el volumen antes de iniciar actualiza el control de sesión;
  - cambiarlo durante la sesión actualiza la preferencia;
- volumen de guía de voz guardado en Firestore;
- volumen de respiración continúa guardándose como en V2.9.

Nueva preferencia:
`preferences.voiceVolume`

Valor predeterminado:
`1.0` (100%), para conservar exactamente el volumen de voz de versiones anteriores.

El volumen de voz utiliza la propiedad `volume` de `SpeechSynthesisUtterance`.

### Firebase Rules

No hace falta cambiar ni volver a publicar las reglas.

### Configuración

Copia tu `js/firebase-config.js` real de V2.9 a V2.10.

### Prueba recomendada

1. Configura voz al 70% y respiración al 35%.
2. Inicia `?test=1`.
3. Durante INHALA / EXHALA cambia ambos volúmenes.
4. Comprueba que el efecto sea inmediato.
5. Cierra sesión y vuelve a entrar para confirmar que los valores quedaron guardados.


## Cambios V2.11

### Interfaz de audio más limpia
Los controles de volumen de voz y respiración quedan ocultos detrás de un botón `Volumen`.

- En configuración: botón Volumen.
- En INHALA / EXHALA: botón Volumen.
- Al iniciar una sesión el panel comienza cerrado.
- Los sliders siguen sincronizados y sus valores continúan guardándose en Firestore.

### Sonido de respiración refinado
Se redujo el carácter artificial del sonido generado por Web Audio API:
- ruido mucho más suavizado;
- menos frecuencias agudas;
- filtros de aire en varias etapas;
- inhalación gradual;
- exhalación más cálida;
- nivel base ligeramente menor.

### Conteo de la voz
La guía ya no dice el número en cada respiración.

Ejemplo para 40 respiraciones:
- 1–9: "Inhala"
- 10: "10, inhala"
- 11–19: "Inhala"
- 20: "20, inhala"
- 21–29: "Inhala"
- 30: "30, inhala"
- 31–39: "Inhala"
- 40: "Última"

"Exhala" se conserva en cada ciclo.

No requiere cambios de reglas de Firebase.


## Cambios V2.12 — Mayor volumen de respiración

Se incrementó el nivel real del sonido de inhalación y exhalación.

- El control continúa de 0 a 100%.
- Los porcentajes guardados en Firestore no cambian.
- 35% ahora suena más fuerte que en V2.11.
- 100% tiene aproximadamente 65% más margen acústico que V2.11.
- No se modificó el volumen de la guía de voz.
- No se modificaron tiempos, conteos, retención, recuperación, historial ni Firebase.

No requiere cambios en Firestore Rules.


## Cambios V2.13 — Respiración con mayor presencia

Se aumentó de forma considerable la ganancia real del sonido de inhalación y exhalación.

- V2.12: multiplicador máximo 0.24
- V2.13: multiplicador máximo 0.50
- Aumento aproximado del 108% respecto a V2.12
- El control visual continúa de 0 a 100%
- Las preferencias guardadas en Firestore no cambian
- La guía de voz no fue modificada
- No se modificaron tiempos, retención, recuperación, historial, gráficas ni Firebase

Recomendación inicial:
probar entre 40% y 70% antes de usar 100%.


## Cambios V2.14 — Voz relajante

Antes de continuar con PWA se mejoró la guía de voz.

### Selección automática
La opción predeterminada es `Automática · relajante`.

La aplicación:
1. busca voces en español disponibles en el navegador/sistema;
2. si existen voces identificadas como Natural, Neural, Online, Premium o Enhanced, prioriza ese grupo;
3. dentro de ese grupo da preferencia a español de México y Latinoamérica;
4. si no hay una voz natural, selecciona la mejor voz española disponible.

La voz exacta depende del sistema operativo y del navegador.

### Selector manual
Dentro del botón `Volumen` se agregó:
- selector `Voz de la guía`;
- indicador de cuál voz está eligiendo el modo automático;
- botón `Probar voz`.

La selección queda guardada en `preferences.voiceName`.

Si una voz elegida no existe en otro equipo, la app vuelve automáticamente a `Automática · relajante`.

### Carácter de la voz
Para frases normales:
- velocidad global ligeramente más tranquila: 92% de la anterior;
- tono ligeramente más suave: 96% del anterior.

Las frases que ya tenían una velocidad especial muy lenta, como `Suelta`, conservan su velocidad configurada.

No se modificaron respiraciones, tiempos, retención, recuperación, sonido de respiración, historial, gráficas ni reglas de Firebase.

La PWA queda como siguiente etapa después de validar esta voz.


## Cambios V2.15 — PWA instalable

La aplicación ahora incluye:
- `manifest.webmanifest`;
- iconos PNG de 192x192 y 512x512;
- `service-worker.js`;
- registro de Service Worker;
- botón `Instalar app` cuando el navegador expone el evento de instalación;
- modo `standalone` al instalarse;
- colores de tema para navegador/sistema;
- caché del shell local de la aplicación;
- caché de recursos de CDN tras usarlos al menos una vez.

### Importante sobre Firebase y modo sin conexión

La PWA puede conservar y cargar la interfaz básica después de una primera visita, pero:
- Authentication necesita conexión para determinados flujos;
- Firestore necesita conexión para sincronizar cambios;
- el historial y preferencias dependen de Firebase.

Por eso esta versión no promete funcionamiento completo de sesiones y datos cuando el equipo está totalmente desconectado.

### Requisitos para instalar

La PWA debe ejecutarse desde:
- `localhost` / Live Server para pruebas; o
- un sitio servido por HTTPS, por ejemplo GitHub Pages.

No funcionará correctamente abriendo `index.html` directamente con `file://`.

### Prueba en computadora

1. Copia tu `js/firebase-config.js` real de V2.14 a V2.15.
2. Abre V2.15 con Live Server.
3. Recarga una vez.
4. Si Chrome/Edge considera la app instalable, aparecerá `Instalar app`.
5. Pulsa el botón y acepta la instalación.
6. La aplicación deberá abrir en una ventana independiente.

### Siguiente etapa recomendada

Publicar V2.15 en GitHub Pages y probar la instalación desde computadora y teléfono.


## Cambios V2.16 — Actualizaciones PWA y experiencia móvil

- Aviso “Hay una nueva versión disponible”.
- Botones “Actualizar” y “Después”.
- La actualización no interrumpe automáticamente una sesión activa.
- Cada versión usa su propio caché y elimina caches anteriores al activarse.
- `js/pwa.js` forma parte del app shell.
- La navegación usa red primero para detectar publicaciones nuevas.
- Firebase no es interceptado por el Service Worker.
- La interfaz muestra discretamente `v2.16`.
- Mejoras responsive, touch targets, safe areas, historial y gráficas en móvil.

Después de validarla localmente, conserva tu `js/firebase-config.js` real, haz commit/push y abre la PWA instalada para probar el flujo de actualización.


## Cambios V2.17 — Modo offline y sincronización pendiente

- Si Firestore no responde al terminar una sesión, el resultado se guarda localmente.
- La app muestra `Sin conexión` y el número de sesiones pendientes.
- Al volver Internet intenta sincronizarlas automáticamente.
- Cada sesión usa un identificador estable para evitar duplicados en los reintentos.
- También se intenta sincronizar al iniciar sesión.
- El historial completo continúa viniendo de Firestore.

### Prueba recomendada
1. Publica V2.17.
2. Desde la PWA V2.16 espera el aviso de nueva versión.
3. Pulsa Actualizar y confirma v2.17.
4. Inicia una sesión de prueba.
5. Desconecta Internet antes de terminarla.
6. Termínala y confirma que aparece como pendiente.
7. Reactiva Internet.
8. Comprueba que se sincronice y aparezca en Firebase.


## V2.17.1 — Corrección de autenticación / arranque

Hotfix sobre V2.17.

- Corrige la ausencia accidental de `updateConnectionUi()` y `trySyncPendingSessions()`.
- Evita que JavaScript se detenga antes de registrar `watchAuth`.
- El usuario autenticado vuelve a entrar correctamente a la aplicación.
- Si el navegador ya está offline al terminar una sesión, se guarda directamente en la cola local.
- No modifica Firebase Auth, credenciales, historial, voz, audio ni el motor de respiración.


## V2.18 — Mobile first, estadísticas e interfaz

### Experiencia móvil
- Encabezado de usuario reorganizado para evitar que el nombre se comprima verticalmente.
- Acciones adaptadas a 3 columnas y 2 columnas en teléfonos pequeños.
- Tarjetas de sesiones más legibles en móvil.
- Barra superior de la sesión fija y compacta.
- Mejor uso de `100dvh` y áreas seguras de la PWA.
- Gráficas más compactas en pantallas pequeñas.

### Estadísticas
Se agregan:
- Racha actual de días consecutivos de práctica.
- Días únicos de práctica.
- Actividad de las últimas 4 semanas, medida en sesiones completadas.

Estas métricas se enfocan en constancia de práctica y no en competir por tiempos de retención.

### Modo de prueba
`?test=1` sigue usando:
- 3 respiraciones
- 2 vueltas
- ritmo rápido

Pero desde V2.18 las sesiones de prueba NO se guardan en Firestore ni en la cola offline.

### Limpieza de sesiones de prueba
Para administradores, el Historial muestra `Eliminar pruebas (N)` cuando detecta sesiones con:
- `testMode === true`, o
- 3 respiraciones por vuelta y 2 vueltas planeadas.

La eliminación solicita confirmación antes de borrar los documentos.

### Usuario de prueba
La cuenta de Authentication de prueba se elimina manualmente desde Firebase Console.
No se incorpora eliminación de cuentas de otros usuarios desde el navegador porque eso requiere privilegios administrativos de servidor.

### Respiración
El motor, ritmos, voz, recuperación, retención y audio permanecen sin cambios en V2.18.
Las nuevas funciones respiratorias se reservan para una versión posterior para no mezclar mejoras de interfaz con cambios al protocolo.


## V2.19.3 — Presets con entorno local limpio

Reconstruida directamente sobre V2.18 estable.

### Cambio importante para desarrollo local
En `localhost` y `127.0.0.1`:
- no se registra Service Worker;
- se eliminan Service Workers locales anteriores;
- se eliminan caches `respiracion-guiada-v*`.

Esto evita mezclar archivos de versiones anteriores al probar con Live Server.

En GitHub Pages el Service Worker continúa funcionando normalmente.

### Audio
`js/speech.js` y `js/audio.js` son byte por byte iguales a V2.18.
El bloque de inicio de sesión y sus controles de audio también conservan el flujo de V2.18.

### V2.19
- Presets Suave, Normal e Intensa.
- Personalizada automática al modificar respiraciones, vueltas o ritmo.
- Pausa entre vueltas al final en Opciones avanzadas.
- Sin pausa adicional como valor predeterminado y recomendado.


## V2.20 — Controles de sesión y personalización avanzada

### Mantener pantalla activa
Nueva preferencia activada por defecto:
- intenta usar Screen Wake Lock durante una sesión;
- evita que la pantalla se apague cuando el navegador/dispositivo lo permite;
- libera el bloqueo al terminar o detener la sesión;
- lo solicita de nuevo al volver a la app si el navegador lo liberó;
- puede activarse o desactivarse también desde la barra superior de la sesión.

Si Wake Lock no está soportado, la sesión funciona normalmente.

### Conteo por voz
Nueva opción avanzada:
- Cada 10 respiraciones · recomendado y comportamiento histórico.
- Cada 5 respiraciones.
- Solo anunciar `Última`.

`Inhala` y `Exhala` se mantienen en cada respiración.
La opción únicamente cambia cuándo se pronuncia el número.

### Finalizar
La confirmación de finalización se mantiene y ahora indica claramente que
el progreso incompleto no se guardará.

### Sin cambios
V2.20 no modifica:
- duración ni ritmo de inhalación/exhalación;
- retención;
- recuperación de 15 s;
- voz seleccionada;
- sonido de respiración;
- presets;
- modo offline;
- Firebase Authentication;
- estadísticas.

La pausa entre vueltas permanece al final de Opciones avanzadas y
`Sin pausa adicional` sigue siendo el valor recomendado.


## V2.21 — Presets de ambiente y modo enfoque

### Ambiente
Nueva capa de sonido opcional e independiente de la guía de voz y del sonido de inhalación/exhalación.
Presets: Sin ambiente, Océano suave, Viento suave y Ruido profundo.
Los ambientes se generan localmente con Web Audio y no requieren archivos externos ni conexión.
El volumen se controla de forma independiente y se guarda como preferencia.

### Modo enfoque
Activado por defecto. Reduce visualmente elementos secundarios durante la práctica sin ocultar los controles importantes.
Puede alternarse durante la sesión y no modifica el protocolo.

### Protocolo intacto
No cambian respiraciones, ritmos, retención, recuperación, conteo por voz, pausa entre vueltas, presets de sesión, Wake Lock, Firebase ni modo offline.
`js/session.js`, `js/speech.js` y `js/audio.js` permanecen sin cambios.


## V2.21.1 — Ajuste de ambientes

Cambios respecto a V2.21:
- `Viento suave` se reemplaza por `Río tranquilo`.
- Se agrega `432 Hz + binaural`.
  - canal izquierdo: 432 Hz;
  - canal derecho: 438 Hz;
  - diferencia binaural: 6 Hz;
  - requiere audífonos estéreo para percibir el efecto binaural.
- Se agrega `Tibetano ligero`, generado con tonos armónicos suaves de cuencos/campanas.
- Se conserva `Océano suave`, `Ruido profundo` y `Sin ambiente`.
- Todos los ambientes siguen generándose localmente con Web Audio.
- `ambient.js` se agrega al App Shell de la PWA para disponibilidad offline.

La opción 432 Hz + binaural se presenta exclusivamente como ambiente sonoro,
sin atribuir efectos médicos, terapéuticos o de salud.

El protocolo de respiración permanece intacto.


## V2.21.2 — Ajuste de ambientes

Cambios respecto a V2.21.1:
- Se elimina `Océano suave`.
- Se elimina `Río tranquilo`.
- Se agrega `Piano minimalista`.
  - notas suaves y espaciadas;
  - generadas localmente con Web Audio;
  - sin archivos externos;
  - volumen ambiental independiente.
- Se conservan:
  - Sin ambiente
  - Ruido profundo
  - 432 Hz + binaural
  - Tibetano ligero

El protocolo de respiración permanece intacto.

## V2.21.3 — Piano contemplativo, enfoque visible y estado de pantalla

- Piano minimalista original con intervalos abiertos, silencios amplios y resonancias largas.
- Modo enfoque mucho más evidente visualmente.
- Indicadores claros: `Enfoque: activo/desactivado`.
- Estado de Wake Lock visible: `Pantalla: activa ✓`, `normal`, `no disponible` o `lista para activar`.
- Funciona en web y PWA cuando el navegador permite Screen Wake Lock.
- El protocolo respiratorio permanece intacto.


## V2.22 — Historial y progreso 2.0

### Filtros de periodo
El historial ahora puede filtrarse por:
- 7 días
- 30 días
- 90 días
- Todo

El filtro actualiza:
- resumen del periodo;
- lista de sesiones;
- gráfica de retención promedio;
- gráfica de mejor retención;
- promedio por vuelta;
- actividad semanal reciente.

### Detalle de sesión
El detalle muestra:
- preset;
- respiraciones;
- vueltas;
- ritmo;
- ambiente;
- pausa entre vueltas;
- conteo por voz;
- guía de voz;
- sonido de respiración;
- modo enfoque;
- promedio y mejor retención;
- retenciones por vuelta.

### Repetir esta configuración
Desde el detalle se puede cargar una configuración anterior en la pantalla principal.
La app no inicia automáticamente: el usuario puede revisarla antes de comenzar.

En sesiones nuevas también se guardan, cuando están disponibles:
- Wake Lock / pantalla activa;
- volumen y voz seleccionada;
- volumen del sonido de respiración.

Las sesiones antiguas siguen siendo compatibles. Los campos que no existían se muestran como
`No registrado` o conservan la preferencia actual al repetir la sesión.

### Sin cambios en el protocolo
V2.22 no modifica:
- respiraciones ni ritmos;
- retención;
- recuperación de 15 s;
- transición entre vueltas;
- voz del protocolo;
- sonidos ambientales;
- modo offline.


## V2.23.1 — Experiencia de sesión y cierre final

Corrige V2.23 y conserva completas las vistas de:
- Administración
- Historial
- Configuración
- Sesión
- Resumen

Agrega:
- controles rápidos plegables durante la sesión;
- resumen final ampliado;
- acciones Repetir configuración / Ajustar nueva sesión / Ver historial;
- optimización responsive.

El protocolo respiratorio permanece intacto.
