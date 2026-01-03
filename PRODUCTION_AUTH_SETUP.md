# Production Authentication Setup Checklist

## 1. Supabase Dashboard Configuration

### Site URL
1. Go to **Authentication → URL Configuration** in Supabase Dashboard
2. Set **Site URL** to your production URL: `https://your-site.netlify.app`
3. Or use your custom domain if configured

### Redirect URLs
Add these URLs to the **Redirect URLs** list:
- `https://your-site.netlify.app/**`
- `https://your-site.netlify.app`
- `https://your-site.netlify.app/*`
- If using custom domain: `https://yourdomain.com/**`

**Important**: The `/**` wildcard allows all paths on your domain.

### Email Provider
1. Go to **Authentication → Providers → Email**
2. Ensure **Email** provider is enabled
3. Configure email templates if needed

## 2. Netlify Environment Variables

### Required Variables
Set these in **Netlify Dashboard → Site Settings → Environment Variables**:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Important Notes
- ⚠️ **React environment variables are build-time only**
- After adding/changing env vars, you **MUST redeploy** your site
- Variable names must start with `REACT_APP_` to be accessible in React
- Values are case-sensitive

### How to Redeploy
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Or push a new commit to trigger automatic deploy

## 3. Testing Checklist

After configuration:
- [ ] Environment variables set in Netlify
- [ ] Site redeployed after env var changes
- [ ] Site URL configured in Supabase
- [ ] Redirect URLs added in Supabase
- [ ] Email provider enabled
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Check browser console for errors

## 4. Common Issues

### "Invalid redirect URL"
- **Fix**: Add your production URL to Supabase Redirect URLs list
- Include both `https://your-site.netlify.app` and `https://your-site.netlify.app/**`

### "Environment variables not working"
- **Fix**: Redeploy site after adding env vars (they're build-time)
- Verify variable names start with `REACT_APP_`
- Check Netlify build logs to confirm vars are being read

### "CORS errors"
- **Fix**: Usually means redirect URL not configured in Supabase
- Add production URL to Supabase Redirect URLs

### "Session not persisting"
- **Fix**: Check that `persistSession: true` is set in supabase.js (already configured)
- Clear browser cache/cookies and try again

## 5. Debugging

### Check Browser Console
Look for errors like:
- `Invalid redirect URL`
- `CORS policy blocked`
- `Environment variables not set`

### Check Netlify Build Logs
1. Go to **Deploys** → Click on latest deploy
2. Check **Build log** for environment variable warnings
3. Look for: `Supabase environment variables are not set`

### Verify Environment Variables
Add temporary logging (remove after debugging):
```javascript
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('Has key:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
```

## 6. Quick Fix Steps

1. ✅ Add production URL to Supabase Redirect URLs
2. ✅ Set Site URL in Supabase
3. ✅ Verify env vars in Netlify (with `REACT_APP_` prefix)
4. ✅ **Redeploy site** (critical!)
5. ✅ Test authentication flow
6. ✅ Check browser console for errors

