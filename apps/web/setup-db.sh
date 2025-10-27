#!/bin/bash
cd apps/web
export DATABASE_URL="file:./dev.db"
export AUTH_SECRET="8l2iNB9Kjygdcc8rKhCcnA3McoK/rknGlroFTY4EGhI="

echo "📦 Setting up database..."
npx prisma db push --accept-data-loss

echo "🔐 Updating password..."
node --input-type=module -e "
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.update({
      where: { email: 'milan@aaws.ca' },
      data: { password: hashedPassword },
    });
    console.log('✅ Password updated:', user.email);
    console.log('Password: admin123');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

updatePassword();
"

echo "✅ Setup complete!"
