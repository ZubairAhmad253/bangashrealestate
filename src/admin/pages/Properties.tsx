import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sb, formatPrice, slugify, shortId, removeImages, isStoredMedia, type PropertyRow } from '../lib';
import { Icon, Field, Segmented, FilterTabs, Toggle, Stepper, Chips, PhotoUploader, VideoManager, Empty, PageHead, Skeleton, toast, confirmDialog, memoRow, useProgressive } from '../ui';
import { go, type Ctx } from '../App';
import { AREA_OPTIONS, areaName, SITE_URL, DEMO_SLUGS } from '../meta';
import { useProperties, useThumbs, cachedProperty } from '../queries';
import { afterWrite, age, invalidate, mutate } from '../store';

const STATUS: Record<PropertyRow['status'], { label: string; cls: string }> = {
  available: { label: 'Live', cls: 'a-pill--live' },
  hidden: { label: 'Hidden', cls: 'a-pill--muted' },
  sold: { label: 'Sold', cls: 'a-pill--sold' },
  rented: { label: 'Rented', cls: 'a-pill--sold' },
};
const TYPE_LABEL = { house: 'House', flat: 'Flat', plot: 'Plot' } as const;

const SAVED_MSG = 'Saved ✓ The website will update in 1–2 minutes.';

/* ==================== LIST ==================== */
type TypeFilter = 'all' | PropertyRow['type'];
type StatusFilter = 'all' | 'available' | 'hidden' | 'done';

export function PropertiesList({ ctx }: { ctx: Ctx }) {
  const isSuper = ctx.me.role === 'super_admin';
  const query = useProperties();
  const rows = query.data ?? (query.error ? [] : null);
  const thumb = useThumbs();
  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const update = async (p: PropertyRow, patch: Partial<PropertyRow>, msg = SAVED_MSG) => {
    query.mutate((r) => r?.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) ?? []);
    const { error } = await sb.from('properties').update(patch).eq('id', p.id);
    if (error) { toast.err(error); void query.reload().catch(() => {}); } else { toast.ok(msg); afterWrite(); }
  };
  const remove = async (p: PropertyRow) => {
    if (!(await confirmDialog(`Delete "${p.title}"?`, 'The property and all its photos will be removed permanently. If it has only been sold, setting the status to "Sold" is better.'))) return;
    const { error } = await sb.from('properties').delete().eq('id', p.id);
    if (error) return toast.err(error);
    await removeImages(p.images).catch(() => {});
    query.mutate((r) => r?.filter((x) => x.id !== p.id) ?? []);
    toast.ok('Property deleted.');
    afterWrite();
  };
  // Demo listings (copied from the original sample data) must not stay on the live website
  const demos = (rows ?? []).filter((r) => DEMO_SLUGS.includes(r.slug) && r.status !== 'hidden');
  const [hidingDemos, setHidingDemos] = useState(false);
  const hideDemos = async () => {
    if (!(await confirmDialog('Hide demo listings?', `${demos.length} demo listing${demos.length > 1 ? 's' : ''} with stock photos will be hidden from the website. Nothing is deleted — you can show them again at any time.`, 'Hide demo listings', false))) return;
    setHidingDemos(true);
    const ids = demos.map((d) => d.id);
    const { error } = await sb.from('properties').update({ status: 'hidden' }).in('id', ids);
    setHidingDemos(false);
    if (error) return toast.err(error);
    query.mutate((r) => r?.map((x) => (ids.includes(x.id) ? { ...x, status: 'hidden' as const } : x)) ?? []);
    toast.ok(SAVED_MSG);
    afterWrite();
  };

  const counts = useMemo(() => {
    const c = { all: 0, house: 0, flat: 0, plot: 0 };
    (rows ?? []).forEach((r) => { c.all++; c[r.type]++; });
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (rows ?? []).filter((p) => {
      if (type !== 'all' && p.type !== type) return false;
      if (status === 'available' && p.status !== 'available') return false;
      if (status === 'hidden' && p.status !== 'hidden') return false;
      if (status === 'done' && !['sold', 'rented'].includes(p.status)) return false;
      return !term || `${p.title} ${p.location} ${areaName(p.area)}`.toLowerCase().includes(term);
    });
  }, [rows, q, type, status]);
  // The listings that fit on the screen appear at once, the rest right after the screen change
  const visible = useProgressive(shown, 6);

  return (
    <div class="a-page">
      <PageHead title="Properties" icon="home" sub="All houses, flats and plots — for sale and for rent">
        <a href="#/properties/new" class="a-btn a-btn--gold"><Icon name="plus" /> Add property</a>
      </PageHead>

      {demos.length > 0 && (
        <section class="a-banner">
          <span class="a-banner__icon"><Icon name="eye-off" size={22} /></span>
          <div class="a-banner__text">
            <strong>{demos.length} demo listing{demos.length > 1 ? 's are' : ' is'} still on the website</strong>
            <p>These were added as examples with stock photos. Hide them so Google and visitors only see your real properties.</p>
          </div>
          <button class="a-btn a-btn--gold" onClick={hideDemos} disabled={hidingDemos}>{hidingDemos ? 'Hiding…' : 'Hide demo listings'}</button>
        </section>
      )}

      <FilterTabs label="Property type" value={type} onChange={setType} options={[
        { value: 'all', label: 'All', icon: 'layers', count: counts.all },
        { value: 'house', label: 'Houses', icon: 'home', count: counts.house },
        { value: 'flat', label: 'Flats', icon: 'building', count: counts.flat },
        { value: 'plot', label: 'Plots', icon: 'map', count: counts.plot },
      ]} />

      <div class="a-toolbar">
        <div class="a-search">
          <Icon name="search" />
          <input type="search" placeholder="Search properties…" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
        </div>
        <select class="a-filter" value={status} onChange={(e) => setStatus(e.currentTarget.value as typeof status)} aria-label="Filter by status">
          <option value="all">Any status</option>
          <option value="available">Live</option>
          <option value="hidden">Hidden</option>
          <option value="done">Sold / Rented</option>
        </select>
      </div>

      {rows === null ? <Skeleton rows={4} /> : shown.length === 0 ? (
        rows.length === 0 ? (
          <Empty icon="home" title="No properties yet" text="Add your first property — it will appear on the website automatically.">
            <a href="#/properties/new" class="a-btn a-btn--gold"><Icon name="plus" /> Add a property</a>
          </Empty>
        ) : <Empty icon="search" title="Nothing found" text="Try a different search or filter." />
      ) : (
        <div class="a-items">
          {visible.map((p, i) => (
            <PropertyItem key={p.id} p={p} thumb={p.images[0] ? thumb(p.images[0]) : ''} eager={i < 4} isSuper={isSuper} onUpdate={update} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

/* One listing in the list — redraws only when this listing (or its photo) changes */
interface ItemProps { p: PropertyRow; thumb: string; eager: boolean; isSuper: boolean; onUpdate: (p: PropertyRow, patch: Partial<PropertyRow>) => void; onRemove: (p: PropertyRow) => void }
const PropertyItem = memoRow<ItemProps>(({ p, thumb, eager, isSuper, onUpdate, onRemove }) => (
    <article class="a-item">
      <a href={`#/properties/${p.id}`} class="a-item__thumb">
        {p.images[0] ? <img src={thumb} alt="" width={480} height={360} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : <span><Icon name="image" size={28} /></span>}
        <span class={`a-pill ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
        {(p.images.length > 1 || (p.videos?.length ?? 0) > 0) && (
          <span class="a-item__count"><Icon name="image" size={12} /> {p.images.length}{(p.videos?.length ?? 0) > 0 && <> · <Icon name="play" size={11} /> {p.videos.length}</>}</span>
        )}
      </a>
      <div class="a-item__body">
        <div class="a-item__meta">
          <span class="a-chiplet">{TYPE_LABEL[p.type]}</span>
          <span class={`a-chiplet ${p.purpose === 'sale' ? 'a-chiplet--sale' : 'a-chiplet--rent'}`}>{p.purpose === 'sale' ? 'For Sale' : 'For Rent'}</span>
          <span class="a-muted a-small">{p.size}</span>
        </div>
        <a href={`#/properties/${p.id}`} class="a-item__title">{p.title}</a>
        <p class="a-muted a-small"><Icon name="pin" size={14} /> {p.location}{p.area && !p.location.toLowerCase().includes(areaName(p.area).toLowerCase()) ? `, ${areaName(p.area)}` : ''}</p>
        {p.show_price === false
          ? <p class="a-item__price a-item__price--hidden"><Icon name="eye-off" size={15} /> Price on request</p>
          : <p class="a-item__price">PKR {formatPrice(p.price)}{p.purpose === 'rent' && <small> /month</small>}</p>}
      </div>
      <div class="a-item__actions">
        <button class={`a-tag${p.featured ? ' is-on' : ''}`} onClick={() => onUpdate(p, { featured: !p.featured })} title="Show on the home page"><Icon name="star" size={14} /> Featured</button>
        <button class={`a-tag a-tag--hot${p.hot ? ' is-on' : ''}`} onClick={() => onUpdate(p, { hot: !p.hot })}><Icon name="fire" size={14} /> Hot</button>
        <select class="a-select-sm" value={p.status} onChange={(e) => onUpdate(p, { status: e.currentTarget.value as PropertyRow['status'] })} aria-label="Status">
          <option value="available">● Live</option>
          <option value="hidden">○ Hidden</option>
          <option value="sold">✓ Sold</option>
          <option value="rented">✓ Rented</option>
        </select>
      </div>
      <div class="a-item__side">
        <a href={`#/properties/${p.id}`} class="a-btn a-btn--soft a-btn--sm"><Icon name="edit" size={16} /> Edit</a>
        {p.status !== 'hidden' && <a href={`${SITE_URL}/properties/${p.slug}/`} target="_blank" rel="noopener" class="a-btn a-btn--ghost a-btn--sm"><Icon name="external" size={16} /> View</a>}
        {isSuper && <button class="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" onClick={() => onRemove(p)}><Icon name="trash" size={16} /> Delete</button>}
      </div>
    </article>
), ['p', 'thumb', 'eager', 'isSuper']);

/* ==================== FORM ==================== */
type Unit = 'crore' | 'lakh' | 'thousand' | 'rupees';
const UNIT_VALUE: Record<Unit, number> = { crore: 10_000_000, lakh: 100_000, thousand: 1_000, rupees: 1 };
const splitPrice = (n: number): { amount: string; unit: Unit } => {
  if (!n) return { amount: '', unit: 'lakh' };
  const unit: Unit = n >= 10_000_000 ? 'crore' : n >= 100_000 ? 'lakh' : n >= 1_000 && n % 1_000 === 0 ? 'thousand' : 'rupees';
  return { amount: String(Number((n / UNIT_VALUE[unit]).toFixed(4))), unit };
};
type SizeUnit = 'Marla' | 'Kanal' | 'sq ft' | 'sq yd';
const splitSize = (s: string): { amount: string; unit: SizeUnit } => {
  const m = s.match(/^([\d.,]+)\s*(Marla|Kanal|sq ft|sq yd)$/i);
  if (m) return { amount: m[1].replace(/,/g, ''), unit: (['Marla', 'Kanal', 'sq ft', 'sq yd'].find((u) => u.toLowerCase() === m[2].toLowerCase()) as SizeUnit) };
  return { amount: s, unit: 'Marla' };
};

const FEATURES: Record<PropertyRow['type'], string[]> = {
  house: ['Brand new', 'Corner', 'Park facing', 'Main boulevard', 'Car porch', 'Servant quarter', 'Gas available', 'Separate meters', 'Near mosque', 'Near market', 'Solar system', 'Furnished'],
  flat: ['Lift', 'Backup power', 'Parking', 'Furnished', 'Semi-furnished', 'Balcony', 'Security', 'Gas available', 'Near market', 'Family building'],
  plot: ['Corner', 'Park facing', 'Main boulevard', 'Possession', 'Clear documents', 'Utilities available', 'Developed sector', 'Ready for construction'],
};

interface FormState {
  title: string; purpose: PropertyRow['purpose']; type: PropertyRow['type'];
  priceAmount: string; priceUnit: Unit; showPrice: boolean; area: string; location: string;
  sizeAmount: string; sizeUnit: SizeUnit; beds: number | null; baths: number | null;
  description: string; features: string[]; images: string[]; videos: string[];
  featured: boolean; hot: boolean; status: PropertyRow['status'];
}
const EMPTY: FormState = {
  title: '', purpose: 'sale', type: 'house', priceAmount: '', priceUnit: 'crore', showPrice: true, area: AREA_OPTIONS[0].slug, location: '',
  sizeAmount: '', sizeUnit: 'Marla', beds: 3, baths: 3, description: '', features: [], images: [], videos: [],
  featured: false, hot: false, status: 'available',
};
type FormTab = 'details' | 'photos' | 'videos';
const TAB_OF: Record<string, FormTab> = { images: 'photos' };

const toForm = (p: PropertyRow): FormState => {
  const pr = splitPrice(Number(p.price));
  const sz = splitSize(p.size);
  return {
    title: p.title, purpose: p.purpose, type: p.type, priceAmount: pr.amount, priceUnit: pr.unit, showPrice: p.show_price ?? true,
    area: p.area, location: p.location, sizeAmount: sz.amount, sizeUnit: sz.unit, beds: p.beds, baths: p.baths,
    description: p.description, features: p.features ?? [], images: p.images ?? [], videos: p.videos ?? [],
    featured: p.featured, hot: p.hot, status: p.status,
  };
};

export function PropertyForm({ id, ctx: _ctx }: { id: string; ctx: Ctx }) {
  const isNew = id === 'new';
  // Opens instantly from the cached list; loads from the server only if it is not there or is old
  const [cached] = useState(() => (isNew ? undefined : cachedProperty(id)));
  const [row, setRow] = useState<PropertyRow | null>(cached ?? null);
  const [f, setF] = useState<FormState | null>(isNew ? EMPTY : cached ? toForm(cached) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<FormTab>('details');
  const dirty = useRef(false);
  const uploaded = useRef<string[]>([]);
  const folder = useRef(`properties/${isNew ? `new-${Date.now()}-${shortId()}` : id}`);

  useEffect(() => {
    if (isNew || (cached && age('properties') < 60_000)) return;
    sb.from('properties').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) { if (!cached) { toast.err(error ?? 'Property not found'); go('properties'); } return; }
      const p = data as PropertyRow;
      setRow(p);
      if (!dirty.current) setF(toForm(p)); // never overwrite what the user is already typing
    });
  }, [id]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  if (!f) return <div class="a-page"><Skeleton rows={3} /></div>;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    dirty.current = true;
    setF((prev) => (prev ? { ...prev, [k]: v } : prev));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: '' } : prev));
  };

  const price = Math.round((parseFloat(f.priceAmount) || 0) * UNIT_VALUE[f.priceUnit]);
  const size = f.sizeAmount.trim() ? (/^[\d.]+$/.test(f.sizeAmount.trim()) ? `${f.sizeAmount.trim()} ${f.sizeUnit}` : f.sizeAmount.trim()) : '';

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 3) e.title = 'Please enter a title (e.g. "10 Marla Brand New House").';
    if (!price && f.showPrice) e.priceAmount = 'Please enter the price — or turn off "Show price on website".';
    if (!f.location.trim()) e.location = 'Please enter the sector, phase or block.';
    if (!size) e.sizeAmount = 'Please enter the size (e.g. 10).';
    if (!f.images.length) e.images = 'Please add at least one photo.';
    setErrors(e);
    const keys = Object.keys(e);
    if (keys.length) {
      setTab(TAB_OF[keys.find((k) => k !== 'images') ?? keys[0]] ?? 'details');
      toast.err('Some required details are missing — please check the fields marked in red.');
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const data = {
      title: f.title.trim(), purpose: f.purpose, type: f.type, price, show_price: f.showPrice, area: f.area, location: f.location.trim(), size,
      beds: f.type === 'plot' ? null : f.beds, baths: f.type === 'plot' ? null : f.baths,
      description: f.description.trim(), features: f.features, images: f.images, videos: f.videos,
      featured: f.featured, hot: f.hot, status: f.status,
    };
    const res = isNew
      ? await sb.from('properties').insert({ ...data, slug: `${slugify(`${data.title} ${areaName(data.area)}`)}-${shortId()}` })
      : await sb.from('properties').update(data).eq('id', id);
    setSaving(false);
    if (res.error) return toast.err(res.error);
    // The list shows the change at once (a new listing appears after a quick refresh)
    if (isNew) invalidate('properties');
    else mutate<PropertyRow[]>('properties', (list) => list?.map((x) => (x.id === id ? { ...x, ...data, updated_at: new Date().toISOString() } : x)) ?? []);
    afterWrite();
    // Also delete removed photos / uploaded videos from storage (in the background)
    if (row) {
      const gone = [...row.images.filter((u) => !f.images.includes(u)), ...(row.videos ?? []).filter((u) => !f.videos.includes(u) && isStoredMedia(u))];
      if (gone.length) removeImages(gone).catch(() => {});
    }
    dirty.current = false;
    toast.ok(SAVED_MSG);
    go('properties');
  };

  const cancel = async () => {
    if (dirty.current && !(await confirmDialog('Discard changes?', 'Your changes have not been saved.', 'Discard'))) return;
    const kept = [...(row?.images ?? []), ...(row?.videos ?? [])];
    const unused = uploaded.current.filter((u) => !kept.includes(u));
    if (unused.length) await removeImages(unused).catch(() => {});
    dirty.current = false;
    go('properties');
  };

  const detailErrors = ['title', 'priceAmount', 'location', 'sizeAmount'].some((k) => errors[k]);

  return (
    <div class="a-page a-page--form">
      <PageHead title={isNew ? 'New property' : 'Edit property'} icon="home" sub={isNew ? 'Fill in the details, add photos, then press Save' : f.title}>
        {!isNew && row?.status === 'available' && <a href={`${SITE_URL}/properties/${row.slug}/`} target="_blank" rel="noopener" class="a-btn a-btn--ghost"><Icon name="external" /> View on website</a>}
      </PageHead>

      <div class="a-tabs a-tabs--form" role="tablist" aria-label="Property sections">
        <button role="tab" aria-selected={tab === 'details'} class={tab === 'details' ? 'is-on' : ''} onClick={() => setTab('details')}>
          <Icon name="edit" size={16} /> Details {detailErrors && <i class="a-dot" aria-label="has errors" />}
        </button>
        <button role="tab" aria-selected={tab === 'photos'} class={tab === 'photos' ? 'is-on' : ''} onClick={() => setTab('photos')}>
          <Icon name="image" size={16} /> Photos <b>{f.images.length}</b> {errors.images && <i class="a-dot" aria-label="has errors" />}
        </button>
        <button role="tab" aria-selected={tab === 'videos'} class={tab === 'videos' ? 'is-on' : ''} onClick={() => setTab('videos')}>
          <Icon name="play" size={16} /> Videos <b>{f.videos.length}</b>
        </button>
      </div>

      {tab === 'photos' && (
        <section class="a-card a-tabpanel">
          <h2 class="a-card__title"><span><Icon name="image" size={16} /></span> Photos</h2>
          <PhotoUploader images={f.images} onChange={(v) => set('images', v)} folder={folder.current} onUploaded={(u) => uploaded.current.push(u)} />
          {errors.images && <p class="a-field__error">{errors.images}</p>}
        </section>
      )}

      {tab === 'videos' && (
        <section class="a-card a-tabpanel">
          <h2 class="a-card__title"><span><Icon name="play" size={16} /></span> Videos</h2>
          <p class="a-muted">Videos are shown as a "Video tour" on the property page. They are optional.</p>
          <VideoManager videos={f.videos} onChange={(v) => set('videos', v)} folder={folder.current} onUploaded={(u) => uploaded.current.push(u)} />
        </section>
      )}

      {tab === 'details' && (
        <div class="a-tabpanel a-stack">
          <section class="a-card">
            <h2 class="a-card__title"><span>1</span> Basic details</h2>
            <div class="a-form-grid">
              <Field label="Property title" hint='e.g. "10 Marla Brand New Double Storey House"' error={errors.title} full>
                <input value={f.title} maxLength={140} onInput={(e) => set('title', e.currentTarget.value)} placeholder="10 Marla Brand New House" />
              </Field>
              <Field label="For sale or rent?">
                <Segmented label="For sale or rent" value={f.purpose} onChange={(v) => set('purpose', v)} options={[{ value: 'sale', label: 'For Sale' }, { value: 'rent', label: 'For Rent' }]} />
              </Field>
              <Field label="Type">
                <Segmented label="Type" value={f.type} onChange={(v) => set('type', v)} options={[{ value: 'house', label: 'House' }, { value: 'flat', label: 'Flat' }, { value: 'plot', label: 'Plot' }]} />
              </Field>
            </div>
          </section>

          <section class="a-card">
            <h2 class="a-card__title"><span>2</span> Price</h2>
            <Toggle checked={f.showPrice} onChange={(v) => set('showPrice', v)} label="Show price on website" hint={f.showPrice ? 'Visitors see the price.' : 'Visitors see "Price on request" and contact you for the price.'} />
            <div class="a-form-grid">
              <Field label={`${f.purpose === 'rent' ? 'Monthly rent' : 'Demand (price)'}${f.showPrice ? '' : ' — optional, for your records'}`} error={errors.priceAmount}>
                <div class="a-combo">
                  <input type="number" inputMode="decimal" min="0" step="any" value={f.priceAmount} onInput={(e) => set('priceAmount', e.currentTarget.value)} placeholder={f.purpose === 'rent' ? '65' : '4.25'} />
                  <select value={f.priceUnit} onChange={(e) => set('priceUnit', e.currentTarget.value as Unit)}>
                    <option value="crore">Crore</option>
                    <option value="lakh">Lakh</option>
                    <option value="thousand">Thousand</option>
                    <option value="rupees">Rupees</option>
                  </select>
                </div>
              </Field>
              <div class={`a-preview${f.showPrice ? '' : ' is-hidden'}`}>
                <span class="a-muted a-small">Shown on the website as</span>
                <strong>{f.showPrice ? `PKR ${formatPrice(price)}${f.purpose === 'rent' ? ' /month' : ''}` : 'Price on request'}</strong>
              </div>
            </div>
          </section>

          <section class="a-card">
            <h2 class="a-card__title"><span>3</span> Location &amp; size</h2>
            <div class="a-form-grid">
              <Field label="Area / Society">
                <select value={f.area} onChange={(e) => set('area', e.currentTarget.value)}>
                  {AREA_OPTIONS.map((a) => <option value={a.slug}>{a.name}</option>)}
                  <option value="other">Other area</option>
                </select>
              </Field>
              <Field label="Sector / Phase / Block" hint='e.g. "Sector 4" or "Phase 5, Street 12"' error={errors.location}>
                <input value={f.location} maxLength={160} onInput={(e) => set('location', e.currentTarget.value)} placeholder="Sector 4, Airport Housing Society" />
              </Field>
              <Field label="Size" error={errors.sizeAmount}>
                <div class="a-combo">
                  <input inputMode="decimal" value={f.sizeAmount} onInput={(e) => set('sizeAmount', e.currentTarget.value)} placeholder="10" />
                  <select value={f.sizeUnit} onChange={(e) => set('sizeUnit', e.currentTarget.value as SizeUnit)}>
                    <option>Marla</option>
                    <option>Kanal</option>
                    <option>sq ft</option>
                    <option>sq yd</option>
                  </select>
                </div>
              </Field>
              {f.type !== 'plot' && (
                <>
                  <Field label="Bedrooms"><Stepper value={f.beds} onChange={(v) => set('beds', v)} /></Field>
                  <Field label="Bathrooms"><Stepper value={f.baths} onChange={(v) => set('baths', v)} /></Field>
                </>
              )}
            </div>
          </section>

          <section class="a-card">
            <h2 class="a-card__title"><span>4</span> Description &amp; features</h2>
            <Field label="Description" hint="2–4 lines about the property and its location." full>
              <textarea rows={5} maxLength={5000} value={f.description} onInput={(e) => set('description', e.currentTarget.value)} placeholder="Brand-new double storey house on a wide street, close to park, mosque and market…" />
            </Field>
            <Field label="Features" full>
              <Chips value={f.features} onChange={(v) => set('features', v)} suggestions={FEATURES[f.type]} />
            </Field>
          </section>

          <section class="a-card">
            <h2 class="a-card__title"><span>5</span> Visibility</h2>
            <Field label="Status">
              <Segmented label="Status" value={f.status} onChange={(v) => set('status', v)} options={[
                { value: 'available', label: 'Live' },
                { value: 'hidden', label: 'Hidden (draft)' },
                { value: 'sold', label: 'Sold' },
                { value: 'rented', label: 'Rented' },
              ]} />
            </Field>
            <div class="a-toggles">
              <Toggle checked={f.featured} onChange={(v) => set('featured', v)} label="Featured" hint="Show in 'Handpicked properties' on the home page" />
              <Toggle checked={f.hot} onChange={(v) => set('hot', v)} label="Hot deal" hint="Add a 'HOT' badge to the listing" />
            </div>
          </section>
        </div>
      )}

      <div class="a-savebar">
        {tab !== 'photos' && !f.images.length && <button class="a-btn a-btn--soft a-savebar__hint" onClick={() => setTab('photos')}><Icon name="image" size={16} /> Add photos</button>}
        <button class="a-btn a-btn--ghost" onClick={cancel} disabled={saving}>Cancel</button>
        <button class="a-btn a-btn--gold a-btn--lg" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Icon name="check" /> Save property</>}</button>
      </div>
    </div>
  );
}
