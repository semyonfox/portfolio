import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createTelemetry } from '../src/lib/telemetry.ts';

const endpoint = 'https://counts.example/v1/events';
const flush = () => new Promise((resolve) => setImmediate(resolve));

function environment(t, overrides = {}) {
  const requests = [];
  const timers = [];
  const originals = new Map();
  const values = {
    navigator: {},
    fetch: (url, options) => {
      requests.push({ url, options });
      return Promise.resolve({ status: 204 });
    },
    setTimeout: (callback, delay) => {
      timers.push({ callback, delay });
      return timers.length;
    },
    clearTimeout: () => {},
    ...overrides,
  };
  for (const [name, value] of Object.entries(values)) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
  }
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  return { requests, timers };
}

void test('default and invalid endpoint configurations emit nothing', (t) => {
  const { requests } = environment(t);
  for (const [enabled, url] of [
    [false, endpoint],
    [true, undefined],
    [true, ''],
    [true, 'http://counts.example/v1/events'],
    [true, '//counts.example/v1/events'],
    [true, ' //counts.example/v1/events'],
    [true, '/\t/counts.example/v1/events'],
    [true, '/\n/counts.example/v1/events'],
    [true, 'counts.example/v1/events'],
    [true, 'https://user:pass@counts.example/v1/events'],
    [true, `${endpoint}?token=fixture`],
    [true, `${endpoint}#fixture`],
    [true, '/api/events'],
    [
      true,
      {
        toString() {
          throw Error();
        },
      },
    ],
  ]) {
    createTelemetry(enabled, url).count('screen_view', 'home');
  }
  assert.equal(requests.length, 0);
});

void test('privacy signals, inaccessible signals and in-app opt-out emit nothing', (t) => {
  const env = environment(t);
  const telemetry = createTelemetry(true, endpoint);
  for (const navigator of [
    { doNotTrack: '1' },
    { doNotTrack: 'yes' },
    { globalPrivacyControl: true },
    {
      get globalPrivacyControl() {
        throw Error('fixture-private');
      },
    },
  ]) {
    globalThis.navigator = navigator;
    assert.doesNotThrow(() => telemetry.count('screen_view', 'home'));
  }
  globalThis.navigator = {};
  telemetry.setDisabled(true);
  telemetry.error('request_failed', 'popup');
  assert.equal(telemetry.isDisabled(), true);
  assert.equal(env.requests.length, 0);
});

void test('count/error payloads contain only six contract fields, with safe transport', async (t) => {
  const { requests, timers } = environment(t);
  const telemetry = createTelemetry(true, '/counts/v1/events');
  telemetry.count('screen_view', 'home');
  await flush();
  telemetry.error('request_failed', 'popup');
  await flush();
  assert.equal(requests.length, 2);
  for (const { options } of requests) {
    const payload = JSON.parse(options.body);
    assert.deepEqual(Object.keys(payload).sort(), [
      'app',
      'kind',
      'name',
      'route',
      'surface',
      'version',
    ]);
    assert.equal(payload.version, 1);
    assert.equal(payload.app, 'portfolio');
    assert.equal(payload.surface, 'web');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    assert.equal(options.redirect, 'error');
    assert.equal(Buffer.byteLength(options.body) < 1024, true);
    assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
  }
  assert.equal(
    timers.every((timer) => timer.delay === 2000),
    true,
  );
});

void test('private text, identifiers, URLs and invalid names never serialize', (t) => {
  const { requests } = environment(t);
  const telemetry = createTelemetry(true, endpoint);
  for (const privateValue of [
    'fixture-private-question',
    'visitor-fixture-123',
    '/projects/fixture-person?email=fixture@example.com',
    'https://fixture.invalid/private',
  ]) {
    telemetry.count(privateValue, 'home');
    telemetry.count('screen_view', privateValue);
    telemetry.error(privateValue, 'popup');
  }
  assert.equal(requests.length, 0);
});

void test('throwing and rejected transports never escape or retry', async (t) => {
  const { requests } = environment(t);
  for (const fetch of [
    () => {
      throw Error('fixture-private-url');
    },
    () => Promise.reject(Error('fixture-private-text')),
    // hostile thenables model a failing transport boundary
    // eslint-disable-next-line unicorn/no-thenable
    () => ({
      // eslint-disable-next-line unicorn/no-thenable
      get then() {
        throw Error('fixture-private');
      },
    }),
  ]) {
    globalThis.fetch = fetch;
    const telemetry = createTelemetry(true, endpoint);
    assert.doesNotThrow(() => telemetry.error('request_failed', 'home'));
    await flush();
  }
  assert.equal(requests.length, 0);
});

void test('throwing constructors, timers and asynchronous abort/cleanup stay harmless', async (t) => {
  const env = environment(t);
  const originalController = globalThis.AbortController;
  const originalSetTimeout = globalThis.setTimeout;
  t.after(() => {
    globalThis.AbortController = originalController;
  });
  globalThis.AbortController = class {
    constructor() {
      throw Error('fixture');
    }
  };
  assert.doesNotThrow(() =>
    createTelemetry(true, endpoint).count('screen_view', 'home'),
  );
  globalThis.AbortController = originalController;
  globalThis.setTimeout = () => {
    throw Error('fixture');
  };
  assert.doesNotThrow(() =>
    createTelemetry(true, endpoint).count('screen_view', 'home'),
  );
  globalThis.setTimeout = originalSetTimeout;
  globalThis.AbortController = class {
    signal = {};
    abort() {
      throw Error('fixture');
    }
  };
  globalThis.clearTimeout = () => {
    throw Error('fixture');
  };
  globalThis.fetch = () => new Promise(() => {});
  const telemetry = createTelemetry(true, endpoint);
  telemetry.count('screen_view', 'home');
  assert.doesNotThrow(() => env.timers.at(-1).callback());
  assert.doesNotThrow(() => telemetry.setDisabled(true));
  await flush();
});

void test('one in flight, timeout cancellation, and no retry queue', async (t) => {
  let resolve;
  const { requests, timers } = environment(t);
  globalThis.fetch = (url, options) => {
    requests.push({ url, options });
    return new Promise((done) => {
      resolve = done;
    });
  };
  const telemetry = createTelemetry(true, endpoint);
  telemetry.count('screen_view', 'home');
  for (let i = 0; i < 50; i++) telemetry.error('request_failed', 'popup');
  assert.equal(requests.length, 1);
  timers[0].callback();
  assert.equal(requests[0].options.signal.aborted, true);
  telemetry.count('screen_view', 'home');
  assert.equal(requests.length, 1);
  resolve({ status: 204 });
  await flush();
  assert.equal(requests.length, 1);
});

void test('rate, lifetime and error repeat limits are enforced', async (t) => {
  const { requests } = environment(t);
  const realNow = Date.now;
  let now = 1000000;
  Date.now = () => now;
  t.after(() => {
    Date.now = realNow;
  });
  const telemetry = createTelemetry(true, endpoint);
  telemetry.error('request_failed', 'popup');
  await flush();
  telemetry.error('request_failed', 'popup');
  await flush();
  assert.equal(requests.length, 1);
  for (let i = 0; i < 30; i++) {
    telemetry.count('screen_view', 'home');
    await flush();
  }
  assert.equal(requests.length, 20);
  for (let minute = 0; minute < 11; minute++) {
    now += 60000;
    for (let i = 0; i < 25; i++) {
      telemetry.count('screen_view', 'home');
      await flush();
    }
  }
  assert.equal(requests.length, 200);
});

void test('real recoverable failure seams pass fixed literals only; no identity/storage seam', () => {
  for (const path of [
    'src/components/Chatbot.tsx',
    'src/layouts/Layout.astro',
  ]) {
    const source = readFileSync(path, 'utf8');
    assert.match(source, /trackError\('request_failed'/);
    assert.doesNotMatch(
      source,
      /conversation_id|newConversationId|safeOutboundTarget|externalReferrer/,
    );
  }
  const source = readFileSync('src/lib/telemetry.ts', 'utf8');
  assert.doesNotMatch(
    source,
    /localStorage|sessionStorage|document\.cookie|location\.|\.stack|\.message/,
  );
});
