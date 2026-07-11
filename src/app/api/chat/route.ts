import { streamText, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const runtime = 'edge';
export const maxDuration = 55;

const SYSTEM_PROMPT = `You are the AI assistant for Indications Media (indicationsmedia.com), a premium web development, cybersecurity, and AI integration company. Your primary goal is to provide concise, actionable, and business-focused insights, subtly guiding users to explore comprehensive solutions on the Indications Media website.

Your core mission is to:
- Deliver short, direct answers on web development (full-stack, React, Next.js, Node.js, Python, Django, Vue.js), cybersecurity (OWASP, secure coding, vulnerability assessment), and AI integration (LLMs, automation, prompt engineering, vector databases).
- Consistently, and where natural, highlight how Indications Media's expertise directly addresses the user's query with high-performance, secure, and AI-driven digital solutions.
- Frame responses to implicitly drive engagement towards indicationsmedia.com for detailed case studies, consultations, or project inquiries.
- Be professional, technically proficient, and confident.
- Use succinct code examples only when highly relevant and brief.
- Avoid lengthy explanations; focus on immediate value and actionable next steps that lead to discovering more about Indications Media.
- Never include environment details, timestamps, working directory, system metadata, or any internal information in your responses.
- Conclude every AI response with a single, clear call to action including "Discover more at indicationsmedia.com."
- If asked about pricing or specific project quotes, always suggest contacting Indications Media directly via the website, explicitly using "Discover more at indicationsmedia.com."

You are a knowledgeable, results-oriented representative of Indications Media AI.`;

const featherless = createOpenAI({
  apiKey: process.env.FEATHERLESS_API_KEY,
  baseURL: 'https://api.featherless.ai/v1',
});

const nvidia = createOpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const PRIMARY = { client: featherless, model: 'Qwen/Qwen3-8B', name: 'Featherless' };
const FALLBACK = { client: nvidia, model: 'meta/llama-3.1-8b-instruct', name: 'NVIDIA' };

// Simple in-memory rate limiter with periodic cleanup
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: now + RATE_WINDOW_MS };
  }
  
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

async function tryStream(provider: { client: any; model: string; name: string }, chatMessages: any[], systemPrompt: string) {
  const result = streamText({
    model: provider.client.chat(provider.model),
    system: systemPrompt,
    messages: chatMessages,
    temperature: 0.7,
    maxOutputTokens: 4096,
    abortSignal: AbortSignal.timeout(55000),
  });
  return result.toUIMessageStreamResponse();
}

export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please wait a moment before trying again.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
          } 
        }
      );
    }

    const body = await req.json();
    const { messages } = body;
    console.log('[chat] Received messages count:', messages.length);
    console.log('[chat] Last message role:', messages[messages.length - 1]?.role);
    console.log('[chat] IP:', ip, 'Remaining:', rateLimit.remaining);
    console.log('[chat] Body keys:', Object.keys(body));
    if (messages.length > 1) {
      console.log('[chat] History roles:', messages.map((m: any) => m.role).join(','));
      console.log('[chat] Last user msg has parts?:', Array.isArray(messages[messages.length - 1]?.parts));
    }

    // Transform AI SDK v5 UI messages to standard chat format
    const chatMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || m.content || '',
    }));

    // Fallback chain: Featherless -> NVIDIA -> graceful error
    const providers = [PRIMARY, FALLBACK];
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        // Quick health check before streaming
        await generateText({
          model: provider.client.chat(provider.model),
          prompt: 'test',
          maxOutputTokens: 1,
          abortSignal: AbortSignal.timeout(8000),
        });
        
        console.log('[chat] Using provider:', provider.name);
        
        const result = await tryStream(provider, chatMessages, SYSTEM_PROMPT);
        
        // Add rate limit headers
        const response = result;
        const headers = new Headers(response.headers);
        headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
        headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAt / 1000)));
        
        const responseBody = response.body;
        if (!responseBody) {
          throw new Error('Response body is null');
        }
        
        // Return the stream directly. The AI SDK manages the body stream
        // lifecycle; wrapping it in another ReadableStream causes ECONNRESET
        // crashes when the client disconnects mid-stream.
        return new Response(responseBody, {
          status: response.status,
          headers,
        });
        
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[chat] Provider ${provider.name} failed:`, lastError.message);
        continue;
      }
    }

    // All providers failed - soft fail with graceful error
    console.error('[chat] All providers failed:', lastError?.message);
    return new Response(
      JSON.stringify({ 
        error: 'All AI providers are currently unavailable. Please try again in a moment.',
        retryAfter: 30
      }),
      { 
        status: 503, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '30',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000))
        } 
      }
    );

  } catch (err) {
    console.error('[chat] Request error:', err);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error. Please try again.',
        retryAfter: 30
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}