# PostgreSQL Database Setup

## Prerequisites

You need to have PostgreSQL running before you can seed the database.

## Option 1: Docker (Recommended)

### Start PostgreSQL with Docker:

```bash
docker run --name worklane-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=worklane \
  -p 5432:5432 \
  -d postgres:16
```

### Push the schema:

```bash
cd apps/web
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/worklane" pnpm db:push
```

### Seed the database:

```bash
cd apps/web
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/worklane" pnpm tsx seed.ts
```

## Option 2: Local PostgreSQL Installation

### Install PostgreSQL:

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Create database:

```bash
createdb worklane
```

### Push the schema:

```bash
cd apps/web
pnpm db:push
```

### Seed the database:

```bash
cd apps/web
pnpm tsx seed.ts
```

## Option 3: Cloud PostgreSQL (Supabase, Neon, Railway, etc.)

1. Create a PostgreSQL database on your cloud provider
2. Get the connection string
3. Update `.env.local`:

```
DATABASE_URL="your-cloud-connection-string"
```

4. Push the schema and seed:

```bash
cd apps/web
pnpm db:push
pnpm tsx seed.ts
```

## What will be seeded:

1. **Organization**: AAWS Organization
2. **Permissions**: 54 permissions (Organization, Project, Task)
3. **Users**: 9 users (Milan + 8 dummy users, password: `password123`)
4. **Roles**: Super Admin with all permissions
5. **Projects**: 6 projects
6. **Tasks**: Tasks will be added with assignees and reviewers

## Login Credentials

All users can login with:

- **Email**: [user-email]
- **Password**: `password123`

## Next Steps After Seeding

1. Start the dev server: `pnpm dev`
2. Login at: `http://localhost:3000/login`
3. Access the dashboard and explore the seeded data
