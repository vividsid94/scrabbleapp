const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Auth check
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const { submissionId, status, notes } = JSON.parse(event.body);

    if (!submissionId || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Submission ID and status are required' })
      };
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid status' })
      };
    }

    // Update submission
    const { data, error, count } = await supabase
      .from('game_submissions')
      .update({
        status,
        notes: notes || '',
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    if (count === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Submission not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Submission updated successfully',
        updated: true
      })
    };

  } catch (error) {
    console.error('Error updating submission:', error);
    
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