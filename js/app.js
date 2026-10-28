// AxFit — lógica de la app. Se guarda en el celular (localStorage + IndexedDB para videos) y, con sesión iniciada, en Supabase.
'use strict';

const STORE_KEY = 'axfit-v1';
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MS_DAY = 86400000;

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r5 = (n) => Math.round(n / 5) * 5;
const r50 = (n) => Math.round(n / 50) * 50;

function dateKey(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function daysBetween(a, b) { return Math.round((parseKey(dateKey(b)) - parseKey(dateKey(a))) / MS_DAY); }
function fmtDate(k) { return parseKey(k).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }); }
function hm(str) { const [h, m] = str.split(':').map(Number); return h * 60 + (m || 0); }
function nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }

// ---------- Estado ----------
const DEFAULT_STATE = {
  profile: null,
  weights: [],
  waist: [],
  days: {},
  videos: [], // metadatos; el archivo vive en IndexedDB
  badges: {},
  settings: {
    notif: false,
    videoDay: 0, videoTime: '10:00',
    workoutReminder: true, workoutTime: '19:45',
    sleepReminder: true, sleepTime: '23:00',
    vitB: true,
  },
  notified: {},
  quoteOffset: 0,
};

let S = load();
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { ...structuredClone(DEFAULT_STATE), ...s, settings: { ...DEFAULT_STATE.settings, ...s.settings } };
    }
  } catch (e) { console.warn(e); }
  return structuredClone(DEFAULT_STATE);
}
function save(changed = true) {
  if (changed) S.updatedAt = Date.now();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { toast('No se pudo guardar'); }
  syncSWConfig();
  if (changed) Cloud.schedulePush(cloudData, cloudDone);
}

// ---------- Nube (Supabase) ----------
// Los videos y los avisos ya mostrados son de cada celular: no se suben.
function cloudData() {
  const { videos, notified, cloud, ...rest } = S;
  return rest;
}
function cloudDone(err) {
  S.cloud = { ...S.cloud, at: err ? S.cloud?.at : Date.now(), err: err ? err.message : null };
  save(false);
  const el = $('#cloudStatus'); if (el) el.innerHTML = cloudStatus();
}
function cloudStatus() {
  const c = S.cloud || {};
  if (c.err) return `<span style="color:var(--danger)">${esc(c.err)}</span>`;
  if (!c.at) return 'Aún no se sincroniza';
  return `Sincronizado ${new Date(c.at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`;
}
function applyRemote(data) {
  const keepLocal = { videos: S.videos, notified: S.notified, cloud: S.cloud };
  S = { ...structuredClone(DEFAULT_STATE), ...data, settings: { ...DEFAULT_STATE.settings, ...data.settings }, ...keepLocal };
  save(false);
}
// Compara la copia del celular con la de la nube y se queda con la más reciente.
async function cloudSync({ manual = false } = {}) {
  if (!Cloud.enabled() || !Cloud.user || !navigator.onLine) return;
  try {
    const remote = (await Cloud.download())?.data;
    const firstTime = S.cloud?.user !== Cloud.user.id;
    const localT = S.updatedAt || 0, remoteT = remote?.updatedAt || 0;
    let useRemote = remote && (!S.profile || remoteT > localT);
    if (remote && S.profile && firstTime) {
      useRemote = confirm(`Ya tienes datos en la nube (último cambio: ${new Date(remoteT).toLocaleDateString('es-MX')}).\n\nAceptar = usar los de la nube\nCancelar = subir los de este celular`);
    }
    if (useRemote) { applyRemote(remote); closeModal(); }
    else if (S.profile && (!remote || localT !== remoteT || firstTime)) await Cloud.upload(cloudData());
    S.cloud = { user: Cloud.user.id, at: Date.now(), err: null };
    save(false); render();
    if (manual) toast('Sincronizado');
  } catch (e) {
    S.cloud = { ...S.cloud, err: e.message }; save(false);
    if (manual || !Cloud.user) { toast(e.message); render(); }
  }
}
function cloudForm() {
  return `<form id="fCloud">
      <label>Correo</label><input name="email" type="email" autocomplete="email" required>
      <label>Contraseña</label><input name="password" type="password" autocomplete="current-password" minlength="6" required>
      <div class="grid2" style="margin-top:12px">
        <button class="primary" type="submit">Entrar</button>
        <button type="button" data-act="cloudSignUp">Crear cuenta</button>
      </div>
    </form>`;
}
function cloudCard() {
  if (!Cloud.enabled()) return `<section class="card"><h2>${ic('cloud')}Nube</h2><p class="muted">Falta conectar Supabase en <code>js/config.js</code>.</p></section>`;
  const u = Cloud.user;
  return `<section class="card">
      <h2>${ic('cloud')}Nube</h2>
      ${u ? `<p>Sesión iniciada como <b>${esc(u.email)}</b>. Tus datos se guardan solos en Supabase cuando hay internet.</p>
        <p class="muted" id="cloudStatus">${cloudStatus()}</p>
        <div class="row wrap">
          <button class="small" data-act="cloudSync">${ic('refresh')}Sincronizar ahora</button>
          <button class="small ghost" data-act="cloudSignOut">${ic('logOut')}Cerrar sesión</button>
        </div>`
      : `<p class="muted">Inicia sesión para guardar tu progreso en la nube y recuperarlo si cambias o pierdes el celular. Los videos se quedan solo en tu celular.</p>${cloudForm()}`}
    </section>`;
}
function today() {
  const k = dateKey();
  if (!S.days[k]) S.days[k] = { meals: {}, workout: false, agua: 0, sueno: null };
  return S.days[k];
}

// ---------- Cálculos ----------
function currentWeight() {
  const w = [...S.weights].sort((a, b) => a.d.localeCompare(b.d));
  return w.length ? w[w.length - 1].kg : S.profile.peso;
}
function targets() {
  const p = S.profile;
  const w = currentWeight();
  const bmr = 10 * w + 6.25 * p.estatura - 5 * p.edad + (p.sexo === 'F' ? -161 : 5);
  const tdee = bmr * 1.45; // trabajo + traslados + 4 entrenamientos
  const floor = p.sexo === 'F' ? 1700 : 1900; // mínimo seguro en crecimiento
  const kcal = Math.max(floor, r50(tdee * 0.75));
  const refW = 24 * (p.estatura / 100) ** 2; // peso de referencia (IMC 24)
  const prot = r5(2.6 * refW);
  // Carbos bajos, pero nunca debajo de 130 g: el mínimo diario para el cerebro en adolescentes.
  const carb = Math.max(130, r5((kcal * 0.26) / 4));
  const fat = r5((kcal - prot * 4 - carb * 4) / 9);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, prot, fat, carb, agua: Math.round(w * 0.035 * 4) / 4 };
}
function bmi(w = currentWeight()) { return w / (S.profile.estatura / 100) ** 2; }
function weekNum(d = new Date()) { return Math.max(1, Math.floor(daysBetween(parseKey(S.profile.inicio), d) / 7) + 1); }
function phase() { const w = weekNum(); return PHASES.find((p) => w >= p.desde && w <= p.hasta); }
function menuTotals(menu) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0 };
  for (const k in menu.comidas) for (const [id, q] of menu.comidas[k].items) for (const x in t) t[x] += FOODS[id][x] * q;
  return t;
}
function mealTotals(meal) {
  const t = { kcal: 0, p: 0 };
  for (const [id, q] of meal.items) { t.kcal += FOODS[id].kcal * q; t.p += FOODS[id].p * q; }
  return t;
}
function dayDone(k) {
  const d = S.days[k];
  if (!d) return false;
  const meals = Object.values(d.meals || {}).filter(Boolean).length;
  return d.workout || meals >= 4;
}
function streak() {
  let n = 0;
  const d = new Date();
  if (!dayDone(dateKey(d))) d.setDate(d.getDate() - 1);
  while (dayDone(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function workoutsCount() { return Object.values(S.days).filter((d) => d.workout).length; }
function lastVideo() { return [...S.videos].sort((a, b) => b.d.localeCompare(a.d))[0]; }
function videoDue() {
  const lv = lastVideo();
  return !lv || daysBetween(parseKey(lv.d), new Date()) >= 6;
}

// ---------- Logros ----------
function checkBadges() {
  const got = [];
  const give = (id, cond) => { if (cond && !S.badges[id]) { S.badges[id] = dateKey(); got.push(id); } };
  const wc = workoutsCount(), st = streak(), lost = S.profile.peso - currentWeight();
  give('primer_paso', wc >= 1);
  give('entrenos10', wc >= 10);
  give('entrenos50', wc >= 50);
  give('racha3', st >= 3);
  give('racha7', st >= 7);
  give('racha30', st >= 30);
  give('video1', S.videos.length >= 1);
  give('video4', S.videos.length >= 4);
  give('menos2', lost >= 2);
  give('menos5', lost >= S.profile.peso * 0.05);
  give('menos10', lost >= S.profile.peso * 0.10);
  if (got.length) {
    save();
    const b = BADGES.find((x) => x.id === got[0]);
    toast(`${b.icon} ¡Logro desbloqueado: ${b.n}!`, 3500);
  }
}

// ---------- UI general ----------
let toastTimer;
function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
function openModal(html) {
  const m = $('#modal');
  m.innerHTML = `<div class="sheet">${html}</div>`;
  m.hidden = false;
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && S.profile) closeModal(); });

// ---------- Tema ----------
const THEMES = { auto: { n: 'Auto', i: 'monitor' }, light: { n: 'Claro', i: 'sun' }, dark: { n: 'Oscuro', i: 'moon' } };
function getTheme() { try { return localStorage.getItem('axfit-theme') || 'auto'; } catch { return 'auto'; } }
function setTheme(t) {
  try { t === 'auto' ? localStorage.removeItem('axfit-theme') : localStorage.setItem('axfit-theme', t); } catch { /* sin storage */ }
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  syncThemeColor(); render();
}
function syncThemeColor() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#fafafa');
}
function renderThemeBtn() {
  const t = getTheme();
  $('#themeBtn').innerHTML = ic(THEMES[t].i, 'lg');
  $('#themeBtn').title = `Tema: ${THEMES[t].n}`;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeColor);

const VIEWS = { hoy: viewHoy, comida: viewComida, ejercicio: viewEjercicio, progreso: viewProgreso, mas: viewMas };
let foodDay = new Date().getDay();
function currentTab() { const t = location.hash.slice(1); return VIEWS[t] ? t : 'hoy'; }
function render() {
  if (!S.profile) return onboarding();
  const tab = currentTab();
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  $('#view').innerHTML = VIEWS[tab]();
  const st = streak();
  $('#topStreak').innerHTML = st ? `${ic('flame')}${st}` : '';
  renderThemeBtn();
  if (tab === 'progreso') renderVideos();
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

// ---------- Onboarding ----------
function onboarding() {
  openModal(`
    <h1>Bienvenido(a) a AxFit</h1>
    <p class="muted">Tu plan personal para bajar grasa cuidando que sigues en crecimiento. Todo se guarda solo en tu celular.</p>
    <form id="fProfile">
      ${profileFields({ nombre: '', sexo: '', edad: 17, estatura: 170, peso: 95, inicio: dateKey() })}
      <label>¿Por qué empiezas? (lo verás cuando necesites motivación)</label>
      <textarea name="porque" placeholder="Ej: Quiero sentirme bien con mi cuerpo, tener energía y que mis abuelos me vean sano."></textarea>
      <div class="card warn" style="margin-top:14px">
        <b>Importante:</b> tienes 17 años. Este plan es moderado a propósito (≈0.5–1 kg por semana) para no afectar tu desarrollo.
        Lo ideal es que un médico o nutriólogo lo revise. Como estudiante de CBTis tienes <b>Seguro Facultativo del IMSS</b>: la consulta es gratis.
      </div>
      <button class="primary block" type="submit">Empezar mi plan</button>
    </form>
    ${Cloud.enabled() ? `<details style="margin-top:16px"><summary>¿Ya tienes cuenta? Recupera tus datos</summary>${cloudForm()}</details>` : ''}`);
  $('#fProfile').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (!f.get('sexo')) return toast('Elige una opción en "Sexo" para calcular tus calorías');
    S.profile = readProfile(f);
    S.profile.porque = f.get('porque') || '';
    S.weights = [{ d: S.profile.inicio, kg: S.profile.peso }];
    save(); closeModal(); render();
    toast('¡Listo! Día 1 empieza hoy');
  });
}
function profileFields(p) {
  return `
    <label>Nombre (opcional)</label><input name="nombre" value="${esc(p.nombre)}" autocomplete="given-name">
    <div class="grid2">
      <div><label>Sexo (para el cálculo)</label>
        <select name="sexo" required>
          <option value="" ${!p.sexo ? 'selected' : ''} disabled>Elegir…</option>
          <option value="M" ${p.sexo === 'M' ? 'selected' : ''}>Hombre</option>
          <option value="F" ${p.sexo === 'F' ? 'selected' : ''}>Mujer</option>
        </select></div>
      <div><label>Edad</label><input name="edad" type="number" min="12" max="25" value="${p.edad}" required></div>
      <div><label>Estatura (cm)</label><input name="estatura" type="number" min="120" max="220" value="${p.estatura}" required></div>
      <div><label>Peso inicial (kg)</label><input name="peso" type="number" step="0.1" min="30" max="250" value="${p.peso}" required></div>
    </div>
    <label>Fecha de inicio</label><input name="inicio" type="date" value="${p.inicio}" required>`;
}
function readProfile(f) {
  return {
    nombre: (f.get('nombre') || '').trim(),
    sexo: f.get('sexo'),
    edad: +f.get('edad'), estatura: +f.get('estatura'), peso: +f.get('peso'),
    inicio: f.get('inicio') || dateKey(),
  };
}

// ---------- HOY ----------
function agenda(dow) {
  const t = WEEK_PLAN[dow];
  if (dow >= 1 && dow <= 4) return [
    ['5:20', 'sun', 'Despertar · vaso grande de agua, luces prendidas, agua fría en la cara'],
    ['5:45', MEAL_INFO.desayuno.icon, `Desayuno ligero (10 min)${S.settings.vitB ? ' + Complejo B' : ''}`],
    ['6:10', 'bus', 'Camión · duerme con alarma a las 7:30'],
    ['7:30', 'alarm', 'Despierta en el camión · toma agua y despéjate antes de bajar'],
    ['8:00', 'briefcase', 'Trabajo · tu mejor hora para concentrarte. ½ litro de agua antes de las 10'],
    ['10:30', MEAL_INFO.colacion.icon, 'Colación'],
    ['13:00', MEAL_INFO.comida.icon, 'Comida: 30 min comer + 20 min caminar'],
    ['17:00', 'bus', 'Salida · pre‑entreno en el camión'],
    ['19:30', 'home', 'Llegar · ropa de entrenar, agua'],
    ['20:00', 'dumbbell', t.n],
    ['21:10', MEAL_INFO.cena.icon, 'Cena'],
    ['21:30', 'laptop', 'Tareas y programación (bloque enfocado, cel en silencio)'],
    ['22:45', 'pot', 'Deja lista la avena del desayuno y la mochila'],
    [S.settings.sleepTime, 'moon', 'Pantallas fuera · a dormir'],
  ];
  if (dow === 5) return [
    ['7:00', MEAL_INFO.desayuno.icon, 'Desayuno'],
    ['—', 'school', 'CBTis: reportes, dudas y clases. Lleva colación en la mochila'],
    ['14:00', MEAL_INFO.comida.icon, 'Comida'],
    ['Tarde', 'walk', `${t.n}: ${t.d}`],
    ['20:30', MEAL_INFO.cena.icon, 'Cena'],
    [S.settings.sleepTime, 'moon', 'A dormir · recupera sueño de la semana'],
  ];
  return [
    ['8:30', MEAL_INFO.desayuno.icon, 'Desayuno'],
    ['Mañana', dow === 0 ? 'video' : 'book', dow === 0 ? 'Video de progreso + pesarte + medir cintura' : 'Tareas y trabajos pendientes'],
    ['14:30', MEAL_INFO.comida.icon, 'Comida (si salen: proteína + verduras + agua)'],
    ['Tarde', dow === 0 ? 'pot' : 'walk', dow === 0 ? 'Preparar comida de la semana (60–90 min)' : `${t.n} con tus abuelos`],
    ['20:30', MEAL_INFO.cena.icon, 'Cena'],
    [dow === 0 ? S.settings.sleepTime : '23:30', 'moon', 'A dormir'],
  ];
}
function viewHoy() {
  const p = S.profile, d = today(), dow = new Date().getDay();
  const menu = MENUS[dow], plan = WEEK_PLAN[dow], T = targets();
  const qi = (Math.floor(Date.now() / MS_DAY) + S.quoteOffset) % MOTIVATION.length;
  const mealsDone = Object.values(d.meals).filter(Boolean).length;
  const vasos = Math.ceil(T.agua / 0.25);
  const nm = nowMin();
  const ag = agenda(dow);
  let nowIdx = -1;
  ag.forEach(([h], i) => { if (/^\d/.test(h) && hm(h) <= nm) nowIdx = i; });
  const hello = p.nombre ? `Hola, ${esc(p.nombre)}` : 'Hola';
  return `
    <section class="card hero">
      <div class="row between"><h1>${hello}</h1><span class="pill accent">Semana ${weekNum()}</span></div>
      <p class="muted">${DAY_NAMES[dow]} ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} · ${phase().n}</p>
      <p class="quote">“${esc(MOTIVATION[qi])}”</p>
      <div class="row wrap">
        <button class="small ghost" data-act="nextQuote">Otra frase</button>
        <button class="small ghost" data-act="sos">${ic('buoy')}Necesito ayuda</button>
        ${p.porque ? `<button class="small ghost" data-act="porque">${ic('heart')}Mi porqué</button>` : ''}
      </div>
    </section>

    ${videoDue() ? `
    <section class="card warn">
      <h2>${ic('video')}Toca tu video de progreso</h2>
      <p>${S.videos.length ? 'Ya pasó una semana desde tu último video.' : 'Graba tu video del día 1. En unos meses vas a agradecer tenerlo.'}</p>
      <a class="btn primary" href="#progreso">${ic('record')}Grabar ahora</a>
    </section>` : ''}

    <section class="card">
      <div class="row between"><h2>${ic('utensils')}Comidas de hoy</h2><span class="pill">${mealsDone}/5</span></div>
      ${Object.entries(menu.comidas).map(([k, m]) => `
        <label class="check ${d.meals[k] ? 'done' : ''}">
          <input type="checkbox" data-act="meal" data-k="${k}" ${d.meals[k] ? 'checked' : ''}>
          <span class="t"><b>${ic(MEAL_INFO[k].icon)}${MEAL_INFO[k].t}</b><small>${esc(m.plato)} · ${MEAL_TIMES[menu.tipo][k]}</small></span>
        </label>`).join('')}
      ${S.settings.vitB ? `
        <label class="check ${d.vitB ? 'done' : ''}">
          <input type="checkbox" data-act="vitB" ${d.vitB ? 'checked' : ''}>
          <span class="t"><b>${ic('pill')}Complejo B</b><small>Con el desayuno · revisa que no pase de 80 mg de B6</small></span>
        </label>` : ''}
      <a href="#comida" class="small">Ver porciones exactas${ic('chevronRight')}</a>
    </section>

    ${dow >= 1 && dow <= 5 && nm < 12 * 60 ? `
    <section class="card">
      <h2>${ic('zap')}Mañana con energía</h2>
      <ul>${MORNING.slice(1, 5).map((x) => `<li><b>${x.t}:</b> ${x.d}</li>`).join('')}</ul>
      <a href="#mas" class="small">Ver todo sobre energía y foco${ic('chevronRight')}</a>
    </section>` : ''}

    <section class="card">
      <div class="row between"><h2>${ic('dumbbell')}${esc(plan.n)}</h2>${d.workout ? `<span class="pill accent">${ic('check')}Hecho</span>` : `<span class="pill">${plan.hora}</span>`}</div>
      <p class="muted">${esc(plan.d)}</p>
      ${guidedAvailable(dow)
        ? `<button class="primary block" data-act="startWorkout">${d.workout ? 'Repetir entrenamiento' : `${ic('play')}Empezar entrenamiento`}</button>`
        : `<button class="${d.workout ? 'ghost' : 'primary'} block" data-act="toggleWorkout">${d.workout ? 'Desmarcar' : `${ic('check')}Marcar como hecho`}</button>`}
    </section>

    <section class="card">
      <div class="row between"><h2>${ic('droplet')}Agua</h2><span class="pill">${d.agua}/${vasos} vasos</span></div>
      <div class="water">${Array.from({ length: vasos }, (_, i) => `<button data-act="water" data-n="${i + 1}" class="${i < d.agua ? 'on' : ''}" aria-label="${i + 1} vasos">${ic('droplet')}</button>`).join('')}</div>
      <small>Meta ≈ ${T.agua} L (vasos de 250 ml). Más si hace calor o entrenas.</small>
    </section>

    <section class="card">
      <h2>${ic('moon')}¿Cuánto dormiste anoche?</h2>
      <div class="row">
        <input type="number" min="0" max="14" step="0.5" value="${d.sueno ?? ''}" placeholder="horas" data-act="sleep" style="max-width:120px">
        <span class="muted">${sleepMsg(d.sueno)}</span>
      </div>
    </section>

    <section class="card">
      <h2>${ic('calendar')}Tu día</h2>
      <ul class="timeline">${ag.map(([h, icon, t], i) => `<li class="${i === nowIdx ? 'now' : ''}"><span class="h">${h}</span>${ic(icon)}<span>${esc(t)}</span></li>`).join('')}</ul>
    </section>`;
}
function sleepMsg(h) {
  if (h == null || h === '') return 'Meta: 8 h o más';
  if (h < 6) return 'Muy poco. Hoy entrena suave y duérmete temprano.';
  if (h < 7.5) return 'Mejorable. Intenta acostarte 30 min antes.';
  return '¡Bien! Así tu cuerpo quema grasa y crece mejor.';
}
function guidedAvailable(dow) { return ['fuerza', 'cardio'].includes(WEEK_PLAN[dow].tipo); }

function showSOS() {
  openModal(`
    <h2>${ic('buoy')}¿Qué está pasando?</h2>
    ${SOS.map((s) => `<details><summary>${s.t}</summary><ul>${s.d.map((x) => `<li>${x}</li>`).join('')}</ul></details>`).join('')}
    ${S.profile.porque ? `<div class="card hero"><b>Tu porqué:</b><p>${esc(S.profile.porque)}</p></div>` : ''}
    <button class="block" data-act="closeModal">Cerrar</button>`);
}

// ---------- COMIDA ----------
function viewComida() {
  const T = targets();
  const menu = MENUS[foodDay];
  const tot = menuTotals(menu);
  const diff = Math.round(tot.kcal - T.kcal);
  const adj = Math.abs(diff) <= 150 ? '' : diff < 0
    ? `<p class="muted">Este menú tiene ${-diff} kcal menos que tu meta: agrega 1 fruta o 1 huevo más si tienes hambre.</p>`
    : `<p class="muted">Este menú tiene ${diff} kcal más que tu meta: quita el cacahuate o reduce la porción de carbohidrato a la mitad.</p>`;
  return `
    <section class="card hero">
      <h1>Tu meta diaria</h1>
      <div class="grid4">
        <div class="stat"><b>${T.kcal}</b><small>kcal</small></div>
        <div class="stat"><b>${T.prot} g</b><small>proteína</small></div>
        <div class="stat"><b>${T.carb} g</b><small>carbos buenos</small></div>
        <div class="stat"><b>${T.fat} g</b><small>grasa</small></div>
      </div>
      <p class="muted" style="margin-top:10px">Mantenimiento ≈ ${T.tdee} kcal. Comes ≈ 25% menos para bajar 0.5–1 kg por semana sin frenar tu crecimiento.
      Alta en proteína y baja en carbos, pero no keto: a tu edad necesitas un mínimo de carbohidratos buenos para crecer, estudiar y entrenar. <a href="#" data-act="whyCalc">¿Cómo se calculó?</a></p>
    </section>

    <section class="card">
      <div class="days">${DAY_SHORT.map((n, i) => `<button class="${i === foodDay ? 'on' : ''} ${i === new Date().getDay() ? 'today' : ''}" data-act="foodDay" data-i="${i}">${n}</button>`).join('')}</div>
      <h2 style="margin-top:12px">${esc(menu.titulo)}</h2>
      <p class="muted">≈ ${Math.round(tot.kcal)} kcal · ${Math.round(tot.p)} g proteína · ${Math.round(tot.c)} g carbos · ${Math.round(tot.fib)} g fibra</p>
      ${adj}
      ${Object.entries(menu.comidas).map(([k, m]) => {
        const mt = mealTotals(m);
        return `<div class="meal">
          <div class="row between"><b>${ic(MEAL_INFO[k].icon)}${MEAL_INFO[k].t}</b><small>${MEAL_TIMES[menu.tipo][k]}</small></div>
          <div>${esc(m.plato)}</div>
          <ul class="items">${m.items.map(([id, , lbl]) => `<li>${esc(FOODS[id].n)} — ${esc(lbl)}</li>`).join('')}</ul>
          <small>≈ ${Math.round(mt.kcal)} kcal · ${Math.round(mt.p)} g proteína</small>
        </div>`;
      }).join('')}
    </section>

    <section class="card">
      <h2>${ic('ruler')}Reglas de oro</h2>
      ${FOOD_RULES.map((r) => `<details><summary>${r.t}</summary><p>${r.d}</p></details>`).join('')}
    </section>

    <section class="card">
      <h2>${ic('cart')}Lista del súper semanal</h2>
      <p class="muted">Pensada para gastar poco: mercado o tianguis &gt; supermercado. Huevo, atún y pierna de pollo son la proteína más barata.</p>
      ${SHOPPING.map((g, gi) => `<details ${gi === 0 ? 'open' : ''}><summary>${g.g}</summary>
        ${g.items.map((it, ii) => { const id = `s${gi}_${ii}`; const on = (S.shop || {})[id]; return `<label class="check ${on ? 'done' : ''}"><input type="checkbox" data-act="shop" data-id="${id}" ${on ? 'checked' : ''}><span class="t"><b style="font-weight:500">${esc(it)}</b></span></label>`; }).join('')}
      </details>`).join('')}
      <button class="small ghost" data-act="shopReset">Limpiar lista</button>
    </section>

    <section class="card">
      <h2>${ic('pot')}Preparar la comida (meal prep)</h2>
      <p class="muted">Con tus horarios, cocinar el domingo es lo que hace posible el plan.</p>
      ${MEAL_PREP.map((m) => `<details><summary>${m.t}</summary><ul>${m.items.map((x) => `<li>${x}</li>`).join('')}</ul></details>`).join('')}
    </section>

    <section class="card">
      <h2>${ic('list')}Tabla de alimentos</h2>
      <p class="muted">Valores aproximados por porción (USDA FoodData Central / SMAE).</p>
      <div class="table-wrap"><table>
        <tr><th>Alimento</th><th>Porción</th><th class="n">kcal</th><th class="n">Prot</th><th class="n">Carb</th><th class="n">Grasa</th></tr>
        ${Object.values(FOODS).map((f) => `<tr><td>${f.n}</td><td>${f.base}</td><td class="n">${f.kcal}</td><td class="n">${f.p}</td><td class="n">${f.c}</td><td class="n">${f.f}</td></tr>`).join('')}
      </table></div>
    </section>`;
}
function showWhyCalc() {
  const T = targets(), p = S.profile;
  openModal(`
    <h2>¿Cómo se calculó?</h2>
    <ol>
      <li><b>Metabolismo en reposo</b> (Mifflin‑St Jeor): ${T.bmr} kcal con ${currentWeight()} kg, ${p.estatura} cm, ${p.edad} años.</li>
      <li><b>Gasto total</b>: × 1.45 por trabajo, traslados y 4 entrenamientos = ${T.tdee} kcal.</li>
      <li><b>Meta</b>: 25% menos = ${T.kcal} kcal. Nunca menos de ${p.sexo === 'F' ? 1700 : 1900} kcal, porque estás en desarrollo.</li>
      <li><b>Proteína</b>: ≈ 2.6 g por kg de tu peso de referencia = ${T.prot} g (pollo, atún, huevo). Protege tu músculo y es lo que más llena.</li>
      <li><b>Carbohidratos</b>: bajos, ${T.carb} g. Nunca menos de 130 g, el mínimo diario recomendado para que tu cerebro funcione. Solo avena, arroz integral, camote, papa y fruta.</li>
      <li><b>Grasa</b>: lo que sobra = ${T.fat} g (hormonas y crecimiento).</li>
    </ol>
    <p class="muted">Se recalcula solo cada vez que registras tu peso. Si bajas más de 1 kg por semana durante 3 semanas seguidas o te sientes sin energía, come un poco más (agrega 1 fruta y 1 huevo al día).</p>
    <button class="block" data-act="closeModal">Entendido</button>`);
}

// ---------- EJERCICIO ----------
const SPECIAL_REPS = { plancha: '20–40 s', dead_bug: '8–10 por lado', bird_dog: '8–10 por lado', zancada: '8–10 por pierna', bulgara: '8–10 por pierna', escalon: '10–12 por pierna' };
function repsFor(id, ph) { return SPECIAL_REPS[id] || ph.reps; }
function routineFor(dow) {
  const plan = WEEK_PLAN[dow], ph = phase();
  if (plan.tipo === 'fuerza') return { main: ROUTINES[plan.rutina][ph.id], cardio: ROUTINES.finisher };
  if (plan.tipo === 'cardio') return { cardio: ROUTINES.cardio[ph.id], core: ROUTINES.core };
  return {};
}
function exCard(id, ph, sets) {
  const e = EXERCISES[id];
  return `<details><summary>${e.n} <small class="muted">· ${sets ? `${sets} × ${repsFor(id, ph)}` : e.m}</small></summary>
    <ol>${e.how.map((h) => `<li>${h}</li>`).join('')}</ol><p class="muted tip">${ic('bulb')}<span>${e.tip}</span></p></details>`;
}
function viewEjercicio() {
  const ph = phase(), dow = new Date().getDay(), plan = WEEK_PLAN[dow], r = routineFor(dow), d = today();
  return `
    <section class="card hero">
      <h1>${ph.n}</h1>
      <p>${ph.d}</p>
      <div class="grid4">
        <div class="stat"><b>${weekNum()}</b><small>semana</small></div>
        <div class="stat"><b>${ph.series}</b><small>series</small></div>
        <div class="stat"><b>${ph.reps}</b><small>reps</small></div>
        <div class="stat"><b>${workoutsCount()}</b><small>sesiones</small></div>
      </div>
    </section>

    <section class="card">
      <div class="row between"><h2>${ic('dumbbell')}Hoy: ${esc(plan.n)}</h2>${d.workout ? `<span class="pill accent">${ic('check')}Hecho</span>` : ''}</div>
      <p class="muted">${plan.hora} · ${esc(plan.d)}</p>
      ${r.main ? `<h3>Calentamiento (7 min)</h3><ul>${WARMUP.map((x) => `<li>${x}</li>`).join('')}</ul>
        <h3>Fuerza (${ph.series} series, descanso ${ph.descanso} s)</h3>${r.main.map((id) => exCard(id, ph, ph.series)).join('')}
        <h3 style="margin-top:10px">Cardio final (10 min)</h3><p class="muted">40 s trabajo / 20 s descanso × 10: ${r.cardio.map((id) => EXERCISES[id].n).join(', ')}.</p>` : ''}
      ${r.core ? `<h3>Calentamiento (7 min)</h3><ul>${WARMUP.map((x) => `<li>${x}</li>`).join('')}</ul>
        <h3>Intervalos: ${ph.cardio.work} s trabajo / ${ph.cardio.rest} s descanso × ${ph.cardio.rondas}</h3>${r.cardio.map((id) => exCard(id)).join('')}
        <h3 style="margin-top:10px">Abdomen (2 series)</h3>${r.core.map((id) => exCard(id, ph, 2)).join('')}` : ''}
      ${guidedAvailable(dow)
        ? `<button class="primary block" style="margin-top:12px" data-act="startWorkout">${ic('play')}Empezar con temporizador</button>`
        : `<button class="${d.workout ? 'ghost' : 'primary'} block" data-act="toggleWorkout">${d.workout ? 'Desmarcar' : `${ic('check')}Marcar como hecho`}</button>`}
    </section>

    <section class="card">
      <h2>${ic('calendar')}Tu semana</h2>
      <ul class="timeline plain">${WEEK_PLAN.map((w, i) => ({ w, i })).slice(1).concat({ w: WEEK_PLAN[0], i: 0 }).map(({ w, i }) =>
        `<li class="${i === dow ? 'now' : ''}"><span class="h">${DAY_SHORT[i]}</span><span><b>${esc(w.n)}</b><br><small>${w.hora} · ${esc(w.d)}</small></span></li>`).join('')}</ul>
    </section>

    <section class="card">
      <h2>${ic('walk')}Movimiento extra (cuenta mucho)</h2>
      <ul>
        <li>Usa 20 min de tu hora de comida para caminar después de comer.</li>
        <li>Bájate una parada antes del camión cuando puedas.</li>
        <li>Meta diaria: 7,000–10,000 pasos (la app de salud del cel los cuenta).</li>
        <li>OMS: los adolescentes necesitan 60 min de actividad al día y fuerza 3 veces por semana.</li>
      </ul>
    </section>

    <section class="card">
      <h2>${ic('book')}Todos los ejercicios</h2>
      ${Object.keys(EXERCISES).map((id) => exCard(id)).join('')}
    </section>

    <section class="card warn">
      <h2>${ic('alert')}Seguridad</h2>
      <ul>
        <li>Técnica antes que peso o velocidad. El entrenamiento de fuerza es seguro a tu edad con buena técnica.</li>
        <li>Nada de saltos por ahora: con tu peso actual cuidan tus rodillas. Los saltos llegan cuando bajes más.</li>
        <li>Detente si sientes dolor en el pecho, mareo fuerte, falta de aire que no se quita o dolor punzante en articulaciones.</li>
        <li>Si dormiste menos de 6 h, cambia el entrenamiento por caminata y estiramiento.</li>
      </ul>
    </section>`;
}

// ---------- Entrenamiento guiado ----------
let W = null; // sesión activa
let wakeLock = null;
function buildSession(dow) {
  const ph = phase(), r = routineFor(dow), steps = [];
  steps.push({ type: 'list', title: 'Calentamiento', sub: '≈ 7 minutos', list: WARMUP });
  if (r.main) {
    r.main.forEach((id, ei) => {
      for (let s = 1; s <= ph.series; s++) {
        steps.push({ type: 'set', ex: id, set: s, of: ph.series, reps: repsFor(id, ph) });
        const last = ei === r.main.length - 1 && s === ph.series;
        if (!last) steps.push({ type: 'rest', secs: ph.descanso, next: s < ph.series ? id : r.main[ei + 1] });
      }
    });
    steps.push({ type: 'interval', exs: r.cardio, work: 40, rest: 20, rounds: 10, title: 'Cardio final' });
  }
  if (r.core) {
    steps.push({ type: 'interval', exs: r.cardio, work: ph.cardio.work, rest: ph.cardio.rest, rounds: ph.cardio.rondas, title: 'Intervalos' });
    r.core.forEach((id, ei) => {
      for (let s = 1; s <= 2; s++) {
        steps.push({ type: 'set', ex: id, set: s, of: 2, reps: repsFor(id, ph) });
        if (!(ei === r.core.length - 1 && s === 2)) steps.push({ type: 'rest', secs: 45, next: s < 2 ? id : r.core[ei + 1] });
      }
    });
  }
  steps.push({ type: 'list', title: 'Estiramiento', sub: '≈ 3 minutos', list: COOLDOWN });
  return steps;
}
async function startWorkout() {
  W = { steps: buildSession(new Date().getDay()), i: 0, timer: null, end: 0, sub: null, started: Date.now() };
  $('#workout').hidden = false;
  document.body.style.overflow = 'hidden';
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* sin wake lock */ }
  unlockAudio();
  renderStep();
}
function stopWorkout() {
  clearInterval(W?.timer);
  W = null;
  $('#workout').hidden = true;
  $('#workout').className = 'workout';
  document.body.style.overflow = '';
  wakeLock?.release?.(); wakeLock = null;
}
function finishWorkout() {
  const mins = Math.round((Date.now() - W.started) / 60000);
  stopWorkout();
  today().workout = true;
  save(); checkBadges(); render();
  openModal(`
    <div style="text-align:center">
      <div class="done-icon">${ic('trophy', 'xl')}</div>
      <h1>¡Entrenamiento completado!</h1>
      <p>${mins} minutos. Llevas <b>${workoutsCount()}</b> ${workoutsCount() === 1 ? "sesión" : "sesiones"}.</p>
      <p class="quote">Ahora: cena con proteína, agua y a dormir temprano. Ahí es donde tu cuerpo cambia.</p>
      <button class="primary block" data-act="closeModal">Listo</button>
    </div>`);
}
function wNext() {
  clearInterval(W.timer);
  W.i++; W.sub = null;
  if (W.i >= W.steps.length) return finishWorkout();
  renderStep();
}
function wPrev() { clearInterval(W.timer); W.i = Math.max(0, W.i - 1); W.sub = null; renderStep(); }
function fmtSecs(s) { s = Math.max(0, Math.ceil(s)); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : String(s); }
function renderStep() {
  const st = W.steps[W.i], el = $('#workout');
  const pct = Math.round((W.i / W.steps.length) * 100);
  const head = `<div class="row between"><button class="small ghost" data-act="wStop">${ic('x')}Salir</button>
    <div class="bar" style="flex:1"><i style="width:${pct}%"></i></div>
    <button class="small ghost" data-act="wPrev" ${W.i === 0 ? 'disabled' : ''} aria-label="Anterior">${ic('arrowLeft')}</button></div>`;
  el.className = 'workout';
  let body = '', foot = '';
  if (st.type === 'list') {
    body = `<div class="label">${st.sub}</div><div class="ex">${st.title}</div><ul>${st.list.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    foot = `<button class="primary block" data-act="wNext">Listo${ic('arrowRight')}</button>`;
  } else if (st.type === 'set') {
    const e = EXERCISES[st.ex];
    body = `<div class="label">Serie ${st.set} de ${st.of}</div><div class="ex">${e.n}</div>
      <div class="big" style="font-size:2.6rem">${st.reps}</div>
      <ol>${e.how.map((h) => `<li>${h}</li>`).join('')}</ol><p class="muted tip">${ic('bulb')}<span>${e.tip}</span></p>`;
    foot = `<button class="primary block" data-act="wNext">${ic('check')}Serie hecha</button>`;
  } else if (st.type === 'rest') {
    el.classList.add('rest');
    W.end = Date.now() + st.secs * 1000;
    body = `<div class="label">Descanso</div><div class="big" id="wClock">${st.secs}</div>
      <p>Siguiente: <b>${EXERCISES[st.next].n}</b></p><p class="muted">Respira profundo. Toma agua.</p>`;
    foot = `<div class="grid2"><button data-act="wAdd">+15 s</button><button class="primary" data-act="wNext">Saltar${ic('arrowRight')}</button></div>`;
    W.timer = setInterval(() => {
      const left = (W.end - Date.now()) / 1000;
      const c = $('#wClock'); if (c) c.textContent = fmtSecs(left);
      if (left <= 3.05 && left > 0 && Math.ceil(left) !== W.lastBeep) { W.lastBeep = Math.ceil(left); beep(660, 0.08); }
      if (left <= 0) { beep(990, 0.25); vibrate([200]); wNext(); }
    }, 200);
  } else if (st.type === 'interval') {
    if (!W.sub) W.sub = { round: 1, phase: 'ready', end: Date.now() + 5000 };
    const s = W.sub;
    const ex = EXERCISES[st.exs[(s.round - 1) % st.exs.length]];
    el.classList.add(s.phase === 'work' ? 'work' : 'rest');
    const lbl = s.phase === 'ready' ? 'Prepárate' : s.phase === 'work' ? '¡Dale!' : 'Descansa';
    body = `<div class="label">${st.title} · ronda ${s.round} de ${st.rounds}</div>
      <div class="label" style="font-size:1.2rem;color:var(--text)">${lbl}</div>
      <div class="big" id="wClock">${fmtSecs((s.end - Date.now()) / 1000)}</div>
      <div class="ex">${s.phase === 'rest' ? 'Siguiente: ' : ''}${ex.n}</div><p class="muted">${ex.tip}</p>`;
    foot = `<div class="grid2"><button data-act="wPause">${s.paused ? `${ic('play')}Seguir` : `${ic('pause')}Pausa`}</button><button data-act="wNext">Saltar bloque${ic('arrowRight')}</button></div>`;
    W.timer = setInterval(tickInterval, 200);
  }
  el.innerHTML = `${head}<div class="wbody">${body}</div>${foot}`;
}
function tickInterval() {
  const st = W.steps[W.i], s = W.sub;
  if (s.paused) return;
  const left = (s.end - Date.now()) / 1000;
  const c = $('#wClock'); if (c) c.textContent = fmtSecs(left);
  if (left <= 3.05 && left > 0 && Math.ceil(left) !== W.lastBeep) { W.lastBeep = Math.ceil(left); beep(660, 0.08); }
  if (left > 0) return;
  beep(s.phase === 'rest' || s.phase === 'ready' ? 990 : 440, 0.3); vibrate([150, 80, 150]);
  clearInterval(W.timer);
  if (s.phase === 'ready' || s.phase === 'rest') { s.phase = 'work'; s.end = Date.now() + st.work * 1000; }
  else if (s.round >= st.rounds) { return wNext(); }
  else { s.phase = 'rest'; s.round++; s.end = Date.now() + st.rest * 1000; }
  renderStep();
}
function wPause() {
  const s = W.sub;
  if (s.paused) { s.end = Date.now() + s.left; s.paused = false; }
  else { s.left = s.end - Date.now(); s.paused = true; }
  clearInterval(W.timer); renderStep();
}
let audioCtx;
function unlockAudio() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch { /* sin audio */ } }
function beep(freq = 880, dur = 0.15) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.frequency.value = freq; o.type = 'sine';
  g.gain.setValueAtTime(0.25, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + dur);
}
function vibrate(p) { try { navigator.vibrate?.(p); } catch { /* sin vibración */ } }

// ---------- PROGRESO ----------
function viewProgreso() {
  const p = S.profile, w = currentWeight(), lost = +(p.peso - w).toFixed(1);
  const lastWaist = [...S.waist].sort((a, b) => a.d.localeCompare(b.d)).pop();
  const whr = lastWaist ? (lastWaist.cm / p.estatura) : null;
  const g5 = +(p.peso * 0.95).toFixed(1), g10 = +(p.peso * 0.90).toFixed(1);
  const next = w > g5 ? { n: 'Meta 1 (−5%)', kg: g5 } : w > g10 ? { n: 'Meta 2 (−10%)', kg: g10 } : { n: 'Meta 3 (−15%)', kg: +(p.peso * 0.85).toFixed(1) };
  const prog = Math.min(100, Math.max(0, ((p.peso - w) / (p.peso - next.kg)) * 100));
  return `
    <section class="card hero">
      <h1>Tu progreso</h1>
      <div class="grid4">
        <div class="stat"><b>${w}</b><small>kg actual</small></div>
        <div class="stat"><b>${lost > 0 ? '−' : ''}${Math.abs(lost)}</b><small>kg desde inicio</small></div>
        <div class="stat"><b>${bmi(w).toFixed(1)}</b><small>IMC</small></div>
        <div class="stat"><b>${whr ? whr.toFixed(2) : '—'}</b><small>cintura/estatura</small></div>
      </div>
      <p style="margin-top:12px"><b>${next.n}: ${next.kg} kg</b> <small class="muted">· te faltan ${Math.max(0, w - next.kg).toFixed(1)} kg</small></p>
      <div class="bar"><i style="width:${prog}%"></i></div>
      <p class="muted" style="margin-top:8px">La mejor medida para ti es la <b>cintura entre estatura</b>: por debajo de 0.5 es saludable. Como sigues creciendo, el IMC es solo una referencia.</p>
    </section>

    <section class="card">
      <h2>${ic('scale')}Registrar</h2>
      <p class="muted">Pésate 1 vez por semana: mismo día, en ayunas, después de ir al baño. El peso diario sube y baja por agua y te puede desanimar.</p>
      <form id="fWeight" class="grid2">
        <div><label>Peso (kg)</label><input name="kg" type="number" step="0.1" min="30" max="250" placeholder="${w}"></div>
        <div><label>Cintura (cm, a la altura del ombligo)</label><input name="cm" type="number" step="0.5" min="40" max="200" placeholder="${lastWaist?.cm ?? ''}"></div>
        <button class="primary" type="submit" style="grid-column:1/-1">Guardar</button>
      </form>
    </section>

    <section class="card chart">
      <h2>${ic('trendDown')}Peso</h2>
      ${weightChart()}
      ${S.weights.length > 1 ? `<details><summary>Historial</summary><table>${[...S.weights].sort((a, b) => b.d.localeCompare(a.d)).map((x) => `<tr><td>${fmtDate(x.d)}</td><td class="n">${x.kg} kg</td><td class="n"><button class="small ghost" data-act="delWeight" data-d="${x.d}" aria-label="Borrar">${ic('x')}</button></td></tr>`).join('')}</table></details>` : ''}
    </section>

    <section class="card">
      <div class="row between"><h2>${ic('video')}Videos de progreso</h2><span class="pill">${S.videos.length}</span></div>
      <p class="muted">Cada semana, mismo lugar, misma luz y misma ropa. Gira despacio: frente, lado, espalda, lado (5 s cada uno). Al final di: semana, peso, cintura y una victoria de la semana.</p>
      <div class="grid2">
        <button class="primary" data-act="recordVideo">${ic('record')}Grabar aquí</button>
        <label class="btn" style="margin:0;color:var(--text);font-size:1rem">${ic('phone')}Cámara del cel<input type="file" accept="video/*" capture="user" data-act="pickVideo" hidden></label>
      </div>
      <p class="muted" style="margin-top:8px">Los videos se guardan en la app, pero <b>descárgalos también a tu galería</b> como respaldo.</p>
      <div class="videos" id="videoList"></div>
    </section>

    <section class="card">
      <h2>${ic('award')}Logros</h2>
      <div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? '' : 'off'}" title="${b.d}"><span class="ib">${ic(b.icon)}</span><b>${b.n}</b><br>${b.d}</div>`).join('')}</div>
    </section>`;
}
function weightChart() {
  const pts = [...S.weights].sort((a, b) => a.d.localeCompare(b.d));
  if (pts.length < 2) return '<p class="muted">Registra tu peso cada semana y aquí verás tu gráfica.</p>';
  const W_ = 340, H = 180, pl = 34, pr = 10, pt = 10, pb = 22;
  const t0 = parseKey(pts[0].d).getTime(), t1 = Math.max(parseKey(pts[pts.length - 1].d).getTime(), t0 + MS_DAY * 7);
  const goal = +(S.profile.peso * 0.95).toFixed(1);
  const vals = pts.map((x) => x.kg).concat(goal);
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const X = (t) => pl + ((t - t0) / (t1 - t0)) * (W_ - pl - pr);
  const Y = (v) => pt + ((hi - v) / (hi - lo)) * (H - pt - pb);
  const path = pts.map((x) => `${X(parseKey(x.d).getTime()).toFixed(1)},${Y(x.kg).toFixed(1)}`).join(' ');
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  return `<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Gráfica de peso">
    ${ticks.map((v) => `<line class="ax" x1="${pl}" x2="${W_ - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pl - 4}" y="${Y(v) + 3}" text-anchor="end">${v}</text>`).join('')}
    <line class="goal" x1="${pl}" x2="${W_ - pr}" y1="${Y(goal)}" y2="${Y(goal)}"/><text x="${W_ - pr}" y="${Y(goal) - 4}" text-anchor="end">meta −5%</text>
    <polyline class="ln" points="${path}"/>
    ${pts.map((x) => `<circle class="pt" r="3.5" cx="${X(parseKey(x.d).getTime())}" cy="${Y(x.kg)}"/>`).join('')}
    <text x="${pl}" y="${H - 6}">${fmtDate(pts[0].d)}</text><text x="${W_ - pr}" y="${H - 6}" text-anchor="end">${fmtDate(pts[pts.length - 1].d)}</text>
  </svg>`;
}

// ---------- Videos (IndexedDB) ----------
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('axfit', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('videos', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbDo(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction('videos', mode), st = tx.objectStore('videos');
    const req = fn(st);
    tx.oncomplete = () => res(req?.result);
    tx.onerror = () => rej(tx.error);
  });
}
async function saveVideo(blob) {
  const id = String(Date.now());
  const meta = { id, d: dateKey(), week: weekNum(), size: blob.size, type: blob.type || 'video/mp4' };
  try {
    await idbDo('readwrite', (st) => st.put({ id, blob }));
    navigator.storage?.persist?.();
  } catch (e) {
    toast('No hubo espacio para guardar el video. Descárgalo a tu galería.');
    downloadBlob(blob, videoName(meta));
  }
  S.videos.push(meta);
  save(); checkBadges(); render();
  toast(`Video de la semana ${meta.week} guardado`);
}
function videoName(m) { return `AxFit-semana-${String(m.week).padStart(2, '0')}-${m.d}.${/mp4/.test(m.type) ? 'mp4' : 'webm'}`; }
function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
const videoURLs = [];
async function renderVideos() {
  const box = $('#videoList'); if (!box) return;
  videoURLs.splice(0).forEach((u) => URL.revokeObjectURL(u));
  const list = [...S.videos].sort((a, b) => b.d.localeCompare(a.d));
  if (!list.length) { box.innerHTML = ''; return; }
  let all = [];
  try { all = await idbDo('readonly', (st) => st.getAll()); } catch { /* sin IDB */ }
  const map = Object.fromEntries((all || []).map((x) => [x.id, x.blob]));
  box.innerHTML = list.map((m) => {
    const b = map[m.id];
    const url = b ? URL.createObjectURL(b) : null;
    if (url) videoURLs.push(url);
    return `<div class="video-item">
      <div class="row between"><b>Semana ${m.week}</b><small class="muted">${fmtDate(m.d)} · ${(m.size / 1048576).toFixed(1)} MB</small></div>
      ${url ? `<video src="${url}" controls playsinline preload="metadata"></video>` : '<p class="muted">El archivo ya no está en la app (descargado o borrado por el sistema).</p>'}
      <div class="row">${url ? `<button class="small" data-act="dlVideo" data-id="${m.id}">${ic('download')}Descargar</button>` : ''}<button class="small danger" data-act="delVideo" data-id="${m.id}">Borrar</button></div>
    </div>`;
  }).join('');
}
let rec = null;
async function recordVideo() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    return toast('Tu navegador no permite grabar aquí. Usa "Cámara del cel".');
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: true });
  } catch (e) {
    return toast('No se pudo abrir la cámara. Revisa los permisos o usa "Cámara del cel".');
  }
  rec = { stream, chunks: [], facing: 'user' };
  openModal(`
    <div class="row between"><h2>Video semana ${weekNum()}</h2><span id="recTime" class="pill">0:00</span></div>
    <video id="recPrev" class="rec-preview" autoplay muted playsinline></video>
    <p class="muted">Gira despacio: frente → lado → espalda → lado. Luego di tu peso, cintura y una victoria de la semana.</p>
    <div class="grid2">
      <button id="recBtn" class="primary" data-act="recToggle">${ic('record')}Grabar</button>
      <button data-act="recFlip">${ic('refresh')}Cambiar cámara</button>
    </div>
    <button class="block ghost" style="margin-top:8px" data-act="recCancel">Cancelar</button>`);
  $('#recPrev').srcObject = stream;
}
function recToggle() {
  if (!rec) return;
  if (!rec.mr) {
    const types = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
    const type = types.find((t) => MediaRecorder.isTypeSupported?.(t));
    rec.mr = new MediaRecorder(rec.stream, type ? { mimeType: type, videoBitsPerSecond: 2_500_000 } : undefined);
    rec.mr.ondataavailable = (e) => e.data.size && rec.chunks.push(e.data);
    rec.mr.onstop = () => {
      const blob = new Blob(rec.chunks, { type: rec.mr.mimeType || 'video/webm' });
      recCleanup(); closeModal(); saveVideo(blob);
    };
    rec.mr.start(1000);
    rec.t0 = Date.now();
    $('#recBtn').innerHTML = '<span class="rec-dot"></span> Detener';
    rec.tick = setInterval(() => {
      const s = Math.floor((Date.now() - rec.t0) / 1000);
      $('#recTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      if (s >= 120) recToggle(); // máximo 2 minutos
    }, 500);
  } else if (rec.mr.state === 'recording') {
    rec.mr.stop();
  }
}
async function recFlip() {
  if (!rec || rec.mr) return;
  rec.stream.getTracks().forEach((t) => t.stop());
  rec.facing = rec.facing === 'user' ? 'environment' : 'user';
  try {
    rec.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: rec.facing }, audio: true });
    $('#recPrev').srcObject = rec.stream;
  } catch { toast('No se pudo cambiar de cámara'); }
}
function recCleanup() {
  if (!rec) return;
  clearInterval(rec.tick);
  rec.stream.getTracks().forEach((t) => t.stop());
  rec = null;
}

// ---------- MÁS ----------
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (currentTab() === 'mas') render(); });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function viewMas() {
  const s = S.settings, p = S.profile;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `
    ${!isStandalone() ? `<section class="card hero">
      <h2>${ic('phone')}Instala AxFit en tu celular</h2>
      ${installEvt ? '<button class="primary block" data-act="install">Instalar app</button>'
        : ios ? '<p>En iPhone: abre en Safari → botón Compartir → <b>Agregar a pantalla de inicio</b>. Necesitas iOS 16.4+ para las notificaciones.</p>'
        : '<p>En Chrome: menú ⋮ → <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</p>'}
    </section>` : ''}

    <section class="card">
      <h2>${ic('sun')}Apariencia</h2>
      <div class="seg">${Object.entries(THEMES).map(([k, t]) => `<button class="${getTheme() === k ? 'on' : ''}" data-act="setTheme" data-t="${k}">${ic(t.i)}${t.n}</button>`).join('')}</div>
    </section>

    <section class="card">
      <h2>${ic('heart')}Mi porqué</h2>
      <textarea id="porque" placeholder="¿Por qué empezaste? Escríbelo para los días difíciles.">${esc(p.porque)}</textarea>
      <button class="small" data-act="savePorque" style="margin-top:8px">Guardar</button>
    </section>

    <section class="card">
      <h2>${ic('bell')}Recordatorios</h2>
      ${perm === 'granted' && s.notif
        ? '<p class="pill accent">Notificaciones activadas</p>'
        : perm === 'denied'
          ? '<p class="muted">Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.</p>'
          : perm === 'unsupported'
            ? '<p class="muted">Este navegador no soporta notificaciones. Usa el calendario de abajo.</p>'
            : '<button class="primary block" data-act="enableNotif">Activar notificaciones</button>'}
      <form id="fSettings">
        <div class="grid2">
          <div><label>Video de progreso: día</label><select name="videoDay">${DAY_NAMES.map((n, i) => `<option value="${i}" ${+s.videoDay === i ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div><label>Hora</label><input name="videoTime" type="time" value="${s.videoTime}"></div>
          <div><label><input type="checkbox" name="workoutReminder" ${s.workoutReminder ? 'checked' : ''} style="width:auto"> Entrenar (Lun–Jue)</label><input name="workoutTime" type="time" value="${s.workoutTime}"></div>
          <div><label><input type="checkbox" name="sleepReminder" ${s.sleepReminder ? 'checked' : ''} style="width:auto"> Hora de dormir</label><input name="sleepTime" type="time" value="${s.sleepTime}"></div>
        </div>
        <button class="small" type="submit" style="margin-top:10px">Guardar horarios</button>
        ${perm === 'granted' ? '<button class="small ghost" type="button" data-act="testNotif" style="margin-top:10px">Probar notificación</button>' : ''}
      </form>
      <div class="card warn" style="margin-top:12px">
        <b>Recomendado: agrega los recordatorios a tu calendario.</b>
        <p>Las notificaciones de una app web solo llegan de forma confiable cuando la app está abierta o en segundo plano reciente. El calendario de tu celular avisa <b>siempre</b>, aunque la app esté cerrada.</p>
        <button class="primary block" data-act="ics">${ic('calendar')}Descargar recordatorios (.ics)</button>
      </div>
    </section>

    <section class="card">
      <h2>${ic('moon')}Tu sueño es tu punto débil</h2>
      <p>Te levantas a las 5:20 y te duermes a las 12–1 am: son <b>4–5 horas</b>. A tu edad necesitas <b>8–10</b> (Academia Americana de Medicina del Sueño).</p>
      <ul>
        <li>Dormir poco aumenta el hambre y los antojos de azúcar (sube la grelina) y frena la quema de grasa.</li>
        <li>La hormona de crecimiento se libera sobre todo en el sueño profundo.</li>
        <li><b>Idea:</b> pasas ~4 h al día en el camión. Usa una parte para tareas o lectura en el cel y otra para dormir. Así puedes acostarte a las 11 pm.</li>
        <li>Cierra la laptop a una hora fija. El código de mañana sale mejor con 7 h de sueño que con 4.</li>
      </ul>
    </section>

    <section class="card">
      <h2>${ic('zap')}Energía y foco en la mañana</h2>
      ${MORNING.map((x) => `<details><summary>${x.t}</summary><p>${x.d}</p></details>`).join('')}
    </section>

    <section class="card">
      <h2>${ic('pill')}Complejo B</h2>
      <label class="check"><input type="checkbox" data-act="vitBSetting" ${s.vitB ? 'checked' : ''}><span class="t"><b>Lo estoy tomando</b><small>Muestra la casilla diaria en Hoy</small></span></label>
      <p>${VIT_B.intro}</p>
      ${VIT_B.puntos.map((x) => `<details><summary>${x.t}</summary><p>${x.d}</p></details>`).join('')}
    </section>

    <section class="card">
      <h2>${ic('stethoscope')}Salud y seguridad</h2>
      <ul>
        <li>Ve a tu Unidad de Medicina Familiar del IMSS (Seguro Facultativo de estudiante) y pide revisión y canalización a nutrición. Lleva esta app.</li>
        <li>Ritmo sano: 0.5–1 kg por semana. Las primeras 2 semanas puede bajar más por agua.</li>
        <li>Nunca uses pastillas, quemadores, tés "para adelgazar", laxantes ni ayunos largos.</li>
        <li>Ve al médico si tienes mareos frecuentes, desmayos, caída de cabello, mucho frío, si dejas de crecer o si sientes culpa o ansiedad fuerte con la comida.</li>
      </ul>
    </section>

    <section class="card">
      <h2>${ic('book')}Fuentes</h2>
      ${SOURCES.map((x) => `<details><summary>${x.n}</summary><p>${x.uso}</p>${x.url ? `<a href="${x.url}" target="_blank" rel="noopener">${x.url}</a>` : ''}</details>`).join('')}
      <p class="muted" style="margin-top:8px">AxFit es una guía educativa, no sustituye la consulta con un profesional de la salud.</p>
    </section>

    <section class="card">
      <h2>${ic('user')}Perfil</h2>
      <form id="fProfileEdit">
        ${profileFields(p)}
        <button class="small" type="submit" style="margin-top:10px">Guardar perfil</button>
      </form>
    </section>

    ${cloudCard()}

    <section class="card">
      <h2>${ic('database')}Respaldo</h2>
      <p class="muted">${Cloud.user ? 'Ya tienes copia en la nube. Si quieres, también' : 'Sin sesión en la nube, tus datos viven solo en este celular.'} exporta un archivo de respaldo de vez en cuando (no incluye los videos).</p>
      <div class="row wrap">
        <button class="small" data-act="export">${ic('download')}Exportar datos</button>
        <label class="btn small" style="margin:0;color:var(--text)">${ic('upload')}Importar<input type="file" accept="application/json" data-act="import" hidden></label>
        <button class="small danger" data-act="reset">Borrar todo</button>
      </div>
    </section>`;
}

// ---------- Notificaciones ----------
let swReg = null;
async function enableNotif() {
  if (!('Notification' in window)) return toast('Este navegador no soporta notificaciones');
  const r = await Notification.requestPermission();
  if (r !== 'granted') { render(); return toast('Sin permiso no puedo avisarte. Usa el calendario.'); }
  S.settings.notif = true; save();
  try {
    if (swReg && 'periodicSync' in swReg) {
      const st = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (st.state === 'granted') await swReg.periodicSync.register('axfit-reminders', { minInterval: 60 * 60 * 1000 });
    }
  } catch { /* periodic sync opcional */ }
  notify('¡Listo!', 'Te avisaré para tu video semanal, tu entrenamiento y la hora de dormir.', 'hoy');
  render();
}
async function notify(title, body, tab = 'hoy') {
  const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: `axfit-${tab}-${title}`, data: { url: `./#${tab}` }, vibrate: [100, 50, 100] };
  try {
    const reg = swReg || await navigator.serviceWorker?.ready;
    if (reg) return reg.showNotification(title, opts);
  } catch { /* fallback abajo */ }
  try { new Notification(title, opts); } catch { /* nada */ }
}
// Revisa recordatorios mientras la app está abierta (o en segundo plano reciente).
function checkReminders() {
  if (!S.profile || !S.settings.notif || Notification?.permission !== 'granted') return;
  const s = S.settings, k = dateKey(), dow = new Date().getDay(), m = nowMin();
  const once = (id, fn) => { if (S.notified[id] !== k) { S.notified[id] = k; save(); fn(); } };
  if (dow === +s.videoDay && m >= hm(s.videoTime) && videoDue()) {
    once('video', () => notify('Hoy toca tu video de progreso', `Semana ${weekNum()}. Pésate, mide tu cintura y graba. Tu yo del futuro te lo va a agradecer.`, 'progreso'));
  }
  if (s.workoutReminder && dow >= 1 && dow <= 4 && m >= hm(s.workoutTime) && m < hm(s.workoutTime) + 75 && !today().workout) {
    once('workout', () => notify(`${WEEK_PLAN[dow].n} a las 8`, MOTIVATION[(dow * 7 + new Date().getDate()) % MOTIVATION.length], 'ejercicio'));
  }
  if (s.sleepReminder && m >= hm(s.sleepTime) && m < hm(s.sleepTime) + 90) {
    once('sleep', () => notify('Hora de dormir', 'Cierra la laptop. Dormir también es entrenar.', 'hoy'));
  }
}
// El service worker no puede leer localStorage: le dejamos la configuración en Cache Storage.
async function syncSWConfig() {
  if (!('caches' in window) || !S.profile) return;
  try {
    const lv = lastVideo();
    const cfg = { ...S.settings, inicio: S.profile.inicio, lastVideo: lv?.d || null, workoutToday: today().workout, today: dateKey(), notified: S.notified };
    const c = await caches.open('axfit-config');
    await c.put('./__config', new Response(JSON.stringify(cfg), { headers: { 'content-type': 'application/json' } }));
  } catch { /* opcional */ }
}

// ---------- Calendario .ics ----------
function icsDate(d) { const z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}T${z(d.getHours())}${z(d.getMinutes())}00`; }
function nextDow(dow, time) {
  const d = new Date(); const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  while (d.getDay() !== dow || d < new Date()) d.setDate(d.getDate() + 1);
  return d;
}
function downloadICS() {
  const s = S.settings, BY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const ev = (uid, start, mins, title, desc, rrule) => {
    const end = new Date(start.getTime() + mins * 60000);
    return ['BEGIN:VEVENT', `UID:${uid}@axfit`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`,
      `RRULE:${rrule}`, `SUMMARY:${title}`, `DESCRIPTION:${desc}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'TRIGGER:-PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n');
  };
  const events = [
    ev('video', nextDow(+s.videoDay, s.videoTime), 30, 'AxFit: video de progreso + peso + cintura', 'Mismo lugar\\, misma luz\\, misma ropa. Frente\\, lado\\, espalda\\, lado. Abre AxFit para grabar.', `FREQ=WEEKLY;BYDAY=${BY[+s.videoDay]}`),
    ev('prep', nextDow(0, '16:00'), 90, 'AxFit: preparar comida de la semana', '12 huevos cocidos\\, pollo\\, arroz integral\\, verduras picadas.', 'FREQ=WEEKLY;BYDAY=SU'),
  ];
  if (s.workoutReminder) events.push(ev('workout', nextDow(1, s.workoutTime), 60, 'AxFit: entrenamiento 8:00 pm', 'Abre AxFit y dale play. Solo 1 hora.', 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH'));
  if (s.sleepReminder) events.push(ev('sleep', nextDow(0, s.sleepTime), 15, 'AxFit: hora de dormir', 'Cierra la laptop. Dormir también es entrenar.', 'FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH'));
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AxFit//ES', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
  downloadBlob(new Blob([ics], { type: 'text/calendar' }), 'AxFit-recordatorios.ics');
  toast('Abre el archivo descargado para agregarlo a tu calendario');
}

// ---------- Eventos ----------
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  const a = el.dataset.act;
  const acts = {
    closeModal, sos: showSOS, whyCalc: showWhyCalc,
    setTheme: () => setTheme(el.dataset.t),
    cloudSync: () => cloudSync({ manual: true }),
    cloudSignOut: async () => {
      if (!confirm('¿Cerrar sesión? Tus datos se quedan en este celular y en la nube.')) return;
      await Cloud.signOut(); S.cloud = null; save(false); render(); toast('Sesión cerrada');
    },
    cloudSignUp: async () => {
      const f = el.closest('form');
      if (!f.reportValidity()) return;
      try {
        const r = await Cloud.signUp(f.email.value.trim(), f.password.value);
        if (r === 'in') { await cloudSync(); toast('Cuenta creada'); }
        else openModal(`<h2>${ic('cloud')}Revisa tu correo</h2><p>Te mandamos un enlace a <b>${esc(f.email.value)}</b>. Ábrelo en este celular para confirmar tu cuenta (revisa también spam).</p><button class="block" data-act="closeModal">Entendido</button>`);
      } catch (e) { toast(e.message, 3500); }
    },
    cycleTheme: () => { const ks = Object.keys(THEMES); setTheme(ks[(ks.indexOf(getTheme()) + 1) % ks.length]); toast(`Tema: ${THEMES[getTheme()].n}`); },
    nextQuote: () => { S.quoteOffset++; save(); render(); },
    porque: () => openModal(`<h2>${ic('heart')}Tu porqué</h2><p class="quote">${esc(S.profile.porque)}</p><button class="block" data-act="closeModal">Cerrar</button>`),
    foodDay: () => { foodDay = +el.dataset.i; render(); },
    shopReset: () => { S.shop = {}; save(); render(); },
    toggleWorkout: () => { today().workout = !today().workout; save(); checkBadges(); render(); },
    startWorkout, wStop: () => { if (confirm('¿Salir del entrenamiento?')) stopWorkout(); }, wNext, wPrev, wPause,
    wAdd: () => { W.end += 15000; },
    recordVideo, recToggle, recFlip,
    recCancel: () => { if (rec?.mr) rec.mr.onstop = null; recCleanup(); closeModal(); },
    dlVideo: async () => {
      const m = S.videos.find((v) => v.id === el.dataset.id);
      const r = await idbDo('readonly', (st) => st.get(m.id));
      if (r?.blob) downloadBlob(r.blob, videoName(m));
    },
    delVideo: async () => {
      if (!confirm('¿Borrar este video de la app? Si no lo descargaste, se pierde.')) return;
      await idbDo('readwrite', (st) => st.delete(el.dataset.id)).catch(() => {});
      S.videos = S.videos.filter((v) => v.id !== el.dataset.id); save(); render();
    },
    delWeight: () => { if (S.weights.length > 1) { S.weights = S.weights.filter((w) => w.d !== el.dataset.d); save(); render(); } },
    water: () => { const n = +el.dataset.n; const d = today(); d.agua = d.agua === n ? n - 1 : n; save(); render(); },
    savePorque: () => { S.profile.porque = $('#porque').value; save(); toast('Guardado'); },
    enableNotif, testNotif: () => notify('Así se verán tus recordatorios', MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)]),
    ics: downloadICS,
    install: async () => { installEvt?.prompt(); await installEvt?.userChoice; installEvt = null; render(); },
    export: () => downloadBlob(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), `AxFit-respaldo-${dateKey()}.json`),
    reset: async () => {
      if (!confirm('Esto borra TODO tu progreso y videos de este celular y cierra tu sesión (la copia en la nube no se borra). ¿Seguro?')) return;
      localStorage.removeItem(STORE_KEY);
      await Cloud.signOut();
      try { indexedDB.deleteDatabase('axfit'); } catch { /* nada */ }
      S = structuredClone(DEFAULT_STATE); location.hash = '#hoy'; render();
    },
  };
  if (acts[a]) { e.preventDefault(); acts[a](); }
});
document.addEventListener('change', async (e) => {
  const el = e.target, a = el.dataset.act;
  if (a === 'meal') { today().meals[el.dataset.k] = el.checked; save(); checkBadges(); render(); }
  if (a === 'vitB') { today().vitB = el.checked; save(); render(); }
  if (a === 'vitBSetting') { S.settings.vitB = el.checked; save(); toast(el.checked ? 'Casilla de Complejo B activada en Hoy' : 'Casilla de Complejo B oculta'); }
  if (a === 'shop') { S.shop = S.shop || {}; S.shop[el.dataset.id] = el.checked; save(); el.closest('.check').classList.toggle('done', el.checked); }
  if (a === 'sleep') { today().sueno = el.value === '' ? null : +el.value; save(); render(); }
  if (a === 'pickVideo' && el.files[0]) saveVideo(el.files[0]);
  if (a === 'import' && el.files[0]) {
    try {
      const data = JSON.parse(await el.files[0].text());
      if (!data.profile) throw new Error();
      S = { ...structuredClone(DEFAULT_STATE), ...data, settings: { ...DEFAULT_STATE.settings, ...data.settings } };
      save(); render(); toast('Datos importados');
    } catch { toast('Archivo no válido'); }
  }
});
document.addEventListener('submit', (e) => {
  const f = new FormData(e.target);
  if (e.target.id === 'fWeight') {
    e.preventDefault();
    const kg = parseFloat(f.get('kg')), cm = parseFloat(f.get('cm')), k = dateKey();
    if (!kg && !cm) return toast('Escribe tu peso o tu cintura');
    if (kg) { S.weights = S.weights.filter((w) => w.d !== k).concat({ d: k, kg }); }
    if (cm) { S.waist = S.waist.filter((w) => w.d !== k).concat({ d: k, cm }); }
    save(); checkBadges(); render();
    const prev = [...S.weights].sort((a, b) => a.d.localeCompare(b.d)).slice(-2);
    toast(kg && prev.length === 2 && prev[1].kg < prev[0].kg ? `−${(prev[0].kg - prev[1].kg).toFixed(1)} kg. ¡Sigue así!` : 'Guardado. La constancia gana');
  }
  if (e.target.id === 'fSettings') {
    e.preventDefault();
    Object.assign(S.settings, {
      videoDay: +f.get('videoDay'), videoTime: f.get('videoTime'),
      workoutReminder: f.get('workoutReminder') === 'on', workoutTime: f.get('workoutTime'),
      sleepReminder: f.get('sleepReminder') === 'on', sleepTime: f.get('sleepTime'),
    });
    S.notified = {};
    save(); toast('Horarios guardados. Vuelve a descargar el calendario si lo usas.');
  }
  if (e.target.id === 'fCloud') {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]'); btn.disabled = true;
    Cloud.signIn(f.get('email').trim(), f.get('password'))
      .then(() => cloudSync())
      .then(() => toast(S.profile ? 'Sesión iniciada' : 'Sesión iniciada. Llena tu perfil para empezar'))
      .catch((err) => toast(err.message, 3500))
      .finally(() => { btn.disabled = false; });
  }
  if (e.target.id === 'fProfileEdit') {
    e.preventDefault();
    S.profile = { ...readProfile(f), porque: S.profile.porque };
    save(); render(); toast('Perfil actualizado');
  }
});

// ---------- Arranque ----------
document.querySelectorAll('[data-i]').forEach((el) => { el.outerHTML = ic(el.dataset.i); });
renderThemeBtn(); syncThemeColor();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; syncSWConfig(); }).catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); checkReminders(); cloudSync(); } });
window.addEventListener('online', () => cloudSync());
setInterval(checkReminders, 30000);
render();
checkReminders();
Cloud.fromRedirect().then((ok) => { if (ok) toast('Correo confirmado. Sesión iniciada'); cloudSync(); });
