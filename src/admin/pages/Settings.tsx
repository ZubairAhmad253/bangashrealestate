import { useEffect, useState } from 'preact/hooks';
import { sb, requestRebuild, type Admin, type SettingsRow } from '../lib';
import { Icon, Field, Skeleton, PageHead, toast, confirmDialog } from '../ui';
import { useQuery, afterWrite } from '../store';
import type { Ctx } from '../App';
import { SITE } from '../../config/site';

type Stat = { value: number; suffix: string; label: string };
const ROLE_LABEL: Record<Admin['role'], string> = { super_admin: 'Super Admin', editor: 'Editor' };
const addedOn = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
interface SettingsData { settings: SettingsRow; hook: string; admins: Admin[] }

async function fetchSettings(): Promise<SettingsData> {
  const [s, h, a] = await Promise.all([
    sb.from('settings').select('*').eq('id', 1).single(),
    sb.from('private_settings').select('deploy_hook_url').eq('id', 1).single(),
    sb.from('admins').select('*').order('created_at'),
  ]);
  if (s.error) throw s.error;
  const d = (s.data ?? {}) as SettingsRow;
  return {
    settings: {
      phone: d.phone ?? SITE.phone,
      whatsapp: d.whatsapp ?? SITE.whatsapp,
      email: d.email ?? SITE.email,
      hours: d.hours ?? SITE.hours,
      google_rating: d.google_rating ?? SITE.googleRating,
      stats: d.stats?.length === 4 ? d.stats : SITE.stats.map((x) => ({ ...x })),
    },
    hook: (h.data as { deploy_hook_url: string | null } | null)?.deploy_hook_url ?? '',
    admins: (a.data as Admin[]) ?? [],
  };
}

export function Settings({ ctx }: { ctx: Ctx }) {
  const query = useQuery('settings', fetchSettings, 10_000);
  // Editable copies — filled once from the loaded data
  const [s, setS] = useState<SettingsRow | null>(query.data?.settings ?? null);
  const [hook, setHook] = useState(query.data?.hook ?? '');
  const admins = query.data?.admins ?? [];
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', user_id: '', role: 'editor' as Admin['role'] });
  useEffect(() => {
    if (!s && query.data) { setS(query.data.settings); setHook(query.data.hook); }
  }, [query.data]);
  const loadAdmins = () => sb.from('admins').select('*').order('created_at').then(({ data }) => query.mutate((prev) => ({ ...(prev as SettingsData), admins: (data as Admin[]) ?? [] })));

  if (!s) return <div class="a-page"><Skeleton rows={3} /></div>;
  const stats = s.stats as Stat[];
  const setStat = (i: number, patch: Partial<Stat>) => setS({ ...s, stats: stats.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  const save = async () => {
    if (hook && !/^https:\/\/api\.vercel\.com\//.test(hook.trim())) return toast.err('The deploy hook must start with "https://api.vercel.com/".');
    setSaving(true);
    // Save the deploy hook FIRST — saving `settings` fires the rebuild trigger, which reads the hook.
    const r2 = await sb.from('private_settings').update({ deploy_hook_url: hook.trim() || null }).eq('id', 1);
    const r1 = await sb.from('settings').update({
      phone: s.phone?.trim() || null, whatsapp: s.whatsapp?.trim() || null, email: s.email?.trim() || null, hours: s.hours?.trim() || null,
      google_rating: s.google_rating ? Number(s.google_rating) : null,
      stats: stats.map((x) => ({ value: Number(x.value) || 0, suffix: x.suffix, label: x.label.trim() })),
    }).eq('id', 1);
    setSaving(false);
    if (r1.error || r2.error) return toast.err(r1.error ?? r2.error);
    query.mutate((prev) => ({ ...(prev as SettingsData), settings: s, hook: hook.trim() }));
    toast.ok('Settings saved ✓ The website will update in 1–2 minutes.');
    afterWrite();
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const ok = await requestRebuild();
      if (ok) toast.ok('Website update started — live in 1–2 minutes.');
      else toast.err('Please add the Vercel deploy hook below and save first.');
    } catch (e) { toast.err(e); }
    setPublishing(false);
  };

  const addAdmin = async () => {
    const uid = newAdmin.user_id.trim();
    if (!/^[0-9a-f-]{36}$/i.test(uid) || !/\S+@\S+/.test(newAdmin.email)) return toast.err('Enter a valid email and User UID (Supabase → Authentication → Users).');
    const { error } = await sb.from('admins').insert({ user_id: uid, email: newAdmin.email.trim(), role: newAdmin.role });
    if (error) return toast.err(error);
    setNewAdmin({ email: '', user_id: '', role: 'editor' });
    toast.ok('Admin added.');
    void loadAdmins();
  };
  const patchAdmins = (fn: (list: Admin[]) => Admin[]) => query.mutate((prev) => ({ ...(prev as SettingsData), admins: fn((prev as SettingsData).admins) }));
  const setRole = async (a: Admin, role: Admin['role']) => {
    if (role === a.role) return;
    const who = a.name?.trim() || a.email;
    // Full access is a big step — ask first (the dropdown snaps back if cancelled)
    if (role === 'super_admin' && !(await confirmDialog(`Give full access to ${who}?`, 'Super Admins can delete listings, change settings and manage the team.', 'Give full access', false))) {
      patchAdmins((list) => [...list]);
      return;
    }
    patchAdmins((list) => list.map((x) => (x.user_id === a.user_id ? { ...x, role } : x)));
    const { error } = await sb.from('admins').update({ role }).eq('user_id', a.user_id);
    if (error) { toast.err(error); void loadAdmins(); return; }
    toast.ok(`${who} is now ${role === 'super_admin' ? 'a Super Admin' : 'an Editor'}.`);
  };
  const removeAdmin = async (a: Admin) => {
    const who = a.name?.trim() || a.email;
    if (!(await confirmDialog(`Remove admin access for ${who}?`, 'This person will no longer be able to sign in to the admin panel.', 'Remove access'))) return;
    const { error } = await sb.from('admins').delete().eq('user_id', a.user_id);
    if (error) return toast.err(error);
    patchAdmins((list) => list.filter((x) => x.user_id !== a.user_id));
    toast.ok('Access removed.');
  };

  return (
    <div class="a-page a-page--form">
      <PageHead title="Settings" icon="settings" sub="Super admin only — contact details, stats, publishing and admins">
        <button class="a-btn a-btn--ghost" onClick={publish} disabled={publishing}><Icon name="refresh" /> {publishing ? 'Starting…' : 'Publish website now'}</button>
      </PageHead>

      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="phone" size={16} /></span> Contact details (used across the website)</h2>
        <div class="a-form-grid">
          <Field label="Phone (as displayed)" hint="e.g. 0332-0445759"><input value={s.phone ?? ''} onInput={(e) => setS({ ...s, phone: e.currentTarget.value })} /></Field>
          <Field label="WhatsApp number" hint="e.g. 03320445759 (converted to +92 automatically)"><input value={s.whatsapp ?? ''} onInput={(e) => setS({ ...s, whatsapp: e.currentTarget.value })} /></Field>
          <Field label="Email"><input type="email" value={s.email ?? ''} onInput={(e) => setS({ ...s, email: e.currentTarget.value })} /></Field>
          <Field label="Office timings"><input value={s.hours ?? ''} onInput={(e) => setS({ ...s, hours: e.currentTarget.value })} /></Field>
          <Field label="Google rating" hint="Your rating on Google Maps (1–5)"><input type="number" step="0.1" min="1" max="5" value={s.google_rating ?? ''} onInput={(e) => setS({ ...s, google_rating: Number(e.currentTarget.value) })} /></Field>
        </div>
      </section>

      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="dashboard" size={16} /></span> Home page stats</h2>
        <div class="a-stats-edit">
          {stats.map((st, i) => (
            <div class="a-stats-edit__row">
              <input type="number" inputMode="numeric" value={st.value} onInput={(e) => setStat(i, { value: Number(e.currentTarget.value) })} aria-label="Number" />
              <input value={st.suffix} maxLength={3} onInput={(e) => setStat(i, { suffix: e.currentTarget.value })} aria-label="Suffix" />
              <input value={st.label} maxLength={40} onInput={(e) => setStat(i, { label: e.currentTarget.value })} aria-label="Label" />
            </div>
          ))}
        </div>
        <p class="a-field__hint">Number · suffix (e.g. +) · label — e.g. "12 + Years of Experience"</p>
      </section>

      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="globe" size={16} /></span> Auto-publish (Vercel deploy hook)</h2>
        <Field label="Vercel deploy hook URL" hint="Create it in Vercel → Project → Settings → Git → Deploy Hooks (branch: main). After that, every save updates the website automatically." full>
          <input value={hook} onInput={(e) => setHook(e.currentTarget.value)} placeholder="https://api.vercel.com/v1/integrations/deploy/…" />
        </Field>
        {!hook && <p class="a-alert a-alert--warn">No deploy hook yet — changes made here will not appear on the website until it is added.</p>}
      </section>

      <div class="a-savebar">
        <button class="a-btn a-btn--gold a-btn--lg" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Icon name="check" /> Save settings</>}</button>
      </div>

      <section class="a-card">
        <div class="a-card__head">
          <h2 class="a-card__title"><span><Icon name="user" size={16} /></span> Team</h2>
          <span class="a-muted a-small">{admins.length} {admins.length === 1 ? 'person' : 'people'}</span>
        </div>
        <div class="a-table-wrap">
          <table class="a-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Added</th>
                <th scope="col"><span class="a-sr">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isMe = a.user_id === ctx.me.user_id;
                const name = a.name?.trim();
                return (
                  <tr key={a.user_id} class={isMe ? 'is-me' : ''}>
                    <td class="a-table__name">
                      <span class="a-me__avatar" aria-hidden="true">{(name || a.email).charAt(0).toUpperCase()}</span>
                      <span>
                        {name ? <strong>{name}</strong> : <strong class="a-muted">No name yet</strong>}
                        {isMe && <em class="a-you">You</em>}
                      </span>
                    </td>
                    <td data-label="Email" class="a-table__email">{a.email}</td>
                    <td data-label="Role">
                      {isMe ? (
                        <span class="a-pill a-pill--role">{ROLE_LABEL[a.role]}</span>
                      ) : (
                        <select class="a-select-sm" value={a.role} onChange={(e) => setRole(a, e.currentTarget.value as Admin['role'])} aria-label={`Role of ${a.email}`}>
                          <option value="editor">Editor</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      )}
                    </td>
                    <td data-label="Added" class="a-table__date">{addedOn(a.created_at)}</td>
                    <td class="a-table__actions">
                      {!isMe && <button class="a-icon-btn a-btn--danger-text" onClick={() => removeAdmin(a)} aria-label={`Remove ${a.email}`} title="Remove access"><Icon name="trash" /></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p class="a-field__hint a-roles">
          <span><strong>Editor</strong> — adds and edits listings, leads, projects and reviews. Cannot delete or open Settings.</span>
          <span><strong>Super Admin</strong> — full access, including deleting and managing the team.</span>
        </p>
        <details class="a-details">
          <summary>+ Add a new admin</summary>
          <p class="a-muted a-small">First create the account in Supabase → Authentication → Users → "Add user", then enter its email and UID here.</p>
          <div class="a-form-grid">
            <Field label="Email"><input type="email" value={newAdmin.email} onInput={(e) => setNewAdmin({ ...newAdmin, email: e.currentTarget.value })} /></Field>
            <Field label="User UID"><input value={newAdmin.user_id} onInput={(e) => setNewAdmin({ ...newAdmin, user_id: e.currentTarget.value })} placeholder="43c6b883-…" /></Field>
            <Field label="Role">
              <select value={newAdmin.role} onChange={(e) => setNewAdmin({ ...newAdmin, role: e.currentTarget.value as Admin['role'] })}>
                <option value="editor">Editor</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </Field>
          </div>
          <button class="a-btn a-btn--primary" onClick={addAdmin}><Icon name="plus" /> Add admin</button>
        </details>
      </section>
    </div>
  );
}
