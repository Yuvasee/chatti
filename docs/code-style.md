# Chatti Code Guidelines

This document outlines coding standards, conventions, and project structure for Chatti microservices.

## Naming Conventions

### Files and Directories
- Use **kebab-case** for files/directories: `auth-service.ts`
- Use descriptive suffixes:
  - `.service.ts`, `.controller.ts`, `.module.ts`, `.gateway.ts`
  - `.middleware.ts`, `.filter.ts`, `.guard.ts`, `.interceptor.ts`
  - `.dto.ts`, `.schema.ts`
  - `.spec.ts` for unit tests, `.e2e-spec.ts` for e2e tests

### Classes
- Use **PascalCase**: `AuthService`, `ChatController`
- Add descriptive suffixes: `Service`, `Controller`, `Module`, etc.

### Interfaces and DTOs
- Use **PascalCase** and descriptive suffixes:
  - DTOs: `LoginDto`, `CreateChatDto`
  - Response DTOs: `LoginResponseDto`
  - Schema classes: `User`, `Chat`, `Message`

### Variables and Methods
- Use **camelCase**: `getUserById`, `isAuthenticated`
- Use descriptive, self-explanatory names
- Boolean variables: use prefixes like `is`, `has`, `should`
- Private class properties: prefix with underscore `_privateProperty`

## Project Structure

### Root Project Structure

```
chatti/
├── docs/                         # Project documentation
├── packages/                     # All service packages
│   ├── auth-service/             # Authentication service
│   ├── chat-service/             # Chat service
│   ├── translation-service/      # Translation service
│   └── shared-types/             # Shared types and utilities
├── docker-compose.yml           # Docker compose configuration
├── .prettierrc                  # Prettier configuration
└── package.json                 # Root package configuration
```

### Microservice Structure

```
service-name/
├── src/
│   ├── main.ts                   # Entry point
│   ├── app.module.ts             # Root module
│   ├── config/                   # Configuration
│   ├── database/                 # Database connection
│   ├── schemas/                  # Database schemas
│   ├── feature-module/           # Feature modules
│   │   ├── feature.module.ts     # Module definition
│   │   ├── feature.controller.ts # Controller
│   │   ├── feature.service.ts    # Service
│   │   └── feature.service.spec.ts # Unit tests
│   └── queue/                    # Queue (if needed)
├── test/                         # E2E tests
├── Dockerfile                    # Service Dockerfile
└── package.json                  # Package configuration
```

### Feature Module Guidelines

1. **Simple Modules** (flat structure):
```
feature/
├── feature.module.ts             # Module definition
├── feature.controller.ts         # Controller
├── feature.service.ts            # Service
└── feature.service.spec.ts       # Tests
```

2. **Complex Modules** (nested structure):
```
feature/
├── feature.module.ts             # Module definition
├── controllers/                  # Controllers directory
├── services/                     # Services directory
└── dtos/                         # DTOs directory
```

### Shared Types Structure

```
shared-types/
├── src/
│   ├── index.ts                  # Main exports
│   ├── auth/                     # Auth-related types
│   ├── chat/                     # Chat-related types
│   ├── translation/              # Translation-related types
│   ├── utils/                    # Shared utilities
│   └── database/                 # Database utilities
└── package.json                  # Package definition
```

## Code Formatting

Use the project's Prettier configuration:
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "auto"
}
```

## Import Organization

Organize imports in this order with blank lines between groups:
1. External dependencies
2. Internal modules
3. DTOs and schemas

## DTO Validation Practices

- Use `class-validator` decorators for all DTOs
- Follow consistent pattern for validation:
  - Required properties: `@IsNotEmpty()`, `@IsString()`, etc.
  - Optional properties: mark with `?` and use appropriate validators
  - Use validation groups when needed for create/update operations
- Use `ValidationPipe` in controllers and gateways
- Centralize validation error handling in error filters

## Testing Standards

- Unit tests: `.spec.ts` suffix in same directory as tested file
- E2E tests: `.e2e-spec.ts` suffix in `/test` directory
- Test database schemas with dedicated schema tests
- Use consistent testing utilities from shared packages
- Follow AAA pattern (Arrange-Act-Assert) in all tests

## Environment Configuration

- Use NestJS ConfigModule for all environment variables
- Follow consistent naming convention:
  - Database: `MONGO_URI`, `MONGO_DB_NAME`
  - Redis/Queue: `REDIS_HOST`, `REDIS_PORT`
  - Service-specific: `AUTH_JWT_SECRET`, `TRANSLATION_API_KEY`
- Group related settings with common prefixes
- Document all environment variables in service documentation

## Error Handling Patterns

- Use structured try/catch blocks with specific error types
- Follow error bubbling pattern - handle errors at appropriate levels
- Log errors with consistent format and context
- Return standardized error responses with appropriate HTTP codes
- Use shared error types from `shared-types` package

## Documentation

- Use JSDoc-style comments for public APIs, methods, and classes
- Include parameter descriptions, return types and examples
- Comment complex logic or non-obvious behavior

Example:
```typescript
/**
 * Creates a new user account
 * 
 * @param username - The username for the new account
 * @param email - The email address for the new account
 * @returns The newly created user object
 * @throws {ValidationError} If validation fails
 */
async createUser(username: string, email: string): Promise<User> {
  // Implementation
}
```
