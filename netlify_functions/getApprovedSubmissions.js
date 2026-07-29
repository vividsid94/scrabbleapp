const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get query parameters
    const { limit = 50, skip = 0 } = event.queryStringParameters || {};

    // Build query - only get approved submissions
    let query = supabase
      .from('game_submissions')
      .select('*', { count: 'exact' })
      .eq('status', 'approved') // Only approved submissions
      .order('submitted_at', { ascending: false })
      .range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1);

    // Get submissions
    const { data: submissions, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        submissions,
        totalCount: count,
        hasMore: count > parseInt(skip) + submissions.length
      })
    };

  } catch (error) {
    console.error('Error getting approved submissions:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}; 