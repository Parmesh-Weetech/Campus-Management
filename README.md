# Campus Management System

> A modular, scalable backend for campus management, built with NestJS and TypeORM.

## Features

- User authentication and authorization
- Student and attendance management
- RESTful API structure
- Database migrations and seeding
- Environment-based configuration

## Project Structure

```
src/
	app/
		attendance/      # Attendance logic
		auth/            # Authentication
		common/          # Shared utilities
		config/          # App configuration
		core/            # Core services (e.g., logging)
    crypto/          # Encryption utilities
    jwt/             # JWT handling
    redis/           # Redis integration
    refresh-token/   # Refresh token management
    rest/            # REST API controllers and dtos
    student/         # Student management
    user/            # User management
    app.module.ts    # Main app module
    main.ts          # App entry point
    setup-app.ts     # App setup (e.g., global pipes, interceptors)
db/
	migrations/        # TypeORM migrations
	seeders/           # Seed scripts
infra/               # Infrastructure (e.g., docker-compose)
test/                # Unit and e2e tests
.gitignore
README.md
package.json
tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 25.2.1+
- npm 11.12.1+
- PostgreSQL (or use Docker)

### Installation

```bash
git clone <repo-url>
cd Campus-Management
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and update values as needed.

### Database (with Docker)

```bash
cd src/app/common/infra
docker-compose up -d
```

### Running the App

```bash
npm run start:dev
```

### Running Migrations

```bash
npm run migration:run
```

### Running Tests

```bash
npm run test
npm run test:e2e
```

## License

UNLICENSED
