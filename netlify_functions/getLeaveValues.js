const fs = require('fs');
const path = require('path');

// Cache for leave values
const leaveCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Load leaves from JSON file
let leaves = null;
try {
  const leavesPath = path.join(__dirname, 'leaves.json');
  leaves = JSON.parse(fs.readFileSync(leavesPath, 'utf8'));
  console.log('Loaded leaves from JSON file');
} catch (err) {
  console.error('Failed to load leaves:', err);
  throw err;
}

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
    
    // Parse the request body
    const { leaves: requestedLeaves } = JSON.parse(event.body);
    console.log('Requested leaves:', requestedLeaves);

    if (!requestedLeaves || typeof requestedLeaves !== 'object') {
      console.error('Invalid request: leaves is not an object');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Leaves must be an object' })
      };
    }

    // Get unique leave values
    const uniqueLeaves = [...new Set(Object.values(requestedLeaves))].sort();
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
    
    // If we have uncached leaves, get them from the JSON object
    if (uncachedLeaves.length > 0) {
      uncachedLeaves.forEach(leave => {
        const value = leaves[leave];
        if (value !== undefined) {
          leaveCache.set(leave, {
            value,
            timestamp: Date.now()
          });
        }
      });
    }

    // Build response using cache
    for (const [word, leave] of Object.entries(requestedLeaves)) {
      const cached = leaveCache.get(leave);
      if (cached) {
        leaveValues[word] = cached.value;
      } else {
        // If not in cache, get it directly from the JSON object
        const value = leaves[leave];
        if (value !== undefined) {
          leaveValues[word] = value;
          // Cache the value for future use
          leaveCache.set(leave, {
            value,
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