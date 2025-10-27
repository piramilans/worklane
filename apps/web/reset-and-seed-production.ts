import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Resetting and seeding production database...");

  try {
    // Delete all data (reset database)
    console.log("🗑️  Deleting all existing data...");

    await prisma.taskReviewer.deleteMany();
    await prisma.taskAssignment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    console.log("✅ Database cleared");

    // Create organization
    console.log("\n🏢 Creating organization...");
    const organization = await prisma.organization.create({
      data: {
        name: "AAWS Organization",
        slug: "aaws",
        subdomain: "aaws",
        description: "AAWS Main Organization",
      },
    });
    console.log(`✅ Created organization: ${organization.name}`);

    // Seed permissions
    console.log("\n📝 Creating permissions...");
    const permissionDefinitions = [
      // Organization Permissions
      {
        name: "MANAGE_ORGANIZATION",
        description: "Edit organization settings",
        category: "ORGANIZATION",
      },
      {
        name: "MANAGE_USERS",
        description: "Manage users and roles",
        category: "ORGANIZATION",
      },
      {
        name: "MANAGE_BILLING",
        description: "Access billing info",
        category: "ORGANIZATION",
      },
      {
        name: "MANAGE_ROLES",
        description: "Manage roles",
        category: "ORGANIZATION",
      },
      {
        name: "VIEW_AUDIT_LOG",
        description: "View audit logs",
        category: "ORGANIZATION",
      },
      {
        name: "INVITE_MEMBERS",
        description: "Invite members",
        category: "ORGANIZATION",
      },
      {
        name: "REMOVE_MEMBERS",
        description: "Remove members",
        category: "ORGANIZATION",
      },
      {
        name: "VIEW_DASHBOARD",
        description: "View dashboard",
        category: "ORGANIZATION",
      },

      // Project Permissions
      {
        name: "CREATE_PROJECT",
        description: "Create projects",
        category: "PROJECT",
      },
      {
        name: "EDIT_PROJECT",
        description: "Edit projects",
        category: "PROJECT",
      },
      {
        name: "DELETE_PROJECT",
        description: "Delete projects",
        category: "PROJECT",
      },
      {
        name: "VIEW_PROJECT",
        description: "View projects",
        category: "PROJECT",
      },
      {
        name: "MANAGE_PROJECT_MEMBERS",
        description: "Manage project members",
        category: "PROJECT",
      },

      // Task Permissions
      { name: "CREATE_TASK", description: "Create tasks", category: "TASK" },
      { name: "EDIT_TASK", description: "Edit tasks", category: "TASK" },
      { name: "DELETE_TASK", description: "Delete tasks", category: "TASK" },
      { name: "VIEW_TASK", description: "View tasks", category: "TASK" },
      { name: "ASSIGN_TASK", description: "Assign tasks", category: "TASK" },
    ];

    const permissions = [];
    for (const perm of permissionDefinitions) {
      const created = await prisma.permission.create({ data: perm });
      permissions.push(created);
      console.log(`  ✅ ${created.name}`);
    }

    // Create users
    console.log("\n👥 Creating users...");
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: "Milan",
          email: "milan@aaws.ca",
          password: hashedPassword,
        },
      }),
      prisma.user.create({
        data: {
          name: "Sarah Johnson",
          email: "sarah.johnson@aaws.ca",
          password: hashedPassword,
        },
      }),
      prisma.user.create({
        data: {
          name: "Michael Chen",
          email: "michael.chen@aaws.ca",
          password: hashedPassword,
        },
      }),
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create roles
    console.log("\n🎭 Creating roles...");
    const superAdminRole = await prisma.role.create({
      data: {
        name: "Super Admin",
        description: "Full access to everything",
        organizationId: organization.id,
        isSystem: true,
      },
    });

    // Assign all permissions to Super Admin
    for (const perm of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      });
    }
    console.log("✅ Super Admin role created with all permissions");

    // Assign users to organization
    console.log("\n🔗 Assigning users to organization...");
    for (const user of users) {
      await prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          roleId: superAdminRole.id,
        },
      });
    }
    console.log(`✅ Assigned ${users.length} users to organization`);

    // Create projects
    console.log("\n📁 Creating projects...");
    const projects = await Promise.all([
      prisma.project.create({
        data: {
          name: "Website Redesign",
          description: "Complete redesign of the company website",
          status: "ACTIVE",
          organizationId: organization.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.project.create({
        data: {
          name: "Mobile App Development",
          description: "Development of a new mobile application",
          status: "ACTIVE",
          organizationId: organization.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.project.create({
        data: {
          name: "API Integration",
          description: "Integration with third-party APIs",
          status: "IN_PROGRESS",
          organizationId: organization.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);
    console.log(`✅ Created ${projects.length} projects`);

    // Add users to projects
    console.log("\n🔗 Adding users to projects...");
    for (const project of projects) {
      for (const user of users) {
        await prisma.projectMember.create({
          data: {
            userId: user.id,
            projectId: project.id,
            roleId: superAdminRole.id,
          },
        });
      }
    }
    console.log("✅ Users added to projects");

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📋 Login credentials:");
    console.log(`   Email: milan@aaws.ca`);
    console.log(`   Password: admin123`);
    console.log(`\n📊 Summary:`);
    console.log(`   - ${permissions.length} permissions`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${projects.length} projects`);
    console.log(`   - 1 Super Admin role`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
