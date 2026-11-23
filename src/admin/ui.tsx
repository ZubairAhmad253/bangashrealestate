/* Admin panel — chhote reusable UI components */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { uploadImage, errorText } from './lib';

/* ---------------- Icons ---------------- */
const PATHS: Record<string, string> = {
  dashboard: 'M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z',
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9.5 21v-6h5v6',
  leads: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  hammer: 'M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1zM10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5M4 15v-3a6 6 0 0 1 6-6M14 6a6 6 0 0 1 6 6v3',
  star: 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  plus: 'M12 5v14M5 12h14',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.35-4.35',
  image: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm18 2-10 7L2 6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  fire: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
};
const WA = 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 6.99 2.9 9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z';

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  if (name === 'whatsapp') {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={WA} /></svg>;
  }
  const filled = name === 'star';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? ''} />
    </svg>
  );
}

/* ---------------- Toasts ---------------- */
type ToastItem = { id: number; text: string; kind: 'ok' | 'err' | 'info' };
let pushToast: (t: Omit<ToastItem, 'id'>) => void = () => {};
export const toast = {
  ok: (text: string) => pushToast({ text, kind: 'ok' }),
  err: (e: unknown) => pushToast({ text: typeof e === 'string' ? e : errorText(e), kind: 'err' }),
  info: (text: string) => pushToast({ text, kind: 'info' }),
};
export function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      const id = Date.now() + Math.random();
      setItems((x) => [...x, { ...t, id }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), t.kind === 'err' ? 7000 : 4500);
    };
  }, []);
  return (
    <div class="a-toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} class={`a-toast a-toast--${t.kind}`}>
          <Icon name={t.kind === 'err' ? 'info' : 'check'} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Confirm dialog ---------------- */
let openConfirm: (o: { title: string; text?: string; ok?: string; danger?: boolean; resolve: (v: boolean) => void }) => void = () => {};
export const confirmDialog = (title: string, text?: string, ok = 'Yes, delete', danger = true) =>
  new Promise<boolean>((resolve) => openConfirm({ title, text, ok, danger, resolve }));
export function ConfirmHost() {
  const [state, setState] = useState<Parameters<typeof openConfirm>[0] | null>(null);
  useEffect(() => { openConfirm = setState; }, []);
  if (!state) return null;
  const close = (v: boolean) => { state.resolve(v); setState(null); };
  return (
    <div class="a-modal" onClick={(e) => e.target === e.currentTarget && close(false)}>
      <div class="a-modal__box a-modal__box--sm" role="alertdialog" aria-modal="true">
        <h3>{state.title}</h3>
        {state.text && <p class="a-muted">{state.text}</p>}
        <div class="a-row a-row--end" style={{ marginTop: '20px' }}>
          <button class="a-btn a-btn--ghost" onClick={() => close(false)}>Cancel</button>
          <button class={`a-btn ${state.danger ? 'a-btn--danger' : 'a-btn--primary'}`} onClick={() => close(true)} autoFocus>{state.ok}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Form bits ---------------- */
export function Field({ label, hint, error, children, full }: { label: string; hint?: string; error?: string; children: ComponentChildren; full?: boolean }) {
  return (
    <label class={`a-field${full ? ' a-field--full' : ''}${error ? ' has-error' : ''}`}>
      <span class="a-field__label">{label}</span>
      {children}
      {error ? <span class="a-field__error">{error}</span> : hint ? <span class="a-field__hint">{hint}</span> : null}
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; icon?: string }[]; onChange: (v: T) => void }) {
  return (
    <div class="a-seg" role="radiogroup">
      {options.map((o) => (
        <button type="button" role="radio" aria-checked={value === o.value} class={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={16} />} {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label class="a-toggle">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

export function Stepper({ value, onChange, min = 0, max = 20 }: { value: number | null; onChange: (v: number | null) => void; min?: number; max?: number }) {
  const v = value ?? 0;
  return (
    <div class="a-stepper">
      <button type="button" onClick={() => onChange(Math.max(min, v - 1))} aria-label="Kam karein">−</button>
      <input type="number" inputMode="numeric" value={value ?? ''} min={min} max={max} onInput={(e) => {
        const n = parseInt((e.target as HTMLInputElement).value, 10);
        onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null);
      }} />
      <button type="button" onClick={() => onChange(Math.min(max, v + 1))} aria-label="Zyada karein">+</button>
    </div>
  );
}

export function Chips({ value, onChange, suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; suggestions?: string[] }) {
  const [text, setText] = useState('');
  const add = (t: string) => {
    const s = t.trim();
    if (s && !value.includes(s)) onChange([...value, s]);
    setText('');
  };
  const left = suggestions.filter((s) => !value.includes(s));
  return (
    <div class="a-chips">
      <div class="a-chips__list">
        {value.map((c) => (
          <span class="a-chip is-on">
            {c}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== c))} aria-label={`${c} hatayein`}><Icon name="x" size={14} /></button>
          </span>
        ))}
        <input
          value={text}
          placeholder={value.length ? 'Aur likhein…' : 'Feature likh kar Enter dabayein'}
          onInput={(e) => setText((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); } }}
          onBlur={() => text && add(text)}
        />
      </div>
      {left.length > 0 && (
        <div class="a-chips__suggest">
          <span class="a-muted">Jaldi add karein:</span>
          {left.map((s) => <button type="button" class="a-chip" onClick={() => add(s)}>+ {s}</button>)}
        </div>
      )}
    </div>
  );
}

/* ---------------- Photo uploader ---------------- */
export function PhotoUploader({ images, onChange, folder, onUploaded }: { images: string[]; onChange: (v: string[]) => void; folder: string; onUploaded?: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [drag, setDrag] = useState(false);
  const latest = useRef(images);
  latest.current = images;

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => /^image\//.test(f.type));
    if (!list.length) return;
    setBusy({ done: 0, total: list.length });
    let ok = 0;
    for (const f of list) {
      try {
        const url = await uploadImage(f, folder);
        onUploaded?.(url);
        latest.current = [...latest.current, url];
        onChange(latest.current);
        ok++;
      } catch (e) {
        toast.err(e);
      }
      setBusy((b) => (b ? { ...b, done: b.done + 1 } : b));
    }
    setBusy(null);
    if (ok) toast.ok(`${ok} photo${ok > 1 ? 's' : ''} upload ho gayi`);
  };
  const move = (i: number, d: number) => {
    const next = [...images];
    const [x] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + d)), 0, x);
    onChange(next);
  };

  return (
    <div
      class={`a-photos${drag ? ' is-drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer?.files) void addFiles(e.dataTransfer.files); }}
    >
      <div class="a-photos__grid">
        {images.map((url, i) => (
          <figure class="a-photo" key={url}>
            <img src={url} alt="" loading="lazy" />
            {i === 0 && <span class="a-photo__cover">Cover photo</span>}
            <div class="a-photo__bar">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Pehle"><Icon name="left" size={16} /></button>
              {i !== 0 && <button type="button" class="a-photo__make" onClick={() => move(i, -i)} aria-label="Cover photo banayein" title="Cover photo banayein"><Icon name="star" size={15} /></button>}
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Baad mein"><Icon name="right" size={16} /></button>
              <button type="button" class="is-danger" onClick={() => onChange(images.filter((x) => x !== url))} aria-label="Photo hatayein"><Icon name="trash" size={16} /></button>
            </div>
          </figure>
        ))}
        <button type="button" class="a-photos__add" onClick={() => input.current?.click()} disabled={!!busy}>
          {busy ? (
            <>
              <span class="a-spinner" />
              <span>Uploading {busy.done}/{busy.total}…</span>
            </>
          ) : (
            <>
              <Icon name="upload" size={28} />
              <strong>Photos add karein</strong>
              <span>Tap karein ya yahan drag karein</span>
            </>
          )}
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { const t = e.target as HTMLInputElement; if (t.files) void addFiles(t.files); t.value = ''; }} />
      <p class="a-field__hint">Pehli photo "cover" hoti hai (listing par yahi dikhti hai). Photos khud chhoti ho kar upload hoti hain.</p>
    </div>
  );
}

/* ---------------- Misc ---------------- */
export function Empty({ icon, title, text, children }: { icon: string; title: string; text?: string; children?: ComponentChildren }) {
  return (
    <div class="a-empty">
      <span class="a-empty__icon"><Icon name={icon} size={30} /></span>
      <h3>{title}</h3>
      {text && <p class="a-muted">{text}</p>}
      {children}
    </div>
  );
}

export function Loading() {
  return <div class="a-loading"><span class="a-spinner" /> Loading…</div>;
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ComponentChildren }) {
  return (
    <header class="a-pagehead">
      <div>
        <h1>{title}</h1>
        {sub && <p class="a-muted">{sub}</p>}
      </div>
      {children && <div class="a-row">{children}</div>}
    </header>
  );
}
