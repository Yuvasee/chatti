# Chatti POC Implementation Plan

## 1. Project Setup

- [X] Initialize monorepo structure with yarn workspaces
- [X] Create root package.json with workspace configuration
- [X] Set up docker-compose.yml with all required services
- [X] Create .env template with required environment variables
- [X] Set up shared TypeScript configuration
- [X] Configure ESLint and Prettier for the monorepo

## 2. Backend Services Setup

### Auth Service

- [X] Initialize NestJS project in packages/auth-service
- [X] Set up MongoDB connection
- [X] Implement guest login endpoint
- [X] Add random name/avatar generation
- [X] Implement JWT token generation
- [X] Add basic error handling and validation

### Chat Service

- [X] Initialize NestJS project in packages/chat-service
- [X] Set up MongoDB connection
- [X] Implement chat ID generation (123-456-789 format)
- [X] Set up Socket.IO gateway
- [X] Implement chat room management
- [X] Add message handling and storage
  - [X] Implement real-time message broadcasting
  - [X] Add asynchronous message persistence to MongoDB
  - [X] Implement message history retrieval for reconnections
  - [X] Set up BullMQ for translation jobs
  - [X] Add translation notification broadcasting

#### Translation Service
- [X] Create packages/translation-service directory and initialize NestJS project
- [X] Set up basic project structure (modules, services, controllers)
- [X] Add required dependencies (BullMQ, LangChain, MongoDB)
- [X] Create translation queue consumer service
- [X] Configure connection to Redis for BullMQ
- [X] Implement translation processor with OpenAI/LangChain integration
- [X] Add MongoDB service for storing/retrieving translations
- [X] Implement error handling and retry logic for translations

## 3. Frontend Layouts Development

- [X] Initialize React + Vite project in packages/web
- [X] Set up Material UI
- [X] Implement basic routing
- [X] Create login page UI with guest login form
- [X] Add random name/avatar generation UI components
- [X] Implement chat page UI layout
- [X] Add language selector component
- [X] Create chat ID display and sharing UI
- [X] Implement message display components
- [X] Add translation UI components

## 4. Frontend-Backend Integration

- [X] Create API client service for Auth Service
  - [X] Implement guest login API integration
  - [X] Add JWT token storage and retrieval
  - [X] Implement authentication header handling
  - [X] Use shared DTOs from @chatti/shared-types for type consistency

> **Important Note:** For all remaining API integration tasks, always use the shared DTOs from `@chatti/shared-types` package for consistent typing between frontend and backend. This includes response types (ApiResponseDto, LoginResponseDto, etc.), request types (LoginDto, etc.), and payload types (TokenPayloadDto, etc.).

- [ ] Create Socket.IO client service for Chat Service
  - [ ] Create ChatService in packages/web/src/api/ChatService.ts using socket.io-client
  - [ ] Implement connection with JWT token authentication via AuthService
  - [ ] Add reconnection logic with error handling
  - [ ] Create chat room joining methods using formatted chat IDs
  - [ ] Add message sending interface with typing indicators
  - [ ] Implement event handlers for real-time message reception
  - [ ] Use shared message and event DTOs from @chatti/shared-types
- [ ] Integrate translation functionality
  - [ ] Create TranslationService in packages/web/src/api/TranslationService.ts
  - [ ] Implement language change socket events
  - [ ] Update ChatContext with translation state management
  - [ ] Add UI components for displaying translation status
  - [ ] Implement caching for already translated messages
  - [ ] Use shared translation DTOs from @chatti/shared-types
- [ ] Add error handling and notifications
  - [ ] Create NotificationContext for centralized error handling
  - [ ] Implement connection status indicators
  - [ ] Add automatic token refresh on expiration
  - [ ] Create toast notification components for errors and events
  - [ ] Use shared error types from @chatti/shared-types where applicable

## 5. Smoke Testing

- [ ] Test guest login flow
  - [ ] Verify token storage and retrieval
  - [ ] Test login with custom name vs. random name
  - [ ] Confirm avatar generation
- [ ] Test chat creation and joining
  - [ ] Test chat ID generation and validation
  - [ ] Test room joining with authentication
  - [ ] Verify chat state persistence
- [ ] Test real-time messaging
  - [ ] Confirm message delivery
  - [ ] Test multi-user scenarios
  - [ ] Verify typing indicators
- [ ] Test translation functionality
  - [ ] Test language switching
  - [ ] Verify message translation accuracy
  - [ ] Test performance with many messages
- [ ] Test error scenarios and recovery
  - [ ] Test connection loss and recovery
  - [ ] Verify error notifications
  - [ ] Test token expiration handling
