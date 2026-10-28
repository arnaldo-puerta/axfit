# AxFit — tu plan personal

App web instalable (PWA) con dieta, ejercicio en casa, registro de progreso, videos semanales y motivación.
Funciona sin internet y guarda todo **solo en tu celular** (no hay servidor ni cuenta).

## Qué incluye

| Sección | Qué hace |
|---|---|
| **Hoy** | Frase del día, comidas para palomear, entrenamiento del día, agua, sueño y tu agenda según tu horario (Lun–Jue trabajo, Vie CBTis, fin de semana). |
| **Comida** | Calorías y macros calculados para ti, 7 menús con porciones exactas, lista del súper barata, preparación de comida del domingo y tabla de alimentos. |
| **Ejercicio** | Programa en casa sin equipo (mochila con libros = peso), 3 fases que suben de dificultad, y modo guiado con temporizador, pitidos y vibración. |
| **Progreso** | Peso, cintura, gráfica, metas −5 % / −10 %, grabación de video semanal y logros. |
| **Más** | Recordatorios, calendario `.ics`, sueño, salud, fuentes, perfil y respaldo. |

## Tu app publicada

**<https://arnaldo-puerta.github.io/axfit/>** (GitHub Pages, repositorio `arnaldo-puerta/axfit`).

Para publicar cambios: sube el número `VERSION` en `sw.js` y luego

```bash
git add -A && git commit -m "Cambios" && git push
```

En 1–2 minutos se actualiza; en el celular cierra y vuelve a abrir la app.

## Otras formas de publicarla

Para instalarla necesita estar en internet con HTTPS. La forma más fácil:

1. Entra a <https://app.netlify.com/drop> (cuenta gratis).
2. Arrastra la carpeta `AxFit` completa.
3. Abre el link que te da en el **Chrome** de tu celular → menú ⋮ → **Instalar app**.
   En iPhone: Safari → Compartir → **Agregar a pantalla de inicio** (iOS 16.4+ para notificaciones).

Otra opción es GitHub Pages: sube la carpeta a un repositorio y activa Pages en *Settings → Pages*.

Para probarla en la computadora:

```bash
py -m http.server 8765
```

y abre <http://localhost:8765>.

## Datos en la nube (Supabase)

- Con sesión iniciada (*Más → Nube*), tu progreso se guarda en Supabase y se sincroniza solo. Sin sesión, todo se queda en el celular.
- Los **videos no se suben**: viven en el celular (descárgalos a tu galería).
- Tabla y reglas de seguridad: `supabase/schema.sql`. Conexión: `js/config.js` (solo la *publishable key*; nunca la *secret/service_role*).

## Sobre las notificaciones

- **Calendario (lo más confiable):** en *Más → Recordatorios → Descargar recordatorios (.ics)*. Agrega a tu calendario el video semanal, el entrenamiento Lun–Jue, la hora de dormir y la preparación de comida del domingo. Te avisa aunque la app esté cerrada.
- **Notificaciones de la app:** llegan cuando la app está abierta o en segundo plano. En Android con la app instalada, Chrome además revisa en segundo plano de vez en cuando (*Periodic Background Sync*), pero el navegador decide cada cuándo.
- Las notificaciones push garantizadas con la app cerrada necesitan un servidor. El service worker ya trae el código para recibirlas (`push`), así que se puede conectar después.

## Archivos

```
index.html            estructura
css/styles.css        diseño (modo claro y oscuro automático)
js/data.js            alimentos, menús, ejercicios, frases, fuentes  ← aquí se cambia el plan
js/app.js             lógica
js/cloud.js           sincronización con Supabase
js/config.js          URL y llave pública de Supabase
js/icons.js           íconos
supabase/schema.sql   tabla y reglas de seguridad
sw.js                 modo sin internet y recordatorios
manifest.webmanifest  instalación
```

Si cambias archivos, sube el número `VERSION` en `sw.js` para que el celular descargue la versión nueva.

## Aviso

AxFit es una guía educativa basada en fuentes confiables (AAP 2023, OMS 2020, AASM, USDA FoodData Central, SMAE), pero no sustituye a un profesional de la salud.
Si tienes 17 años, lo ideal es que un médico revise el plan. Como estudiante de CBTis tienes Seguro Facultativo del IMSS.
