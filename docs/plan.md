# Chatti POC Implementation Plan

## 1. Project Setup

- [X] Initialize monorepo structure with npm workspaces
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

- [ ] Create API client service for Auth Service
  - [ ] Implement guest login API integration
  - [ ] Add JWT token storage and retrieval
  - [ ] Implement authentication header handling
- [ ] Create Socket.IO client service for Chat Service
  - [ ] Implement connection and reconnection logic with authentication
  - [ ] Add chat room joining functionality
  - [ ] Implement message sending via socket
  - [ ] Handle real-time message reception
- [ ] Integrate translation functionality
  - [ ] Handle language change notifications
  - [ ] Process and display translated messages
  - [ ] Show translation status indicators
- [ ] Add error handling and retry logic
  - [ ] Handle connection failures
  - [ ] Implement token refresh logic
  - [ ] Add error notifications to UI

## 5. Smoke Testing

- [ ] Test guest login flow
- [ ] Test chat creation and joining
- [ ] Test real-time messaging
- [ ] Test translation functionality
- [ ] Test multi-language scenarios
