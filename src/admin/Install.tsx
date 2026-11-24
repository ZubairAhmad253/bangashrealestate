/* "Install the admin app" — adds the admin panel to the phone's home screen like an app */
import { useEffect, useState } from 'preact/hooks';
import { Icon } from './ui';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// The browser offers installation once; keep the event so a button can use it later.
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function useInstall() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const l = () => rerender((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return {
    installed: isStandalone(),
    canPrompt: deferred !== null,
    ios: isIOS(),
    prompt: async () => {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      listeners.forEach((l) => l());
    },
  };
}

const DISMISS_KEY = 'bangash-install-dismissed';
const readDismissed = () => { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; } };

/** Install card. `dismissible` shows a close button (used on the dashboard). */
export function InstallCard({ dismissible = false }: { dismissible?: boolean }) {
  const { installed, canPrompt, ios, prompt } = useInstall();
  const [hidden, setHidden] = useState(dismissible && readDismissed());
  const [help, setHelp] = useState(false);

  if (hidden) return null;
  if (installed) {
    return dismissible ? null : (
      <section class="a-banner a-install">
        <span class="a-banner__icon"><Icon name="check" size={22} /></span>
        <div class="a-banner__text"><strong>App installed</strong><p>You are using the Bangash Admin app.</p></div>
      </section>
    );
  }

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
    setHidden(true);
  };

  return (
    <section class="a-banner a-install">
      <span class="a-banner__icon"><Icon name="download" size={22} /></span>
      <div class="a-banner__text">
        <strong>Install the admin app on your phone</strong>
        <p>Open the admin panel from your home screen with one tap — like WhatsApp.</p>
        {(help || (!canPrompt && !dismissible)) && (
          <ol class="a-install__steps">
            {ios ? (
              <>
                <li>Open this page in <b>Safari</b>.</li>
                <li>Tap the <b>Share</b> button <Icon name="share" size={15} /> at the bottom.</li>
                <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
              </>
            ) : (
              <>
                <li>Open this page in <b>Chrome</b>.</li>
                <li>Tap the <b>⋮ menu</b> (top right).</li>
                <li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li>
              </>
            )}
          </ol>
        )}
      </div>
      <div class="a-row">
        {canPrompt ? (
          <button class="a-btn a-btn--gold" onClick={prompt}><Icon name="download" /> Install app</button>
        ) : (
          !help && dismissible && <button class="a-btn a-btn--gold" onClick={() => setHelp(true)}><Icon name="download" /> How to install</button>
        )}
        {dismissible && <button class="a-icon-btn" onClick={dismiss} aria-label="Hide"><Icon name="x" /></button>}
      </div>
    </section>
  );
}
