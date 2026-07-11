// Cookieless event ping. Nothing is stored in or read from browser storage,
// so this stays outside ePrivacy consent territory. the server keeps no raw
// ips, only a daily-rotating hash and a cloudflare-resolved country code
const EVENTS_API = import.meta.env.PUBLIC_EVENTS_API_URL || '/api/events';

type EventKind =
  | 'pageview'
  | 'chat_open'
  | 'game_open'
  | 'outbound_click'
  | 'navigation'
  | 'form_submit'
  | 'not_found';

type LinkPlacement = 'header' | 'footer' | 'content' | 'cta';

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
  const source = (params.get('utm_source') || params.get('ref'))
    ?.trim()
    .toLowerCase();
  return source && /^[a-z0-9_-]{1,64}$/.test(source) ? source : null;
}

function externalReferrer(): string | null {
  if (!document.referrer) return null;
  try {
    const url = new URL(document.referrer);
    return url.origin !== location.origin ? url.origin : null;
  } catch {
    return null;
  }
}

// Keep the destination and path, but never query data or fragments.
export function safeOutboundTarget(href: string): string | null {
  try {
    const url = new URL(href, location.href);
    if (url.protocol === 'mailto:') return 'email';
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

// Internal transition destinations are paths only.
export function safeInternalTarget(href: string): string | null {
  try {
    const url = new URL(href, location.href);
    return url.origin === location.origin ? url.pathname : null;
  } catch {
    return null;
  }
}

export function linkPlacement(link: HTMLAnchorElement): LinkPlacement {
  const placement = link.closest<HTMLElement>('[data-analytics-placement]')
    ?.dataset.analyticsPlacement;
  return placement === 'header' || placement === 'footer' || placement === 'cta'
    ? placement
    : 'content';
}

// target is what was acted on: destination URL/path for link events, game id
// for game_open. No browser state or identifier is created.
export function track(
  kind: EventKind,
  target?: string,
  placement?: LinkPlacement,
) {
  if (!import.meta.env.PROD || optedOut()) return;

  // Internal transitions are click aggregates, never a per-person trail.
  const referrer = kind === 'pageview' ? externalReferrer() : null;
  const attribution =
    kind === 'pageview' ? (referrer ? 'external' : 'direct') : null;

  fetch(EVENTS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind,
      path: location.pathname,
      referrer,
      target: target ?? null,
      placement: placement ?? null,
      attribution,
      source: kind === 'pageview' ? campaignSource() : null,
      screen: screenClass(),
    }),
    keepalive: true,
  }).catch(() => {});
}
