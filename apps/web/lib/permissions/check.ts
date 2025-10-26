import { prisma } from "@/lib/prisma";
import { Permission, PermissionCategory } from "./constants";

/**
 * Check if a user has a specific organization-level permission
 */
export async function hasOrgPermission(
  userId: string,
  orgId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!member) return false;

    return member.role.permissions.some(
      (rp) => rp.permission.name === permission
    );
  } catch (error) {
    console.error("Error checking org permission:", error);
    return false;
  }
}

/**
 * Check if a user has a specific project-level permission
 * Takes into account both role permissions and custom project-specific overrides
 */
export async function hasProjectPermission(
  userId: string,
  projectId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        customPermissions: {
          include: {
            permission: true,
          },
        },
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!projectMember) {
      // Check if user has org-level permission that applies
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true },
      });

      if (!project) return false;

      return hasOrgPermission(userId, project.organizationId, permission);
    }

    // Check for custom permission overrides first
    const customPermission = projectMember.customPermissions.find(
      (cp) => cp.permission.name === permission
    );

    if (customPermission) {
      return customPermission.granted;
    }

    // Fall back to role permissions
    return projectMember.role.permissions.some(
      (rp) => rp.permission.name === permission
    );
  } catch (error) {
    console.error("Error checking project permission:", error);
    return false;
  }
}

/**
 * Check if a user has a specific task-level permission
 */
export async function hasTaskPermission(
  userId: string,
  taskId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, creatorId: true },
    });

    if (!task) return false;

    // Task creator always has full permissions on their own tasks
    if (task.creatorId === userId) return true;

    // Check project-level permission
    return hasProjectPermission(userId, task.projectId, permission);
  } catch (error) {
    console.error("Error checking task permission:", error);
    return false;
  }
}

/**
 * Get user's role in an organization
 */
export async function getUserOrgRole(
  userId: string,
  orgId: string
): Promise<string | null> {
  try {
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
      include: {
        role: true,
      },
    });

    return member?.role.name || null;
  } catch (error) {
    console.error("Error getting user org role:", error);
    return null;
  }
}

/**
 * Get user's role in a project (can be different from org role)
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<string | null> {
  try {
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        role: true,
      },
    });

    return projectMember?.role.name || null;
  } catch (error) {
    console.error("Error getting user project role:", error);
    return null;
  }
}

/**
 * Get all permissions for a user in a specific context
 */
export async function getUserPermissions(
  userId: string,
  context: { orgId?: string; projectId?: string }
): Promise<Permission[]> {
  try {
    const permissions: Set<Permission> = new Set();

    // Get org permissions
    if (context.orgId) {
      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: context.orgId,
          },
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      member?.role.permissions.forEach((rp) => {
        permissions.add(rp.permission.name as Permission);
      });
    }

    // Get project permissions (including overrides)
    if (context.projectId) {
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId: context.projectId,
          },
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
          customPermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Add role permissions
      projectMember?.role.permissions.forEach((rp) => {
        permissions.add(rp.permission.name as Permission);
      });

      // Apply custom permission overrides
      projectMember?.customPermissions.forEach((cp) => {
        if (cp.granted) {
          permissions.add(cp.permission.name as Permission);
        } else {
          permissions.delete(cp.permission.name as Permission);
        }
      });
    }

    return Array.from(permissions);
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

/**
 * Universal permission check
 */
export async function canAccessResource(
  userId: string,
  resourceType: "organization" | "project" | "task",
  resourceId: string,
  permission: Permission
): Promise<boolean> {
  switch (resourceType) {
    case "organization":
      return hasOrgPermission(userId, resourceId, permission);
    case "project":
      return hasProjectPermission(userId, resourceId, permission);
    case "task":
      return hasTaskPermission(userId, resourceId, permission);
    default:
      return false;
  }
}

/**
 * Check if user is a member of an organization
 */
export async function isOrgMember(
  userId: string,
  orgId: string
): Promise<boolean> {
  try {
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    return !!member;
  } catch (error) {
    console.error("Error checking org membership:", error);
    return false;
  }
}

/**
 * Check if user is a member of a project
 */
export async function isProjectMember(
  userId: string,
  projectId: string
): Promise<boolean> {
  try {
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    return !!member;
  } catch (error) {
    console.error("Error checking project membership:", error);
    return false;
  }
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations(userId: string) {
  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
        role: true,
      },
    });

    return memberships.map((m) => ({
      organization: m.organization,
      role: m.role.name,
      joinedAt: m.joinedAt,
    }));
  } catch (error) {
    console.error("Error getting user organizations:", error);
    return [];
  }
}

/**
 * Get user's projects in an organization
 */
export async function getUserProjects(userId: string, orgId: string) {
  try {
    const projectMemberships = await prisma.projectMember.findMany({
      where: {
        userId,
        project: {
          organizationId: orgId,
        },
      },
      include: {
        project: true,
        role: true,
      },
    });

    return projectMemberships.map((pm) => ({
      project: pm.project,
      role: pm.role.name,
      joinedAt: pm.joinedAt,
    }));
  } catch (error) {
    console.error("Error getting user projects:", error);
    return [];
  }
}
