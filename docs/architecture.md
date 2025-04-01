### Monorepo Structure (Simple NPM)

Use a simple npm-based workspace approach, no Nx/Turborepo complexity. A possible structure:

```bash
package.json           # root scripts and dependencies
docker-compose.yml     # define services (auth-service, chat-service, translation-service, web, mongo, redis)
.env                   # environment variables (e.g., MONGO_URL, OPENAI_KEY, etc.)
packages/
  web/                 # React front end with Vite bundler
  auth-service/        # NestJS-based Auth microservice
  chat-service/        # NestJS-based Chat microservice
  translation-service/ # NestJS-based Translation microservice
libs/                  # any shared libraries or code
```

### Message Flow Architecture

1. **Real-time Message Flow**:

   - Client sends message through WebSocket
   - Chat Service receives message via Socket.IO
   - Message is immediately broadcast to all connected clients in the chat room
   - Message is asynchronously persisted to MongoDB (non-blocking)
   - Translation job is queued in BullMQ if needed

2. **Translation Flow**:

   - Translation Service consumes jobs from BullMQ
   - Translates message using OpenAI API
   - Stores translation in MongoDB
   - Notifies clients through WebSocket about new translation

3. **Reconnection Handling**:
   - When client reconnects, fetches recent message history from MongoDB
   - Includes both original messages and their translations
   - Continues receiving real-time updates

### Front End (web): React + TypeScript + Vite

- **UI Library**: Material UI for components
- **Screens**:
  1. **Login Page**: Enter name (guest), random name/avatar is suggested if not provided.
  2. **Chat Page**: Real-time chat, display user-friendly Chat ID, language selector.
- **WebSocket Integration**: Use Socket.IO client to join a `chatId` room, send messages, and receive updates.
- **Translation Handling**: The front end can request translations from the chat-service or receive them from the server based on the user's chosen language.
- **Testing**: Jest for unit and integration tests

### Back End Services

#### Auth Service

- **NestJS** microservice to handle guest login.
- Generates random name/avatar if the user doesn't specify.
- Issues JWT tokens for authentication (no persistent session storage).
- **Testing**: Jest for unit and integration tests

#### Chat Service

- **NestJS** microservice for core chat logic.
- Creates new chats with user-friendly `111-222-333` format IDs.
- Manages membership, real-time message sending, and broadcasting via WebSockets (`@WebSocketGateway()`).
- On `message` event, stores the message in Mongo using direct MongoDB queries (no ORM/ODM), then enqueues translation job(s) to Redis if needed.
- **Testing**: Jest for unit and integration tests

#### Translation Service

- **BullMQ** consumer running in its own container.
- Listens on a `translation` queue.
- Uses LangChain library to make OpenAI API calls for translations.
- Saves the translated message to Mongo using direct MongoDB queries.
- **Testing**: Jest for unit and integration tests

### MongoDB

- Common data store for user profiles, chats, messages, etc.
- Direct MongoDB queries without ORM/ODM.
- Accessed by the auth-service (for user info) and the chat-service (for chat data).

### Docker & docker-compose

- **Services**:
  1. **web** (React + Vite front end)
  2. **auth-service** (NestJS)
  3. **chat-service** (NestJS)
  4. **translation-service** (BullMQ consumer)
  5. **mongo** (MongoDB)
  6. **redis** (for bullmq)
- **Example Ports**:
  - 3000 → web (React)
  - 4000 → auth-service (NestJS)
  - 4001 → chat-service (NestJS)
  - 4002 → translation-service (optional if you expose an API, or just run it in background)
  - 27017 → MongoDB
  - 6379 → Redis
