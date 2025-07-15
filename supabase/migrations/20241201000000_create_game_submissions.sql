-- Create game_submissions table for Mack Meller's game submission system
CREATE TABLE IF NOT EXISTS game_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_url TEXT NOT NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('cross-tables', 'woogles')),
    submitted_by TEXT DEFAULT 'anonymous',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT DEFAULT '',
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on game_url to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_submissions_url ON game_submissions(game_url);

-- Create index on status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_game_submissions_status ON game_submissions(status);

-- Create index on submitted_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_game_submissions_submitted_at ON game_submissions(submitted_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE game_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for submissions)
CREATE POLICY "Allow anonymous submissions" ON game_submissions
    FOR INSERT WITH CHECK (true);

-- Create policy to allow admin to read all submissions
CREATE POLICY "Allow admin read all" ON game_submissions
    FOR SELECT USING (true);

-- Create policy to allow admin to update submissions
CREATE POLICY "Allow admin update" ON game_submissions
    FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_game_submissions_updated_at 
    BEFORE UPDATE ON game_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 