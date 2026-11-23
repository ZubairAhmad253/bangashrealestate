import { useState } from 'preact/hooks';
import { sb } from '../lib';
import { Icon, Field, PageHead, toast } from '../ui';
import type { Ctx } from '../App';

export function Account({ ctx }: { ctx: Ctx }) {
  const [name, setName] = useState(ctx.me.name ?? '');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);

  const saveName = async () => {
    const { error } = await sb.rpc('set_my_name', { new_name: name });
    if (error) return toast.err(error);
    toast.ok('Naam save ho gaya — page refresh par dikhega.');
  };
  const changePw = async (e: Event) => {
    e.preventDefault();
    if (pw.length < 8) return toast.err('Password kam az kam 8 characters ka ho.');
    if (pw !== pw2) return toast.err('Dono passwords ek jaise nahi hain.');
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.err(error);
    setPw('');
    setPw2('');
    toast.ok('Password badal gaya ✓');
  };

  return (
    <div class="a-page a-page--form">
      <PageHead title="My Account" sub={`${ctx.me.email} · ${ctx.me.role === 'super_admin' ? 'Super Admin' : 'Editor'}`} />
      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="user" size={16} /></span> Aap ka naam</h2>
        <div class="a-row a-row--wrap">
          <input class="a-input" value={name} maxLength={60} onInput={(e) => setName(e.currentTarget.value)} placeholder="Masalan: Umer Saeed" />
          <button class="a-btn a-btn--primary" onClick={saveName}>Save</button>
        </div>
      </section>
      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="settings" size={16} /></span> Password badlein</h2>
        <form class="a-form-grid" onSubmit={changePw}>
          <Field label="Naya password"><input type="password" autoComplete="new-password" value={pw} onInput={(e) => setPw(e.currentTarget.value)} /></Field>
          <Field label="Dobara likhein"><input type="password" autoComplete="new-password" value={pw2} onInput={(e) => setPw2(e.currentTarget.value)} /></Field>
          <div><button class="a-btn a-btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Password badlein'}</button></div>
        </form>
      </section>
      <button class="a-btn a-btn--ghost a-btn--danger-text" onClick={() => sb.auth.signOut()}><Icon name="logout" /> Logout</button>
    </div>
  );
}
