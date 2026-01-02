-- Create user_games table to store completed game data
CREATE TABLE IF NOT EXISTS user_games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Game metadata
    game_type TEXT NOT NULL DEFAULT 'bot', -- 'bot', 'puzzle', 'multiplayer' (future)
    opponent_name TEXT, -- Name of opponent (bot name or player name)
    opponent_type TEXT DEFAULT 'bot', -- 'bot', 'player'
    
    -- Game results
    player_score INT NOT NULL,
    opponent_score INT NOT NULL,
    won BOOLEAN NOT NULL,
    game_duration_seconds INT, -- Total game time in seconds
    
    -- Game state (stored as JSONB for flexibility)
    final_board_state JSONB NOT NULL, -- Final board state (15x15 array)
    move_history JSONB NOT NULL, -- Array of moves with board diffs, scores, etc.
    player_rack_final TEXT, -- Final rack of player
    opponent_rack_final TEXT, -- Final rack of opponent
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON user_games(user_id);

-- Create index on completed_at for sorting
CREATE INDEX IF NOT EXISTS idx_user_games_completed_at ON user_games(completed_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own games
CREATE POLICY "Users can view own games" ON user_games
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own games
CREATE POLICY "Users can insert own games" ON user_games
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own games (for future features like notes)
CREATE POLICY "Users can update own games" ON user_games
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update completed_at timestamp
CREATE OR REPLACE FUNCTION update_user_games_completed_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.completed_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update completed_at
CREATE TRIGGER update_user_games_completed_at
    BEFORE INSERT OR UPDATE ON user_games
    FOR EACH ROW
    EXECUTE FUNCTION update_user_games_completed_at_column();

