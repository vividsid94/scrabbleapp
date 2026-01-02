import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const profileFetchingRef = useRef(false); // Track if we're already fetching
  const lastFetchedUserIdRef = useRef(null); // Track which user we last fetched for

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Got session', { hasSession: !!session, hasUser: !!session?.user });
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        console.log('AuthContext: No session, setting loading to false');
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed', { event, hasSession: !!session, hasUser: !!session?.user });
      setSession(session);
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      // Only fetch profile if user changed and we haven't fetched for this user yet
      if (newUser) {
        if (lastFetchedUserIdRef.current !== newUser.id && !profileFetchingRef.current) {
          await fetchUserProfile(newUser.id);
        }
      } else {
        console.log('AuthContext: No user in session, clearing profile and setting loading to false');
        setProfile(null);
        setLoading(false);
        lastFetchedUserIdRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Only run once on mount

  const fetchUserProfile = async (userId) => {
    // Prevent multiple simultaneous fetches for the same user
    if (profileFetchingRef.current || lastFetchedUserIdRef.current === userId) {
      console.log('AuthContext: Already fetched or fetching profile for this user, skipping');
      // Still ensure loading is false if we're skipping
      setLoading(false);
      return;
    }
    
    console.log('AuthContext: fetchUserProfile called for', userId);
    profileFetchingRef.current = true;
    lastFetchedUserIdRef.current = userId;
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 2000)
      );
      
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      console.log('AuthContext: Profile fetch result', { data, error });

      if (error) {
        // If profile doesn't exist yet, that's okay - it will be created by the trigger
        if (error.code === 'PGRST116' || error.message === 'Profile query timeout') {
          console.log('Profile not found yet or timeout, will be created automatically');
          setProfile(null);
        } else {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        }
      } else {
        console.log('AuthContext: Setting profile', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      // On error or timeout, set profile to null and continue
      setProfile(null);
    } finally {
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
      profileFetchingRef.current = false;
    }
  };

  const signUp = async (email, password, username, displayName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
            display_name: displayName || username || email.split('@')[0],
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const refreshProfile = async () => {
    if (!user) return { error: 'Not authenticated' };
    
    // Reset the fetching state so we can fetch again
    lastFetchedUserIdRef.current = null;
    profileFetchingRef.current = false;
    
    // Don't set loading to true for refresh - let the Profile page handle its own loading
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found yet, will be created automatically');
          setProfile(null);
        } else {
          console.error('Error refreshing user profile:', error);
          setProfile(null);
        }
      } else {
        console.log('AuthContext: Refreshed profile', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Exception refreshing user profile:', error);
      setProfile(null);
    }
    
    return { error: null };
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

