#!/bin/bash

# Deployment script for worklane monorepo
set -e

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Run type checking
echo "🔍 Running type checks..."
pnpm run typecheck

# Run linting
echo "🧹 Running linter..."
pnpm run lint

# Build the application
echo "🏗️  Building application..."
pnpm run build

echo "✅ Build completed successfully!"
echo "🎉 Ready for deployment!"

# Optional: Run tests if they exist
if [ -f "apps/web/package.json" ] && grep -q "test" "apps/web/package.json"; then
    echo "🧪 Running tests..."
    pnpm run test --filter=web
fi
