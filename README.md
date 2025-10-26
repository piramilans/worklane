# Worklane

An open-source project management tool built with Next.js 16, featuring user authentication, team collaboration, and self-hosting capabilities.

## Features

- 🔐 **User Authentication** - Secure login/registration with NextAuth.js
- 🔑 **Role-Based Access Control** - Flexible permissions system with customizable roles
- 🏢 **Multi-Tenant Organizations** - Support for multiple organizations and projects
- 📊 **Project Management** - Create and organize projects with granular permissions
- 👥 **Team Collaboration** - Work together with role-based access control
- 🎯 **Custom Permissions** - Per-project permission overrides for fine-grained control
- 📝 **Audit Logging** - Track all permission and role changes
- 🏠 **Self-Hosted** - Deploy on your own infrastructure
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS
- ⚡ **Fast Development** - Next.js 16 with Turbopack

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS, shadcn/ui
- **Deployment**: Self-hosted (Docker, Vercel, Railway, etc.)

## Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/piramilans/worklane.git
   cd worklane
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your database URL and auth secret
   ```

4. **Set up the database**

   ```bash
   cd apps/web
   pnpm db:generate
   pnpm db:push
   pnpm db:seed-permissions
   ```

5. **Start development server**

   ```bash
   cd ../..
   pnpm dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Documentation

- **[Setup Guide](./SETUP.md)** - Detailed setup instructions, database configuration, and deployment guides
- **[Permissions Guide](./PERMISSIONS_GUIDE.md)** - Complete guide to the roles and permissions system

## Development

This is a monorepo built with Next.js 16, shadcn/ui, and Turbopack.

### Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

### Database commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed permissions and roles
pnpm db:seed-permissions

# Open Prisma Studio
pnpm db:studio
```

### Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/piramilans/worklane/issues)
- **Discussions**: [GitHub Discussions](https://github.com/piramilans/worklane/discussions)
