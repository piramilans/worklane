import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

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

  // Seed permissions
  console.log("\n📝 Seeding permissions...");
  const permissionDefinitions = [
    // Organization Permissions
    {
      name: "MANAGE_ORGANIZATION",
      description: "Edit organization settings and configuration",
      category: "ORGANIZATION",
    },
    {
      name: "MANAGE_USERS",
      description: "Manage organization users and their roles",
      category: "ORGANIZATION",
    },
    {
      name: "MANAGE_BILLING",
      description: "Access and manage billing information",
      category: "ORGANIZATION",
    },
    {
      name: "MANAGE_ROLES",
      description: "Create, edit, and delete custom roles",
      category: "ORGANIZATION",
    },
    {
      name: "VIEW_AUDIT_LOG",
      description: "View organization audit logs",
      category: "ORGANIZATION",
    },
    {
      name: "INVITE_MEMBERS",
      description: "Invite new members to the organization",
      category: "ORGANIZATION",
    },
    {
      name: "REMOVE_MEMBERS",
      description: "Remove members from the organization",
      category: "ORGANIZATION",
    },
    {
      name: "VIEW_DASHBOARD",
      description: "View and access the organization dashboard",
      category: "ORGANIZATION",
    },
    {
      name: "MANAGE_TEAM",
      description: "Manage team members and their assignments",
      category: "ORGANIZATION",
    },
    {
      name: "VIEW_TEAM",
      description: "View team members and their information",
      category: "ORGANIZATION",
    },
    {
      name: "EXPORT_DATA",
      description: "Export organization data and reports",
      category: "ORGANIZATION",
    },
    {
      name: "IMPORT_DATA",
      description: "Import data into the organization",
      category: "ORGANIZATION",
    },
    {
      name: "MANAGE_INTEGRATIONS",
      description: "Manage third-party integrations",
      category: "ORGANIZATION",
    },
    {
      name: "VIEW_ANALYTICS",
      description: "View organization analytics and insights",
      category: "ORGANIZATION",
    },
    {
      name: "MANAGE_SETTINGS",
      description: "Manage organization settings",
      category: "ORGANIZATION",
    },
    {
      name: "DELETE_ORGANIZATION",
      description: "Delete the organization",
      category: "ORGANIZATION",
    },
    {
      name: "MANAGE_SUBSCRIPTIONS",
      description: "Manage subscription and billing plans",
      category: "ORGANIZATION",
    },
    {
      name: "VIEW_BILLING",
      description: "View billing information and invoices",
      category: "ORGANIZATION",
    },
    {
      name: "MANAGE_CUSTOM_FIELDS",
      description: "Manage custom fields and metadata",
      category: "ORGANIZATION",
    },
    {
      name: "VIEW_REPORTS",
      description: "View and generate reports",
      category: "ORGANIZATION",
    },
    {
      name: "MANAGE_WEBHOOKS",
      description: "Manage webhooks and automation",
      category: "ORGANIZATION",
    },

    // Project Permissions
    {
      name: "CREATE_PROJECT",
      description: "Create new projects",
      category: "PROJECT",
    },
    {
      name: "EDIT_PROJECT",
      description: "Edit project details and settings",
      category: "PROJECT",
    },
    {
      name: "DELETE_PROJECT",
      description: "Delete projects permanently",
      category: "PROJECT",
    },
    {
      name: "VIEW_PROJECT",
      description: "View project details",
      category: "PROJECT",
    },
    {
      name: "MANAGE_PROJECT_MEMBERS",
      description: "Add, remove, and manage project members",
      category: "PROJECT",
    },
    {
      name: "ARCHIVE_PROJECT",
      description: "Archive or unarchive projects",
      category: "PROJECT",
    },
    {
      name: "EXPORT_PROJECT",
      description: "Export project data",
      category: "PROJECT",
    },
    {
      name: "IMPORT_PROJECT",
      description: "Import project data",
      category: "PROJECT",
    },
    {
      name: "MANAGE_PROJECT_SETTINGS",
      description: "Manage project-specific settings",
      category: "PROJECT",
    },
    {
      name: "CLONE_PROJECT",
      description: "Clone existing projects",
      category: "PROJECT",
    },
    {
      name: "VIEW_PROJECT_ANALYTICS",
      description: "View project analytics and metrics",
      category: "PROJECT",
    },
    {
      name: "ASSIGN_PROJECT",
      description: "Assign projects to team members",
      category: "PROJECT",
    },
    {
      name: "MANAGE_PROJECT_ROLES",
      description: "Manage project-specific roles",
      category: "PROJECT",
    },
    {
      name: "MANAGE_PROJECT_TEMPLATES",
      description: "Create and manage project templates",
      category: "PROJECT",
    },
    {
      name: "VIEW_PROJECT_HISTORY",
      description: "View project history and changes",
      category: "PROJECT",
    },

    // Task Permissions
    { name: "CREATE_TASK", description: "Create new tasks", category: "TASK" },
    { name: "EDIT_TASK", description: "Edit task details", category: "TASK" },
    { name: "DELETE_TASK", description: "Delete tasks", category: "TASK" },
    { name: "VIEW_TASK", description: "View task details", category: "TASK" },
    {
      name: "ASSIGN_TASK",
      description: "Assign tasks to team members",
      category: "TASK",
    },
    {
      name: "CHANGE_TASK_STATUS",
      description: "Change task status (TODO, IN_PROGRESS, etc.)",
      category: "TASK",
    },
    {
      name: "COMMENT_TASK",
      description: "Add comments to tasks",
      category: "TASK",
    },
    {
      name: "EDIT_TASK_PRIORITY",
      description: "Change task priority",
      category: "TASK",
    },
    {
      name: "MANAGE_TASK_DEPENDENCIES",
      description: "Manage task dependencies and relationships",
      category: "TASK",
    },
    {
      name: "ATTACH_TASK_FILES",
      description: "Attach files to tasks",
      category: "TASK",
    },
    {
      name: "EDIT_TASK_ASSIGNMENTS",
      description: "Edit task assignments and assignees",
      category: "TASK",
    },
    {
      name: "VIEW_TASK_HISTORY",
      description: "View task change history",
      category: "TASK",
    },
    { name: "EXPORT_TASKS", description: "Export task data", category: "TASK" },
    {
      name: "BULK_EDIT_TASKS",
      description: "Edit multiple tasks at once",
      category: "TASK",
    },
    {
      name: "DELETE_TASK_ATTACHMENTS",
      description: "Delete task attachments",
      category: "TASK",
    },
    {
      name: "MANAGE_TASK_TEMPLATES",
      description: "Create and manage task templates",
      category: "TASK",
    },
    {
      name: "VIEW_TASK_ANALYTICS",
      description: "View task analytics and metrics",
      category: "TASK",
    },
    {
      name: "MANAGE_TASK_CUSTOM_FIELDS",
      description: "Manage custom fields for tasks",
      category: "TASK",
    },
  ];

  const permissions = [];
  for (const perm of permissionDefinitions) {
    const existing = await prisma.permission.findUnique({
      where: { name: perm.name },
    });

    if (existing) {
      permissions.push(existing);
    } else {
      const created = await prisma.permission.create({ data: perm });
      permissions.push(created);
      console.log(`✅ Created permission: ${perm.name}`);
    }
  }

  // Create users
  console.log("\n👥 Seeding users...");
  const userData = [
    {
      name: "Milan",
      email: "milan@aaws.ca",
      password: await bcrypt.hash("password123", 12),
      image: null,
    },
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@aaws.ca",
      password: await bcrypt.hash("password123", 12),
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Michael Chen",
      email: "michael.chen@aaws.ca",
      password: await bcrypt.hash("password123", 12),
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Emily Rodriguez",
      email: "emily.rodriguez@aaws.ca",
      password: await bcrypt.hash("password123", 12),
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "David Kim",
      email: "david.kim@aaws.ca",
      password: await bcrypt.hash("password123", 12),
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Lisa Thompson",
      email: "lisa.thompson@aaws.ca",
      password: await bcrypt.hash("password123", 12),
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "James Wilson",
      email: "james.wilson@aaws.ca",
      password: await bcrypt.hash("password123", 12),
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Maria Garcia",
      email: "maria.garcia@aaws.ca",
      password: await bcrypt.hash("password123", 12),
      image:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Alex Turner",
      email: "alex.turner@aaws.ca",
      password: await bcrypt.hash("password123", 12),
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    },
  ];

  const users = [];
  for (const user of userData) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      users.push(existing);
      console.log(`✓ User already exists: ${user.email}`);
    } else {
      const created = await prisma.user.create({ data: user });
      users.push(created);
      console.log(`✅ Created user: ${user.email}`);
    }
  }

  // Create roles
  console.log("\n🎭 Creating roles...");
  const roles = [];

  // Super Admin role
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
  roles.push(superAdminRole);

  // Assign all permissions to Super Admin
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }
  console.log("✅ Super Admin role created with all permissions");

  // Assign users to organization
  console.log("\n🔗 Assigning users to organization...");
  const firstUser = users[0];
  if (!firstUser) {
    console.log("⚠ No users to assign");
  } else {
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: firstUser.id,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        userId: firstUser.id,
        organizationId: organization.id,
        roleId: superAdminRole.id,
      },
    });
    console.log(`✅ Assigned ${firstUser.name} to Super Admin`);
  }

  // Create projects
  console.log("\n📁 Creating projects...");
  const projects = [
    {
      name: "Website Redesign",
      description: "Complete redesign of the company website",
      status: "ACTIVE",
    },
    {
      name: "Mobile App Development",
      description: "Development of a new mobile application",
      status: "ACTIVE",
    },
    {
      name: "API Integration",
      description: "Integration with third-party APIs",
      status: "IN_PROGRESS",
    },
    {
      name: "Database Migration",
      description: "Migration from legacy database",
      status: "PLANNING",
    },
    {
      name: "Marketing Campaign",
      description: "Q2 marketing campaign launch",
      status: "ACTIVE",
    },
    {
      name: "Security Audit",
      description: "Comprehensive security audit",
      status: "IN_PROGRESS",
    },
  ];

  const createdProjects = [];
  for (const projectData of projects) {
    const project = await prisma.project
      .upsert({
        where: { id: "temp" },
        update: {},
        create: {
          ...projectData,
          organizationId: organization.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      })
      .catch(async () => {
        // Project might exist, try to find it
        return await prisma.project.findFirst({
          where: {
            name: projectData.name,
            organizationId: organization.id,
          },
        });
      });

    if (project) {
      createdProjects.push(project);
      console.log(`✅ Created/found project: ${project.name}`);
    }
  }

  console.log("\n✅ Database seeding completed successfully!");
  console.log(`📊 Summary:`);
  console.log(`   - ${permissions.length} permissions`);
  console.log(`   - ${users.length} users`);
  console.log(`   - ${createdProjects.length} projects`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
