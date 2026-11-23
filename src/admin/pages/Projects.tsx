import { useEffect, useRef, useState } from 'preact/hooks';
import { sb, slugify, shortId, removeImages, type ProjectRow } from '../lib';
import { Icon, Field, Segmented, Toggle, PhotoUploader, Empty, Loading, PageHead, toast, confirmDialog } from '../ui';
import { go, type Ctx } from '../App';
import { SITE_URL } from '../meta';

const CATEGORY: Record<ProjectRow['category'], string> = { house: 'House', flats: 'Flats / Apartments', renovation: 'Renovation', commercial: 'Commercial' };
const SAVED_MSG = 'Saved ✓ Website par 1–2 minute mein update ho jayega.';

export function ProjectsList({ ctx: _ctx }: { ctx: Ctx }) {
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const load = () =>
    sb.from('projects').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) toast.err(error);
      setRows((data as ProjectRow[]) ?? []);
    });
  useEffect(() => { void load(); }, []);

  const update = async (p: ProjectRow, patch: Partial<ProjectRow>) => {
    setRows((r) => r?.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) ?? r);
    const { error } = await sb.from('projects').update(patch).eq('id', p.id);
    if (error) { toast.err(error); void load(); } else toast.ok(SAVED_MSG);
  };
  const remove = async (p: ProjectRow) => {
    if (!(await confirmDialog(`"${p.title}" delete karein?`, 'Project aur us ki saari photos hamesha ke liye hat jayengi.'))) return;
    const { error } = await sb.from('projects').delete().eq('id', p.id);
    if (error) return toast.err(error);
    await removeImages(p.images).catch(() => {});
    setRows((r) => r?.filter((x) => x.id !== p.id) ?? r);
    toast.ok('Project delete ho gaya.');
  };

  return (
    <div class="a-page">
      <PageHead title="Construction Projects" sub="Banaye hue ghar aur buildings — website ke 'Our Projects' page par dikhte hain">
        <a href="#/projects/new" class="a-btn a-btn--gold"><Icon name="plus" /> Add project</a>
      </PageHead>
      {rows === null ? <Loading /> : rows.length === 0 ? (
        <Empty icon="hammer" title="Abhi koi project nahi" text="Apne banaye hue gharon ki photos add karein — naye clients ka bharosa barhta hai.">
          <a href="#/projects/new" class="a-btn a-btn--gold"><Icon name="plus" /> Pehla project add karein</a>
        </Empty>
      ) : (
        <div class="a-items">
          {rows.map((p) => (
            <article class="a-item" key={p.id}>
              <a href={`#/projects/${p.id}`} class="a-item__thumb">
                {p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <span><Icon name="image" size={28} /></span>}
                <span class={`a-pill ${p.published ? 'a-pill--live' : 'a-pill--muted'}`}>{p.published ? 'Live' : 'Hidden'}</span>
              </a>
              <div class="a-item__body">
                <a href={`#/projects/${p.id}`} class="a-item__title">{p.title}</a>
                <p class="a-muted a-small">{CATEGORY[p.category]} · {p.status === 'completed' ? 'Completed' : 'In progress'}{p.location ? ` · ${p.location}` : ''}{p.year ? ` · ${p.year}` : ''}</p>
                <p class="a-muted a-small">{p.images.length} photos</p>
                <div class="a-item__actions">
                  <button class={`a-tag${p.featured ? ' is-on' : ''}`} onClick={() => update(p, { featured: !p.featured })}><Icon name="star" size={14} /> Featured</button>
                  <button class={`a-tag${p.published ? ' is-on' : ''}`} onClick={() => update(p, { published: !p.published })}>{p.published ? '● Live' : '○ Hidden'}</button>
                </div>
              </div>
              <div class="a-item__side">
                <a href={`#/projects/${p.id}`} class="a-btn a-btn--ghost a-btn--sm"><Icon name="edit" size={16} /> Edit</a>
                {p.published && <a href={`${SITE_URL}/projects/${p.slug}/`} target="_blank" rel="noopener" class="a-btn a-btn--ghost a-btn--sm"><Icon name="external" size={16} /> View</a>}
                <button class="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" onClick={() => remove(p)}><Icon name="trash" size={16} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

interface FormState {
  title: string; category: ProjectRow['category']; status: ProjectRow['status']; location: string; size: string;
  year: string; description: string; images: string[]; featured: boolean; published: boolean;
}
const EMPTY: FormState = { title: '', category: 'house', status: 'completed', location: '', size: '', year: String(new Date().getFullYear()), description: '', images: [], featured: false, published: true };

export function ProjectForm({ id, ctx: _ctx }: { id: string; ctx: Ctx }) {
  const isNew = id === 'new';
  const [row, setRow] = useState<ProjectRow | null>(null);
  const [f, setF] = useState<FormState | null>(isNew ? EMPTY : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  const uploaded = useRef<string[]>([]);
  const folder = useRef(`projects/${isNew ? `new-${Date.now()}-${shortId()}` : id}`);

  useEffect(() => {
    if (isNew) return;
    sb.from('projects').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) { toast.err(error ?? 'Project nahi mila'); go('projects'); return; }
      const p = data as ProjectRow;
      setRow(p);
      setF({ title: p.title, category: p.category, status: p.status, location: p.location, size: p.size, year: p.year ? String(p.year) : '', description: p.description, images: p.images, featured: p.featured, published: p.published });
    });
  }, [id]);

  if (!f) return <div class="a-page"><Loading /></div>;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    dirty.current = true;
    setF((prev) => (prev ? { ...prev, [k]: v } : prev));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: '' } : prev));
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 3) e.title = 'Project ka naam likhein.';
    if (!f.images.length) e.images = 'Kam az kam 1 photo add karein.';
    const year = f.year ? parseInt(f.year, 10) : null;
    if (year !== null && (year < 1990 || year > 2100)) e.year = 'Sahi saal likhein (masalan 2025).';
    setErrors(e);
    if (Object.keys(e).length) return toast.err('Laal (red) fields dekhein.');
    setSaving(true);
    const data = { title: f.title.trim(), category: f.category, status: f.status, location: f.location.trim(), size: f.size.trim(), year, description: f.description.trim(), images: f.images, featured: f.featured, published: f.published };
    const res = isNew
      ? await sb.from('projects').insert({ ...data, slug: `${slugify(`${data.title} ${data.location}`)}-${shortId()}` })
      : await sb.from('projects').update(data).eq('id', id);
    setSaving(false);
    if (res.error) return toast.err(res.error);
    if (row) await removeImages(row.images.filter((u) => !f.images.includes(u))).catch(() => {});
    dirty.current = false;
    toast.ok(SAVED_MSG);
    go('projects');
  };
  const cancel = async () => {
    if (dirty.current && !(await confirmDialog('Changes save nahi hue', 'Bina save kiye wapas jana hai?', 'Haan, wapas jayein'))) return;
    const unused = uploaded.current.filter((u) => !(row?.images ?? []).includes(u));
    if (unused.length) await removeImages(unused).catch(() => {});
    go('projects');
  };

  return (
    <div class="a-page a-page--form">
      <PageHead title={isNew ? 'Naya project' : 'Project edit karein'} sub="Construction gallery" />
      <section class="a-card">
        <h2 class="a-card__title"><span>1</span> Photos</h2>
        <PhotoUploader images={f.images} onChange={(v) => set('images', v)} folder={folder.current} onUploaded={(u) => uploaded.current.push(u)} />
        {errors.images && <p class="a-field__error">{errors.images}</p>}
      </section>
      <section class="a-card">
        <h2 class="a-card__title"><span>2</span> Details</h2>
        <div class="a-form-grid">
          <Field label="Project name" hint='Masalan: "10 Marla House — Sector 4"' error={errors.title} full>
            <input value={f.title} maxLength={140} onInput={(e) => set('title', e.currentTarget.value)} placeholder="10 Marla Modern House" />
          </Field>
          <Field label="Kis qism ka kaam?">
            <Segmented value={f.category} onChange={(v) => set('category', v)} options={[{ value: 'house', label: 'House' }, { value: 'flats', label: 'Flats' }, { value: 'renovation', label: 'Renovation' }, { value: 'commercial', label: 'Commercial' }]} />
          </Field>
          <Field label="Status">
            <Segmented value={f.status} onChange={(v) => set('status', v)} options={[{ value: 'completed', label: 'Completed' }, { value: 'in_progress', label: 'In progress' }]} />
          </Field>
          <Field label="Location" hint="Masalan: Airport Housing Society, Rawalpindi">
            <input value={f.location} maxLength={140} onInput={(e) => set('location', e.currentTarget.value)} />
          </Field>
          <Field label="Size" hint="Masalan: 10 Marla, double storey">
            <input value={f.size} maxLength={80} onInput={(e) => set('size', e.currentTarget.value)} />
          </Field>
          <Field label="Saal (year)" error={errors.year}>
            <input type="number" inputMode="numeric" value={f.year} onInput={(e) => set('year', e.currentTarget.value)} />
          </Field>
          <Field label="Description (optional)" hint="Kya kaam kiya: grey structure, finishing, design waghera." full>
            <textarea rows={4} maxLength={5000} value={f.description} onInput={(e) => set('description', e.currentTarget.value)} />
          </Field>
        </div>
        <div class="a-toggles">
          <Toggle checked={f.published} onChange={(v) => set('published', v)} label="Website par dikhayein" />
          <Toggle checked={f.featured} onChange={(v) => set('featured', v)} label="Featured" hint="List mein sab se upar" />
        </div>
      </section>
      <div class="a-savebar">
        <button class="a-btn a-btn--ghost" onClick={cancel} disabled={saving}>Cancel</button>
        <button class="a-btn a-btn--gold a-btn--lg" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Icon name="check" /> Save project</>}</button>
      </div>
    </div>
  );
}
