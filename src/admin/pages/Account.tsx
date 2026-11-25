import { useState } from 'preact/hooks';
import { sb, type Admin } from '../lib';
import { Icon, Field, PageHead, toast } from '../ui';
import { mutate } from '../store';
import type { Ctx } from '../App';
import { InstallCard } from '../Install';
import { WhatsAppReplies } from '../WhatsAppReplies';

export function Account({ ctx }: { ctx: Ctx }) {
  const [name, setName] = useState(ctx.me.name ?? '');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const saveName = async () => {
    const { error } = await sb.rpc('set_my_name', { new_name: name });
    if (error) return toast.err(error);
    // Updates the name everywhere in the app straight away
    mutate<Admin | null>(`me:${ctx.me.user_id}`, (me) => (me ? { ...me, name: name.trim() || null } : me ?? null));
    toast.ok('Name saved ✓');
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

      <InstallCard />

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
      <WhatsAppReplies />
      <button class="a-btn a-btn--ghost a-btn--danger-text" onClick={() => sb.auth.signOut()}><Icon name="logout" /> Sign out</button>
    </div>
  );
}
