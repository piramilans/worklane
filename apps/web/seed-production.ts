import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting production database seeding...");

  try {
    // Get or create organization
    let organization = await prisma.organization.findFirst({
      where: { subdomain: "aaws" },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: "AAWS Organization",
          slug: "aaws",
          subdomain: "aaws",
          description: "AAWS Main Organization",
        },
      });
      console.log("✅ Created organization: AAWS");
    } else {
      console.log("✓ Organization already exists: AAWS");
    }

    // Create or get the main user
    console.log("\n👤 Creating main user...");
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const user = await prisma.user.upsert({
      where: { email: "milan@aaws.ca" },
      update: {
        password: hashedPassword, // Update password on each seed
      },
      create: {
        name: "Milan",
        email: "milan@aaws.ca",
        password: hashedPassword,
      },
    });
    console.log(`✅ Created/updated user: ${user.email}`);
    console.log("   Password: admin123");

    // Get or create Super Admin role
    console.log("\n🎭 Creating Super Admin role...");
    const superAdminRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: "Super Admin",
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        name: "Super Admin",
        description: "Full access to everything",
        organizationId: organization.id,
        isSystem: true,
      },
    });
    console.log("✅ Super Admin role created");

    // Assign all permissions to Super Admin
    console.log("\n🔐 Assigning permissions...");
    const allPermissions = await prisma.permission.findMany();

    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      });
    }
    console.log(
      `✅ Assigned ${allPermissions.length} permissions to Super Admin`
    );

    // Assign user to organization as Super Admin
    console.log("\n🔗 Assigning user to organization...");
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: {
        roleId: superAdminRole.id,
      },
      create: {
        userId: user.id,
        organizationId: organization.id,
        roleId: superAdminRole.id,
      },
    });
    console.log(`✅ Assigned ${user.email} as Super Admin`);

    console.log("\n✅ Production database seeding completed successfully!");
    console.log("\n📋 Login credentials:");
    console.log(`   Email: milan@aaws.ca`);
    console.log(`   Password: admin123`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
