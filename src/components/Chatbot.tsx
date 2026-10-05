import { useState, useRef, useEffect } from 'preact/hooks';
import { track, trackError } from '../lib/track';
import { chatRequest, type Message } from '../lib/chat-request';

const CHAT_API = import.meta.env.PUBLIC_CHAT_API_URL || '/api/chat';
const FOXBOT_SRC = '/foxbot.webp';

// rotating bubble text on the collapsed chatbot
const QUIPS = [
  'need help finding something?',
  "click me if you're lost",
  'hey, over here!',
  'poke me, i dare you',
  'i know semyon’s work, ask away',
];

// shown when rate limited (429)
const RATE_LIMIT_MSGS = [
  'brb, gone to swim a 100 free',
  'warming up for a 50 back, ask again in a min',
  'retuning the assistant brain, hold on',
  'gone for a coffee, try again shortly',
  'between sets at the pool, give me a sec',
  'the homelab needs a breather, one moment',
  'docker compose down... just kidding, try again soon',
  'even rust needs a break sometimes',
  "rate limited! i'm fast but not that fast",
  "slow down, i'm only one fox",
];

// shown on server errors (500, timeouts, network issues)
const ERROR_MSGS = [
  "my brain isn't available right now - try again in a moment.",
  'the server tripped over a cable, try again in a sec',
  'sorry, gone for a coffee - try again soon',
  'sorry, 500 found. emergency debugging, brb',
  'the assistant is taking an unplanned debugging break - try again shortly',
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'hey, i’m semyon’s assistant. i can help with his projects, background, experience, and what he’s working on.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState('');
  const [quip, setQuip] = useState(QUIPS[0]);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  // rotate quips
  useEffect(() => {
    const interval = setInterval(() => {
      setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'nearest',
    });
  }, [messages]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else if (returnFocus.current) {
      triggerRef.current?.focus();
      returnFocus.current = false;
    }
  }, [open]);

  function closeChat() {
    returnFocus.current = true;
    setOpen(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const body = chatRequest(messages, userMsg);
    if (!body) {
      setFailure('That message is too long. Please shorten it and send again.');
      trackError('validation_failed', 'popup');
      return;
    }
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setFailure('');

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    const fail = (content: string) => {
      trackError('request_failed', 'popup');
      setFailure(
        `No reply arrived. Check the message below and send again to retry. ${content}`,
      );
      setInput((current) => current || text);
    };

    try {
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body,
      });

      if (res.status === 429) {
        const msg =
          RATE_LIMIT_MSGS[Math.floor(Math.random() * RATE_LIMIT_MSGS.length)];
        fail(msg);
        return;
      }
      if (!res.ok) {
        const msg = ERROR_MSGS[Math.floor(Math.random() * ERROR_MSGS.length)];
        fail(msg);
        return;
      }
      const data: unknown = await res.json();
      if (
        typeof data !== 'object' ||
        data === null ||
        !('reply' in data) ||
        typeof data.reply !== 'string' ||
        !data.reply.trim()
      ) {
        throw new Error('Missing chat reply');
      }
      const reply = data.reply;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      const msg = ERROR_MSGS[Math.floor(Math.random() * ERROR_MSGS.length)];
      fail(
        controller.signal.aborted
          ? 'that took too long. try sending again.'
          : msg,
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div class="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex items-end gap-2 group">
        <div class="hidden sm:block bg-surface border border-heading/10 rounded-xl rounded-br-none px-3 py-2 text-xs text-heading/75 max-w-[190px] shadow-lg mb-1 opacity-0 translate-y-1 pointer-events-none transition-all group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
          {quip}
        </div>
        <button
          ref={triggerRef}
          onClick={() => {
            setOpen(true);
            track('action_completed', 'popup');
          }}
          class="w-12 h-12 rounded-full shadow-lg shadow-fox/25 flex items-center justify-center hover:scale-110 transition-all overflow-hidden border-2 border-fox"
          aria-label="Open chat"
          aria-expanded="false"
          aria-controls="chat-dialog"
        >
          <img
            src={FOXBOT_SRC}
            alt="Chat with Semyon’s assistant"
            width={192}
            height={192}
            decoding="async"
            class="w-full h-full object-cover scale-125"
          />
        </button>
      </div>
    );
  }

  return (
    <div
      id="chat-dialog"
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-title"
      onKeyDown={(event) => event.key === 'Escape' && closeChat()}
      class="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-[340px] max-h-[min(520px,calc(100dvh-2rem))] bg-surface border border-heading/10 rounded-xl shadow-2xl flex flex-col overflow-y-auto"
    >
      {/* header */}
      <div class="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <div class="flex items-center gap-2">
          <img
            src={FOXBOT_SRC}
            alt=""
            width={48}
            height={48}
            decoding="async"
            class="w-6 h-6 rounded-full"
          />
          <h2 id="chat-title" class="text-heading text-sm font-semibold">
            semyon&apos;s assistant
          </h2>
        </div>
        <button
          onClick={closeChat}
          class="grid h-11 w-11 place-items-center text-dim hover:text-heading transition-colors text-sm"
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      {/* messages */}
      <div class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-[320px]">
        <ol aria-label="Conversation" class="space-y-3">
          {messages.map((msg, i) => (
            <li
              key={i}
              class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                class={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed break-words ${
                  msg.role === 'user'
                    ? 'bg-white text-black rounded-br-none'
                    : 'bg-border text-heading/80 rounded-bl-none'
                }`}
              >
                <span class="sr-only">
                  {msg.role === 'user' ? 'You: ' : 'Assistant: '}
                </span>
                {msg.content}
              </div>
            </li>
          ))}
        </ol>
        {loading && (
          <div class="flex justify-start">
            <div class="bg-border text-muted px-3 py-2 rounded-xl rounded-bl-none text-xs">
              typing...
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>
      {failure && <p class="px-3 py-2 text-sm text-heading">{failure}</p>}
      <p class="sr-only" aria-live="polite" aria-atomic="true">
        {failure ||
          (loading
            ? 'Semyon’s assistant is typing.'
            : messages.length > 1 &&
                messages[messages.length - 1].role === 'assistant'
              ? messages[messages.length - 1].content
              : '')}
      </p>

      <p id="chat-privacy" class="shrink-0 px-3 py-2 text-xs text-muted">
        Messages go to OpenRouter to answer. Please leave out personal details.
      </p>

      {/* input */}
      <form
        class="shrink-0 border-t border-border p-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <label class="sr-only" htmlFor="chat-message">
          Message for Semyon’s assistant
        </label>
        <input
          ref={inputRef}
          id="chat-message"
          type="text"
          value={input}
          onInput={(e) => setInput(e.currentTarget.value)}
          placeholder="type a message..."
          aria-describedby="chat-privacy"
          maxLength={4000}
          class="min-w-0 flex-1 bg-border rounded-lg px-3 py-2 text-base sm:text-sm text-heading placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-fox/25"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          class="min-h-11 bg-white text-black font-semibold text-sm px-3 py-2 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-40"
        >
          send
        </button>
      </form>
    </div>
  );
}
