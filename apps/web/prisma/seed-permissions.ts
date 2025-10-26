import { PrismaClient } from "@prisma/client";
import {
  PERMISSION_DEFINITIONS,
  SystemRole,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_DESCRIPTIONS,
} from "../lib/permissions/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding permissions and roles...");

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

  // 3. Create a demo organization
  console.log("Creating demo organization...");
  const demoOrg = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {
      name: "Demo Organization",
      description: "A demo organization for testing",
    },
    create: {
      name: "Demo Organization",
      slug: "demo-org",
      description: "A demo organization for testing",
    },
  });
  console.log(`✅ Created demo organization: ${demoOrg.name}`);

  // 4. Copy system roles to the demo organization
  console.log("Copying system roles to demo organization...");
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
        organizationId: demoOrg.id,
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
            organizationId: demoOrg.id,
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
  console.log(`✅ Copied ${systemRoles.length} roles to demo organization`);

  // 5. Assign existing users to the demo organization as Super Admin
  console.log("Assigning existing users to demo organization...");
  const users = await prisma.user.findMany();
  const superAdminRole = await prisma.role.findFirst({
    where: {
      name: SystemRole.SUPER_ADMIN,
      organizationId: demoOrg.id,
    },
  });

  if (superAdminRole) {
    for (const user of users) {
      await prisma.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: demoOrg.id,
          },
        },
        update: {
          roleId: superAdminRole.id,
        },
        create: {
          userId: user.id,
          organizationId: demoOrg.id,
          roleId: superAdminRole.id,
        },
      });
      console.log(
        `✅ Assigned ${user.email} as Super Admin in demo organization`
      );
    }
  }

  // 6. Create a demo project
  console.log("Creating demo project...");
  const demoProject = await prisma.project.upsert({
    where: { id: "demo-project-id" },
    update: {
      name: "Demo Project",
      description: "A demo project for testing",
    },
    create: {
      id: "demo-project-id",
      name: "Demo Project",
      description: "A demo project for testing",
      organizationId: demoOrg.id,
      status: "ACTIVE",
    },
  });
  console.log(`✅ Created demo project: ${demoProject.name}`);

  // 7. Add users to demo project
  const projectManagerRole = await prisma.role.findFirst({
    where: {
      name: SystemRole.PROJECT_MANAGER,
      organizationId: demoOrg.id,
    },
  });

  if (projectManagerRole) {
    for (const user of users) {
      await prisma.projectMember.upsert({
        where: {
          userId_projectId: {
            userId: user.id,
            projectId: demoProject.id,
          },
        },
        update: {
          roleId: projectManagerRole.id,
        },
        create: {
          userId: user.id,
          projectId: demoProject.id,
          roleId: projectManagerRole.id,
        },
      });
      console.log(`✅ Added ${user.email} to demo project as Project Manager`);
    }
  }

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
