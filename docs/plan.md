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

## 3. Frontend Development

- [ ] Initialize React + Vite project in packages/web
- [ ] Set up Material UI
- [ ] Implement basic routing
- [ ] Create login page with guest login
- [ ] Add random name/avatar generation UI
- [ ] Implement chat page with Socket.IO integration
- [ ] Add language selector component
- [ ] Create chat ID display and sharing UI
- [ ] Implement real-time message display
- [ ] Add translation display logic

## 4. Smoke Testing

- [ ] Test guest login flow
- [ ] Test chat creation and joining
- [ ] Test real-time messaging
- [ ] Test translation functionality
- [ ] Test multi-language scenarios
