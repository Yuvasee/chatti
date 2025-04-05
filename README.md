# Chatti - Multi-language Real-time Chat Application

## Environment Setup

1. Copy the environment template file:
   ```bash
   cp .env.template .env
   ```

2. Update the `.env` file with your values:
   - Set a secure MongoDB root password
   - Set a secure JWT secret
   - Add your OpenAI API key

3. The frontend service URLs are configured in docker-compose.yml and don't need to be changed unless you modify the service ports.

## Development

To start the development environment:

```bash
# Start all services
yarn dev

# Stop all services
yarn stop
```

The application will be available at:
- Frontend: http://localhost:3000
- Auth Service: http://localhost:4000
- Chat Service: http://localhost:4001 