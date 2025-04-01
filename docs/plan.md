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

- [ ] Initialize NestJS project in packages/auth-service
- [ ] Set up MongoDB connection
- [ ] Implement guest login endpoint
- [ ] Add random name/avatar generation
- [ ] Implement JWT token generation
- [ ] Add basic error handling and validation

### Chat Service

- [ ] Initialize NestJS project in packages/chat-service
- [ ] Set up MongoDB connection
- [ ] Implement chat ID generation (111-222-333 format)
- [ ] Set up Socket.IO gateway
- [ ] Implement chat room management
- [ ] Add message handling and storage
  - [ ] Implement real-time message broadcasting
  - [ ] Add asynchronous message persistence to MongoDB
  - [ ] Implement message history retrieval for reconnections
  - [ ] Set up BullMQ for translation jobs
  - [ ] Add translation notification broadcasting

### Translation Service

- [ ] Initialize NestJS project in packages/translation-service
- [ ] Set up BullMQ consumer
- [ ] Implement OpenAI integration with LangChain
- [ ] Add translation job processing
- [ ] Set up MongoDB connection for storing translations

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
