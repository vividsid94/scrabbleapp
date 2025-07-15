# Woogles API Notes

## Get Recent Games for a User
```bash
curl -X POST -H "Content-Type: application/json" \
  https://woogles.io/api/game_service.GameMetadataService/GetRecentGames \
  -d '{"username":"josh","num_games":10}'
```

## Get Game Metadata (includes player ratings)
```bash
curl -X POST -H "Content-Type: application/json" \
  https://woogles.io/api/game_service.GameMetadataService/GetMetadata \
  -d '{"game_id":"7sBFFm78"}'
```

## Get Game Moves
```bash
curl -X POST -H "Content-Type: application/json" \
  https://woogles.io/api/game_service.GameMetadataService/GetGame \
  -d '{"game_id":"7sBFFm78"}'
```

## Notes
- These are direct API calls to Woogles (not through our proxy)
- The proxy currently only supports GET requests, not POST
- For frontend integration, we need to either:
  1. Update the proxy to support POST requests with JSON bodies
  2. Use direct API calls (may have CORS issues)
  3. Create server-side functions to handle these API calls

## Current Game Pool
- **40 games total** from multiple players
- Mix of human vs human and human vs bot games
- Various time controls (blitz, rapid, regular)
- Different lexicons (NWL23, CSW24)
- Rating range: ~1600-2300 