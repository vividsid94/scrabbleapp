const { createClient } = require('@supabase/supabase-js');
const { Trie } = require('./trie');

// Log environment variables (without exposing sensitive data)
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Supabase Key length:', process.env.SUPABASE_ANON_KEY?.length || 0);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

let cachedTrie = null;

async function loadDictionary() {
  if (cachedTrie) return cachedTrie;

  const trie = new Trie();

  try {
    console.log('Attempting to connect to Supabase...');
    
    // Test the connection with a simple query
    const { data: testData, error: testError } = await supabase
      .from('dictionary')
      .select('word')
      .limit(1);

    if (testError) {
      console.error('Connection test failed:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
      throw testError;
    }

    console.log('Successfully connected to Supabase');
    console.log('Test query result:', testData);

    console.log('Loading dictionary words...');
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      console.log(`Loading batch starting at offset ${offset}...`);
      const { data, error } = await supabase
        .from('dictionary')
        .select('word')
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('Error loading batch:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        for (const entry of data) {
          trie.insert(entry.word);
        }
        offset += batchSize;
      }
    }

    console.log('Finished loading dictionary');
    cachedTrie = trie;
    return trie;
  } catch (err) {
    console.error("Failed to load dictionary:", err);
    console.error('Full error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    throw err;
  }
}

module.exports = { loadDictionary };
