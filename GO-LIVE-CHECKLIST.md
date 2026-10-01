# Respiración Guiada — Checklist Go Live

Base candidata: **V2.25 RC**

La finalidad es validar la aplicación con el protocolo congelado antes de etiquetar **V3.0 Stable**.

## 1. Acceso y cuenta
- [ ] Iniciar sesión con usuario real.
- [ ] Cerrar sesión y cancelar una vez la confirmación.
- [ ] Cerrar sesión aceptando la confirmación.
- [ ] Volver a iniciar sesión.
- [ ] Confirmar que el usuario normal no ve Administración.
- [ ] Confirmar que el administrador sí puede abrir Administración.

## 2. Pantalla principal
- [ ] La versión visible indica V2.25 RC.
- [ ] `Última práctica` carga sin errores.
- [ ] El resumen `Esta semana` muestra días y sesiones coherentes.
- [ ] `Repetir última sesión` carga la configuración sin iniciar automáticamente.
- [ ] La casilla de seguridad sigue siendo necesaria para comenzar.

## 3. Sesión completa
Realizar al menos una sesión real, sin `?test=1`.

- [ ] Preparación 3–2–1 y “Comienza”.
- [ ] Inhala / Exhala funcionan con el ritmo seleccionado.
- [ ] Conteo hablado funciona según la configuración.
- [ ] Última respiración dice “Última”.
- [ ] Retención comienza correctamente.
- [ ] Recuperación dura 15 s.
- [ ] “Suelta” se escucha al final de recuperación.
- [ ] Pausa entre vueltas funciona si se configura.
- [ ] Ambiente funciona.
- [ ] Volúmenes independientes funcionan.
- [ ] Modo enfoque funciona.
- [ ] Estado de pantalla activa se muestra correctamente.
- [ ] Finalización reproduce el mensaje de cierre.
- [ ] Resumen final muestra datos coherentes.

## 4. Historial y datos
- [ ] La sesión aparece en Historial.
- [ ] Filtros 7 / 30 / 90 días / Todo funcionan.
- [ ] Gráficas cargan.
- [ ] Calendario semanal marca el día de práctica.
- [ ] Tiempo, sesiones y días de la semana son coherentes.
- [ ] Detalle de sesión abre.
- [ ] `Repetir esta configuración` funciona.
- [ ] Exportar CSV descarga un archivo y abre correctamente en Excel.
- [ ] Respaldo JSON descarga un archivo legible.
- [ ] Los archivos exportados no contienen contraseña ni configuración Firebase.

## 5. Offline y sincronización
- [ ] Con sesión iniciada, desconectar Internet.
- [ ] Completar una sesión.
- [ ] Confirmar mensaje de guardado local/pendiente.
- [ ] Cerrar y volver a abrir la app.
- [ ] Reconectar Internet.
- [ ] Confirmar sincronización de la sesión pendiente.
- [ ] Confirmar que no se duplica en Historial.

## 6. Web y PWA
- [ ] Web muestra V2.25 RC.
- [ ] PWA muestra V2.25 RC.
- [ ] La actualización controlada de PWA funciona.
- [ ] Al cerrar y abrir la PWA mantiene el acceso cuando corresponde.
- [ ] La interfaz funciona correctamente en pantalla móvil.
- [ ] No hay elementos cortados ni botones inaccesibles.
- [ ] El service worker no interfiere con Live Server local.

## 7. Prueba final
Usar V2.25 RC durante varias sesiones reales.

- [ ] No se detectan errores bloqueantes.
- [ ] No hay pérdida de sesiones.
- [ ] No aparecen errores recurrentes de autenticación.
- [ ] Voz/audio permanecen estables.
- [ ] La experiencia es suficientemente simple para uso diario.

## Criterio de Go Live

Si todos los puntos críticos funcionan, la misma base de código pasa a:

**V3.0 · Stable / Go Live**

V3.0 no debe incorporar funciones nuevas. Solo:
- cambiar número de versión;
- actualizar documentación;
- crear commit/tag de lanzamiento;
- validar web y PWA.

Correcciones posteriores: V3.0.1, V3.0.2, etc.
Nuevas funciones posteriores: V3.1, V3.2, etc.
