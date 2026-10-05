export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// retain the visible transcript, but send only bounded recent context
export function chatRequest(
  history: Message[],
  message: Message,
): string | undefined {
  const encoder = new TextEncoder();
  if (encoder.encode(message.content).length > 4000) return;
  const messages = [message];
  let body = JSON.stringify({ messages });
  if (encoder.encode(body).length > 16 * 1024) return;
  for (const previous of history.slice(-4).reverse()) {
    if (encoder.encode(previous.content).length > 4000) break;
    const candidate = JSON.stringify({ messages: [previous, ...messages] });
    if (encoder.encode(candidate).length > 16 * 1024) break;
    messages.unshift(previous);
    body = candidate;
  }
  return body;
}
