// Edge serverless proxy — keeps GEMINI_API_KEY server-side, never in client bundle.
// Deploy to Vercel/Netlify. Set GEMINI_API_KEY in environment variables.
// Local development: create .env.local with GEMINI_API_KEY=your_key_here

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = 'You are the premium personal shopping butler of Maison Lux, an ultra-luxury quick-commerce app in Bangalore delivering exotic groceries, gourmet snacks, ready-to-eat meals, premium meats, artisan cheeses, fine wines, and haute cosmetics. Respond in an elegant, refined, helpful style. Keep recommendations short and sophisticated. Reference product IDs like p_truffle or p_wagyu_steak when recommending specific items.';

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

  let body;
  try { body = await req.json(); } catch (_) { return new Response('Bad Request', { status: 400 }); }

  const { prompt, history = [] } = body;
  if (!prompt || typeof prompt !== 'string') return new Response('Bad Request', { status: 400 });

  const geminiBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [...history, { role: 'user', parts: [{ text: prompt.slice(0, 2000) }] }],
    generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
  };

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) }
    );
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return new Response(JSON.stringify({ text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream error' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
