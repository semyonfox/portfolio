import { useState, useRef, useEffect } from 'preact/hooks';

const CHAT_API = import.meta.env.PUBLIC_CHAT_API_URL || '/api/chat';

const QUIPS = [
  "need help finding something?",
  "click me if you're lost",
  "i know things about semyon",
  "bored? ask me anything",
  "hey, over here!",
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "yo! what do you want to know about me or my projects?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quip, setQuip] = useState(QUIPS[0]);
  const messagesEnd = useRef<HTMLDivElement>(null);

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
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!res.ok) throw new Error('chat error');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "my brain isn't connected yet -- the rust backend is coming soon!",
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div class="fixed bottom-5 right-5 z-50 flex items-end gap-2">
        <div class="bg-surface border border-heading/10 rounded-xl rounded-br-none px-3 py-2 text-[11px] text-heading/70 max-w-[180px] shadow-lg mb-1">
          {quip}
        </div>
        <button
          onClick={() => setOpen(true)}
          class="w-12 h-12 rounded-full shadow-lg shadow-fox/25 flex items-center justify-center hover:scale-110 transition-all overflow-hidden border-2 border-fox"
          aria-label="Open chat"
        >
          <img src="/foxbot.png" alt="Chat with Semyon" class="w-full h-full object-cover scale-125" />
        </button>
      </div>
    );
  }

  return (
    <div class="fixed bottom-6 right-6 z-50 w-[340px] max-h-[480px] bg-surface border border-heading/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* header */}
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <div class="flex items-center gap-2">
          <img src="/foxbot.png" alt="" class="w-6 h-6 rounded-full" />
          <span class="text-heading text-sm font-semibold">ask semyon</span>
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
          <div key={i} class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div class={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-white text-black rounded-br-none'
                : 'bg-border text-heading/80 rounded-bl-none'
            }`}>
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
