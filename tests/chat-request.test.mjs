import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatRequest } from '../src/lib/chat-request.ts';

void test('long conversations remain sendable with latest five turns', () => {
  const history = Array.from({ length: 100 }, (_, index) => ({
    role: index % 2 ? 'assistant' : 'user',
    content: `fixture ${index}`,
  }));
  const latest = { role: 'user', content: 'latest fixture' };
  const payload = JSON.parse(chatRequest(history, latest));
  assert.deepEqual(payload.messages, [...history.slice(-4), latest]);
  assert.equal(history.length, 100);
});

void test('request respects UTF-8 content and serialized body limits', () => {
  const history = Array.from({ length: 40 }, () => ({
    role: 'assistant',
    content: 'x'.repeat(4000),
  }));
  const latest = { role: 'user', content: 'é'.repeat(2000) };
  const body = chatRequest(history, latest);
  assert.equal(Buffer.byteLength(body) <= 16 * 1024, true);
  assert.equal(JSON.parse(body).messages.at(-1).content, latest.content);
  assert.equal(
    chatRequest([], { role: 'user', content: 'é'.repeat(2001) }),
    undefined,
  );
  assert.equal(
    chatRequest([], { role: 'user', content: '\u0001'.repeat(4000) }),
    undefined,
  );
});
