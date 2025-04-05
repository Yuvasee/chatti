FROM node:20-alpine

WORKDIR /app

# Copy the package.json files
COPY package.json yarn.lock ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/chat-service/package.json ./packages/chat-service/

# Copy tsconfig files
COPY tsconfig*.json ./
COPY packages/shared-types/tsconfig*.json ./packages/shared-types/
COPY packages/chat-service/tsconfig*.json ./packages/chat-service/

# Install dependencies using yarn
RUN yarn install

# Copy source files
COPY packages/shared-types/src ./packages/shared-types/src/
COPY packages/chat-service/src ./packages/chat-service/src/

# Build shared types first
RUN cd packages/shared-types && yarn build

# Build the app
RUN cd packages/chat-service && yarn build

WORKDIR /app/packages/chat-service

EXPOSE 4001 9229

CMD ["yarn", "start:debug"] 