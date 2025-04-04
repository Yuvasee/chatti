# Chatti Architecture

This document outlines the architecture of the Chatti microservices system, defining service boundaries, communication patterns, and development guidelines.

## System Overview

Chatti is a multi-language real-time chat application built as a microservices system with the following components:

- **Auth Service**: Handles user authentication and session management
- **Chat Service**: Manages chat rooms and real-time messaging
- **Translation Service**: Processes message translation jobs using OpenAI
- **Shared Types**: Reusable types, DTOs, and utilities across services

## Monorepo Structure

Chatti uses a simple npm-based workspace approach without complex tools like Nx or Turborepo:

```
package.json           # root scripts and dependencies
docker-compose.yml     # define services (auth-service, chat-service, translation-service, web, mongo, redis)
.env                   # environment variables (e.g., MONGO_URL, OPENAI_KEY, etc.)
packages/
  web/                 # React front end with Vite bundler
  auth-service/        # NestJS-based Auth microservice
  chat-service/        # NestJS-based Chat microservice
  translation-service/ # NestJS-based Translation microservice
  shared-types/        # Shared types and utilities
docs/                  # Project documentation
```

## Message Flow Architecture

### Real-time Message Flow

1. Client sends message through WebSocket
2. Chat Service receives message via Socket.IO
3. Message is immediately broadcast to all connected clients in the chat room
4. Message is asynchronously persisted to MongoDB (non-blocking)
5. Translation job is queued in BullMQ if needed

### Translation Flow

1. Translation Service consumes jobs from BullMQ
2. Translates message using OpenAI API
3. Stores translation in MongoDB
4. Notifies clients through WebSocket about new translation

### Reconnection Handling

1. When client reconnects, fetches recent message history from MongoDB
2. Includes both original messages and their translations
3. Continues receiving real-time updates

## Service Boundaries and Responsibilities

### Auth Service

**Primary Responsibility**: User authentication and identity management

**Core Functions**:
- Guest user creation and authentication
- JWT token generation and validation
- User profile management
- Random name and avatar generation

**Data Ownership**:
- User records
- Authentication tokens

**Service Boundaries**:
- Should NOT contain any chat or message logic
- Should NOT implement translation functionality
- Should NOT directly access chat or translation data

**Implementation Details**:
- Built with NestJS
- Issues JWT tokens for authentication (no persistent session storage)
- Generates random name/avatar if the user doesn't specify

### Chat Service

**Primary Responsibility**: Real-time chat communication

**Core Functions**:
- Chat room creation and management with user-friendly `123-456-789` format IDs
- Real-time message delivery via WebSockets
- Message history storage and retrieval
- Queueing messages for translation

**Data Ownership**:
- Chat rooms
- Message records
- Active connections

**Service Boundaries**:
- Should NOT implement user authentication logic (only consume auth tokens)
- Should NOT perform translation logic (only queue jobs for translation)
- May query user information from auth service when needed

**Implementation Details**:
- Built with NestJS
- Uses Socket.IO via NestJS WebSocket Gateway (`@WebSocketGateway()`)
- Manages membership, real-time message sending, and broadcasting
- Handles message persistence and translation job queueing

### Translation Service

**Primary Responsibility**: Message translation

**Core Functions**:
- Process translation jobs from the queue
- Interact with OpenAI API for translations
- Store translation results
- Provide translation history and status

**Data Ownership**:
- Translation records
- Translation job status

**Service Boundaries**:
- Should NOT implement chat logic
- Should NOT implement authentication logic
- Should focus exclusively on translation tasks

**Implementation Details**:
- BullMQ consumer for processing translation jobs
- Uses OpenAI API for language translations
- Stores translations in MongoDB for future reference

## Web Frontend

**Technology Stack**:
- React with TypeScript
- Vite bundler for fast development
- Material UI for component library

**Key Features**:
- Login page with guest authentication
- Chat interface with real-time updates
- Language selector for message translation
- Display of user-friendly chat IDs
- Socket.IO client for WebSocket communication

**User Interfaces**:

1. **Login Page**:
   - Simple form to enter a name for guest login
   - Generated random name/avatar with option to change the name
   - No OAuth or complex authentication in initial version
   - Styled with Material UI components
   - Submits to auth-service and receives JWT token

2. **Chat Page**:
   - Real-time chat interface with message history
   - Prominent display of user-friendly Chat ID (123-456-789 format)
   - Shareable link generator for inviting others
   - Language selector dropdown (for translation preferences)
   - User's messages right-aligned, others' left-aligned
   - Visual indicators for message status (sent, delivered, translated)
   - Input area with send button and optional attachments (future)

**Client-Side Architecture**:
- React hooks for state management
- Context API for global state (authentication, user preferences)
- Socket.IO client for real-time WebSocket connections
- Axios for REST API calls
- Material UI theming for consistent visual styling
- React Router for navigation between screens

**Responsive Design**:
- Mobile-first approach with responsive breakpoints
- Only mobile viewport for starters
- Optimized keyboard handling for mobile devices

**Client-Side Data Flow**:
1. Client connects to Chat Service via Socket.IO with JWT token
2. Joins a specific chat room by ID
3. Receives initial message history with translations
4. Sends new messages through WebSocket
5. Receives real-time updates for new messages and translations
6. Updates UI as new data arrives

## Communication Patterns

### Synchronous Communication

- **REST APIs**:
  - Auth Service → Chat Service: User validation
  - Chat Service → Translation Service: Translation status queries
  - Translation Service → Auth Service: User language preference queries

### Asynchronous Communication

- **Message Queues**:
  - Chat Service → Translation Service: New messages for translation
  - Translation Service → Chat Service: Completed translations

## Infrastructure Components

### MongoDB

- Common data store for all services
- Stores user profiles, chats, messages, and translations
- Each service accesses its own data collections
- Using Mongoose ODM for data access

### Redis

- Powers BullMQ for translation job queue
- Provides reliable message delivery between services
- Handles job retries and failure scenarios

### Docker & docker-compose

- **Services**:
  1. **web** (React + Vite front end)
  2. **auth-service** (NestJS)
  3. **chat-service** (NestJS)
  4. **translation-service** (BullMQ consumer)
  5. **mongo** (MongoDB)
  6. **redis** (for BullMQ)

- **Example Ports**:
  - 3000 → web (React)
  - 4000 → auth-service (NestJS)
  - 4001 → chat-service (NestJS)
  - 4002 → translation-service
  - 27017 → MongoDB
  - 6379 → Redis

## Cross-Cutting Concerns

### Authentication Flow

1. User authenticates via Auth Service and receives JWT token
2. User connects to Chat Service with JWT token
3. Chat Service validates token with Auth Service
4. Translation Service receives user context from Chat Service

### Logging Implementation

All services use the standardized logging approach defined in `shared-types`:
- `AppLogger` for consistent logging
- `RequestLoggerMiddleware` for HTTP request logging
- Log levels applied consistently across services
- Context (user ID, request ID) included in log entries

### Error Handling

All services implement consistent error handling:
- `GlobalExceptionFilter` for centralized error handling
- Standardized error response format
- Common error types from `shared-types`
- Each service has specific error handling for its domain

## Module Export Patterns

- **Internal Modules**: Only export what is needed by other modules within the service
- **Public APIs**: Export controllers and DTOs for external consumption
- **Shared Utilities**: Export through index files for clean imports

### When to Export a Service

Services should be exported from their modules when:
1. They need to be used by other modules in the same service
2. They provide functionality needed by controllers in other modules
3. They implement interfaces that are required elsewhere

Example export pattern:
```typescript
@Module({
  imports: [/* ... */],
  providers: [AuthService, JwtService],
  controllers: [AuthController],
  exports: [AuthService], // Only export AuthService, not JwtService (internal)
})
export class AuthModule {}
```

## Architecture Decision Records

### ADR-001: Microservice Structure

**Decision**: Implement as separate NestJS applications with shared types

**Context**: Need to establish how the services will be structured and deployed

**Consequences**:
- Each service can be developed and deployed independently
- Shared code managed through the shared-types package
- Services can be scaled independently based on load

### ADR-002: Data Ownership

**Decision**: Each service maintains its own data store with no direct database sharing

**Context**: Need to establish data ownership and access patterns

**Consequences**:
- Clear ownership of data
- Data synchronization handled through service APIs
- No direct database dependencies between services

### ADR-003: Communication Pattern

**Decision**: Use REST for synchronous communication and BullMQ for asynchronous tasks

**Context**: Need to establish how services communicate with each other

**Consequences**:
- REST provides simple, direct communication for queries
- BullMQ handles background processing and retries
- Services are loosely coupled

## Future Architecture Considerations

1. **API Gateway**: Implement an API gateway for frontend communication
2. **Service Discovery**: Add service discovery for dynamic service locations
3. **Circuit Breaking**: Implement circuit breakers for resilience
4. **Observability**: Add distributed tracing across services
