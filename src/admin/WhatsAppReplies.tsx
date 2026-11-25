/* Ready-made auto-replies for the WhatsApp Business app — copy here, paste in WhatsApp.
   (The website can only prepare the visitor's first message; replies are sent by the
   WhatsApp Business app itself: Greeting message, Away message and Quick replies.) */
import { sb } from './lib';
import { Icon, toast } from './ui';
import { useQuery } from './store';
import { SITE } from '../config/site';

interface PublicSettings { phone: string | null; hours: string | null }

export function WhatsAppReplies() {
  const { data } = useQuery<PublicSettings | null>('public-settings', async () => {
    const { data, error } = await sb.from('settings').select('phone, hours').eq('id', 1).maybeSingle();
    if (error) throw error;
    return (data as PublicSettings | null) ?? null;
  }, 5 * 60_000);
  const hours = data?.hours?.trim() || SITE.hours;
  const office = `${SITE.address.street}, ${SITE.address.city}`;

  const replies = [
    {
      title: 'Greeting message',
      where: 'Business tools → Greeting message — sent to every new customer',
      text: [
        'Assalam o Alaikum, and thank you for contacting Bangash Real Estate & Builders!',
        '',
        'If you have already sent us the details, our agent will contact you shortly.',
        '',
        'If not, please tell us:',
        '1. Buy, rent or sell?',
        '2. House, flat or plot?',
        '3. Area / society',
        '4. Budget',
        '',
        `Office: ${SITE.address.short}, ${SITE.address.city}`,
        hours,
      ].join('\n'),
    },
    {
      title: 'Away message',
      where: 'Business tools → Away message — outside your opening hours',
      text: [
        `Thank you for your message! Our office is closed right now (${hours.replace(/^Open daily:\s*/i, 'open daily ')}).`,
        '',
        'Our agent will reply as soon as we open. Meanwhile, please share what you are looking for: buy, rent or sell; house, flat or plot; area and budget.',
      ].join('\n'),
    },
    {
      title: 'Quick reply  /details',
      where: 'Business tools → Quick replies → shortcut "details"',
      text: [
        'Thank you! To find the right property for you, please share:',
        '1. Buy or rent?',
        '2. House, flat or plot?',
        '3. Preferred area / society',
        '4. Size (marla / kanal)',
        '5. Budget',
      ].join('\n'),
    },
    {
      title: 'Quick reply  /visit',
      where: 'Business tools → Quick replies → shortcut "visit"',
      text: 'Sure! Which day and time suit you for a visit? Our agent will confirm the appointment and send you the location.',
    },
    {
      title: 'Quick reply  /location',
      where: 'Business tools → Quick replies → shortcut "location"',
      text: [`Our office: ${office}`, `Directions: ${SITE.mapsUrl}`, hours].join('\n'),
    },
  ];

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older phones: copy through a hidden text box
      const box = document.createElement('textarea');
      box.value = text;
      box.setAttribute('readonly', '');
      box.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.append(box);
      box.select();
      const ok = document.execCommand('copy');
      box.remove();
      if (!ok) return toast.err('Could not copy — please select the text and copy it.');
    }
    toast.ok('Copied ✓ Now paste it in WhatsApp Business.');
  };

  return (
    <section class="a-card">
      <h2 class="a-card__title"><span><Icon name="whatsapp" size={16} /></span> WhatsApp auto-replies</h2>
      <p class="a-muted">
        Ready-made replies for the <strong>WhatsApp Business</strong> app. Tap <strong>Copy</strong>, then open WhatsApp Business → <strong>⋮ → Business tools</strong> and paste it in the place shown.
      </p>
      <div class="a-replies">
        {replies.map((r) => (
          <article class="a-reply">
            <header class="a-reply__head">
              <span><strong>{r.title}</strong><small class="a-muted">{r.where}</small></span>
              <button type="button" class="a-btn a-btn--soft a-btn--sm" onClick={() => copy(r.text)}><Icon name="copy" size={16} /> Copy</button>
            </header>
            <p class="a-reply__text">{r.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
