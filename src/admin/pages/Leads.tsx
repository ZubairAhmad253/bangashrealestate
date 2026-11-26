import { useMemo, useState } from 'preact/hooks';
import { sb, timeAgo, waDigits, type LeadRow } from '../lib';
import { Icon, FilterTabs, Empty, Skeleton, PageHead, toast, confirmDialog, memoRow, useProgressive } from '../ui';
import { useLeads } from '../queries';
import type { Ctx } from '../App';

const STATUS_LABEL: Record<LeadRow['status'], string> = { new: 'New', contacted: 'Contacted', closed: 'Closed', spam: 'Spam' };
const waText = (l: LeadRow) =>
  encodeURIComponent(`Hello ${l.name}, this is Bangash Real Estate & Builders. Thank you for your enquiry on our website${l.interest ? ` about "${l.interest}"` : ''}. How can we help you?`);

export function Leads({ ctx }: { ctx: Ctx }) {
  const query = useLeads();
  const rows = query.data ?? (query.error ? [] : null);
  const [tab, setTab] = useState<'new' | 'contacted' | 'closed' | 'all' | 'spam'>('new');
  const [open, setOpen] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const update = async (l: LeadRow, patch: Partial<LeadRow>, msg?: string) => {
    query.mutate((r) => r?.map((x) => (x.id === l.id ? { ...x, ...patch } : x)) ?? []);
    const { error } = await sb.from('leads').update(patch).eq('id', l.id);
    if (error) { toast.err(error); void query.reload().catch(() => {}); return; }
    if (msg) toast.ok(msg);
    ctx.refreshCounts(true); // updates the new-lead badge and the bell
  };
  const remove = async (l: LeadRow) => {
    if (!(await confirmDialog(`Delete the enquiry from ${l.name}?`))) return;
    const { error } = await sb.from('leads').delete().eq('id', l.id);
    if (error) return toast.err(error);
    query.mutate((r) => r?.filter((x) => x.id !== l.id) ?? []);
    ctx.refreshCounts(true);
    toast.ok('Lead deleted.');
  };
  // Keeps the list on screen while it refreshes
  const refresh = async () => {
    setRefreshing(true);
    await query.reload().catch(() => {});
    ctx.refreshCounts(true);
    setRefreshing(false);
  };

  const counts = useMemo(() => {
    const c = { new: 0, contacted: 0, closed: 0, spam: 0, all: 0 };
    rows?.forEach((r) => { c[r.status]++; if (r.status !== 'spam') c.all++; });
    return c;
  }, [rows]);
  const shown = useMemo(() => (rows ?? []).filter((r) => (tab === 'all' ? r.status !== 'spam' : r.status === tab)), [rows, tab]);
  // Up to 500 enquiries: the first 20 appear at once, the rest right after the screen has opened
  const visible = useProgressive(shown, 20);
  const toggle = (id: string) => setOpen((cur) => (cur === id ? null : id));

  return (
    <div class="a-page">
      <PageHead title="Leads" icon="leads" sub="Enquiries from the website — reply quickly to close more deals">
        <button class={`a-btn a-btn--ghost${refreshing ? ' is-busy' : ''}`} onClick={refresh} disabled={refreshing}><Icon name="refresh" /> {refreshing ? 'Refreshing…' : 'Refresh'}</button>
      </PageHead>

      <FilterTabs label="Filter enquiries" value={tab} onChange={setTab} options={[
        { value: 'new', label: 'New', count: counts.new },
        { value: 'contacted', label: 'Contacted', count: counts.contacted },
        { value: 'closed', label: 'Closed', count: counts.closed },
        { value: 'all', label: 'All', count: counts.all },
        { value: 'spam', label: 'Spam', count: counts.spam },
      ]} />

      {rows === null ? <Skeleton rows={3} /> : shown.length === 0 ? (
        <Empty icon="leads" title={tab === 'new' ? 'No new enquiries 🎉' : 'Nothing in this list'} text="Every enquiry from the website contact form appears here." />
      ) : (
        <div class="a-leads">
          {visible.map((l) => (
            <LeadItem key={l.id} l={l} isOpen={open === l.id} isSuper={ctx.me.role === 'super_admin'} onToggle={toggle} onUpdate={update} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

/* One enquiry — redraws only when this enquiry changes or is opened/closed */
interface LeadProps { l: LeadRow; isOpen: boolean; isSuper: boolean; onToggle: (id: string) => void; onUpdate: (l: LeadRow, patch: Partial<LeadRow>, msg?: string) => void; onRemove: (l: LeadRow) => void }
const LeadItem = memoRow<LeadProps>(({ l, isOpen, isSuper, onToggle, onUpdate, onRemove }) => (
    <article class={`a-lead${l.status === 'new' ? ' is-new' : ''}`}>
      <button class="a-lead__head" onClick={() => onToggle(l.id)} aria-expanded={isOpen}>
        <span class="a-me__avatar">{l.name.charAt(0).toUpperCase()}</span>
        <span class="a-lead__who">
          <strong>{l.name}</strong>
          <small class="a-muted">{l.interest || 'Enquiry'}{l.area ? ` · ${l.area}` : ''} · {timeAgo(l.created_at)}</small>
        </span>
        <span class={`a-pill a-pill--${l.status}`}>{STATUS_LABEL[l.status]}</span>
      </button>

      <div class="a-lead__actions">
        <a class="a-btn a-btn--wa a-btn--sm" href={`https://wa.me/${waDigits(l.phone)}?text=${waText(l)}`} target="_blank" rel="noopener" onClick={() => l.status === 'new' && onUpdate(l, { status: 'contacted' })}><Icon name="whatsapp" /> WhatsApp</a>
        <a class="a-btn a-btn--ghost a-btn--sm" href={`tel:${l.phone}`} onClick={() => l.status === 'new' && onUpdate(l, { status: 'contacted' })}><Icon name="phone" /> {l.phone}</a>
        {l.email && <a class="a-btn a-btn--ghost a-btn--sm" href={`mailto:${l.email}`}><Icon name="mail" /> Email</a>}
      </div>

      {isOpen && (
        <div class="a-lead__body">
          <dl class="a-dl">
            {l.budget && <><dt>Budget</dt><dd>{l.budget}</dd></>}
            {l.email && <><dt>Email</dt><dd>{l.email}</dd></>}
            <dt>Source</dt><dd>{l.source === 'whatsapp' ? 'Website → WhatsApp' : 'Website form'}</dd>
            <dt>Date</dt><dd>{new Date(l.created_at).toLocaleString('en-PK')}</dd>
          </dl>
          {l.message && <blockquote class="a-quote">{l.message}</blockquote>}
          <label class="a-field">
            <span class="a-field__label">Notes (admins only)</span>
            <textarea rows={2} defaultValue={l.notes} placeholder="e.g. Site visit tomorrow at 5 pm, budget up to 1.5 crore" onBlur={(e) => e.currentTarget.value !== l.notes && onUpdate(l, { notes: e.currentTarget.value }, 'Note saved.')} />
          </label>
          <div class="a-row a-row--wrap">
            <span class="a-muted a-small">Status:</span>
            {(['new', 'contacted', 'closed', 'spam'] as const).map((s) => (
              <button class={`a-tag${l.status === s ? ' is-on' : ''}`} onClick={() => onUpdate(l, { status: s }, `Status: ${STATUS_LABEL[s]}`)}>{STATUS_LABEL[s]}</button>
            ))}
            {isSuper && <button class="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" style={{ marginLeft: 'auto' }} onClick={() => onRemove(l)}><Icon name="trash" size={16} /> Delete</button>}
          </div>
        </div>
      )}
    </article>
), ['l', 'isOpen', 'isSuper']);
