# User Accounts Setup Guide

Phase 1 of the user accounts system is now complete! Here's what was built and how to set it up.

## What's Included

✅ **Database Schema**
- `user_profiles` table (extends auth.users)
- `user_stats` table (tracks game statistics)
- Automatic profile creation on signup
- Row Level Security (RLS) policies

✅ **Authentication**
- Sign up / Sign in / Sign out
- Session management
- User profile management

✅ **Stats Tracking**
- Games played, won, lost
- Total points, average score, best score
- Automatic tracking when games end in Play mode

✅ **UI Components**
- Auth modal (sign in/sign up)
- User menu in Sidenav
- Profile page with stats display

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file (or Netlify environment variables):

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project dashboard under Settings > API.

### 2. Run Database Migration

Run the migration file in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250101000000_create_user_profiles_and_stats.sql`
4. Run the migration

This will create:
- `user_profiles` table
- `user_stats` table
- RLS policies
- Triggers for automatic profile creation

### 3. Enable Email Auth in Supabase

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable "Email" provider
3. Configure email settings (you can use Supabase's default email service for testing)

### 4. Test It Out!

1. Start your app: `npm start`
2. Click the user icon in the Sidenav
3. Sign up with an email and password
4. Play a game in Play mode
5. Check your stats at `/profile`

## Features

### Authentication
- **Sign Up**: Create account with email, password, username, and optional display name
- **Sign In**: Login with email and password
- **Sign Out**: Logout from account
- **Session Persistence**: Stays logged in across page refreshes

### Stats Tracking
Stats are automatically updated when:
- A game ends in Play mode (bot games only)
- User wins or loses
- Final score is recorded

Tracked stats:
- Games played
- Games won
- Games lost
- Total points
- Average score
- Best score
- Win rate (calculated)

### Profile Page
Visit `/profile` to see:
- Display name and username
- All your game statistics
- Beautiful stat cards with icons

## Next Steps (Phase 2)

Future enhancements could include:
- Leaderboards
- Game history
- Achievements/badges
- More detailed stats (best move, average move time, etc.)
- Social features (friends, challenges)

## Troubleshooting

**"Supabase environment variables are not set"**
- Make sure `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are set
- Restart your dev server after adding env variables

**"Error fetching user profile"**
- Make sure the migration ran successfully
- Check that RLS policies are enabled
- Verify your Supabase project URL and key are correct

**Stats not updating**
- Make sure you're logged in
- Stats only track bot games in Play mode (not Puzzle mode yet)
- Check browser console for errors

## Files Created

- `supabase/migrations/20250101000000_create_user_profiles_and_stats.sql` - Database schema
- `src/utils/supabase.js` - Supabase client
- `src/contexts/AuthContext.js` - Auth context and provider
- `src/components/Auth/AuthModal.js` - Login/signup modal
- `src/utils/stats.js` - Stats tracking functions
- `src/containers/Profile/Profile.js` - Profile page
- `src/containers/Profile/Profile.module.css` - Profile styles

## Files Modified

- `src/App.js` - Added AuthProvider wrapper
- `src/components/AppContent/Sidenav/Sidenav.js` - Added user menu
- `src/stores/gameStore.js` - Added stats tracking on game end

Enjoy your new user accounts system! 🎉

