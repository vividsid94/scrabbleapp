const { createClient } = require('@supabase/supabase-js');

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

    // Fetch leave values for the given leaves
    const { data, error } = await supabase
      .from('quackle_leaves')
      .select('leave, value')
      .in('leave', uniqueLeaves);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Retrieved data from Supabase:', data);

    // Convert the array of objects to a map of word -> leave_value
    const leaveValues = {};
    for (const [word, leave] of Object.entries(leaves)) {
      const leaveData = data.find(d => d.leave === leave);
      if (leaveData) {
        leaveValues[word] = leaveData.value;
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