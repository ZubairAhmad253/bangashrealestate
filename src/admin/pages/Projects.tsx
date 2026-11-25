import { useEffect, useRef, useState } from 'preact/hooks';
import { sb, slugify, shortId, removeImages, isStoredMedia, type ProjectRow } from '../lib';
import { Icon, Field, Segmented, Toggle, PhotoUploader, VideoManager, Empty, Skeleton, PageHead, toast, confirmDialog } from '../ui';
import { go, type Ctx } from '../App';
import { SITE_URL } from '../meta';
import { useProjects, useThumbs, cachedProject } from '../queries';
import { afterWrite, age, invalidate, mutate } from '../store';

const CATEGORY: Record<ProjectRow['category'], string> = { house: 'House', flats: 'Flats / Apartments', renovation: 'Renovation', commercial: 'Commercial' };
const SAVED_MSG = 'Saved ✓ The website will update in 1–2 minutes.';

export function ProjectsList({ ctx }: { ctx: Ctx }) {
  const isSuper = ctx.me.role === 'super_admin';
  const query = useProjects();
  const rows = query.data ?? (query.error ? [] : null);
  const thumb = useThumbs();

  const update = async (p: ProjectRow, patch: Partial<ProjectRow>) => {
    query.mutate((r) => r?.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) ?? []);
    const { error } = await sb.from('projects').update(patch).eq('id', p.id);
    if (error) { toast.err(error); void query.reload().catch(() => {}); } else { toast.ok(SAVED_MSG); afterWrite(); }
  };
  const remove = async (p: ProjectRow) => {
    if (!(await confirmDialog(`Delete "${p.title}"?`, 'The project and all its photos will be removed permanently.'))) return;
    const { error } = await sb.from('projects').delete().eq('id', p.id);
    if (error) return toast.err(error);
    await removeImages(p.images).catch(() => {});
    query.mutate((r) => r?.filter((x) => x.id !== p.id) ?? []);
    toast.ok('Project deleted.');
    afterWrite();
  };

  return (
    <div class="a-page">
      <PageHead title="Construction Projects" icon="hammer" sub="Homes and buildings you have built — shown on the website's 'Our Projects' page">
        <a href="#/projects/new" class="a-btn a-btn--gold"><Icon name="plus" /> Add project</a>
      </PageHead>
      {rows === null ? <Skeleton rows={3} /> : rows.length === 0 ? (
        <Empty icon="hammer" title="No projects yet" text="Add photos of homes you have built — it builds trust with new clients.">
          <a href="#/projects/new" class="a-btn a-btn--gold"><Icon name="plus" /> Add your first project</a>
        </Empty>
      ) : (
        <div class="a-items">
          {rows.map((p, i) => (
            <article class="a-item" key={p.id}>
              <a href={`#/projects/${p.id}`} class="a-item__thumb">
                {p.images[0] ? <img src={thumb(p.images[0])} alt="" width={480} height={360} loading={i < 4 ? 'eager' : 'lazy'} decoding="async" /> : <span><Icon name="image" size={28} /></span>}
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
                <a href={`#/projects/${p.id}`} class="a-btn a-btn--soft a-btn--sm"><Icon name="edit" size={16} /> Edit</a>
                {p.published && <a href={`${SITE_URL}/projects/${p.slug}/`} target="_blank" rel="noopener" class="a-btn a-btn--ghost a-btn--sm"><Icon name="external" size={16} /> View</a>}
                {isSuper && <button class="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" onClick={() => remove(p)}><Icon name="trash" size={16} /> Delete</button>}
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
  year: string; description: string; images: string[]; videos: string[]; featured: boolean; published: boolean;
}
const EMPTY: FormState = { title: '', category: 'house', status: 'completed', location: '', size: '', year: String(new Date().getFullYear()), description: '', images: [], videos: [], featured: false, published: true };

const toForm = (p: ProjectRow): FormState => ({ title: p.title, category: p.category, status: p.status, location: p.location, size: p.size, year: p.year ? String(p.year) : '', description: p.description, images: p.images, videos: p.videos ?? [], featured: p.featured, published: p.published });

export function ProjectForm({ id, ctx: _ctx }: { id: string; ctx: Ctx }) {
  const isNew = id === 'new';
  // Opens instantly from the cached list; loads from the server only if it is not there or is old
  const [cached] = useState(() => (isNew ? undefined : cachedProject(id)));
  const [row, setRow] = useState<ProjectRow | null>(cached ?? null);
  const [f, setF] = useState<FormState | null>(isNew ? EMPTY : cached ? toForm(cached) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  const uploaded = useRef<string[]>([]);
  const folder = useRef(`projects/${isNew ? `new-${Date.now()}-${shortId()}` : id}`);

  useEffect(() => {
    if (isNew || (cached && age('projects') < 60_000)) return;
    sb.from('projects').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) { if (!cached) { toast.err(error ?? 'Project not found'); go('projects'); } return; }
      const p = data as ProjectRow;
      setRow(p);
      if (!dirty.current) setF(toForm(p));
    });
  }, [id]);

  if (!f) return <div class="a-page"><Skeleton rows={3} /></div>;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    dirty.current = true;
    setF((prev) => (prev ? { ...prev, [k]: v } : prev));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: '' } : prev));
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 3) e.title = 'Please enter the project name.';
    if (!f.images.length) e.images = 'Please add at least one photo.';
    const year = f.year ? parseInt(f.year, 10) : null;
    if (year !== null && (year < 1990 || year > 2100)) e.year = 'Please enter a valid year (e.g. 2025).';
    setErrors(e);
    if (Object.keys(e).length) return toast.err('Please check the fields marked in red.');
    setSaving(true);
    const data = { title: f.title.trim(), category: f.category, status: f.status, location: f.location.trim(), size: f.size.trim(), year, description: f.description.trim(), images: f.images, videos: f.videos, featured: f.featured, published: f.published };
    const res = isNew
      ? await sb.from('projects').insert({ ...data, slug: `${slugify(`${data.title} ${data.location}`)}-${shortId()}` })
      : await sb.from('projects').update(data).eq('id', id);
    setSaving(false);
    if (res.error) return toast.err(res.error);
    if (isNew) invalidate('projects');
    else mutate<ProjectRow[]>('projects', (list) => list?.map((x) => (x.id === id ? { ...x, ...data } : x)) ?? []);
    afterWrite();
    if (row) {
      const gone = [...row.images.filter((u) => !f.images.includes(u)), ...(row.videos ?? []).filter((u) => !f.videos.includes(u) && isStoredMedia(u))];
      if (gone.length) removeImages(gone).catch(() => {});
    }
    dirty.current = false;
    toast.ok(SAVED_MSG);
    go('projects');
  };
  const cancel = async () => {
    if (dirty.current && !(await confirmDialog('Discard changes?', 'Your changes have not been saved.', 'Discard'))) return;
    const unused = uploaded.current.filter((u) => ![...(row?.images ?? []), ...(row?.videos ?? [])].includes(u));
    if (unused.length) await removeImages(unused).catch(() => {});
    go('projects');
  };

  return (
    <div class="a-page a-page--form">
      <PageHead title={isNew ? 'New project' : 'Edit project'} icon="hammer" sub="Construction gallery" />
      <section class="a-card">
        <h2 class="a-card__title"><span>1</span> Photos</h2>
        <PhotoUploader images={f.images} onChange={(v) => set('images', v)} folder={folder.current} onUploaded={(u) => uploaded.current.push(u)} />
        {errors.images && <p class="a-field__error">{errors.images}</p>}
      </section>
      <section class="a-card">
        <h2 class="a-card__title"><span><Icon name="play" size={16} /></span> Videos (optional)</h2>
        <VideoManager videos={f.videos} onChange={(v) => set('videos', v)} folder={folder.current} onUploaded={(u) => uploaded.current.push(u)} />
      </section>
      <section class="a-card">
        <h2 class="a-card__title"><span>2</span> Details</h2>
        <div class="a-form-grid">
          <Field label="Project name" hint='e.g. "10 Marla House — Sector 4"' error={errors.title} full>
            <input value={f.title} maxLength={140} onInput={(e) => set('title', e.currentTarget.value)} placeholder="10 Marla Modern House" />
          </Field>
          <Field label="Type of work">
            <Segmented value={f.category} onChange={(v) => set('category', v)} options={[{ value: 'house', label: 'House' }, { value: 'flats', label: 'Flats' }, { value: 'renovation', label: 'Renovation' }, { value: 'commercial', label: 'Commercial' }]} />
          </Field>
          <Field label="Status">
            <Segmented value={f.status} onChange={(v) => set('status', v)} options={[{ value: 'completed', label: 'Completed' }, { value: 'in_progress', label: 'In progress' }]} />
          </Field>
          <Field label="Location" hint="e.g. Airport Housing Society, Rawalpindi">
            <input value={f.location} maxLength={140} onInput={(e) => set('location', e.currentTarget.value)} />
          </Field>
          <Field label="Size" hint="e.g. 10 Marla, double storey">
            <input value={f.size} maxLength={80} onInput={(e) => set('size', e.currentTarget.value)} />
          </Field>
          <Field label="Year" error={errors.year}>
            <input type="number" inputMode="numeric" value={f.year} onInput={(e) => set('year', e.currentTarget.value)} />
          </Field>
          <Field label="Description (optional)" hint="What was done: grey structure, finishing, design, etc." full>
            <textarea rows={4} maxLength={5000} value={f.description} onInput={(e) => set('description', e.currentTarget.value)} />
          </Field>
        </div>
        <div class="a-toggles">
          <Toggle checked={f.published} onChange={(v) => set('published', v)} label="Show on website" />
          <Toggle checked={f.featured} onChange={(v) => set('featured', v)} label="Featured" hint="Show first in the list" />
        </div>
      </section>
      <div class="a-savebar">
        <button class="a-btn a-btn--ghost" onClick={cancel} disabled={saving}>Cancel</button>
        <button class="a-btn a-btn--gold a-btn--lg" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Icon name="check" /> Save project</>}</button>
      </div>
    </div>
  );
}
