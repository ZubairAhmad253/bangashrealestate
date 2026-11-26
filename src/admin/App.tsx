/* ==========================================================================
   BANGASH ADMIN PANEL — main app (login, roles, navigation, routing)
   ========================================================================== */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Session } from '@supabase/auth-js';
import { sb, errorText, type Admin } from './lib';
import { Icon, Toasts, ConfirmHost, Loading, toast } from './ui';
import { clearAll, mutate, peek, prefetch, setAfterWrite, setErrorHandler, useQuery } from './store';
import { fetchers, prefetchAll } from './queries';
import { Dashboard } from './pages/Dashboard';
import { PropertiesList, PropertyForm } from './pages/Properties';
import { Leads } from './pages/Leads';
import { ProjectsList, ProjectForm } from './pages/Projects';
import { Reviews } from './pages/Reviews';
import { Settings } from './pages/Settings';
import { Account } from './pages/Account';
import { Notifications } from './pages/Notifications';
import { UpdateBar, watchForUpdates } from './update';
import logoUrl from '../assets/brand/logo-mark.png';

/* ---------------- Hash router with smooth screen changes ---------------- */
const readRoute = () => location.hash.replace(/^#\/?/, '') || 'dashboard';
export const go = (path: string) => { location.hash = `#/${path}`; };

type ViewTransition = { finished: Promise<void>; ready: Promise<void> };
type VTDocument = Document & { startViewTransition?: (update: () => Promise<void>) => ViewTransition };
const depth = (r: string) => r.split('/').filter(Boolean).length;

function useRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    let current = readRoute();
    const on = () => {
      const next = readRoute();
      if (next === current) return;
      // Tab → tab: cross-fade. Into a form: slide in. Back to a list: slide back.
      const dir = depth(next) > depth(current) ? 'forward' : depth(next) < depth(current) ? 'back' : 'tab';
      current = next;
      const show = () => {
        setRoute(next);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      };
      const doc = document as VTDocument;
      if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches || document.visibilityState !== 'visible') {
        show();
        return;
      }
      const root = document.documentElement;
      root.dataset.nav = dir;
      // The browser keeps a picture of the old screen, the new one renders (Preact renders in a
      // microtask), then the GPU blends old → new — no blank frame and no layout jump in between.
      const vt = doc.startViewTransition(() => new Promise<void>((resolve) => { show(); setTimeout(resolve, 0); }));
      vt.ready.catch(() => {});
      vt.finished.catch(() => {}).finally(() => { if (root.dataset.nav === dir) delete root.dataset.nav; });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export interface Ctx {
  me: Admin;
  newLeads: number;
  /** Unread notifications (every change, including your own, since the bell was last opened) */
  unread: number;
  /** When this admin last opened the notifications */
  seenAt: string;
  markSeen: () => void;
  /** Re-count new leads + notifications (`force` skips the 15-second limit) */
  refreshCounts: (force?: boolean) => void;
}

/** The user saved on this phone (read instantly, before the sign-in check finishes) */
const storedUserId = (() => {
  try { return (JSON.parse(localStorage.getItem('bangash-admin') ?? 'null')?.user?.id as string | undefined) ?? undefined; } catch { return undefined; }
})();

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    setErrorHandler((e) => toast.err(e));
    // Signed in on this phone: ask for the first screen's data together with the profile
    // (one round trip to the server instead of two, one after the other)
    if (storedUserId && readRoute() === 'dashboard') {
      void prefetch('properties', fetchers.properties, 15_000);
      void prefetch('projects', fetchers.projects, 15_000);
      if (!peek('leads')) void prefetch('leads:recent', fetchers.recentLeads, 15_000);
    }
    const { data } = sb.auth.onAuthStateChange((event, s) => {
      // Signed out (or the saved sign-in has expired): forget everything kept on this phone
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !s && storedUserId)) clearAll();
      setSession(s);
    });
    // The installed app always runs the newest published version
    const stopUpdates = watchForUpdates();
    return () => {
      data.subscription.unsubscribe();
      stopUpdates();
    };
  }, []);

  // While the sign-in is being checked, the app already opens for the user saved on this phone
  const uid = session === undefined ? storedUserId : session?.user.id;
  const me = useQuery<Admin | null>(`me:${uid ?? ''}`, () => fetchers.me(uid!), 60_000, Boolean(uid) && session !== null);

  let body;
  if (session === null) body = <Login />;
  else if (!uid || (me.data === undefined && !me.error)) body = <div class="a-center"><Loading /></div>;
  else if (me.data === undefined) body = <Offline retry={() => void me.reload().catch(() => {})} />;
  else if (me.data === null) body = <NoAccess email={session?.user.email ?? ''} />;
  else body = <Shell me={me.data} />;

  return (
    <>
      {body}
      <Toasts />
      <ConfirmHost />
      <UpdateBar />
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

function Offline({ retry }: { retry: () => void }) {
  return (
    <div class="a-login a-login--single">
      <div class="a-login__card">
        <img src={logoUrl.src} alt="" class="a-login__logo" width={64} height={64} />
        <h1>No connection</h1>
        <p class="a-muted">The admin panel could not reach the server. Please check your internet connection.</p>
        <button class="a-btn a-btn--gold a-btn--block" onClick={retry}>Try again</button>
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

/* ---------------- Offline-ready app files ---------------- */
function registerServiceWorker() {
  // Not in development (it would keep serving old files) or in automated browser tests
  if (import.meta.env.DEV || !('serviceWorker' in navigator) || navigator.webdriver) return;
  navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' }).then(async () => {
    const reg = await navigator.serviceWorker.ready;
    // Files this page already loaded (before the worker existed) are saved too
    const urls = performance.getEntriesByType('resource').map((e) => e.name).filter((u) => u.startsWith(`${location.origin}/_astro/`));
    reg.active?.postMessage({ type: 'precache', urls });
  }).catch(() => {});
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

type Counts = { newLeads: number; unread: number };

function Shell({ me }: { me: Admin }) {
  const route = useRoute();
  const saved = peek<Counts>('counts');
  const [newLeads, setNewLeads] = useState(saved?.newLeads ?? 0);
  const [unread, setUnread] = useState(saved?.unread ?? 0);
  const [moreOpen, setMoreOpen] = useState(false);
  const seenAt = useRef(me.activity_seen_at ?? new Date().toISOString());
  const lastCount = useRef(0);

  const refreshCounts = (force = false) => {
    if (!force && Date.now() - lastCount.current < 15_000) return;
    lastCount.current = Date.now();
    Promise.all([
      sb.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      sb.from('activity').select('id', { count: 'exact', head: true }).gt('created_at', seenAt.current),
    ]).then(([l, a]) => {
      const next = { newLeads: l.error ? newLeads : l.count ?? 0, unread: a.error ? 0 : a.count ?? 0 };
      setNewLeads(next.newLeads);
      setUnread(next.unread);
      mutate<Counts>('counts', next);
    }, () => {});
  };
  const markSeen = () => {
    setUnread(0);
    mutate<Counts>('counts', (c) => ({ newLeads: c?.newLeads ?? newLeads, unread: 0 }));
    // Use the server time of the newest item, not this device's clock:
    // a phone or PC clock that runs a few minutes fast would otherwise hide new notifications
    sb.from('activity').select('created_at').order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => { const latest = (data as { created_at: string }[] | null)?.[0]?.created_at; if (latest) seenAt.current = latest; }, () => {});
    sb.rpc('mark_activity_seen').then(() => {}, () => {}); // the request only runs once awaited
  };
  // Show the unread count in the browser tab and on the installed app icon
  useEffect(() => {
    document.title = `${unread ? `(${unread}) ` : ''}Admin Panel — Bangash Real Estate`;
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    (unread ? nav.setAppBadge?.(unread) : nav.clearAppBadge?.())?.catch(() => {});
  }, [unread]);
  useEffect(() => {
    // After any save, the bell picks up the change
    let pending: ReturnType<typeof setTimeout> | undefined;
    setAfterWrite(() => { clearTimeout(pending); pending = setTimeout(() => refreshCounts(true), 700); });
    refreshCounts(true);
    // The first screen loads its own data first; the other tabs are fetched a moment later, and the
    // offline app files are saved later still — so nothing competes with what is on screen now
    const later = (fn: () => void, ms: number) => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : fn()), ms);
    const t1 = later(prefetchAll, 1200);
    const t2 = later(registerServiceWorker, 4000);
    const t = setInterval(() => refreshCounts(true), 30_000);
    // Check right away when the app or tab is opened again (phones pause timers in the background)
    const onShow = () => { if (document.visibilityState === 'visible') refreshCounts(); };
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener('focus', onShow);
    return () => {
      clearInterval(t);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(pending);
      setAfterWrite(() => {});
      document.removeEventListener('visibilitychange', onShow);
      window.removeEventListener('focus', onShow);
    };
  }, []);
  useEffect(() => {
    setMoreOpen(false);
    // Counts are refreshed after the screen change has finished, never during it
    // (skipped on the notifications page, which marks everything as read itself)
    if (route.startsWith('notifications')) return;
    const t = setTimeout(() => refreshCounts(), 900);
    return () => clearTimeout(t);
  }, [route]);

  const [section, id] = route.split('/');
  const ctx: Ctx = { me, newLeads, unread, seenAt: seenAt.current, markSeen, refreshCounts };
  const isSuper = me.role === 'super_admin';
  const nav = NAV.filter((n) => !n.super || isSuper);

  let page;
  switch (section) {
    case 'properties': page = id ? <PropertyForm key={id} id={id} ctx={ctx} /> : <PropertiesList ctx={ctx} />; break;
    case 'leads': page = <Leads ctx={ctx} />; break;
    case 'projects': page = id ? <ProjectForm key={id} id={id} ctx={ctx} /> : <ProjectsList ctx={ctx} />; break;
    case 'reviews': page = <Reviews ctx={ctx} />; break;
    case 'notifications': page = <Notifications ctx={ctx} />; break;
    case 'settings': page = isSuper ? <Settings ctx={ctx} /> : <Dashboard ctx={ctx} />; break;
    case 'account': page = <Account ctx={ctx} />; break;
    default: page = <Dashboard ctx={ctx} />;
  }

  const isActive = (path: string) => section === path || (section === '' && path === 'dashboard');
  const link = (n: (typeof NAV)[number]) => (
    <a href={`#/${n.path}`} class={`a-nav__link${isActive(n.path) ? ' is-active' : ''}`} aria-current={isActive(n.path) ? 'page' : undefined}>
      <Icon name={n.icon} size={20} />
      <span>{n.label}</span>
      {n.path === 'leads' && newLeads > 0 && <b class="a-badge">{newLeads}</b>}
      {n.path === 'notifications' && unread > 0 && <b class="a-badge">{unread > 99 ? '99+' : unread}</b>}
    </a>
  );
  const displayName = me.name || me.email.split('@')[0];
  // The golden pill under the active tab slides between tabs (the 5th place is "More")
  const tabs = nav.slice(0, 4);
  const tabIndex = moreOpen ? 4 : (() => { const i = tabs.findIndex((n) => isActive(n.path)); return i === -1 ? 4 : i; })();

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

      <nav class="a-tabbar" aria-label="Main" style={{ '--tab': tabIndex }}>
        <span class="a-tabbar__pill" aria-hidden="true" />
        {tabs.map(link)}
        <button class={`a-nav__link${moreOpen || tabIndex === 4 ? ' is-active' : ''}`} onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen}>
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
