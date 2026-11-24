/* ==========================================================================
   BANGASH ADMIN PANEL — main app (login, roles, navigation, routing)
   ========================================================================== */
import { useEffect, useRef, useState } from 'preact/hooks';
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
import { Notifications } from './pages/Notifications';
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

export interface Ctx {
  me: Admin;
  newLeads: number;
  /** Unread notifications (changes made by other people since the bell was last opened) */
  unread: number;
  /** When this admin last opened the notifications */
  seenAt: string;
  markSeen: () => void;
  refreshCounts: () => void;
}

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
function BrandPanel() {
  return (
    <aside class="a-login__brand">
      <img src={logoUrl.src} alt="" width={84} height={84} />
      <h2>Bangash Real Estate &amp; Builders</h2>
      <p>Your trusted partner in real estate &amp; construction.</p>
      <ul>
        <li><Icon name="home" /> Add and update property listings</li>
        <li><Icon name="leads" /> Reply to website enquiries fast</li>
        <li><Icon name="globe" /> Changes go live on the website automatically</li>
      </ul>
    </aside>
  );
}

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
      <BrandPanel />
      <div class="a-login__side">
        <form class="a-login__card" onSubmit={submit}>
          <img src={logoUrl.src} alt="" class="a-login__logo" width={64} height={64} />
          <h1>Welcome back</h1>
          <p class="a-muted">Sign in to the Bangash admin panel</p>
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
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name="eye" /></button>
            </div>
          </label>
          {error && <p class="a-alert a-alert--err">{error}</p>}
          <button class="a-btn a-btn--gold a-btn--block a-btn--lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p class="a-muted a-small a-login__help">Forgot your password? Contact the super admin.</p>
        </form>
        <a href="/" class="a-login__back">← Back to website</a>
      </div>
    </div>
  );
}

function NoAccess({ email }: { email: string }) {
  return (
    <div class="a-login a-login--single">
      <div class="a-login__card">
        <img src={logoUrl.src} alt="" class="a-login__logo" width={64} height={64} />
        <h1>No access</h1>
        <p class="a-muted">{email} is not on the admin list. Please contact the super admin.</p>
        <button class="a-btn a-btn--primary a-btn--block" onClick={() => sb.auth.signOut()}>Sign out</button>
      </div>
    </div>
  );
}

/* ---------------- Notification bell ---------------- */
function Bell({ unread, active }: { unread: number; active: boolean }) {
  return (
    <a href="#/notifications" class={`a-bell${active ? ' is-active' : ''}${unread ? ' has-new' : ''}`} aria-label={unread ? `Notifications — ${unread} new` : 'Notifications'} title="Notifications">
      <Icon name="bell" size={20} />
      {unread > 0 && <b class="a-badge">{unread > 99 ? '99+' : unread}</b>}
    </a>
  );
}

/* ---------------- Layout + navigation ---------------- */
const NAV = [
  { path: 'dashboard', label: 'Dashboard', icon: 'dashboard', group: 'main' },
  { path: 'properties', label: 'Properties', icon: 'home', group: 'main' },
  { path: 'leads', label: 'Leads', icon: 'leads', group: 'main' },
  { path: 'projects', label: 'Projects', icon: 'hammer', group: 'main' },
  { path: 'reviews', label: 'Reviews', icon: 'star', group: 'main' },
  { path: 'notifications', label: 'Notifications', icon: 'bell', group: 'main' },
  { path: 'settings', label: 'Settings', icon: 'settings', group: 'account', super: true },
  { path: 'account', label: 'My Account', icon: 'user', group: 'account' },
];

function Shell({ me }: { me: Admin }) {
  const route = useRoute();
  const [newLeads, setNewLeads] = useState(0);
  const [unread, setUnread] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const seenAt = useRef(me.activity_seen_at ?? new Date().toISOString());
  const refreshCounts = () => {
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new').then(({ count }) => setNewLeads(count ?? 0));
    sb.from('activity').select('id', { count: 'exact', head: true })
      .gt('created_at', seenAt.current)
      .or(`actor_id.is.null,actor_id.neq.${me.user_id}`)
      .then(({ count, error }) => setUnread(error ? 0 : count ?? 0));
  };
  const markSeen = () => {
    seenAt.current = new Date().toISOString();
    setUnread(0);
    sb.rpc('mark_activity_seen').then(() => {}, () => {}); // the request only runs once awaited
  };
  // Show the unread count in the browser tab and on the installed app icon
  useEffect(() => {
    document.title = `${unread ? `(${unread}) ` : ''}Admin Panel — Bangash Real Estate`;
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    (unread ? nav.setAppBadge?.(unread) : nav.clearAppBadge?.())?.catch(() => {});
  }, [unread]);
  useEffect(() => {
    refreshCounts();
    const t = setInterval(refreshCounts, 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => setMoreOpen(false), [route]);

  const [section, id] = route.split('/');
  const ctx: Ctx = { me, newLeads, unread, seenAt: seenAt.current, markSeen, refreshCounts };
  const isSuper = me.role === 'super_admin';
  const nav = NAV.filter((n) => !n.super || isSuper);

  let page;
  switch (section) {
    case 'properties': page = id ? <PropertyForm id={id} ctx={ctx} /> : <PropertiesList ctx={ctx} />; break;
    case 'leads': page = <Leads ctx={ctx} />; break;
    case 'projects': page = id ? <ProjectForm id={id} ctx={ctx} /> : <ProjectsList ctx={ctx} />; break;
    case 'reviews': page = <Reviews ctx={ctx} />; break;
    case 'notifications': page = <Notifications ctx={ctx} />; break;
    case 'settings': page = isSuper ? <Settings ctx={ctx} /> : <Dashboard ctx={ctx} />; break;
    case 'account': page = <Account ctx={ctx} />; break;
    default: page = <Dashboard ctx={ctx} />;
  }

  const link = (n: (typeof NAV)[number]) => (
    <a href={`#/${n.path}`} class={`a-nav__link${section === n.path || (section === '' && n.path === 'dashboard') ? ' is-active' : ''}`}>
      <Icon name={n.icon} size={20} />
      <span>{n.label}</span>
      {n.path === 'leads' && newLeads > 0 && <b class="a-badge">{newLeads}</b>}
      {n.path === 'notifications' && unread > 0 && <b class="a-badge">{unread > 99 ? '99+' : unread}</b>}
    </a>
  );
  const displayName = me.name || me.email.split('@')[0];

  return (
    <div class="a-shell">
      <aside class="a-side">
        <div class="a-side__head">
          <a href="#/dashboard" class="a-brand">
            <img src={logoUrl.src} alt="" width={42} height={42} />
            <span><strong>BANGASH</strong><small>Admin Panel</small></span>
          </a>
          <Bell unread={unread} active={section === 'notifications'} />
        </div>
        <nav class="a-nav">
          <p class="a-nav__group">Manage</p>
          {nav.filter((n) => n.group === 'main').map(link)}
          <p class="a-nav__group">Account</p>
          {nav.filter((n) => n.group === 'account').map(link)}
          <a href="/" target="_blank" rel="noopener" class="a-nav__link"><Icon name="globe" size={20} /><span>View website</span><Icon name="external" size={14} /></a>
        </nav>
        <div class="a-side__foot">
          <div class="a-me">
            <span class="a-me__avatar">{displayName.charAt(0).toUpperCase()}</span>
            <span class="a-me__who"><strong>{displayName}</strong><small>{isSuper ? 'Super Admin' : 'Editor'}</small></span>
            <button class="a-me__out" onClick={() => sb.auth.signOut()} aria-label="Sign out" title="Sign out"><Icon name="logout" size={18} /></button>
          </div>
        </div>
      </aside>

      <header class="a-top">
        <a href="#/dashboard" class="a-brand a-brand--sm"><img src={logoUrl.src} alt="" width={34} height={34} /><strong>BANGASH</strong></a>
        <div class="a-row">
          <a href="/" target="_blank" rel="noopener" class="a-btn a-btn--ghost a-btn--sm"><Icon name="globe" size={16} /> Website</a>
          <Bell unread={unread} active={section === 'notifications'} />
        </div>
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
            <button class="a-nav__link" onClick={() => sb.auth.signOut()}><Icon name="logout" size={20} /><span>Sign out</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
