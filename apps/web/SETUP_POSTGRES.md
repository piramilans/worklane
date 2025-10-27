# PostgreSQL Setup Instructions

## Database Connection String
The app is now configured to use PostgreSQL.

## Connection Details:
- Host: localhost
- Port: 5432
- Database: worklane
- User: postgres
- Password: postgres

## To set up PostgreSQL:

### Option 1: Using Docker
```bash
docker run --name worklane-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=worklane \
  -p 5432:5432 \
  -d postgres:16
```

### Option 2: Install PostgreSQL locally
```bash
# On macOS
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb worklane
```

### Option 3: Use a cloud PostgreSQL service
Update the DATABASE_URL in `.env.local` to your cloud database connection string

## After setting up PostgreSQL:
1. Update the .env.local file with your actual PostgreSQL connection string
2. Run: pnpm db:push
3. Seed the database with your data

## Current .env.local should contain:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/worklane"
AUTH_SECRET="8l2iNB9Kjygdcc8rKhCcnA3McoK/rknGlroFTY4EGhI="
NEXTAUTH_URL="http://localhost:3000"
```
