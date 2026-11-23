import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sb, formatPrice, slugify, shortId, removeImages, type PropertyRow } from '../lib';
import { Icon, Field, Segmented, Toggle, Stepper, Chips, PhotoUploader, Empty, Loading, PageHead, toast, confirmDialog } from '../ui';
import { go, type Ctx } from '../App';
import { AREA_OPTIONS, areaName, SITE_URL } from '../meta';

const STATUS: Record<PropertyRow['status'], { label: string; cls: string }> = {
  available: { label: 'Live', cls: 'a-pill--live' },
  hidden: { label: 'Hidden (draft)', cls: 'a-pill--muted' },
  sold: { label: 'Sold', cls: 'a-pill--sold' },
  rented: { label: 'Rented', cls: 'a-pill--sold' },
};
const TYPE_LABEL = { house: 'House', flat: 'Flat', plot: 'Plot' } as const;

const SAVED_MSG = 'Saved ✓ The website will update in 1–2 minutes.';

/* ==================== LIST ==================== */
export function PropertiesList({ ctx: _ctx }: { ctx: Ctx }) {
  const [rows, setRows] = useState<PropertyRow[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'hidden' | 'done'>('all');

  const load = () =>
    sb.from('properties').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) toast.err(error);
      setRows((data as PropertyRow[]) ?? []);
    });
  useEffect(() => { void load(); }, []);

  const update = async (p: PropertyRow, patch: Partial<PropertyRow>, msg = SAVED_MSG) => {
    setRows((r) => r?.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) ?? r);
    const { error } = await sb.from('properties').update(patch).eq('id', p.id);
    if (error) { toast.err(error); void load(); } else toast.ok(msg);
  };
  const remove = async (p: PropertyRow) => {
    if (!(await confirmDialog(`Delete "${p.title}"?`, 'The property and all its photos will be removed permanently. If it has only been sold, setting the status to "Sold" is better.'))) return;
    const { error } = await sb.from('properties').delete().eq('id', p.id);
    if (error) return toast.err(error);
    await removeImages(p.images).catch(() => {});
    setRows((r) => r?.filter((x) => x.id !== p.id) ?? r);
    toast.ok('Property deleted.');
  };

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (rows ?? []).filter((p) => {
      if (filter === 'available' && p.status !== 'available') return false;
      if (filter === 'hidden' && p.status !== 'hidden') return false;
      if (filter === 'done' && !['sold', 'rented'].includes(p.status)) return false;
      return !term || `${p.title} ${p.location} ${areaName(p.area)}`.toLowerCase().includes(term);
    });
  }, [rows, q, filter]);

  return (
    <div class="a-page">
      <PageHead title="Properties" icon="home" sub="Houses, flats and plots for sale or rent">
        <a href="#/properties/new" class="a-btn a-btn--gold"><Icon name="plus" /> Add property</a>
      </PageHead>

      <div class="a-toolbar">
        <div class="a-search">
          <Icon name="search" />
          <input type="search" placeholder="Search by title, area or sector…" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
        </div>
        <Segmented value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'All' },
          { value: 'available', label: 'Live' },
          { value: 'hidden', label: 'Hidden' },
          { value: 'done', label: 'Sold/Rented' },
        ]} />
      </div>

      {rows === null ? <Loading /> : shown.length === 0 ? (
        rows.length === 0 ? (
          <Empty icon="home" title="No properties yet" text="Add your first property — your real listings will replace the sample listings on the website.">
            <a href="#/properties/new" class="a-btn a-btn--gold"><Icon name="plus" /> Add your first property</a>
          </Empty>
        ) : <Empty icon="search" title="Nothing found" text="Try a different search or filter." />
      ) : (
        <div class="a-items">
          {shown.map((p) => (
            <article class="a-item" key={p.id}>
              <a href={`#/properties/${p.id}`} class="a-item__thumb">
                {p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <span><Icon name="image" size={28} /></span>}
                <span class={`a-pill ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
              </a>
              <div class="a-item__body">
                <a href={`#/properties/${p.id}`} class="a-item__title">{p.title}</a>
                <p class="a-item__price">PKR {formatPrice(p.price)}{p.purpose === 'rent' && <small> /month</small>}</p>
                <p class="a-muted a-small"><Icon name="pin" size={14} /> {p.location}{p.area ? `, ${areaName(p.area)}` : ''} · {TYPE_LABEL[p.type]} · {p.purpose === 'sale' ? 'For Sale' : 'For Rent'}</p>
                <div class="a-item__actions">
                  <button class={`a-tag${p.featured ? ' is-on' : ''}`} onClick={() => update(p, { featured: !p.featured })} title="Show on the home page"><Icon name="star" size={14} /> Featured</button>
                  <button class={`a-tag a-tag--hot${p.hot ? ' is-on' : ''}`} onClick={() => update(p, { hot: !p.hot })}><Icon name="fire" size={14} /> Hot</button>
                  <select class="a-select-sm" value={p.status} onChange={(e) => update(p, { status: e.currentTarget.value as PropertyRow['status'] })} aria-label="Status">
                    <option value="available">● Live</option>
                    <option value="hidden">○ Hidden</option>
                    <option value="sold">✓ Sold</option>
                    <option value="rented">✓ Rented</option>
                  </select>
                </div>
              </div>
              <div class="a-item__side">
                <a href={`#/properties/${p.id}`} class="a-btn a-btn--ghost a-btn--sm"><Icon name="edit" size={16} /> Edit</a>
                {p.status === 'available' && <a href={`${SITE_URL}/properties/${p.slug}/`} target="_blank" rel="noopener" class="a-btn a-btn--ghost a-btn--sm"><Icon name="external" size={16} /> View</a>}
                <button class="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" onClick={() => remove(p)}><Icon name="trash" size={16} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

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
  priceAmount: string; priceUnit: Unit; area: string; location: string;
  sizeAmount: string; sizeUnit: SizeUnit; beds: number | null; baths: number | null;
  description: string; features: string[]; images: string[];
  featured: boolean; hot: boolean; status: PropertyRow['status'];
}
const EMPTY: FormState = {
  title: '', purpose: 'sale', type: 'house', priceAmount: '', priceUnit: 'crore', area: AREA_OPTIONS[0].slug, location: '',
  sizeAmount: '', sizeUnit: 'Marla', beds: 3, baths: 3, description: '', features: [], images: [],
  featured: false, hot: false, status: 'available',
};

export function PropertyForm({ id, ctx: _ctx }: { id: string; ctx: Ctx }) {
  const isNew = id === 'new';
  const [row, setRow] = useState<PropertyRow | null>(null);
  const [f, setF] = useState<FormState | null>(isNew ? EMPTY : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  const uploaded = useRef<string[]>([]);
  const folder = useRef(`properties/${isNew ? `new-${Date.now()}-${shortId()}` : id}`);

  useEffect(() => {
    if (isNew) return;
    sb.from('properties').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) { toast.err(error ?? 'Property not found'); go('properties'); return; }
      const p = data as PropertyRow;
      const pr = splitPrice(Number(p.price));
      const sz = splitSize(p.size);
      setRow(p);
      setF({
        title: p.title, purpose: p.purpose, type: p.type, priceAmount: pr.amount, priceUnit: pr.unit, area: p.area, location: p.location,
        sizeAmount: sz.amount, sizeUnit: sz.unit, beds: p.beds, baths: p.baths, description: p.description, features: p.features ?? [],
        images: p.images ?? [], featured: p.featured, hot: p.hot, status: p.status,
      });
    });
  }, [id]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  if (!f) return <div class="a-page"><Loading /></div>;
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
    if (!price) e.priceAmount = 'Please enter the price.';
    if (!f.location.trim()) e.location = 'Please enter the sector, phase or block.';
    if (!size) e.sizeAmount = 'Please enter the size (e.g. 10).';
    if (!f.images.length) e.images = 'Please add at least one photo.';
    setErrors(e);
    if (Object.keys(e).length) { toast.err('Some required details are missing — please check the fields marked in red.'); return false; }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const data = {
      title: f.title.trim(), purpose: f.purpose, type: f.type, price, area: f.area, location: f.location.trim(), size,
      beds: f.type === 'plot' ? null : f.beds, baths: f.type === 'plot' ? null : f.baths,
      description: f.description.trim(), features: f.features, images: f.images, featured: f.featured, hot: f.hot, status: f.status,
    };
    const res = isNew
      ? await sb.from('properties').insert({ ...data, slug: `${slugify(`${data.title} ${areaName(data.area)}`)}-${shortId()}` })
      : await sb.from('properties').update(data).eq('id', id);
    setSaving(false);
    if (res.error) return toast.err(res.error);
    // Also delete removed photos from storage
    if (row) await removeImages(row.images.filter((u) => !f.images.includes(u))).catch(() => {});
    dirty.current = false;
    toast.ok(SAVED_MSG);
    go('properties');
  };

  const cancel = async () => {
    if (dirty.current && !(await confirmDialog('Discard changes?', 'Your changes have not been saved.', 'Discard'))) return;
    const unused = uploaded.current.filter((u) => !(row?.images ?? []).includes(u));
    if (unused.length) await removeImages(unused).catch(() => {});
    dirty.current = false;
    go('properties');
  };

  return (
    <div class="a-page a-page--form">
      <PageHead title={isNew ? 'New property' : 'Edit property'} icon="home" sub={isNew ? 'Fill in the details below and press Save' : f.title}>
        {!isNew && row?.status === 'available' && <a href={`${SITE_URL}/properties/${row.slug}/`} target="_blank" rel="noopener" class="a-btn a-btn--ghost"><Icon name="external" /> View on website</a>}
      </PageHead>

      <section class="a-card">
        <h2 class="a-card__title"><span>1</span> Photos</h2>
        <PhotoUploader images={f.images} onChange={(v) => set('images', v)} folder={folder.current} onUploaded={(u) => uploaded.current.push(u)} />
        {errors.images && <p class="a-field__error">{errors.images}</p>}
      </section>

      <section class="a-card">
        <h2 class="a-card__title"><span>2</span> Basic details</h2>
        <div class="a-form-grid">
          <Field label="Property title" hint='e.g. "10 Marla Brand New Double Storey House"' error={errors.title} full>
            <input value={f.title} maxLength={140} onInput={(e) => set('title', e.currentTarget.value)} placeholder="10 Marla Brand New House" />
          </Field>
          <Field label="For sale or rent?">
            <Segmented value={f.purpose} onChange={(v) => set('purpose', v)} options={[{ value: 'sale', label: 'For Sale' }, { value: 'rent', label: 'For Rent' }]} />
          </Field>
          <Field label="Type">
            <Segmented value={f.type} onChange={(v) => set('type', v)} options={[{ value: 'house', label: 'House' }, { value: 'flat', label: 'Flat' }, { value: 'plot', label: 'Plot' }]} />
          </Field>
        </div>
      </section>

      <section class="a-card">
        <h2 class="a-card__title"><span>3</span> Price</h2>
        <div class="a-form-grid">
          <Field label={f.purpose === 'rent' ? 'Monthly rent' : 'Demand (price)'} error={errors.priceAmount}>
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
          <div class="a-preview">
            <span class="a-muted a-small">Shown on the website as</span>
            <strong>PKR {formatPrice(price)}{f.purpose === 'rent' ? ' /month' : ''}</strong>
          </div>
        </div>
      </section>

      <section class="a-card">
        <h2 class="a-card__title"><span>4</span> Location &amp; size</h2>
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
        <h2 class="a-card__title"><span>5</span> Description &amp; features</h2>
        <Field label="Description" hint="2–4 lines about the property and its location." full>
          <textarea rows={5} maxLength={5000} value={f.description} onInput={(e) => set('description', e.currentTarget.value)} placeholder="Brand-new double storey house on a wide street, close to park, mosque and market…" />
        </Field>
        <Field label="Features" full>
          <Chips value={f.features} onChange={(v) => set('features', v)} suggestions={FEATURES[f.type]} />
        </Field>
      </section>

      <section class="a-card">
        <h2 class="a-card__title"><span>6</span> Visibility</h2>
        <Field label="Status">
          <Segmented value={f.status} onChange={(v) => set('status', v)} options={[
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

      <div class="a-savebar">
        <button class="a-btn a-btn--ghost" onClick={cancel} disabled={saving}>Cancel</button>
        <button class="a-btn a-btn--gold a-btn--lg" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Icon name="check" /> Save property</>}</button>
      </div>
    </div>
  );
}
