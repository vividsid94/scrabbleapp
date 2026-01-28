-- Update game code generation to 4 characters instead of 6
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
