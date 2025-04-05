FROM node:20-alpine

WORKDIR /app

# Copy the package.json files
COPY package.json yarn.lock ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/translation-service/package.json ./packages/translation-service/

# Copy tsconfig files
COPY tsconfig*.json ./
COPY packages/shared-types/tsconfig*.json ./packages/shared-types/
COPY packages/translation-service/tsconfig*.json ./packages/translation-service/

# Install dependencies using yarn
RUN yarn install

# Copy source files
COPY packages/shared-types/src ./packages/shared-types/src/
COPY packages/translation-service/src ./packages/translation-service/src/

# Build shared types first
RUN cd packages/shared-types && yarn build

# Build the app
RUN cd packages/translation-service && yarn build

WORKDIR /app/packages/translation-service

EXPOSE 4002 9229

CMD ["yarn", "start:debug"] 