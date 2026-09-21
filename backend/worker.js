// RankPilot API starter for Cloudflare Workers.
// Deploy separately from GitHub Pages. Configure ALLOWED_ORIGIN and YOUTUBE_API_KEY
// as Worker variables/secrets before enabling production traffic.
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "Content-Type" }
});

function validHttpUrl(raw) {
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    if (u.username || u.password) return null;
    // Block localhost and private/reserved host patterns to reduce SSRF risk.
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') ||
        /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h === '[::1]' || h === '::1') return null;
    return u;
  } catch { return null; }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return json({ ok: true });
    const url = new URL(request.url);

    if (url.pathname === '/api/health') return json({ ok: true, service: 'RankPilot API', version: 1 });

    if (url.pathname === '/api/keywords/suggest') {
      const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
      if (!q) return json({ error: 'Missing q query parameter.' }, 400);
      try {
        const upstream = await fetch('https://suggestqueries.google.com/complete/search?client=firefox&q=' + encodeURIComponent(q), {
          headers: { 'accept': 'application/json', 'user-agent': 'RankPilot/1.0' }
        });
        if (!upstream.ok) return json({ error: 'Keyword suggestion provider unavailable.' }, 502);
        const payload = await upstream.json();
        const suggestions = Array.isArray(payload?.[1]) ? [...new Set(payload[1].filter(x => typeof x === 'string'))] : [];
        return json({ source: 'Google autocomplete', metrics: null, notice: 'Suggestions only; no search volume, CPC, or difficulty data is provided.', query: q, suggestions });
      } catch { return json({ error: 'Could not retrieve keyword suggestions.' }, 502); }
    }

    if (url.pathname === '/api/youtube/search') {
      const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
      if (!q) return json({ error: 'Missing q query parameter.' }, 400);
      if (!env.YOUTUBE_API_KEY) return json({ error: 'YouTube Data API key is not configured on the Worker.' }, 503);
      try {
        const endpoint = new URL('https://www.googleapis.com/youtube/v3/search');
        endpoint.search = new URLSearchParams({ part: 'snippet', type: 'video', maxResults: '10', q, key: env.YOUTUBE_API_KEY });
        const upstream = await fetch(endpoint);
        const payload = await upstream.json();
        if (!upstream.ok) return json({ error: payload?.error?.message || 'YouTube provider error.' }, 502);
        return json({ source: 'YouTube Data API', items: (payload.items || []).map(item => ({ videoId: item.id?.videoId, title: item.snippet?.title, channelTitle: item.snippet?.channelTitle, publishedAt: item.snippet?.publishedAt, description: item.snippet?.description })) });
      } catch { return json({ error: 'Could not retrieve YouTube results.' }, 502); }
    }

    if (url.pathname === '/api/audit/fetch' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Send JSON with a url field.' }, 400); }
      const target = validHttpUrl(String(body?.url || ''));
      if (!target) return json({ error: 'Enter a public HTTP(S) URL. Local/private hosts are not allowed.' }, 400);
      try {
        const upstream = await fetch(target.toString(), { redirect: 'manual', headers: { 'user-agent': 'RankPilotAudit/1.0' }, signal: AbortSignal.timeout(8000) });
        if (upstream.status >= 300 && upstream.status < 400) return json({ error: 'Redirected page not fetched; submit the final URL directly.' }, 400);
        const type = upstream.headers.get('content-type') || '';
        if (!upstream.ok) return json({ error: `Target returned HTTP ${upstream.status}.` }, 502);
        if (!type.includes('text/html')) return json({ error: 'Target did not return HTML.' }, 415);
        const html = (await upstream.text()).slice(0, 1_000_000);
        return json({ url: target.toString(), html, truncated: html.length >= 1_000_000 });
      } catch { return json({ error: 'Could not fetch target. It may block automated requests or take too long.' }, 502); }
    }

    return json({ error: 'Not found' }, 404);
  }
};
