/* ==========================================================================
   BANGASH ADMIN PANEL — main app (login, roles, navigation, routing)
   ========================================================================== */
import { useEffect, useState } from 'preact/hooks';
import type { Session } from '@supabase/supabase-js';
import { sb, errorText, type Admin } from './lib';
import { Icon, Toasts, ConfirmHost, Loading } from './ui';
import { Dashboard } from './pages/Dashboard';
import { PropertiesList, PropertyForm } from './pages/Properties';
import { Leads } from './pages/Leads';
import { ProjectsList, ProjectForm } from './pages/Projects';
import { Reviews } from './pages/Reviews';
import { Settings } from './pages/Settings';
import { Account } from './pages/Account';
import logoUrl from '../assets/brand/logo-mark.png';

/* ---------------- Hash router ---------------- */
const readRoute = () => location.hash.replace(/^#\/?/, '') || 'dashboard';
export const go = (path: string) => { location.hash = `#/${path}`; };
function useRoute() {
  const [route, setRoute] = useState(readRoute());
  useEffect(() => {
    const on = () => { setRoute(readRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export interface Ctx { me: Admin; newLeads: number; refreshCounts: () => void }

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [me, setMe] = useState<Admin | null | undefined>(undefined);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setMe(session === null ? null : undefined); return; }
    setMe(undefined);
    sb.from('admins').select('*').eq('user_id', session.user.id).maybeSingle().then(({ data }) => setMe((data as Admin) ?? null));
  }, [session?.user.id]);

  let body;
  if (session === undefined || (session && me === undefined)) body = <div class="a-center"><Loading /></div>;
  else if (!session) body = <Login />;
  else if (!me) body = <NoAccess email={session.user.email ?? ''} />;
  else body = <Shell me={me} />;

  return (
    <>
      {body}
      <Toasts />
      <ConfirmHost />
    </>
  );
}

/* ---------------- Login ---------------- */
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: Event) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(errorText(error));
    setBusy(false);
  };

  return (
    <div class="a-login">
      <form class="a-login__card" onSubmit={submit}>
        <img src={logoUrl.src} alt="" class="a-login__logo" width={72} height={72} />
        <h1>Admin Panel</h1>
        <p class="a-muted">Bangash Real Estate &amp; Builders</p>
        <label class="a-field">
          <span class="a-field__label">Email</span>
          <input type="email" required autoComplete="username" value={email} onInput={(e) => setEmail(e.currentTarget.value)} placeholder="you@example.com" />
        </label>
        <label class="a-field">
          <span class="a-field__label">Password</span>
          <div class="a-input-icon">
            {show ? (
              <input type="text" required autoComplete="current-password" value={password} onInput={(e) => setPassword(e.currentTarget.value)} />
            ) : (
              <input type="password" required autoComplete="current-password" value={password} onInput={(e) => setPassword(e.currentTarget.value)} />
            )}
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Password chhupayein' : 'Password dikhayein'}><Icon name="eye" /></button>
          </div>
        </label>
        {error && <p class="a-alert a-alert--err">{error}</p>}
        <button class="a-btn a-btn--primary a-btn--block a-btn--lg" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
        <p class="a-muted a-small" style={{ textAlign: 'center', marginTop: '14px' }}>Password bhool gaye? Super admin (Zubair) se rabta karein.</p>
      </form>
      <a href="/" class="a-login__back">← Website par wapas</a>
    </div>
  );
}

function NoAccess({ email }: { email: string }) {
  return (
    <div class="a-login">
      <div class="a-login__card">
        <h1>Access nahi hai</h1>
        <p class="a-muted">{email} admin list mein shamil nahi hai. Super admin se rabta karein.</p>
        <button class="a-btn a-btn--primary a-btn--block" onClick={() => sb.auth.signOut()}>Logout</button>
      </div>
    </div>
  );
}

/* ---------------- Layout + navigation ---------------- */
const NAV = [
  { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: 'properties', label: 'Properties', icon: 'home' },
  { path: 'leads', label: 'Leads', icon: 'leads' },
  { path: 'projects', label: 'Projects', icon: 'hammer' },
  { path: 'reviews', label: 'Reviews', icon: 'star' },
  { path: 'settings', label: 'Settings', icon: 'settings', super: true },
  { path: 'account', label: 'My Account', icon: 'user' },
];

function Shell({ me }: { me: Admin }) {
  const route = useRoute();
  const [newLeads, setNewLeads] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const refreshCounts = () => {
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new').then(({ count }) => setNewLeads(count ?? 0));
  };
  useEffect(() => {
    refreshCounts();
    const t = setInterval(refreshCounts, 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => setMoreOpen(false), [route]);

  const [section, id] = route.split('/');
  const ctx: Ctx = { me, newLeads, refreshCounts };
  const nav = NAV.filter((n) => !n.super || me.role === 'super_admin');
  const isSuper = me.role === 'super_admin';

  let page;
  switch (section) {
    case 'properties': page = id ? <PropertyForm id={id} ctx={ctx} /> : <PropertiesList ctx={ctx} />; break;
    case 'leads': page = <Leads ctx={ctx} />; break;
    case 'projects': page = id ? <ProjectForm id={id} ctx={ctx} /> : <ProjectsList ctx={ctx} />; break;
    case 'reviews': page = <Reviews ctx={ctx} />; break;
    case 'settings': page = isSuper ? <Settings ctx={ctx} /> : <Dashboard ctx={ctx} />; break;
    case 'account': page = <Account ctx={ctx} />; break;
    default: page = <Dashboard ctx={ctx} />;
  }

  const link = (n: (typeof NAV)[number]) => (
    <a href={`#/${n.path}`} class={`a-nav__link${section === n.path || (section === '' && n.path === 'dashboard') ? ' is-active' : ''}`}>
      <Icon name={n.icon} size={20} />
      <span>{n.label}</span>
      {n.path === 'leads' && newLeads > 0 && <b class="a-badge">{newLeads}</b>}
    </a>
  );

  return (
    <div class="a-shell">
      <aside class="a-side">
        <a href="#/dashboard" class="a-brand">
          <img src={logoUrl.src} alt="" width={40} height={40} />
          <span><strong>BANGASH</strong><small>Admin Panel</small></span>
        </a>
        <nav class="a-nav">{nav.map(link)}</nav>
        <div class="a-side__foot">
          <a href="/" target="_blank" rel="noopener" class="a-nav__link"><Icon name="globe" size={20} /><span>View website</span></a>
          <div class="a-me">
            <span class="a-me__avatar">{(me.name || me.email).charAt(0).toUpperCase()}</span>
            <span><strong>{me.name || me.email.split('@')[0]}</strong><small>{isSuper ? 'Super Admin' : 'Editor'}</small></span>
          </div>
        </div>
      </aside>

      <header class="a-top">
        <a href="#/dashboard" class="a-brand a-brand--sm"><img src={logoUrl.src} alt="" width={34} height={34} /><strong>BANGASH</strong></a>
        <a href="/" target="_blank" rel="noopener" class="a-btn a-btn--ghost a-btn--sm"><Icon name="globe" size={16} /> Website</a>
      </header>

      <main class="a-main">{page}</main>

      <nav class="a-tabbar" aria-label="Main">
        {nav.slice(0, 4).map(link)}
        <button class={`a-nav__link${moreOpen ? ' is-active' : ''}`} onClick={() => setMoreOpen(!moreOpen)}>
          <Icon name="menu" size={20} /><span>More</span>
        </button>
      </nav>
      {moreOpen && (
        <div class="a-sheet" onClick={(e) => e.target === e.currentTarget && setMoreOpen(false)}>
          <div class="a-sheet__box">
            {nav.slice(4).map(link)}
            <a href="/" target="_blank" rel="noopener" class="a-nav__link"><Icon name="globe" size={20} /><span>View website</span></a>
            <button class="a-nav__link" onClick={() => sb.auth.signOut()}><Icon name="logout" size={20} /><span>Logout</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
