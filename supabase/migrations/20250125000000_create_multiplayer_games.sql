-- Create multiplayer_games table for real-time multiplayer Scrabble games
CREATE TABLE IF NOT EXISTS multiplayer_games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_code TEXT UNIQUE NOT NULL, -- Short code for sharing (e.g., "ABC123")
    
    -- Player information
    player1_id TEXT NOT NULL, -- Can be UUID for auth users or guest_* for guests
    player1_name TEXT NOT NULL DEFAULT 'Player 1',
    player2_id TEXT, -- Nullable until player 2 joins
    player2_name TEXT DEFAULT 'Player 2',
    
    -- Game state
    status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'completed'
    current_player INT NOT NULL DEFAULT 1, -- 1 or 2
    
    -- Board and game state (stored as JSONB)
    board_state JSONB NOT NULL DEFAULT '[]'::jsonb, -- 15x15 array
    pool JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of tile strings
    
    -- Player state
    player1_points INT NOT NULL DEFAULT 0,
    player2_points INT NOT NULL DEFAULT 0,
    player1_rack JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of tile strings
    player2_rack JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of tile strings
    
    -- Move tracking
    move_history JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of move objects
    consecutive_passes INT NOT NULL DEFAULT 0,
    
    -- Winner information
    winner INT, -- 1 or 2, null if tie
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on game_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_game_code ON multiplayer_games(game_code);

-- Create index on status for filtering active games
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_status ON multiplayer_games(status);

-- Create index on created_at for cleanup
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_created_at ON multiplayer_games(created_at);

-- Function to generate unique game codes
CREATE OR REPLACE FUNCTION generate_game_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed confusing chars (0, O, I, 1)
    result TEXT := '';
    i INT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..4 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM multiplayer_games WHERE game_code = result) INTO code_exists;
        
        -- If code doesn't exist, we're done
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate game_code on insert
CREATE OR REPLACE FUNCTION set_game_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.game_code IS NULL OR NEW.game_code = '' THEN
        NEW.game_code := generate_game_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_game_code_trigger
    BEFORE INSERT ON multiplayer_games
    FOR EACH ROW
    EXECUTE FUNCTION set_game_code();

-- Enable Row Level Security (RLS)
ALTER TABLE multiplayer_games ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read multiplayer games (needed for joining)
CREATE POLICY "Anyone can view multiplayer games" ON multiplayer_games
    FOR SELECT USING (true);

-- Policy: Anyone can create games (for anonymous multiplayer)
CREATE POLICY "Anyone can create games" ON multiplayer_games
    FOR INSERT WITH CHECK (true);

-- Policy: Players can update their own games
-- Note: Updates from Netlify functions use service role key and bypass RLS
-- This policy is for direct client updates (if needed)
CREATE POLICY "Players can update own games" ON multiplayer_games
    FOR UPDATE USING (
        player1_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
        player2_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
        player1_id LIKE 'guest_%' OR
        player2_id LIKE 'guest_%'
    );

-- Enable Realtime for multiplayer_games table
-- This will fail silently if the table is already in the publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'multiplayer_games'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_games;
    END IF;
END $$;
