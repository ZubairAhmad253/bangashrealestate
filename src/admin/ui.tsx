/* Admin panel — small reusable UI components */
import { Component, h, type ComponentChildren, type FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/** A list row that redraws only when its own data changes.
    (Callback props are ignored on purpose — they always do the same thing.) */
export function memoRow<P extends object>(Row: FunctionComponent<P>, watch: (keyof P)[]) {
  return class MemoRow extends Component<P> {
    shouldComponentUpdate(next: P) {
      return watch.some((k) => next[k] !== this.props[k]);
    }
    render() {
      return h(Row as FunctionComponent<object>, this.props as object);
    }
  };
}

/** Long lists: the first rows appear at once, the rest right after the screen change has finished */
export function useProgressive<T>(list: T[], first = 20): T[] {
  const [all, setAll] = useState(false);
  const long = list.length > first;
  useEffect(() => {
    if (all || !long) return;
    const t = setTimeout(() => setAll(true), 380);
    return () => clearTimeout(t);
  }, [long]);
  return all || !long ? list : list.slice(0, first);
}
import { uploadImage, uploadVideo, youtubeId, tiktokId, isTikTok, normalizeTikTok, errorText, MAX_VIDEO_MB } from './lib';
import { useThumbs } from './queries';

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
  play: 'M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5z',
  'eye-off': 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  copy: 'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
};
const WA = 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 6.99 2.9 9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z';

const TIKTOK = 'M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  if (name === 'whatsapp' || name === 'tiktok') {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={name === 'whatsapp' ? WA : TIKTOK} /></svg>;
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
      <button type="button" onClick={() => onChange(Math.max(min, v - 1))} aria-label="Decrease">−</button>
      <input type="number" inputMode="numeric" value={value ?? ''} min={min} max={max} onInput={(e) => {
        const n = parseInt((e.target as HTMLInputElement).value, 10);
        onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null);
      }} />
      <button type="button" onClick={() => onChange(Math.min(max, v + 1))} aria-label="Increase">+</button>
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
            <button type="button" onClick={() => onChange(value.filter((x) => x !== c))} aria-label={`Remove ${c}`}><Icon name="x" size={14} /></button>
          </span>
        ))}
        <input
          value={text}
          placeholder={value.length ? 'Add another…' : 'Type a feature and press Enter'}
          onInput={(e) => setText((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); } }}
          onBlur={() => text && add(text)}
        />
      </div>
      {left.length > 0 && (
        <div class="a-chips__suggest">
          <span class="a-muted">Quick add:</span>
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
  const thumb = useThumbs();
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
    if (ok) toast.ok(`${ok} photo${ok > 1 ? 's' : ''} uploaded`);
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
            <img src={thumb(url)} alt="" width={480} height={360} loading={i < 6 ? 'eager' : 'lazy'} decoding="async" />
            {i === 0 && <span class="a-photo__cover">Cover photo</span>}
            <div class="a-photo__bar">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left"><Icon name="left" size={16} /></button>
              {i !== 0 && <button type="button" class="a-photo__make" onClick={() => move(i, -i)} aria-label="Make cover photo" title="Make cover photo"><Icon name="star" size={15} /></button>}
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move right"><Icon name="right" size={16} /></button>
              <button type="button" class="is-danger" onClick={() => onChange(images.filter((x) => x !== url))} aria-label="Remove photo"><Icon name="trash" size={16} /></button>
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
              <strong>Add photos</strong>
              <span>Tap to choose, or drag &amp; drop here</span>
            </>
          )}
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { const t = e.target as HTMLInputElement; if (t.files) void addFiles(t.files); t.value = ''; }} />
      <p class="a-field__hint">The first photo is the cover shown on the listing. Use ★ to make any photo the cover. Photos are resized automatically.</p>
    </div>
  );
}

/* ---------------- Videos ---------------- */
export function VideoManager({ videos, onChange, folder, onUploaded }: { videos: string[]; onChange: (v: string[]) => void; folder: string; onUploaded?: (url: string) => void }) {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(videos);
  latest.current = videos;

  // TikTok links (full or short vt./vm. share links). Old YouTube links still work too.
  const addLink = async () => {
    const raw = link.trim();
    if (!raw) return;
    let url: string | null = null;
    if (isTikTok(raw)) {
      setChecking(true);
      try { url = await normalizeTikTok(raw); } catch (e) { toast.err(e); }
      setChecking(false);
    } else if (youtubeId(raw)) {
      url = `https://www.youtube.com/watch?v=${youtubeId(raw)}`;
    } else {
      toast.err('Please paste a TikTok video link (tiktok.com/@…/video/… or a vt.tiktok.com share link).');
    }
    if (!url) return;
    if (!latest.current.includes(url)) onChange([...latest.current, url]);
    setLink('');
    toast.ok('Video added.');
  };
  const addFile = async (file: File) => {
    setBusy(true);
    try {
      const url = await uploadVideo(file, folder);
      onUploaded?.(url);
      latest.current = [...latest.current, url];
      onChange(latest.current);
      toast.ok('Video uploaded.');
    } catch (e) {
      toast.err(e);
    }
    setBusy(false);
  };

  return (
    <div class="a-videos">
      <div class="a-videos__add">
        <div class="a-videos__card">
          <span class="a-videos__icon a-videos__icon--tt"><Icon name="tiktok" size={20} /></span>
          <strong>Add a TikTok link</strong>
          <span class="a-muted a-small">In TikTok tap Share → Copy link, then paste it here. Free and no size limit.</span>
          <div class="a-row">
            <input value={link} placeholder="https://www.tiktok.com/@…/video/…" onInput={(e) => setLink(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addLink(); } }} />
            <button type="button" class="a-btn a-btn--soft" onClick={() => void addLink()} disabled={checking}>{checking ? 'Checking…' : 'Add'}</button>
          </div>
        </div>
        <div class="a-videos__card">
          <span class="a-videos__icon"><Icon name="upload" size={20} /></span>
          <strong>Upload a short video</strong>
          <span class="a-muted a-small">MP4, MOV or WebM up to {MAX_VIDEO_MB} MB — e.g. a quick walkthrough from your phone.</span>
          <button type="button" class="a-btn a-btn--ghost" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <><span class="a-spinner" /> Uploading… please wait</> : <><Icon name="upload" size={16} /> Choose video</>}
          </button>
          <input ref={input} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => { const t = e.target as HTMLInputElement; const f = t.files?.[0]; if (f) void addFile(f); t.value = ''; }} />
        </div>
      </div>

      {videos.length > 0 && (
        <div class="a-videos__list">
          {videos.map((url, i) => {
            const yt = youtubeId(url);
            const tt = tiktokId(url);
            return (
              <figure class={`a-video${tt ? ' a-video--tt' : ''}`} key={url}>
                {tt ? <span class="a-video__tt"><Icon name="tiktok" size={34} /></span>
                  : yt ? <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" loading="lazy" />
                  : <video src={url} preload="metadata" muted playsInline />}
                <span class="a-video__badge">{tt ? 'TikTok' : yt ? 'YouTube' : 'Uploaded'}</span>
                <span class="a-video__play"><Icon name="play" size={22} /></span>
                <div class="a-photo__bar">
                  <span class="a-video__num">Video {i + 1}</span>
                  <a href={url} target="_blank" rel="noopener" aria-label="Open video"><Icon name="external" size={16} /></a>
                  <button type="button" class="is-danger" onClick={() => onChange(videos.filter((x) => x !== url))} aria-label="Remove video"><Icon name="trash" size={16} /></button>
                </div>
              </figure>
            );
          })}
        </div>
      )}
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

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div class="a-skeleton" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, () => (
        <div class="a-skeleton__row">
          <span class="a-skeleton__thumb" />
          <span class="a-skeleton__lines"><i /><i /><i /></span>
        </div>
      ))}
    </div>
  );
}

export function Loading() {
  return <div class="a-loading"><span class="a-spinner" /> Loading…</div>;
}

export function PageHead({ title, sub, icon, children }: { title: string; sub?: string; icon?: string; children?: ComponentChildren }) {
  return (
    <header class="a-pagehead">
      <div class="a-pagehead__title">
        {icon && <span class="a-pagehead__icon"><Icon name={icon} size={22} /></span>}
        <div>
          <h1>{title}</h1>
          {sub && <p class="a-muted">{sub}</p>}
        </div>
      </div>
      {children && <div class="a-row">{children}</div>}
    </header>
  );
}
