# Worklane Setup Guide

This guide will help you set up Worklane, an open-source project management tool with authentication.

## Prerequisites

- Node.js 18+ and pnpm
- A Neon PostgreSQL database (or any PostgreSQL database)

## 1. Database Setup

### Option A: Neon (Recommended)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string from the dashboard
4. The connection string should look like:
   ```
   postgresql://username:password@host/database?sslmode=require
   ```

### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a new database
3. Use connection string:
   ```
   postgresql://username:password@localhost:5432/worklane
   ```

## 2. Environment Configuration

1. Copy the environment template:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Update `apps/web/.env.local` with your values:
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   AUTH_SECRET="generate-a-random-secret-minimum-32-characters"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Generate a secure AUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

## 3. Database Migration

1. Generate Prisma client:
   ```bash
   pnpm db:generate
   ```

2. Push the schema to your database:
   ```bash
   pnpm db:push
   ```

## 4. Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## 5. First User

1. Go to `/register` to create your first account
2. Use any email and password (minimum 6 characters)
3. You'll be automatically logged in and redirected to the dashboard

## 6. Database Management

- **View database**: `pnpm db:studio`
- **Reset database**: `pnpm db:push --force-reset`
- **Generate client**: `pnpm db:generate`

## 7. Production Deployment

### Environment Variables

For production, update these environment variables:

```env
DATABASE_URL="your-production-postgresql-connection-string"
AUTH_SECRET="your-production-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
```

### Self-Hosting

Worklane is designed to be self-hosted. You can deploy it to:

- **Vercel**: Connect your GitHub repo and add environment variables
- **Railway**: Deploy with automatic PostgreSQL database
- **Docker**: Use the included Dockerfile
- **VPS**: Deploy to any VPS with Node.js support

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t worklane .
   ```

2. Run with environment variables:
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="your-db-url" \
     -e AUTH_SECRET="your-secret" \
     -e NEXTAUTH_URL="http://localhost:3000" \
     worklane
   ```

## Troubleshooting

### Database Connection Issues

- Verify your DATABASE_URL is correct
- Ensure your database is accessible from your deployment environment
- Check if SSL is required (add `?sslmode=require` to connection string)

### Authentication Issues

- Ensure AUTH_SECRET is at least 32 characters long
- Verify NEXTAUTH_URL matches your domain
- Check browser console for errors

### Build Issues

- Run `pnpm db:generate` before building
- Ensure all environment variables are set
- Check that Prisma schema is valid

## Support

- **Issues**: [GitHub Issues](https://github.com/piramilans/worklane/issues)
- **Documentation**: [README.md](./README.md)
- **Discussions**: [GitHub Discussions](https://github.com/piramilans/worklane/discussions)
