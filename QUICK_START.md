# Quick Docker Commands for MockupSuite

## Status Check
```bash
docker ps
```

## View Live Logs
```bash
docker-compose logs -f mockupsuite
```

## Stop the Container
```bash
docker-compose down
```

## Restart with Changes
```bash
# If you made code changes
docker-compose up --build mockupsuite
```

## Access Container Shell (if needed)
```bash
docker-compose exec mockupsuite sh
```

## Production Deployment
```bash
docker-compose --profile production up --build mockupsuite-prod
```

## Clean Up
```bash
# Stop all containers
docker-compose down

# Remove all Docker resources
docker system prune -a
```

## Environment Variables
Make sure your `.env` file contains:
- `GEMINI_API_KEY`: Your Google Gemini API key
- `SUPABASE_URL`: Your Supabase project URL  
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Current Status
✅ Container is running: mockupsuite-dev
✅ App available at: http://localhost:3000
✅ Hot reload enabled: Changes are reflected immediately