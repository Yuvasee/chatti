FROM node:20-alpine as build

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

# Build the app
RUN cd packages/web && yarn build

# Production stage
FROM nginx:alpine

COPY --from=build /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"] 