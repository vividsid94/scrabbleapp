// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rhchcvppudekwvcxtwmm.supabase.co';  // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoY2hjdnBwdWRla3d2Y3h0d21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODI3MzIsImV4cCI6MjA1Mzk1ODczMn0.L01t2t0CMYQy4_TQPn_ujhfmiNt3NKCeDqV_Z0SG2Yg';  // Replace with your anon key
export const supabase = createClient(supabaseUrl, supabaseKey);
