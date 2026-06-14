// cookieless event ping. nothing is stored or read on the visitor's device,
// so this stays outside ePrivacy consent territory. the server keeps no raw
// ips, only a daily-rotating hash and a cloudflare-resolved country code
const EVENTS_API = import.meta.env.PUBLIC_EVENTS_API_URL || '/api/events';

type EventKind =
  | 'pageview'
  | 'chat_open'
  | 'game_open'
  | 'outbound_click'
  | 'form_submit'
  | 'not_found';

function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true;
}

// coarse device class, the only thing read from the browser environment
function screenClass(): string {
  const width = window.innerWidth;
  return width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
}

// campaign tag when the current url carries one (utm_source or ref)
function campaignSource(): string | null {
  const params = new URLSearchParams(location.search);
  return params.get('utm_source') || params.get('ref');
}

// target is what was acted on: destination url for outbound_click, game id
// for game_open
export function track(kind: EventKind, target?: string) {
  if (!import.meta.env.PROD || optedOut()) return;

  // only external referrers are interesting, internal navigation is noise
  let referrer: string | null = null;
  if (kind === 'pageview' && document.referrer) {
    try {
      if (new URL(document.referrer).origin !== location.origin) {
        referrer = document.referrer;
      }
    } catch {
      // unparseable referrer, skip it
    }
  }

  fetch(EVENTS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind,
      path: location.pathname,
      referrer,
      target: target ?? null,
      source: kind === 'pageview' ? campaignSource() : null,
      screen: screenClass(),
    }),
    keepalive: true,
  }).catch(() => {});
}
