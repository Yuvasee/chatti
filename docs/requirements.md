## Overview

Chatti is a multi-language real-time chat application designed to mitigate challenges of short conversations in a multi-language environment.

## Main User Flow

1. **User Opens App (Login Page)**
   - The user logs in as a guest by entering a name (no external OAuth for now).
2. **New Chat Screen**
   - Displays the user-friendly Chat ID in the `123-456-789` format.
   - Provides a link (like `https://chatti-domain.com/123-456-789`) to join the chat.
3. **User Joins Chat**
   - The user sees real-time messages.
   - The user can select a preferred language, and all messages are translated into that language using ChatGPT.

## Additional Requirements

1. **User-Friendly Chat ID**
   - Format: `123-456-789`.
   - Shown on all relevant screens.
2. **Random Name and Avatar**
   - On guest login, generate a random name and avatar if the user has not entered a name.
3. **Translation**
   - Messages are translated by ChatGPT (OpenAI API).
   - Each user sees incoming messages in their chosen language.
4. **PoC Constraints**
   - Login only as guest.
   - Only link sharing for invites (no QR code).
   - All services run in Docker (docker-compose for local dev).
5. **Tech Stack**
   - **Front End**: TypeScript, React.
   - **Back End**: TypeScript, NestJS.
   - **Database**: MongoDB.
   - **Monorepo**: Simple npm-based workspace structure.
   - **Real-time Communication**: WebSockets (Socket.IO).
   - **Queues**: bullmq for translation jobs (and possibly other tasks).
   - **Deployment**: Docker, docker-compose.
