import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking production database...");

  try {
    // Check if database is accessible
    const orgs = await prisma.organization.findMany();
    console.log(`✅ Found ${orgs.length} organizations`);

    // Check users
    const users = await prisma.user.findMany();
    console.log(`✅ Found ${users.length} users:`);

    for (const user of users) {
      console.log(`  - ${user.email} (ID: ${user.id})`);
      console.log(`    Has password: ${!!user.password}`);

      if (user.password) {
        // Test password verification
        const isValid = await bcrypt.compare("admin123", user.password);
        console.log(`    Password 'admin123' is valid: ${isValid}`);
      }
    }

    // Check organization members
    const members = await prisma.organizationMember.findMany({
      include: {
        user: true,
        role: true,
        organization: true,
      },
    });

    console.log(`\n✅ Found ${members.length} organization members:`);
    for (const member of members) {
      console.log(
        `  - ${member.user.email} in ${member.organization.name} as ${member.role.name}`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
