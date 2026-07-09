import { useState, useRef, useEffect } from 'preact/hooks';
import { track } from '../lib/track';

const CHAT_API = import.meta.env.PUBLIC_CHAT_API_URL || '/api/chat';
const FOXBOT_SRC = '/foxbot.webp';

// per-tab id so the backend can group a conversation's turns. lives in
// memory only, never touches cookies or storage
function newConversationId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

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
  "my brain isn't connected yet - the rust backend is coming soon!",
  'the server tripped over a cable, try again in a sec',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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
  const [quip, setQuip] = useState(QUIPS[0]);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const conversationId = useRef(newConversationId());

  // rotate quips
  useEffect(() => {
    const interval = setInterval(() => {
      setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          conversation_id: conversationId.current,
        }),
      });

      if (res.status === 429) {
        const msg =
          RATE_LIMIT_MSGS[Math.floor(Math.random() * RATE_LIMIT_MSGS.length)];
        setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
        return;
      }
      if (!res.ok) {
        const msg = ERROR_MSGS[Math.floor(Math.random() * ERROR_MSGS.length)];
        setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch {
      const msg = ERROR_MSGS[Math.floor(Math.random() * ERROR_MSGS.length)];
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
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
          onClick={() => {
            setOpen(true);
            track('chat_open');
          }}
          class="w-12 h-12 rounded-full shadow-lg shadow-fox/25 flex items-center justify-center hover:scale-110 transition-all overflow-hidden border-2 border-fox"
          aria-label="Open chat"
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
    <div class="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-[340px] max-h-[min(520px,calc(100vh-2rem))] bg-surface border border-heading/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* header */}
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <div class="flex items-center gap-2">
          <img
            src={FOXBOT_SRC}
            alt=""
            width={48}
            height={48}
            decoding="async"
            class="w-6 h-6 rounded-full"
          />
          <span class="text-heading text-sm font-semibold">
            semyon&apos;s assistant
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          class="text-dim hover:text-heading transition-colors text-sm"
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      {/* messages */}
      <div class="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              class={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white text-black rounded-br-none'
                  : 'bg-border text-heading/80 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div class="flex justify-start">
            <div class="bg-border text-heading/40 px-3 py-2 rounded-xl rounded-bl-none text-xs">
              typing...
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* input */}
      <div class="border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="type a message..."
          class="flex-1 bg-border rounded-lg px-3 py-2 text-xs text-heading placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-fox/25"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          class="bg-white text-black font-semibold text-xs px-3 py-2 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-40"
        >
          send
        </button>
      </div>
    </div>
  );
}
