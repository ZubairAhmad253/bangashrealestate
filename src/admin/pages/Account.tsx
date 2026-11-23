import { useState } from 'preact/hooks';
import { sb } from '../lib';
import { Icon, Field, PageHead, toast } from '../ui';
import type { Ctx } from '../App';

/* Font presets — the CSS for each lives in admin.css (.a-body[data-font="…"]) */
const FONTS = [
  { id: 'modern', name: 'Modern', desc: 'Sora + Manrope · clean & premium', head: '"Sora Variable", sans-serif', body: '"Manrope Variable", sans-serif' },
  { id: 'sleek', name: 'Sleek', desc: 'Urbanist · light & stylish', head: '"Urbanist Variable", sans-serif', body: '"Urbanist Variable", sans-serif' },
  { id: 'classic', name: 'Classic', desc: 'Poppins · bold & familiar', head: 'Poppins, sans-serif', body: 'Poppins, sans-serif' },
  { id: 'website', name: 'Website', desc: 'Outfit + Plus Jakarta · same as the website', head: '"Outfit Variable", sans-serif', body: '"Plus Jakarta Sans Variable", sans-serif' },
] as const;
const FONT_KEY = 'bangash-admin-font';

export function Account({ ctx }: { ctx: Ctx }) {
  const [name, setName] = useState(ctx.me.name ?? '');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [font, setFont] = useState(document.body.dataset.font || 'modern');

  const chooseFont = (id: string) => {
    document.body.dataset.font = id;
    try { localStorage.setItem(FONT_KEY, id); } catch { /* private mode — still applies for this visit */ }
    setFont(id);
  };
  const saveName = async () => {
    const { error } = await sb.rpc('set_my_name', { new_name: name });
    if (error) return toast.err(error);
    toast.ok('Name saved — refresh the page to see it everywhere.');
  };
  const changePw = async (e: Event) => {
    e.preventDefault();
    if (pw.length < 8) return toast.err('Password must be at least 8 characters.');
    if (pw !== pw2) return toast.err('The two passwords do not match.');
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.err(error);
    setPw('');
    setPw2('');
    toast.ok('Password changed ✓');
  };

  return (
    <div class="a-page a-page--form">
      <PageHead title="My Account" icon="user" sub={`${ctx.me.email} · ${ctx.me.role === 'super_admin' ? 'Super Admin' : 'Editor'}`} />

      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="edit" size={16} /></span> Appearance — font style</h2>
        <p class="a-muted">Pick the font you like best. It changes instantly and is remembered on this device.</p>
        <div class="a-fonts" role="radiogroup" aria-label="Font style">
          {FONTS.map((x) => (
            <button type="button" role="radio" aria-checked={font === x.id} class={`a-font${font === x.id ? ' is-on' : ''}`} onClick={() => chooseFont(x.id)}>
              <span class="a-font__sample" style={{ fontFamily: x.head, fontWeight: 700 }}>Aa Bangash</span>
              <span class="a-font__name" style={{ fontFamily: x.body }}>{x.name}{font === x.id && ' ✓'}</span>
              <span class="a-font__desc" style={{ fontFamily: x.body }}>{x.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="user" size={16} /></span> Your name</h2>
        <div class="a-row a-row--wrap">
          <input class="a-input" value={name} maxLength={60} onInput={(e) => setName(e.currentTarget.value)} placeholder="e.g. Umer Saeed" />
          <button class="a-btn a-btn--primary" onClick={saveName}>Save</button>
        </div>
      </section>
      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="settings" size={16} /></span> Change password</h2>
        <form class="a-form-grid" onSubmit={changePw}>
          <Field label="New password"><input type="password" autoComplete="new-password" value={pw} onInput={(e) => setPw(e.currentTarget.value)} /></Field>
          <Field label="Confirm new password"><input type="password" autoComplete="new-password" value={pw2} onInput={(e) => setPw2(e.currentTarget.value)} /></Field>
          <div><button class="a-btn a-btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button></div>
        </form>
      </section>
      <button class="a-btn a-btn--ghost a-btn--danger-text" onClick={() => sb.auth.signOut()}><Icon name="logout" /> Sign out</button>
    </div>
  );
}
