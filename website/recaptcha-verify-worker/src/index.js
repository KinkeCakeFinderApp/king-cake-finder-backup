// King Cake Finder — reCAPTCHA server-side verification worker.
//
// The website's checkbox (src/components/Recaptcha.jsx) only produces a
// token client-side; Google requires a SEPARATE server-side call (with the
// secret key) to actually verify that token before trusting it. This worker
// is that server — it's the only backend this project has, on purpose kept
// tiny and stateless.
//
// Only allowed origins may call this, and it does nothing except forward a
// token to Google and relay a plain ok/not-ok back — the secret key never
// reaches the browser.

const ALLOWED_ORIGINS = [
  'https://king-cake-app.web.app',
  'http://localhost:5173', // Vite dev server
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405, headers });
    }

    let token;
    try {
      const body = await request.json();
      token = body && body.token;
    } catch (e) {
      return Response.json({ ok: false, error: 'invalid_json' }, { status: 400, headers });
    }

    if (!token || typeof token !== 'string') {
      return Response.json({ ok: false, error: 'missing_token' }, { status: 400, headers });
    }

    if (!env.RECAPTCHA_SECRET) {
      return Response.json({ ok: false, error: 'server_misconfigured' }, { status: 500, headers });
    }

    const params = new URLSearchParams({
      secret: env.RECAPTCHA_SECRET,
      response: token,
    });
    const remoteIp = request.headers.get('CF-Connecting-IP');
    if (remoteIp) params.set('remoteip', remoteIp);

    let googleResult;
    try {
      const googleRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      googleResult = await googleRes.json();
    } catch (e) {
      return Response.json({ ok: false, error: 'verification_request_failed' }, { status: 502, headers });
    }

    return Response.json({ ok: !!googleResult.success }, { status: 200, headers });
  },
};
