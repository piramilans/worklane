import { PrismaClient } from "@prisma/client";
import {
  PERMISSION_DEFINITIONS,
  SystemRole,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_DESCRIPTIONS,
} from "../lib/permissions/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding permissions, roles, and AAWS organization...");

  // 1. Create all permissions
  console.log("Creating permissions...");
  for (const permDef of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { name: permDef.name },
      update: {
        description: permDef.description,
        category: permDef.category,
      },
      create: {
        name: permDef.name,
        description: permDef.description,
        category: permDef.category,
      },
    });
  }
  console.log(`✅ Created ${PERMISSION_DEFINITIONS.length} permissions`);

  // 2. Create system roles (without organization - these are global templates)
  console.log("Creating system roles...");
  for (const [roleName, permissions] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS
  )) {
    // Check if role exists
    const existingRole = await prisma.role.findFirst({
      where: {
        name: roleName,
        organizationId: null,
      },
    });

    const role = existingRole
      ? await prisma.role.update({
          where: { id: existingRole.id },
          data: {
            description: ROLE_DESCRIPTIONS[roleName as SystemRole],
            isSystem: true,
          },
        })
      : await prisma.role.create({
          data: {
            name: roleName,
            description: ROLE_DESCRIPTIONS[roleName as SystemRole],
            isSystem: true,
            organizationId: null,
          },
        });

    // Clear existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Add permissions to role
    for (const permissionName of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }

    console.log(
      `✅ Created role: ${roleName} with ${permissions.length} permissions`
    );
  }

  // 3. Create AAWS organization
  console.log("Creating AAWS organization...");
  const aawsOrg = await prisma.organization.upsert({
    where: { slug: "aaws" },
    update: {
      name: "AAWS",
      description: "AAWS Organization",
    },
    create: {
      name: "AAWS",
      slug: "aaws",
      description: "AAWS Organization",
    },
  });
  console.log(`✅ Created AAWS organization: ${aawsOrg.name}`);

  // 4. Copy system roles to the AAWS organization
  console.log("Copying system roles to AAWS organization...");
  const systemRoles = await prisma.role.findMany({
    where: { isSystem: true, organizationId: null },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  for (const systemRole of systemRoles) {
    // Check if org role exists
    const existingOrgRole = await prisma.role.findFirst({
      where: {
        name: systemRole.name,
        organizationId: aawsOrg.id,
      },
    });

    const orgRole = existingOrgRole
      ? await prisma.role.update({
          where: { id: existingOrgRole.id },
          data: {
            description: systemRole.description,
          },
        })
      : await prisma.role.create({
          data: {
            name: systemRole.name,
            description: systemRole.description,
            organizationId: aawsOrg.id,
            isSystem: false,
          },
        });

    // Clear existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: orgRole.id },
    });

    // Copy permissions
    for (const rp of systemRole.permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: orgRole.id,
          permissionId: rp.permission.id,
        },
      });
    }
  }
  console.log(`✅ Copied ${systemRoles.length} roles to AAWS organization`);

  // 5. Create or find the main user milan@aaws.ca
  console.log("Creating main user milan@aaws.ca...");
  const mainUser = await prisma.user.upsert({
    where: { email: "milan@aaws.ca" },
    update: {
      name: "Milan",
      email: "milan@aaws.ca",
    },
    create: {
      name: "Milan",
      email: "milan@aaws.ca",
      password: null, // Will be set when user registers
    },
  });
  console.log(`✅ Created/found main user: ${mainUser.email}`);

  // 6. Assign main user to AAWS organization as Super Admin
  console.log("Assigning main user to AAWS organization as Super Admin...");
  const superAdminRole = await prisma.role.findFirst({
    where: {
      name: SystemRole.SUPER_ADMIN,
      organizationId: aawsOrg.id,
    },
  });

  if (superAdminRole) {
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: mainUser.id,
          organizationId: aawsOrg.id,
        },
      },
      update: {
        roleId: superAdminRole.id,
      },
      create: {
        userId: mainUser.id,
        organizationId: aawsOrg.id,
        roleId: superAdminRole.id,
      },
    });
    console.log(
      `✅ Assigned ${mainUser.email} as Super Admin in AAWS organization`
    );
  }

  // 7. Create a demo project in AAWS
  console.log("Creating demo project in AAWS...");
  const demoProject = await prisma.project.upsert({
    where: { id: "aaws-demo-project" },
    update: {
      name: "AAWS Demo Project",
      description: "A demo project for AAWS organization",
    },
    create: {
      id: "aaws-demo-project",
      name: "AAWS Demo Project",
      description: "A demo project for AAWS organization",
      organizationId: aawsOrg.id,
      status: "ACTIVE",
    },
  });
  console.log(`✅ Created demo project: ${demoProject.name}`);

  // 8. Add main user to demo project as Project Manager
  const projectManagerRole = await prisma.role.findFirst({
    where: {
      name: SystemRole.PROJECT_MANAGER,
      organizationId: aawsOrg.id,
    },
  });

  if (projectManagerRole) {
    await prisma.projectMember.upsert({
      where: {
        userId_projectId: {
          userId: mainUser.id,
          projectId: demoProject.id,
        },
      },
      update: {
        roleId: projectManagerRole.id,
      },
      create: {
        userId: mainUser.id,
        projectId: demoProject.id,
        roleId: projectManagerRole.id,
      },
    });
    console.log(
      `✅ Added ${mainUser.email} to demo project as Project Manager`
    );
  }

  console.log("🎉 Seeding completed successfully!");
  console.log("\n📋 Summary:");
  console.log(`- Organization: ${aawsOrg.name} (${aawsOrg.slug})`);
  console.log(`- Main User: ${mainUser.email}`);
  console.log(
    `- Role: Super Admin in organization, Project Manager in demo project`
  );
  console.log(`- Demo Project: ${demoProject.name}`);
  console.log(`- All ${PERMISSION_DEFINITIONS.length} permissions created`);
  console.log(`- All ${systemRoles.length} system roles created`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
