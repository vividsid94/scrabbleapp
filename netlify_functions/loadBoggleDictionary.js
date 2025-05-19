const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { Trie } = require('./trie');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

let cachedTrie = null;

async function loadDictionary() {
  if (cachedTrie) return cachedTrie;

  const trie = new Trie();

  try {
    const { count } = await supabase
      .from('dictionary')
      .select('*', { count: 'exact', head: true });

    const batchSize = 1000;
    const batches = Math.ceil(count / batchSize);

    for (let i = 0; i < batches; i++) {
      const { data } = await supabase
        .from('dictionary')
        .select('word')
        .range(i * batchSize, (i + 1) * batchSize - 1);

      for (const entry of data) {
        trie.insert(entry.word);
      }
    }
  } catch (err) {
    console.error("Supabase failed. Falling back to local dictionary...");
    const words = fs.readFileSync(path.join(__dirname, 'dictionary.txt'), 'utf-8').split(/\r?\n/);
    for (const word of words) trie.insert(word.trim());
  }

  cachedTrie = trie;
  return trie;
}

exports.handler = async function(event) {
  try {
    if (!cachedTrie) {
      console.log('Loading dictionary...');
      cachedTrie = await loadDictionary();
      console.log('Dictionary loaded and cached');
    }

    // Convert the Trie to a format that can be sent to the client
    const words = [];
    function collectWords(node, prefix = '') {
      if (node.isTerminal) {
        words.push(prefix);
      }
      for (const [char, childNode] of node.children) {
        collectWords(childNode, prefix + char);
      }
    }
    collectWords(cachedTrie.root);

    return {
      statusCode: 200,
      body: JSON.stringify({ words })
    };
  } catch (error) {
    console.error('❌ Dictionary loading error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 