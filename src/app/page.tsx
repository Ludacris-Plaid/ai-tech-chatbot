'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import AnimatedLogo from './components/AnimatedLogo';
import GlitchTitle from './components/GlitchTitle';

const SUGGESTIONS = [
  { icon: '⚡', text: 'How can Indications Media AI transform my business?' },
  { icon: '🔒', text: 'What cybersecurity solutions does Indications Media offer?' },
  { icon: '🚀', text: 'How does Indications Media build AI-driven web apps?' },
  { icon: '🛡️', text: 'Can Indications Media help with secure Node.js development?' },
  { icon: '💎', text: 'What services does Indications Media specialize in?' },
  { icon: '🧠', text: 'How does Indications Media leverage vector databases for RAG?' },
];

function linkIndicationsDomain(text: string): string {
  // Convert bare indicationsmedia.com to a markdown link, avoiding double-linking
  // when it's already inside markdown link syntax [...], URL protocol (https://), or wrapped in (...) / [...]
  return text.replace(/(?<![\[(\/:.])indicationsmedia\.com(?![\]\)])/gi, '[indicationsmedia.com](https://indicationsmedia.com)');
}

function splitReasoning(fullText: string): { reasoning: string; response: string } {
  if (!fullText) return { reasoning: '', response: '' };
  const closedMatch = fullText.match(/^\s*<think>([\s\S]*?)<\/think>\s*/i);
  if (closedMatch) {
    return {
      reasoning: closedMatch[1].trim(),
      response: fullText.slice(closedMatch[0].length).trim(),
    };
  }
  const openMatch = fullText.match(/^\s*<think>([\s\S]*)/i);
  if (openMatch) {
    return {
      reasoning: openMatch[1].trim(),
      response: '',
    };
  }
  return { reasoning: '', response: fullText };
}

function processLinks(text: string): React.ReactNode[] {
  const cleaned = text.replace(/<environment_details>[\s\S]*?<\/environment_details>/gi, '').trim();
  const nodes: React.ReactNode[] = [];
  const urlRegex = /(https?:\/\/[^\s$.?#].[^\s]*|indicationsmedia\.com)/gi;
  const indicationsMediaDomain = "indicationsmedia.com";

  let lastIndex = 0;
  let matches;
  const urlMatches: { url: string; index: number; length: number }[] = [];

  while ((matches = urlRegex.exec(cleaned)) !== null) {
    urlMatches.push({
      url: matches[0],
      index: matches.index,
      length: matches[0].length,
    });
  }

  let lastIndicationsMediaMatch: { url: string; index: number; length: number } | null = null;
  for (let i = urlMatches.length - 1; i >= 0; i--) {
    if (urlMatches[i].url.includes(indicationsMediaDomain)) {
      lastIndicationsMediaMatch = urlMatches[i];
      break;
    }
  }

  for (const match of urlMatches) {
    if (match.index > lastIndex) {
      nodes.push(cleaned.substring(lastIndex, match.index));
    }

    const href = match.url.startsWith('http') ? match.url : `https://${match.url}`;

    if (match === lastIndicationsMediaMatch) {
      nodes.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-im-green hover:underline font-bold transition-colors duration-200"
        >
          {match.url}
        </a>
      );
    } else {
      if (!match.url.includes(indicationsMediaDomain)) {
        nodes.push(
          <a
            key={match.index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-im-green hover:underline opacity-80 transition-colors duration-200"
          >
            {match.url}
          </a>
        );
      }
    }
    lastIndex = match.index + match.length;
  }

  if (lastIndex < cleaned.length) {
    nodes.push(cleaned.substring(lastIndex));
  }

  return nodes;
}

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, regenerate, stop, setMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, followUps]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') {
        const text = last.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '';
        // Extract meaningful follow-ups from actual response content, not reasoning or links
        const responseOnly = text.replace(/^.*?<\/think>\s*/i, '').trim();
        const lines = responseOnly.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 10 && l.length < 120 && !l.match(/^(discover|learn more|visit|http|indicationsmedia\.com)/i));
        const chips = lines.slice(0, 3).map(l => l.replace(/^[-*\s]+/, '').trim()).filter(Boolean);
        setFollowUps(chips);
      }
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (text: string) => {
    if (isLoading) return;
    setShowSuggestions(false);
    sendMessage({ text });
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exportChat = () => {
    let md = '# Indications Media AI Chat\n\n';
    messages.forEach((m) => {
      const role = m.role === 'user' ? '**You**' : '**indications-ai**';
      const content = m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '';
      md += `${role}:\n\n${content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'indications-media-chat.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLatency = (m: any) => {
    if (m.role !== 'assistant') return null;
    const created = (m as any).createdAt;
    if (!created) return null;
    const diff = Date.now() - created;
    if (diff < 1000) return `${diff}ms`;
    return `${(diff / 1000).toFixed(1)}s`;
  };

  return (
    <div className="relative z-10 flex flex-col h-screen font-sans">
      <header className="glass-strong shimmer-border border-b border-im-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AnimatedLogo showText={false} />
            <div>
              <h1 className="text-base font-semibold text-im-text tracking-tight">
                <GlitchTitle text="indications-ai" variant="header" />
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-im-text-dim">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-im-green opacity-75 animate-ping" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-im-green" />
                </span>
                <span className="font-mono">online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMessages([])}
              className="hidden sm:flex items-center gap-1.5 text-xs text-im-text-dim hover:text-im-green transition font-mono cursor-pointer"
              title="Clear Chat History"
            >
              <span>clear chat</span>
              <span>⟲</span>
            </button>
            <button
              onClick={exportChat}
              className="hidden sm:flex items-center gap-1.5 text-xs text-im-text-dim hover:text-im-green transition font-mono cursor-pointer"
              title="Export chat as Markdown"
            >
              <span>export</span>
              <span>↓</span>
            </button>
            <a
              href="https://indicationsmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-im-text-dim hover:text-im-green transition font-mono"
            >
              <span>indicationsmedia.com</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-im-fade-in">
              <div className="mb-6">
                <AnimatedLogo showText={false} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 font-mono">
                <GlitchTitle text="indications-ai" variant="hero" />
              </h2>
              <p className="text-im-text-dim max-w-md mb-2 text-sm sm:text-base">
                Web dev, AI integration, and cybersecurity expertise — on demand.
              </p>
              <p className="text-im-text-dim max-w-md mb-8 text-xs font-mono opacity-70">
                {'> '}indicationsmedia.com
              </p>
              {showSuggestions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(s.text)}
                      className="glass suggestion-card rounded-lg px-4 py-3 text-left text-sm text-im-text-dim hover:text-im-text font-mono"
                    >
                      <span className="mr-2 text-im-green">{s.icon}</span>
                      {s.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m, index) => {
            const text =
              m.parts
                ?.filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('') || '';
            const { reasoning, response } =
              m.role === 'assistant' ? splitReasoning(text) : { reasoning: '', response: text };
            const isUser = m.role === 'user';

            return (
              <div
                key={m.id}
                className={`flex animate-im-fade-in ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                    isUser ? 'bubble-user' : 'bubble-ai'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isUser ? 'text-im-green' : 'text-im-text-dim'
                      }`}
                    >
                      {isUser ? '> anon' : '> indications-ai'}
                    </span>
                    <span className="text-xs text-im-text-dim font-mono opacity-60">
                      {new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </span>
                    {!isUser && getLatency(m) && (
                      <span className="text-[10px] text-im-text-dim font-mono opacity-50 ml-auto">
                        {getLatency(m)}
                      </span>
                    )}
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(text, m.id)}
                        className="text-[10px] text-im-text-dim hover:text-im-green transition font-mono opacity-50 hover:opacity-100"
                        title="Copy response"
                      >
                        {copiedId === m.id ? 'copied' : 'copy'}
                      </button>
                    )}
                  </div>

                  {!isUser && reasoning && (
                    <details className="reasoning-block">
                      <summary>thinking</summary>
                      <div className="reasoning-body animate-surge">{reasoning}</div>
                    </details>
                  )}

                  <div className="text-im-text whitespace-pre-wrap text-sm leading-relaxed">
                    {isUser ? (
                      <span className="whitespace-pre-wrap">{response}</span>
                    ) : (
                      <div className="markdown-body prose prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-lg !bg-[#0a0f0c] !p-3 !text-xs"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className="bg-im-bg-2/80 border border-im-border rounded px-1.5 py-0.5 text-xs text-im-green" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            a({ href, children }) {
                              const url = typeof children === 'string' ? children : String(children);
                              const isIndications = url.includes('indicationsmedia.com');
                              return (
                                <a
                                  href={href || `https://${url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={isIndications ? 'text-im-green hover:underline font-bold' : 'text-im-green hover:underline opacity-80'}
                                >
                                  {children}
                                </a>
                              );
                            },
                          }}
                        >
                          {linkIndicationsDomain(response)}
                        </ReactMarkdown>
                      </div>
                    )}
                    {!isUser && isLoading && m === messages[messages.length - 1] && (
                      <span className="cursor-blink" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {followUps.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 animate-im-fade-in">
              {followUps.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(chip)}
                  className="glass suggestion-card rounded-full px-3 py-1.5 text-xs text-im-text-dim hover:text-im-text font-mono"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start animate-im-fade-in">
              <div className="bubble-ai max-w-[75%] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-semibold text-im-text-dim">
                    {'>'} indications-ai
                  </span>
                </div>
                <div className="flex items-center gap-1.5 py-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center animate-im-fade-in">
              <div className="glass rounded-lg px-4 py-3 max-w-md text-center border-im-pink">
                <p className="text-sm text-im-pink mb-2 font-mono">⚠ connection error</p>
                <p className="text-xs text-im-text-dim mb-3">
                  {error.message || 'failed to reach the ai'}
                </p>
                <button
                  onClick={() => regenerate()}
                  className="text-xs font-mono text-im-green hover:text-im-green-dim transition"
                >
                  [retry]
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="glass-strong border-t border-im-border pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-im-green font-mono text-sm pointer-events-none">
                {'>'}
              </span>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ask anything..."
                rows={1}
                className="w-full bg-im-bg-2/80 border border-im-border rounded-lg pl-8 pr-4 py-3 text-sm text-im-text placeholder:text-im-text-dim focus:outline-none focus:border-im-green/60 focus:ring-1 focus:ring-im-green/40 transition font-mono resize-none"
                disabled={isLoading}
              />
            </div>
            {isLoading ? (
              <button
                type="button"
                onClick={() => stop()}
                className="px-4 py-3 bg-im-bg-2 border border-im-border rounded-lg text-im-text-dim hover:text-im-pink hover:border-im-pink transition font-mono text-sm"
              >
                stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input?.trim()}
                className="px-4 py-3 bg-im-green text-im-bg rounded-lg font-mono text-sm font-bold btn-glow disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
              >
                send
              </button>
            )}
          </form>
          <div className="mt-2 text-xs text-im-text-dim text-center font-mono opacity-60">
            {'> '}
            <a
              href="https://indicationsmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-im-green hover:text-im-green-dim transition"
            >
              indicationsmedia.com
            </a>
            {' // secured'}
          </div>
        </div>
      </footer>
    </div>
  );
}
