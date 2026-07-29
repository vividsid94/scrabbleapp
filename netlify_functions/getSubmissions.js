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
    // Basic auth check - you might want to implement proper authentication
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.split(' ')[1];
    // Simple token check - replace with proper JWT validation
    if (token !== process.env.ADMIN_TOKEN) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Get query parameters
    const { status, limit = 50, skip = 0 } = event.queryStringParameters || {};

    // Build query
    let query = supabase
      .from('game_submissions')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: false })
      .range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    // Get submissions
    const { data: submissions, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        submissions,
        totalCount: count,
        hasMore: count > parseInt(skip) + submissions.length
      })
    };

  } catch (error) {
    console.error('Error getting submissions:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}; 