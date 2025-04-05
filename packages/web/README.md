# Chatti Web Frontend

This is the web frontend for the Chatti real-time multilingual chat application.

## Technology Stack

- React + TypeScript
- Vite for fast development and building
- Material UI for components and styling
- React Router for navigation
- Socket.IO client for real-time communication

## Development Setup

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Running the Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at http://localhost:5173 by default.

### Building for Production

```bash
# Build the application
npm run build
```

## Project Structure

- `src/`
  - `components/` - Reusable UI components
  - `pages/` - Page components for different routes
  - `contexts/` - React context providers
  - `types/` - TypeScript type definitions
  - `api/` - API client and Socket.IO setup

## Available Routes

- `/login` - Guest login page
- `/chat/:chatId` - Chat page with real-time messaging
