const counts = [
  'app_open',
  'screen_view',
  'action_completed',
  'action_failed',
] as const;
const errors = [
  'unexpected_error',
  'request_failed',
  'render_failed',
  'storage_failed',
  'permission_failed',
  'media_failed',
  'validation_failed',
] as const;
const routes = ['app', 'home', 'help', 'game', 'library', 'popup'] as const;

export type CountName = (typeof counts)[number];
export type ErrorName = (typeof errors)[number];
export type Route = (typeof routes)[number];

// no identifiers, storage or queue; only this module's bounded counters live in memory
export function createTelemetry(enabled: boolean, endpoint: unknown) {
  let destination = '';
  try {
    if (
      enabled === true &&
      typeof endpoint === 'string' &&
      endpoint.length <= 512 &&
      endpoint === endpoint.trim() &&
      !/[\s\\]/u.test(endpoint) &&
      Array.from(endpoint).every(
        (char) => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127,
      ) &&
      !endpoint.startsWith('//')
    ) {
      const url = new URL(endpoint, 'https://same-origin.invalid');
      if (
        ((endpoint.startsWith('/') &&
          url.origin === 'https://same-origin.invalid') ||
          (endpoint.startsWith('https://') && url.protocol === 'https:')) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        url.pathname.endsWith('/v1/events')
      )
        destination = endpoint;
    }
  } catch {
    /* invalid configuration keeps collection off */
  }

  let disabled = false;
  let inFlight = false;
  let active: AbortController | undefined;
  let lifetime = 0;
  let minuteStart = 0;
  let minuteCount = 0;
  const lastErrors = new Map<string, number>();

  function send(
    kind: 'count' | 'error',
    name: CountName | ErrorName,
    route: Route,
  ) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const finish = () => {
      try {
        if (timeout !== undefined) clearTimeout(timeout);
      } catch {
        /* no retry */
      }
      if (active === controller) {
        active = undefined;
        inFlight = false;
      }
    };
    try {
      if (
        !destination ||
        disabled ||
        inFlight ||
        lifetime >= 200 ||
        !(kind === 'count' ? counts : errors).some((value) => value === name) ||
        !routes.some((value) => value === route)
      )
        return;
      if (typeof navigator !== 'undefined') {
        const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
        if (
          nav.globalPrivacyControl === true ||
          nav.doNotTrack === '1' ||
          nav.doNotTrack === 'yes'
        )
          return;
      }
      const now = Date.now();
      if (!Number.isFinite(now)) return;
      if (now - minuteStart >= 60000) {
        minuteStart = now;
        minuteCount = 0;
      }
      if (minuteCount >= 20) return;
      const errorKey = `${name}:${route}`;
      const previous = lastErrors.get(errorKey);
      if (kind === 'error' && previous !== undefined && now - previous < 60000)
        return;

      const body = JSON.stringify({
        version: 1,
        app: 'portfolio',
        kind,
        name,
        surface: 'web',
        route,
      });
      if (body.length > 1024) return;
      controller = new AbortController();
      active = controller;
      inFlight = true;
      timeout = setTimeout(() => {
        try {
          controller?.abort();
        } catch {
          /* optional transport */
        }
      }, 2000);
      lifetime++;
      minuteCount++;
      if (kind === 'error') lastErrors.set(errorKey, now);
      void Promise.resolve(
        fetch(destination, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
          signal: controller.signal,
        }),
      ).then(finish, finish);
    } catch {
      try {
        controller?.abort();
      } catch {
        /* optional transport */
      }
      finish();
    }
  }

  return {
    count: (name: CountName, route: Route) => send('count', name, route),
    error: (name: ErrorName, route: Route) => send('error', name, route),
    isDisabled: () => disabled,
    setDisabled(value: boolean) {
      disabled = value === true;
      if (disabled) {
        try {
          active?.abort();
        } catch {
          /* optional transport */
        }
      }
    },
  };
}
