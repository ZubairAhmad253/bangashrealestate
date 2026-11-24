/* Notifications — everything that was added, changed or removed, newest first */
import { useEffect, useState } from 'preact/hooks';
import { sb, timeAgo, formatPrice, type ActivityRow, type ActivityEntity } from '../lib';
import { Icon, PageHead, Skeleton, Empty } from '../ui';
import type { Ctx } from '../App';

const PAGE = 40;

const FILTERS: { value: '' | ActivityEntity | 'team'; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'property', label: 'Properties' },
  { value: 'lead', label: 'Leads' },
  { value: 'project', label: 'Projects' },
  { value: 'review', label: 'Reviews' },
  { value: 'team', label: 'Settings & team' },
];

const NOUN: Record<ActivityEntity, string> = {
  property: 'property', project: 'project', review: 'review', lead: 'lead', settings: 'site settings', admin: 'team member',
};

const STATUS: Record<string, string> = {
  available: 'Available', sold: 'Sold', rented: 'Rented', hidden: 'Hidden',
  new: 'New', contacted: 'Contacted', closed: 'Closed', spam: 'Spam',
  completed: 'Completed', in_progress: 'In progress',
};

const FIELD: Record<string, string> = {
  title: 'title', price: 'price', show_price: 'price visibility', images: 'photos', videos: 'videos', description: 'description',
  features: 'features', featured: 'featured', hot: 'hot deal', beds: 'bedrooms', baths: 'bathrooms', size: 'size',
  location: 'location', area: 'society', purpose: 'sale / rent', type: 'type', slug: 'web link', notes: 'notes',
  stats: 'home page stats', phone: 'phone', whatsapp: 'WhatsApp', email: 'email', hours: 'timings', google_rating: 'Google rating',
  sort_order: 'order', rating: 'rating', text: 'review text', name: 'name', place: 'place', category: 'category', year: 'year',
  published: 'visibility', role: 'role',
};

const label = (s?: string) => (s ? STATUS[s] ?? s : '');

/** What happened, in plain words */
function describe(a: ActivityRow): { verb: string; tone: string; icon: string } {
  const noun = NOUN[a.entity];
  const d = a.details ?? {};
  if (a.entity === 'lead' && a.action === 'created') return { verb: 'New enquiry from', tone: 'gold', icon: 'leads' };
  switch (a.action) {
    case 'created': return { verb: a.entity === 'admin' ? 'added a team member' : `added a ${noun}`, tone: 'green', icon: 'plus' };
    case 'deleted': return { verb: a.entity === 'admin' ? 'removed a team member' : `deleted a ${noun}`, tone: 'red', icon: 'trash' };
    case 'shown': return { verb: `made a ${noun} visible`, tone: 'blue', icon: 'eye' };
    case 'hidden': return { verb: `hid a ${noun}`, tone: 'grey', icon: 'eye-off' };
    case 'role': return { verb: `changed the role (${d.to === 'super_admin' ? 'Super Admin' : 'Editor'}) of`, tone: 'blue', icon: 'shield' };
    case 'status':
      if (d.to === 'hidden') return { verb: `hid a ${noun}`, tone: 'grey', icon: 'eye-off' };
      if (d.from === 'hidden') return { verb: `made a ${noun} visible`, tone: 'blue', icon: 'eye' };
      return { verb: `marked a ${noun} as ${label(d.to)}`, tone: d.to === 'sold' || d.to === 'rented' ? 'green' : 'blue', icon: 'check' };
    default:
      return { verb: a.entity === 'settings' ? 'updated the site settings' : `edited a ${noun}`, tone: 'blue', icon: 'edit' };
  }
}

function extra(a: ActivityRow): string {
  const d = a.details ?? {};
  const parts: string[] = [];
  if (d.price_from != null && d.price_to != null) parts.push(`Price: ${formatPrice(d.price_from)} → ${formatPrice(d.price_to)}`);
  if (a.action === 'status' && d.from && d.to && d.to !== 'hidden' && d.from !== 'hidden') parts.push(`${label(d.from)} → ${label(d.to)}`);
  const changed = (d.changed ?? []).filter((k) => !['status', 'price', 'published', 'role'].includes(k)).map((k) => FIELD[k] ?? k.replace(/_/g, ' '));
  if (changed.length) parts.push(`Changed: ${changed.join(', ')}`);
  if (a.entity === 'lead' && d.interest) parts.push(d.interest);
  if (a.entity === 'lead' && d.source === 'whatsapp') parts.push('via WhatsApp');
  return parts.join(' · ');
}

function linkFor(a: ActivityRow): string | null {
  if (a.action === 'deleted') return null;
  switch (a.entity) {
    case 'property': return a.entity_id ? `#/properties/${a.entity_id}` : '#/properties';
    case 'project': return a.entity_id ? `#/projects/${a.entity_id}` : '#/projects';
    case 'review': return '#/reviews';
    case 'lead': return '#/leads';
    default: return '#/settings';
  }
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 864e5);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function Notifications({ ctx }: { ctx: Ctx }) {
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('');
  const [more, setMore] = useState(false);
  const [missing, setMissing] = useState(false);
  // Remember what was unread when the page opened, then mark everything as read
  const [seenBefore] = useState(ctx.seenAt);
  useEffect(() => { ctx.markSeen(); }, []);

  const load = async (offset = 0) => {
    let q = sb.from('activity').select('*').order('created_at', { ascending: false }).range(offset, offset + PAGE - 1);
    if (filter === 'team') q = q.in('entity', ['settings', 'admin']);
    else if (filter) q = q.eq('entity', filter);
    const { data, error } = await q;
    if (error) { setMissing(true); setRows([]); return; }
    const list = (data as ActivityRow[]) ?? [];
    setRows((prev) => (offset ? [...(prev ?? []), ...list] : list));
    setMore(list.length === PAGE);
  };
  useEffect(() => { setRows(null); void load(); }, [filter]);

  let lastDay = '';
  return (
    <div class="a-page">
      <PageHead title="Notifications" icon="bell" sub="Everything added, changed or removed — by you, your team and website visitors" />

      <div class="a-tabs" role="tablist" aria-label="Filter notifications">
        {FILTERS.map((f) => (
          <button role="tab" aria-selected={filter === f.value} class={filter === f.value ? 'is-on' : ''} onClick={() => setFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      {missing && (
        <p class="a-alert a-alert--warn">
          Notifications are not switched on yet. {ctx.me.role === 'super_admin' ? 'Run database/migrations/004-activity-log.sql in Supabase → SQL Editor.' : 'Please ask the super admin to finish the setup.'}
        </p>
      )}

      {rows === null ? (
        <Skeleton rows={4} />
      ) : rows.length === 0 && !missing ? (
        <Empty icon="bell" title="No activity yet" text="When someone adds or changes a listing, or a visitor sends an enquiry, it shows up here." />
      ) : (
        <section class="a-card a-feed">
          {rows.map((a) => {
            const day = dayLabel(a.created_at);
            const head = day !== lastDay ? <h2 class="a-feed__day">{day}</h2> : null;
            lastDay = day;
            const { verb, tone, icon } = describe(a);
            const mine = a.actor_id === ctx.me.user_id;
            const unread = !mine && a.created_at > seenBefore;
            const href = linkFor(a);
            const info = extra(a);
            const isLead = a.entity === 'lead' && a.action === 'created';
            const title = a.title ? `“${a.title}”` : '';
            return (
              <>
                {head}
                <article class={`a-feed__item${unread ? ' is-unread' : ''}`}>
                  <span class={`a-feed__icon a-feed__icon--${tone}`}><Icon name={icon} size={18} /></span>
                  <div class="a-feed__body">
                    <p>
                      {isLead ? <strong>{verb}</strong> : <><strong>{mine ? 'You' : a.actor_name}</strong> {verb}</>}{' '}
                      {href ? <a href={href}>{isLead ? a.title : title}</a> : <span class="a-feed__gone">{title}</span>}
                    </p>
                    {info && <small class="a-muted">{info}</small>}
                  </div>
                  <time class="a-feed__time" dateTime={a.created_at} title={new Date(a.created_at).toLocaleString('en-PK')}>{timeAgo(a.created_at)}</time>
                  {unread && <span class="a-feed__dot" aria-label="New" />}
                </article>
              </>
            );
          })}
          {more && <button class="a-btn a-btn--ghost a-btn--block" onClick={() => load(rows.length)}>Show older</button>}
        </section>
      )}
    </div>
  );
}
