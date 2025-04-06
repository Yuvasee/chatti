FROM node:20-alpine

WORKDIR /app

# Copy the package.json files
COPY package.json yarn.lock ./
COPY packages/web/package.json ./packages/web/

# If web uses shared-types
COPY packages/shared-types/package.json ./packages/shared-types/

# Copy tsconfig files
COPY tsconfig*.json ./
COPY packages/web/tsconfig*.json ./packages/web/
COPY packages/shared-types/tsconfig*.json ./packages/shared-types/

# Install dependencies using yarn
RUN yarn install

# Copy source files
COPY packages/web/src ./packages/web/src/
COPY packages/web/public ./packages/web/public/
COPY packages/web/index.html ./packages/web/
COPY packages/web/vite.config.ts ./packages/web/

# Build shared types if needed
COPY packages/shared-types/src ./packages/shared-types/src/
RUN cd packages/shared-types && yarn build

WORKDIR /app/packages/web

EXPOSE 3000

# Run in development mode with hot reloading
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "3000"] 