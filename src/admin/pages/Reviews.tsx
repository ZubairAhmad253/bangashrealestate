import { useEffect, useState } from 'preact/hooks';
import { sb, type TestimonialRow } from '../lib';
import { Icon, Field, Toggle, Empty, Loading, PageHead, toast, confirmDialog } from '../ui';
import type { Ctx } from '../App';

const SAVED_MSG = 'Saved ✓ The website will update in 1–2 minutes.';
type Draft = Pick<TestimonialRow, 'name' | 'place' | 'text' | 'rating' | 'published'> & { id?: string };
const NEW: Draft = { name: '', place: '', text: '', rating: 5, published: true };

export function Reviews({ ctx: _ctx }: { ctx: Ctx }) {
  const [rows, setRows] = useState<TestimonialRow[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    sb.from('testimonials').select('*').order('sort_order').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) toast.err(error);
      setRows((data as TestimonialRow[]) ?? []);
    });
  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!draft) return;
    if (draft.name.trim().length < 2 || draft.text.trim().length < 5) return toast.err('Please enter the client name and the review text.');
    setSaving(true);
    const data = { name: draft.name.trim(), place: draft.place.trim(), text: draft.text.trim(), rating: draft.rating, published: draft.published };
    const res = draft.id
      ? await sb.from('testimonials').update(data).eq('id', draft.id)
      : await sb.from('testimonials').insert({ ...data, sort_order: (rows?.length ?? 0) + 1 });
    setSaving(false);
    if (res.error) return toast.err(res.error);
    setDraft(null);
    toast.ok(SAVED_MSG);
    void load();
  };
  const remove = async (r: TestimonialRow) => {
    if (!(await confirmDialog(`Delete the review from ${r.name}?`))) return;
    const { error } = await sb.from('testimonials').delete().eq('id', r.id);
    if (error) return toast.err(error);
    toast.ok('Review deleted.');
    void load();
  };
  const move = async (i: number, d: number) => {
    if (!rows) return;
    const next = [...rows];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    setRows(next);
    const results = await Promise.all(next.map((r, idx) => sb.from('testimonials').update({ sort_order: idx + 1 }).eq('id', r.id)));
    if (results.some((r) => r.error)) toast.err('Could not save the new order.');
  };

  return (
    <div class="a-page">
      <PageHead title="Reviews" icon="star" sub="Client reviews — shown in the 'Families who trust us' section of the website">
        <button class="a-btn a-btn--gold" onClick={() => setDraft({ ...NEW })}><Icon name="plus" /> Add review</button>
      </PageHead>
      <p class="a-alert a-alert--info">Tip: open your reviews on Google Maps and copy the name and text here.</p>

      {rows === null ? <Loading /> : rows.length === 0 ? (
        <Empty icon="star" title="No reviews yet" text="Until you add reviews, the website shows your Google rating (4.9★) card.">
          <button class="a-btn a-btn--gold" onClick={() => setDraft({ ...NEW })}><Icon name="plus" /> Add your first review</button>
        </Empty>
      ) : (
        <div class="a-reviews">
          {rows.map((r, i) => (
            <article class="a-review" key={r.id}>
              <div class="a-review__stars">{'★'.repeat(r.rating)}<span>{'★'.repeat(5 - r.rating)}</span></div>
              <p>“{r.text}”</p>
              <footer>
                <strong>{r.name}</strong>{r.place && <span class="a-muted"> · {r.place}</span>}
                {!r.published && <span class="a-pill a-pill--muted">Hidden</span>}
              </footer>
              <div class="a-row a-row--wrap">
                <button class="a-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="left" /></button>
                <button class="a-icon-btn" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down"><Icon name="right" /></button>
                <button class="a-btn a-btn--ghost a-btn--sm" onClick={() => setDraft({ ...r })}><Icon name="edit" size={16} /> Edit</button>
                <button class="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" onClick={() => remove(r)}><Icon name="trash" size={16} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {draft && (
        <div class="a-modal" onClick={(e) => e.target === e.currentTarget && setDraft(null)}>
          <div class="a-modal__box" role="dialog" aria-modal="true">
            <h3>{draft.id ? 'Edit review' : 'New review'}</h3>
            <div class="a-form-grid">
              <Field label="Client name"><input value={draft.name} maxLength={80} onInput={(e) => setDraft({ ...draft, name: e.currentTarget.value })} placeholder="Ahmed Khan" /></Field>
              <Field label="Area (optional)"><input value={draft.place} maxLength={80} onInput={(e) => setDraft({ ...draft, place: e.currentTarget.value })} placeholder="Airport Housing Society" /></Field>
              <Field label="Rating" full>
                <div class="a-rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" class={n <= draft.rating ? 'is-on' : ''} onClick={() => setDraft({ ...draft, rating: n })} aria-label={`${n} stars`}><Icon name="star" size={28} /></button>
                  ))}
                </div>
              </Field>
              <Field label="Review" full><textarea rows={4} maxLength={1200} value={draft.text} onInput={(e) => setDraft({ ...draft, text: e.currentTarget.value })} /></Field>
            </div>
            <Toggle checked={draft.published} onChange={(v) => setDraft({ ...draft, published: v })} label="Show on website" />
            <div class="a-row a-row--end" style={{ marginTop: '18px' }}>
              <button class="a-btn a-btn--ghost" onClick={() => setDraft(null)}>Cancel</button>
              <button class="a-btn a-btn--gold" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save review'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
