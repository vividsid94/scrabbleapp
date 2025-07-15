const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { gameUrl, gameType, submittedBy } = JSON.parse(event.body);

    // Validate required fields
    if (!gameUrl || !gameType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Game URL and type are required' })
      };
    }

    // Validate URL format
    const crossTablesPattern = /^https?:\/\/(?:www\.)?cross-tables\.com\/results\.html\?.*$/;
    const wooglesPattern = /^https?:\/\/(?:www\.)?woogles\.io\/game\/[a-zA-Z0-9-]+$/;
    
    if (!crossTablesPattern.test(gameUrl) && !wooglesPattern.test(gameUrl)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid game URL format' })
      };
    }

    // Check if this game has already been submitted
    const { data: existingSubmission, error: checkError } = await supabase
      .from('game_submissions')
      .select('id')
      .eq('game_url', gameUrl)
      .single();

    if (existingSubmission) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'This game has already been submitted' })
      };
    }

    // Create submission
    const { data: submission, error: insertError } = await supabase
      .from('game_submissions')
      .insert({
        game_url: gameUrl,
        game_type: gameType,
        submitted_by: submittedBy || 'anonymous',
        ip_address: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Game submitted successfully',
        submissionId: submission.id,
        status: 'pending'
      })
    };

  } catch (error) {
    console.error('Error submitting game:', error);
    
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