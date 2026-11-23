import { useEffect, useState } from 'preact/hooks';
import { sb, requestRebuild, type Admin, type SettingsRow } from '../lib';
import { Icon, Field, Loading, PageHead, Segmented, toast, confirmDialog } from '../ui';
import type { Ctx } from '../App';
import { SITE } from '../../config/site';

type Stat = { value: number; suffix: string; label: string };

export function Settings({ ctx }: { ctx: Ctx }) {
  const [s, setS] = useState<SettingsRow | null>(null);
  const [hook, setHook] = useState('');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', user_id: '', role: 'editor' as Admin['role'] });

  const loadAdmins = () => sb.from('admins').select('*').order('created_at').then(({ data }) => setAdmins((data as Admin[]) ?? []));
  useEffect(() => {
    sb.from('settings').select('*').eq('id', 1).single().then(({ data, error }) => {
      if (error) toast.err(error);
      const d = (data ?? {}) as SettingsRow;
      setS({
        phone: d.phone ?? SITE.phone,
        whatsapp: d.whatsapp ?? SITE.whatsapp,
        email: d.email ?? SITE.email,
        hours: d.hours ?? SITE.hours,
        google_rating: d.google_rating ?? SITE.googleRating,
        stats: d.stats?.length === 4 ? d.stats : SITE.stats.map((x) => ({ ...x })),
      });
    });
    sb.from('private_settings').select('deploy_hook_url').eq('id', 1).single().then(({ data }) => setHook(data?.deploy_hook_url ?? ''));
    void loadAdmins();
  }, []);

  if (!s) return <div class="a-page"><Loading /></div>;
  const stats = s.stats as Stat[];
  const setStat = (i: number, patch: Partial<Stat>) => setS({ ...s, stats: stats.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  const save = async () => {
    if (hook && !/^https:\/\/api\.vercel\.com\//.test(hook.trim())) return toast.err('Deploy hook "https://api.vercel.com/…" se shuru hona chahiye.');
    setSaving(true);
    const r1 = await sb.from('settings').update({
      phone: s.phone?.trim() || null, whatsapp: s.whatsapp?.trim() || null, email: s.email?.trim() || null, hours: s.hours?.trim() || null,
      google_rating: s.google_rating ? Number(s.google_rating) : null,
      stats: stats.map((x) => ({ value: Number(x.value) || 0, suffix: x.suffix, label: x.label.trim() })),
    }).eq('id', 1);
    const r2 = await sb.from('private_settings').update({ deploy_hook_url: hook.trim() || null }).eq('id', 1);
    setSaving(false);
    if (r1.error || r2.error) return toast.err(r1.error ?? r2.error);
    toast.ok('Settings saved ✓ Website 1–2 minute mein update hogi.');
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const ok = await requestRebuild();
      if (ok) toast.ok('Website update shuru ho gayi — 1–2 minute mein live.');
      else toast.err('Pehle neeche "Vercel deploy hook" lagayein aur Save karein.');
    } catch (e) { toast.err(e); }
    setPublishing(false);
  };

  const addAdmin = async () => {
    const uid = newAdmin.user_id.trim();
    if (!/^[0-9a-f-]{36}$/i.test(uid) || !/\S+@\S+/.test(newAdmin.email)) return toast.err('Sahi email aur User UID (Supabase → Authentication → Users) daalein.');
    const { error } = await sb.from('admins').insert({ user_id: uid, email: newAdmin.email.trim(), role: newAdmin.role });
    if (error) return toast.err(error);
    setNewAdmin({ email: '', user_id: '', role: 'editor' });
    toast.ok('Admin add ho gaya.');
    void loadAdmins();
  };
  const setRole = async (a: Admin, role: Admin['role']) => {
    const { error } = await sb.from('admins').update({ role }).eq('user_id', a.user_id);
    if (error) return toast.err(error);
    toast.ok('Role update ho gaya.');
    void loadAdmins();
  };
  const removeAdmin = async (a: Admin) => {
    if (!(await confirmDialog(`${a.email} ka admin access hatayein?`, 'Ye banda admin panel mein login nahi kar sakega.', 'Haan, hatayein'))) return;
    const { error } = await sb.from('admins').delete().eq('user_id', a.user_id);
    if (error) return toast.err(error);
    toast.ok('Access hata diya.');
    void loadAdmins();
  };

  return (
    <div class="a-page a-page--form">
      <PageHead title="Settings" sub="Sirf Super Admin — contact details, stats, publishing aur admins">
        <button class="a-btn a-btn--ghost" onClick={publish} disabled={publishing}><Icon name="refresh" /> {publishing ? 'Starting…' : 'Publish website now'}</button>
      </PageHead>

      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="phone" size={16} /></span> Contact details (poori website par)</h2>
        <div class="a-form-grid">
          <Field label="Phone (jaisa dikhe)" hint="Masalan 0332-0445759"><input value={s.phone ?? ''} onInput={(e) => setS({ ...s, phone: e.currentTarget.value })} /></Field>
          <Field label="WhatsApp number" hint="Masalan 03320445759 (khud 92 mein badal jata hai)"><input value={s.whatsapp ?? ''} onInput={(e) => setS({ ...s, whatsapp: e.currentTarget.value })} /></Field>
          <Field label="Email"><input type="email" value={s.email ?? ''} onInput={(e) => setS({ ...s, email: e.currentTarget.value })} /></Field>
          <Field label="Office timings"><input value={s.hours ?? ''} onInput={(e) => setS({ ...s, hours: e.currentTarget.value })} /></Field>
          <Field label="Google rating" hint="Google Maps par jo rating hai (1–5)"><input type="number" step="0.1" min="1" max="5" value={s.google_rating ?? ''} onInput={(e) => setS({ ...s, google_rating: Number(e.currentTarget.value) })} /></Field>
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
        <p class="a-field__hint">Number · nishan (jaise +) · label — masalan "12 + Years of Experience"</p>
      </section>

      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="globe" size={16} /></span> Auto-publish (Vercel deploy hook)</h2>
        <Field label="Vercel deploy hook URL" hint="Vercel → Project → Settings → Git → Deploy Hooks se banayein (branch: main). Iske baad har save par website khud update hogi." full>
          <input value={hook} onInput={(e) => setHook(e.currentTarget.value)} placeholder="https://api.vercel.com/v1/integrations/deploy/…" />
        </Field>
        {!hook && <p class="a-alert a-alert--warn">Deploy hook abhi nahi laga — admin se kiye gaye changes website par tab tak nahi aayenge.</p>}
      </section>

      <div class="a-savebar">
        <button class="a-btn a-btn--gold a-btn--lg" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Icon name="check" /> Save settings</>}</button>
      </div>

      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="user" size={16} /></span> Admin users</h2>
        <ul class="a-list">
          {admins.map((a) => (
            <li class="a-list__item">
              <div>
                <strong>{a.email}</strong>
                <small class="a-muted">{a.user_id === ctx.me.user_id ? 'Aap' : a.role === 'super_admin' ? 'Super Admin — sab kuch' : 'Editor — properties, leads, projects, reviews'}</small>
              </div>
              {a.user_id !== ctx.me.user_id && (
                <div class="a-row">
                  <Segmented value={a.role} onChange={(r) => setRole(a, r)} options={[{ value: 'editor', label: 'Editor' }, { value: 'super_admin', label: 'Super' }]} />
                  <button class="a-icon-btn a-btn--danger-text" onClick={() => removeAdmin(a)} aria-label="Hatayein"><Icon name="trash" /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <details class="a-details">
          <summary>+ Naya admin add karein</summary>
          <p class="a-muted a-small">Pehle Supabase → Authentication → Users → "Add user" se account banayein, phir uska email aur UID yahan daalein.</p>
          <div class="a-form-grid">
            <Field label="Email"><input type="email" value={newAdmin.email} onInput={(e) => setNewAdmin({ ...newAdmin, email: e.currentTarget.value })} /></Field>
            <Field label="User UID"><input value={newAdmin.user_id} onInput={(e) => setNewAdmin({ ...newAdmin, user_id: e.currentTarget.value })} placeholder="43c6b883-…" /></Field>
            <Field label="Role">
              <Segmented value={newAdmin.role} onChange={(r) => setNewAdmin({ ...newAdmin, role: r })} options={[{ value: 'editor', label: 'Editor' }, { value: 'super_admin', label: 'Super Admin' }]} />
            </Field>
          </div>
          <button class="a-btn a-btn--primary" onClick={addAdmin}><Icon name="plus" /> Add admin</button>
        </details>
      </section>
    </div>
  );
}
