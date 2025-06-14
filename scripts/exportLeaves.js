require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function exportLeaves() {
  console.log('Starting leaves export...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const batchSize = 1000;
    let offset = 0;
    let allLeaves = [];
    let hasMore = true;

    // Fetch leaves in batches
    while (hasMore) {
      console.log(`Fetching leaves ${offset} to ${offset + batchSize}...`);
      
      const { data, error } = await supabase
        .from('quackle_leaves')
        .select('leave, value')
        .range(offset, offset + batchSize - 1);

      if (error) {
        throw error;
      }

      if (data.length === 0) {
        hasMore = false;
      } else {
        allLeaves = allLeaves.concat(data);
        offset += batchSize;
      }
    }

    // Convert array to key-value object
    const leaves = {};
    allLeaves.forEach(item => {
      leaves[item.leave] = item.value;
    });

    // Save to JSON file
    const outputPath = path.join(__dirname, '../netlify_functions/leaves.json');
    fs.writeFileSync(outputPath, JSON.stringify(leaves, null, 2));
    
    console.log(`Successfully exported ${Object.keys(leaves).length} leaves to ${outputPath}`);
  } catch (error) {
    console.error('Failed to export leaves:', error);
    process.exit(1);
  }
}

exportLeaves(); 