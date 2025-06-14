require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function exportDictionary() {
  console.log('Exporting dictionary from Supabase...');
  
  try {
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;
    let allWords = [];

    while (hasMore) {
      console.log(`Fetching batch starting at offset ${offset}...`);
      const { data: words, error } = await supabase
        .from('dictionary')
        .select('word')
        .order('word')
        .range(offset, offset + batchSize - 1);

      if (error) {
        throw error;
      }

      if (!words || words.length === 0) {
        hasMore = false;
      } else {
        allWords = allWords.concat(words.map(entry => entry.word));
        offset += batchSize;
        console.log(`Loaded ${allWords.length} words so far...`);
      }
    }

    console.log(`Found total of ${allWords.length} words`);

    // Save to dictionary.json
    const outputPath = path.join(__dirname, '../netlify_functions/dictionary.json');
    fs.writeFileSync(outputPath, JSON.stringify(allWords, null, 2));
    console.log(`Saved ${allWords.length} words to ${outputPath}`);

  } catch (error) {
    console.error('Error exporting dictionary:', error);
    process.exit(1);
  }
}

exportDictionary(); 