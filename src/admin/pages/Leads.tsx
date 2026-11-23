import { useEffect, useMemo, useState } from 'preact/hooks';
import { sb, timeAgo, waDigits, type LeadRow } from '../lib';
import { Icon, Segmented, Empty, Skeleton, PageHead, toast, confirmDialog } from '../ui';
import type { Ctx } from '../App';

const STATUS_LABEL: Record<LeadRow['status'], string> = { new: 'New', contacted: 'Contacted', closed: 'Closed', spam: 'Spam' };

export function Leads({ ctx }: { ctx: Ctx }) {
  const [rows, setRows] = useState<LeadRow[] | null>(null);
  const [tab, setTab] = useState<'new' | 'contacted' | 'closed' | 'all' | 'spam'>('new');
  const [open, setOpen] = useState<string | null>(null);

  const load = () =>
    sb.from('leads').select('*').order('created_at', { ascending: false }).limit(500).then(({ data, error }) => {
      if (error) toast.err(error);
      setRows((data as LeadRow[]) ?? []);
    });
  useEffect(() => { void load(); }, []);

  const update = async (l: LeadRow, patch: Partial<LeadRow>, msg?: string) => {
    setRows((r) => r?.map((x) => (x.id === l.id ? { ...x, ...patch } : x)) ?? r);
    const { error } = await sb.from('leads').update(patch).eq('id', l.id);
    if (error) { toast.err(error); void load(); return; }
    if (msg) toast.ok(msg);
    ctx.refreshCounts();
  };
  const remove = async (l: LeadRow) => {
    if (!(await confirmDialog(`Delete the enquiry from ${l.name}?`))) return;
    const { error } = await sb.from('leads').delete().eq('id', l.id);
    if (error) return toast.err(error);
    setRows((r) => r?.filter((x) => x.id !== l.id) ?? r);
    ctx.refreshCounts();
    toast.ok('Lead deleted.');
  };

  const counts = useMemo(() => {
    const c = { new: 0, contacted: 0, closed: 0, spam: 0, all: 0 };
    rows?.forEach((r) => { c[r.status]++; if (r.status !== 'spam') c.all++; });
    return c;
  }, [rows]);
  const shown = (rows ?? []).filter((r) => (tab === 'all' ? r.status !== 'spam' : r.status === tab));

  const waText = (l: LeadRow) =>
    encodeURIComponent(`Hello ${l.name}, this is Bangash Real Estate & Builders. Thank you for your enquiry on our website${l.interest ? ` about "${l.interest}"` : ''}. How can we help you?`);

  return (
    <div class="a-page">
      <PageHead title="Leads" icon="leads" sub="Enquiries from the website — reply quickly to close more deals">
        <button class="a-btn a-btn--ghost" onClick={() => { setRows(null); void load(); ctx.refreshCounts(); }}><Icon name="refresh" /> Refresh</button>
      </PageHead>

      <div class="a-toolbar">
        <Segmented value={tab} onChange={setTab} options={[
          { value: 'new', label: `New (${counts.new})` },
          { value: 'contacted', label: `Contacted (${counts.contacted})` },
          { value: 'closed', label: `Closed (${counts.closed})` },
          { value: 'all', label: 'All' },
          { value: 'spam', label: 'Spam' },
        ]} />
      </div>

      {rows === null ? <Skeleton rows={3} /> : shown.length === 0 ? (
        <Empty icon="leads" title={tab === 'new' ? 'No new enquiries 🎉' : 'Nothing in this list'} text="Every enquiry from the website contact form appears here." />
      ) : (
        <div class="a-leads">
          {shown.map((l) => {
            const isOpen = open === l.id;
            return (
              <article class={`a-lead${l.status === 'new' ? ' is-new' : ''}`} key={l.id}>
                <button class="a-lead__head" onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={isOpen}>
                  <span class="a-me__avatar">{l.name.charAt(0).toUpperCase()}</span>
                  <span class="a-lead__who">
                    <strong>{l.name}</strong>
                    <small class="a-muted">{l.interest || 'Enquiry'}{l.area ? ` · ${l.area}` : ''} · {timeAgo(l.created_at)}</small>
                  </span>
                  <span class={`a-pill a-pill--${l.status}`}>{STATUS_LABEL[l.status]}</span>
                </button>

                <div class="a-lead__actions">
                  <a class="a-btn a-btn--wa a-btn--sm" href={`https://wa.me/${waDigits(l.phone)}?text=${waText(l)}`} target="_blank" rel="noopener" onClick={() => l.status === 'new' && update(l, { status: 'contacted' })}><Icon name="whatsapp" /> WhatsApp</a>
                  <a class="a-btn a-btn--ghost a-btn--sm" href={`tel:${l.phone}`} onClick={() => l.status === 'new' && update(l, { status: 'contacted' })}><Icon name="phone" /> {l.phone}</a>
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
                      <textarea rows={2} defaultValue={l.notes} placeholder="e.g. Site visit tomorrow at 5 pm, budget up to 1.5 crore" onBlur={(e) => e.currentTarget.value !== l.notes && update(l, { notes: e.currentTarget.value }, 'Note saved.')} />
                    </label>
                    <div class="a-row a-row--wrap">
                      <span class="a-muted a-small">Status:</span>
                      {(['new', 'contacted', 'closed', 'spam'] as const).map((s) => (
                        <button class={`a-tag${l.status === s ? ' is-on' : ''}`} onClick={() => update(l, { status: s }, `Status: ${STATUS_LABEL[s]}`)}>{STATUS_LABEL[s]}</button>
                      ))}
                      {ctx.me.role === 'super_admin' && <button class="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" style={{ marginLeft: 'auto' }} onClick={() => remove(l)}><Icon name="trash" size={16} /> Delete</button>}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
