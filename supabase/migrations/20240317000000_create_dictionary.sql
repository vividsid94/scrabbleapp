-- Create dictionary table
CREATE TABLE dictionary (
    id SERIAL PRIMARY KEY,
    word TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX dictionary_word_idx ON dictionary (word);

-- Insert initial words (we'll need to import the full dictionary later)
INSERT INTO dictionary (word) VALUES
    ('HELLO'),
    ('WORLD'),
    ('SCRABBLE'),
    ('GAME'),
    ('PLAY'),
    ('WORD'),
    ('TILE'),
    ('RACK'),
    ('BOARD'),
    ('SCORE'),
    ('POINTS'),
    ('LETTER'),
    ('ALPHABET'),
    ('DICTIONARY'),
    ('VALID'),
    ('MOVE'),
    ('CHECK'); 