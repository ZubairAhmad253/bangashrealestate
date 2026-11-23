import { useEffect, useState } from 'preact/hooks';
import { sb, timeAgo, waDigits, type LeadRow } from '../lib';
import { Icon, PageHead } from '../ui';
import type { Ctx } from '../App';

interface Counts { available: number; sold: number; hidden: number; projects: number; reviews: number }

export function Dashboard({ ctx }: { ctx: Ctx }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);

  useEffect(() => {
    const count = (table: string, col?: string, vals?: string[]) => {
      let q = sb.from(table).select('id', { count: 'exact', head: true });
      if (col && vals) q = q.in(col, vals);
      return q.then(({ count }) => count ?? 0);
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
  const name = ctx.me.name || ctx.me.email.split('@')[0];

  return (
    <div class="a-page">
      <PageHead title={`Assalam o Alaikum, ${name} 👋`} sub={hour < 12 ? 'Subah bakhair! Aaj kya add karna hai?' : 'Aaj kya update karna hai?'} />

      <div class="a-quick">
        <a href="#/properties/new" class="a-quick__card a-quick__card--gold">
          <Icon name="plus" size={26} />
          <strong>Nayi Property</strong>
          <span>House, flat ya plot add karein</span>
        </a>
        <a href="#/leads" class="a-quick__card">
          <Icon name="leads" size={26} />
          <strong>Leads {ctx.newLeads > 0 && <b class="a-badge">{ctx.newLeads} new</b>}</strong>
          <span>Website enquiries dekhein</span>
        </a>
        <a href="#/projects/new" class="a-quick__card">
          <Icon name="hammer" size={26} />
          <strong>Naya Project</strong>
          <span>Construction ki photos</span>
        </a>
        <a href="#/reviews" class="a-quick__card">
          <Icon name="star" size={26} />
          <strong>Review add karein</strong>
          <span>Google reviews website par</span>
        </a>
      </div>

      <div class="a-stats">
        <a href="#/properties" class="a-stat"><span>Live listings</span><strong>{counts?.available ?? '–'}</strong></a>
        <a href="#/properties" class="a-stat"><span>Sold / Rented</span><strong>{counts?.sold ?? '–'}</strong></a>
        <a href="#/leads" class="a-stat a-stat--hl"><span>New leads</span><strong>{ctx.newLeads}</strong></a>
        <a href="#/projects" class="a-stat"><span>Projects</span><strong>{counts?.projects ?? '–'}</strong></a>
      </div>

      <div class="a-grid2">
        <section class="a-card">
          <div class="a-card__head">
            <h2>Latest leads</h2>
            <a href="#/leads" class="a-link">Sab dekhein →</a>
          </div>
          {leads.length === 0 ? (
            <p class="a-muted">Abhi koi enquiry nahi aayi. Website ke contact form se aane wali har enquiry yahan dikhegi.</p>
          ) : (
            <ul class="a-list">
              {leads.map((l) => (
                <li class="a-list__item">
                  <div>
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
          <h2>Kaise kaam karta hai?</h2>
          <ol class="a-steps">
            <li><b>1</b><span><strong>Property add karein</strong> — photos, price aur details daalein, phir <em>Save</em>.</span></li>
            <li><b>2</b><span><strong>1–2 minute intezar</strong> — website khud update ho jati hai.</span></li>
            <li><b>3</b><span><strong>Bik gayi?</strong> Status <em>Sold</em> kar dein — website se khud hat jayegi.</span></li>
          </ol>
          {counts && counts.hidden > 0 && <p class="a-alert a-alert--info">{counts.hidden} property "Hidden" (draft) hai — website par nahi dikh rahi.</p>}
        </section>
      </div>
    </div>
  );
}
