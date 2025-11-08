# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS-based API for a Kazakh language learning platform with AI-powered features. The application uses OpenAI for speech recognition, text-to-speech, and conversational practice. It includes user authentication via session-based auth with Redis storage.

## Essential Commands

### Development
```bash
pnpm install                 # Install dependencies
pnpm run start:dev          # Start dev server with hot reload
pnpm run start:debug        # Start with debugging enabled
```

### Database (Prisma)
```bash
pnpx prisma generate        # Generate Prisma client (outputs to generated/prisma/)
pnpx prisma migrate dev     # Create and apply migrations
pnpx prisma migrate deploy  # Apply migrations in production
pnpx prisma studio          # Open Prisma Studio GUI
```

### Testing
```bash
pnpm run test              # Run unit tests
pnpm run test:watch        # Run tests in watch mode
pnpm run test:e2e          # Run e2e tests
pnpm run test:cov          # Generate coverage report
pnpm run test:debug        # Debug tests with Node inspector
```

### Code Quality
```bash
pnpm run lint              # Lint and auto-fix TypeScript files
pnpm run format            # Format code with Prettier
```

### Build & Production
```bash
pnpm run build             # Build for production
pnpm run start:prod        # Run production build
```

## Architecture

### Module Structure

The application follows NestJS modular architecture with the following main modules:

- **AppModule** (src/app.module.ts): Root module with global configuration
  - Integrates Sentry for error tracking
  - Sets up throttling (20 requests per 60 seconds)
  - Configures structured logging with pino

- **AuthModule** (src/auth/): Session-based authentication
  - Uses argon2 for password hashing
  - Session storage in Redis with connect-redis
  - Guards: `AuthGuard` (authentication), `RolesGuard` (authorization)
  - Custom decorator: `@Authorized()` to inject user data into route handlers

- **UsersModule** (src/users/): User management with repository pattern

- **FilesModule** (src/files/): File upload/download functionality

- **PrismaModule** (src/prisma/): Database client singleton

- **AI Features** (src/ai/): OpenAI integration (not in separate module yet)
  - `OpenaiService`: Handles speech-to-text, text-to-speech, chat completions
  - `SpeechController`: Audio transcription and TTS endpoints
  - `ChatController`: Conversational practice with topic configuration

### Authentication Flow

1. Session data stored in Redis with custom session fields (see src/types/express-session.d.ts)
2. AuthGuard validates session and loads user data into `request.user`
3. Use `@Authorized()` decorator in controllers to access authenticated user
4. Session configuration in main.ts with cookie settings from environment variables

### Database

- **ORM**: Prisma with PostgreSQL
- **Generated Client**: Custom output path at `generated/prisma/` (not default node_modules)
- **Schema**: Single User model with roles (USER, ADMIN) defined as enum
- **Repository Pattern**: Used in UsersRepository for data access abstraction
  - Repository methods use explicit `select` fields for security
  - PrismaService is a singleton injected into repositories

### Path Aliases

TypeScript path alias `@/*` maps to `src/*` (configured in tsconfig.json). Always use path aliases for imports within the project.

### Environment Configuration

Required environment variables (see .env.example):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URI`: Redis connection for sessions
- `SESSION_SECRET`: Secret for session signing
- `SESSION_*`: Cookie and session configuration
- `ALLOWED_ORIGIN`: CORS origins (comma-separated)
- `OPENAI_API_KEY`: OpenAI API key (not in .env.example but required)
- `APPLICATION_PORT`: Server port

### AI/Language Learning Features

The OpenaiService provides:
- **Speech Recognition**: Whisper API for audio transcription (basic and detailed with timestamps)
- **Text Correction**: GPT-4o-mini for grammar/spelling correction in Kazakh, Russian, English
- **Text-to-Speech**: OpenAI TTS with configurable voices
- **Chat Practice**: Conversational practice with topic configuration, language levels, and streaming support
- **Topic Generation**: Structured practice topics with vocabulary and grammar focus

System prompts are multilingual (Kazakh, Russian, English) and focus on Kazakh language education.

### Security & Middleware

- **Helmet**: Security headers enabled
- **CORS**: Configured via getCorsConfig with credentials support
- **Throttling**: Global rate limiting (20 req/60s) with @nestjs/throttler via APP_GUARD
- **Session Security**: HttpOnly, SameSite, and Secure flags configurable via env vars
- **Password Hashing**: Argon2 (industry standard, more secure than bcrypt)
- **Sentry Integration**: Error tracking and profiling configured in src/instrument.ts (imported in main.ts)

### OpenAPI/Swagger

- Documentation generated via Redoc at `/docs` endpoint
- OpenAPI spec saved to `./uploads/openapi/openapi-spec.json` on startup
- Cookie-based authentication configured for protected endpoints
- Configuration in src/config/openapi.config.ts

## Development Notes

- Global prefix `/api` applied to all routes (configured in main.ts)
- Uses pino-pretty for development logging, structured JSON in production
- Validation pipe enabled globally with transform and whitelist options
- Trust proxy enabled for proper IP forwarding (important for session security)
- Uses pnpm for package management
- Common utilities in src/libs/common/utils (parseBoolean, parseSameSite, ms converter, etc.)
- When importing Prisma types, use `import { Type } from "generated/prisma"` (not @prisma/client)