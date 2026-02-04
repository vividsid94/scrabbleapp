const { createClient } = require('@supabase/supabase-js');

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      // Same-origin in Netlify, but keep CORS safe for local dev.
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json(500, {
      error: 'Server auth is not configured',
      missing: {
        SUPABASE_URL: !supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !serviceRoleKey,
        SUPABASE_ANON_KEY: !anonKey,
      },
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const username = (body.username || '').trim().toLowerCase();
  const password = body.password || '';

  if (!username || !password) {
    return json(400, { error: 'Username and password are required' });
  }

  // Username is normalized to lowercase for lookup, but allow user input to be mixed-case.
  const rawUsername = (body.username || '').trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(rawUsername)) {
    return json(400, { error: 'Invalid username format' });
  }

  // Admin client (service role) to look up the auth user by profile id.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  // 1) Find profile by username -> user id
  // IMPORTANT: do NOT use (i)like for "exact" matches because '_' is a wildcard in SQL LIKE patterns.
  // We store usernames normalized to lowercase on signup, and we normalize input to lowercase above.
  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (profileError) {
    console.error('usernameLogin: profile lookup failed', {
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
    });
    return json(500, { error: 'Profile lookup failed' });
  }

  if (!profile?.id) {
    // Don’t leak which part is wrong.
    return json(401, { error: 'Invalid username or password' });
  }

  // 2) Fetch user email from auth.users via admin API
  const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(profile.id);
  if (userErr || !userRes?.user?.email) {
    return json(401, { error: 'Invalid username or password' });
  }

  const email = userRes.user.email;

  // 3) Perform password grant against GoTrue to get tokens
  const tokenUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;

  let tokenJson;
  let tokenOk = false;
  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    tokenJson = await res.json().catch(() => ({}));
    tokenOk = res.ok;
  } catch {
    return json(500, { error: 'Auth service unreachable' });
  }

  if (!tokenOk) {
    return json(401, { error: 'Invalid username or password' });
  }

  return json(200, {
    access_token: tokenJson.access_token,
    refresh_token: tokenJson.refresh_token,
    expires_in: tokenJson.expires_in,
    token_type: tokenJson.token_type,
    user: tokenJson.user,
  });
};

