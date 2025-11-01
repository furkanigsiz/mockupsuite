# Docker Commands Reference

## Development Commands

### Start Development Server
```bash
docker-compose up mockupsuite
```

### Start in Background
```bash
docker-compose up -d mockupsuite
```

### Stop Containers
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f mockupsuite
```

### Rebuild and Start
```bash
docker-compose up --build mockupsuite
```

## Production Commands

### Start Production Server
```bash
docker-compose --profile production up mockupsuite-prod
```

### Start Production in Background
```bash
docker-compose --profile production up -d mockupsuite-prod
```

### Stop Production
```bash
docker-compose down
```

## Utility Commands

### Access Container Shell
```bash
docker-compose exec mockupsuite sh
```

### View Running Containers
```bash
docker ps
```

### Clean Up
```bash
# Remove all containers and volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your actual values:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Notes

- Development mode mounts your source code directory, so changes will be reflected immediately
- Production mode builds an optimized nginx-served version
- Both modes support hot module replacement for development
- Make sure Docker Desktop is running before executing commands