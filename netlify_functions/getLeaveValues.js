const { createClient } = require('@supabase/supabase-js');

// Cache for leave values
const leaveCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Received request for leave values');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request body
    const { leaves } = JSON.parse(event.body);
    console.log('Requested leaves:', leaves);

    if (!leaves || typeof leaves !== 'object') {
      console.error('Invalid request: leaves is not an object');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Leaves must be an object' })
      };
    }

    // Get unique leave values
    const uniqueLeaves = [...new Set(Object.values(leaves))].sort();
    console.log('Unique leaves:', uniqueLeaves);

    // Check cache first
    const uncachedLeaves = uniqueLeaves.filter(leave => {
      const cached = leaveCache.get(leave);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return false;
      }
      return true;
    });

    let leaveValues = {};
    
    // If we have uncached leaves, fetch them from the database
    if (uncachedLeaves.length > 0) {
      const { data, error } = await supabase
        .from('quackle_leaves')
        .select('leave, value')
        .in('leave', uncachedLeaves);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Update cache with new values
      data.forEach(item => {
        leaveCache.set(item.leave, {
          value: item.value,
          timestamp: Date.now()
        });
      });
    }

    // Build response using cache
    for (const [word, leave] of Object.entries(leaves)) {
      const cached = leaveCache.get(leave);
      if (cached) {
        leaveValues[word] = cached.value;
      } else {
        // If not in cache, try to fetch it directly
        const { data, error } = await supabase
          .from('quackle_leaves')
          .select('value')
          .eq('leave', leave)
          .single();

        if (!error && data) {
          leaveValues[word] = data.value;
          // Cache the value for future use
          leaveCache.set(leave, {
            value: data.value,
            timestamp: Date.now()
          });
        }
      }
    }

    console.log('Sending response with leave values:', leaveValues);

    return {
      statusCode: 200,
      body: JSON.stringify({ leaveValues })
    };
  } catch (error) {
    console.error('Error in getLeaveValues function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 