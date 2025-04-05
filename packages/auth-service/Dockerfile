FROM node:20-alpine

WORKDIR /app

# Copy the package.json files
COPY package.json yarn.lock ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/auth-service/package.json ./packages/auth-service/

# Copy tsconfig files
COPY tsconfig*.json ./
COPY packages/shared-types/tsconfig*.json ./packages/shared-types/
COPY packages/auth-service/tsconfig*.json ./packages/auth-service/

# Install dependencies using yarn
RUN yarn install

# Copy source files
COPY packages/shared-types/src ./packages/shared-types/src/
COPY packages/auth-service/src ./packages/auth-service/src/

# Build shared types first
RUN cd packages/shared-types && yarn build

# Build the app
RUN cd packages/auth-service && yarn build

WORKDIR /app/packages/auth-service

EXPOSE 4000 9229

CMD ["yarn", "start:debug"] 