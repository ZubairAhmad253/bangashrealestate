import { useEffect, useState } from 'preact/hooks';
import { sb, timeAgo, waDigits, type LeadRow } from '../lib';
import { Icon } from '../ui';
import type { Ctx } from '../App';

interface Counts { available: number; sold: number; hidden: number; projects: number; reviews: number }

export function Dashboard({ ctx }: { ctx: Ctx }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);

  useEffect(() => {
    const count = async (table: string, col?: string, vals?: string[]) => {
      let q = sb.from(table).select('id', { count: 'exact', head: true });
      if (col && vals) q = q.in(col, vals);
      const { count } = await q;
      return count ?? 0;
    };
    Promise.all([
      count('properties', 'status', ['available']),
      count('properties', 'status', ['sold', 'rented']),
      count('properties', 'status', ['hidden']),
      count('projects'),
      count('testimonials'),
    ]).then(([available, sold, hidden, projects, reviews]) => setCounts({ available, sold, hidden, projects, reviews }));
    sb.from('leads').select('*').neq('status', 'spam').order('created_at', { ascending: false }).limit(5).then(({ data }) => setLeads((data as LeadRow[]) ?? []));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = ctx.me.name || ctx.me.email.split('@')[0];
  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div class="a-page">
      <section class="a-hero">
        <div>
          <p class="a-hero__date">{today}</p>
          <h1>{greeting}, {name} 👋</h1>
          <p>{ctx.newLeads > 0 ? `You have ${ctx.newLeads} new ${ctx.newLeads === 1 ? 'enquiry' : 'enquiries'} waiting for a reply.` : 'Everything is up to date. Ready to add a new listing?'}</p>
        </div>
        <div class="a-hero__actions">
          <a href="#/properties/new" class="a-btn a-btn--gold a-btn--lg"><Icon name="plus" /> Add property</a>
          {ctx.newLeads > 0 && <a href="#/leads" class="a-btn a-btn--glass"><Icon name="leads" /> View leads</a>}
        </div>
      </section>

      <div class="a-stats">
        <a href="#/properties" class="a-stat"><span class="a-stat__icon"><Icon name="home" /></span><span>Live listings</span><strong>{counts?.available ?? '–'}</strong></a>
        <a href="#/properties" class="a-stat"><span class="a-stat__icon"><Icon name="check" /></span><span>Sold / rented</span><strong>{counts?.sold ?? '–'}</strong></a>
        <a href="#/leads" class="a-stat a-stat--hl"><span class="a-stat__icon"><Icon name="leads" /></span><span>New leads</span><strong>{ctx.newLeads}</strong></a>
        <a href="#/projects" class="a-stat"><span class="a-stat__icon"><Icon name="hammer" /></span><span>Projects</span><strong>{counts?.projects ?? '–'}</strong></a>
      </div>

      <div class="a-quick">
        <a href="#/properties/new" class="a-quick__card">
          <span class="a-quick__icon"><Icon name="home" size={22} /></span>
          <strong>New property</strong>
          <span>Add a house, flat or plot</span>
        </a>
        <a href="#/projects/new" class="a-quick__card">
          <span class="a-quick__icon"><Icon name="hammer" size={22} /></span>
          <strong>New project</strong>
          <span>Show construction work</span>
        </a>
        <a href="#/reviews" class="a-quick__card">
          <span class="a-quick__icon"><Icon name="star" size={22} /></span>
          <strong>Add a review</strong>
          <span>Client reviews on the website</span>
        </a>
        <a href="/" target="_blank" rel="noopener" class="a-quick__card">
          <span class="a-quick__icon"><Icon name="globe" size={22} /></span>
          <strong>View website</strong>
          <span>See what visitors see</span>
        </a>
      </div>

      <div class="a-grid2">
        <section class="a-card">
          <div class="a-card__head">
            <h2>Latest enquiries</h2>
            <a href="#/leads" class="a-link">View all →</a>
          </div>
          {leads.length === 0 ? (
            <p class="a-muted">No enquiries yet. Every enquiry from the website contact form will appear here.</p>
          ) : (
            <ul class="a-list">
              {leads.map((l) => (
                <li class="a-list__item">
                  <span class="a-me__avatar">{l.name.charAt(0).toUpperCase()}</span>
                  <div class="a-list__main">
                    <strong>{l.name}</strong> {l.status === 'new' && <span class="a-pill a-pill--new">New</span>}
                    <small class="a-muted">{l.interest || 'Enquiry'} · {timeAgo(l.created_at)}</small>
                  </div>
                  <div class="a-row">
                    <a class="a-icon-btn a-icon-btn--wa" href={`https://wa.me/${waDigits(l.phone)}`} target="_blank" rel="noopener" aria-label="WhatsApp"><Icon name="whatsapp" /></a>
                    <a class="a-icon-btn" href={`tel:${l.phone}`} aria-label="Call"><Icon name="phone" /></a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section class="a-card a-card--tip">
          <h2>How it works</h2>
          <ol class="a-steps">
            <li><b>1</b><span><strong>Add a property</strong> — photos, price and details, then press <em>Save</em>.</span></li>
            <li><b>2</b><span><strong>Wait 1–2 minutes</strong> — the website updates itself.</span></li>
            <li><b>3</b><span><strong>Sold it?</strong> Set the status to <em>Sold</em> and it disappears from the website.</span></li>
          </ol>
          {counts && counts.hidden > 0 && <p class="a-alert a-alert--info">{counts.hidden} {counts.hidden === 1 ? 'property is' : 'properties are'} hidden (draft) and not shown on the website.</p>}
        </section>
      </div>
    </div>
  );
}
