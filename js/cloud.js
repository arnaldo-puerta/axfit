// AxFit — sincronización con Supabase usando su API REST (sin librerías, para que la app siga funcionando sin internet).
// La app guarda primero en el celular; la nube es una copia que se actualiza sola cuando hay internet.
const Cloud = (() => {
  const SESSION_KEY = 'axfit-session';
  const enabled = () => Boolean(SUPABASE_URL && SUPABASE_KEY);
  let session = null;
  let pushTimer = null;
  let busy = false;

  try { session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { session = null; }
  function keep(s) {
    session = s;
    try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch { /* sin storage */ }
  }
  function fromAuth(r) {
    return { access: r.access_token, refresh: r.refresh_token, exp: Date.now() + (r.expires_in || 3600) * 1000, id: r.user?.id, email: r.user?.email };
  }

  async function req(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
    const h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...headers };
    if (auth) { await fresh(); h.Authorization = `Bearer ${session.access}`; }
    const res = await fetch(`${SUPABASE_URL}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(errMsg(json, res.status));
    return json;
  }
  function errMsg(j, status) {
    const m = j?.msg || j?.error_description || j?.message || j?.error || `Error ${status}`;
    if (/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos';
    if (/email not confirmed/i.test(m)) return 'Primero confirma tu correo (revisa tu bandeja y spam)';
    if (/already registered/i.test(m)) return 'Ese correo ya tiene cuenta: inicia sesión';
    if (/password.*(6|characters)/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres';
    if (/rate limit/i.test(m)) return 'Demasiados intentos. Espera unos minutos';
    return m;
  }
  // Renueva el token si está por vencer (dura 1 hora).
  async function fresh() {
    if (!session) throw new Error('Inicia sesión');
    if (session.exp - Date.now() > 60000) return;
    try {
      const r = await req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', auth: false, body: { refresh_token: session.refresh } });
      keep(fromAuth(r));
    } catch (e) {
      if (navigator.onLine) keep(null); // sesión inválida: hay que volver a entrar
      throw e;
    }
  }

  async function signUp(email, password) {
    const redirect = encodeURIComponent(location.origin + location.pathname);
    const r = await req(`/auth/v1/signup?redirect_to=${redirect}`, { method: 'POST', auth: false, body: { email, password } });
    if (r.access_token) { keep(fromAuth(r)); return 'in'; }
    return 'confirm'; // Supabase manda un correo para confirmar
  }
  async function signIn(email, password) {
    keep(fromAuth(await req('/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email, password } })));
  }
  async function signOut() {
    clearTimeout(pushTimer);
    try { if (session) await req('/auth/v1/logout', { method: 'POST' }); } catch { /* igual cerramos aquí */ }
    keep(null);
  }
  // Al confirmar el correo, Supabase regresa a la app con #access_token=… en la dirección.
  async function fromRedirect() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (!h.get('access_token')) return false;
    session = { access: h.get('access_token'), refresh: h.get('refresh_token'), exp: Date.now() + (+h.get('expires_in') || 3600) * 1000 };
    history.replaceState(null, '', location.pathname + '#mas');
    try {
      const u = await req('/auth/v1/user');
      keep({ ...session, id: u.id, email: u.email });
      return true;
    } catch { keep(null); return false; }
  }

  async function download() {
    const rows = await req(`/rest/v1/user_state?select=data,updated_at&user_id=eq.${session.id}`);
    return rows[0] || null;
  }
  async function upload(data) {
    await req('/rest/v1/user_state?on_conflict=user_id', {
      method: 'POST', body: { user_id: session.id, data },
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
  }

  // Sube los cambios unos segundos después del último guardado.
  function schedulePush(getData, onDone) {
    if (!enabled() || !session) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(getData, onDone), 3000);
  }
  async function push(getData, onDone) {
    if (!enabled() || !session || busy || !navigator.onLine) return;
    busy = true;
    try { await upload(getData()); onDone?.(null); } catch (e) { onDone?.(e); } finally { busy = false; }
  }

  return {
    enabled, signUp, signIn, signOut, fromRedirect, download, upload, schedulePush, push,
    get user() { return session ? { id: session.id, email: session.email } : null; },
  };
})();
