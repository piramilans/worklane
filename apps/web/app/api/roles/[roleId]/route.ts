import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateRoleSchema } from "@/lib/users/validation";
import { logRoleUpdated, logRoleDeleted } from "@/lib/audit/log";
import { hasOrgPermission } from "@/lib/permissions/check";
import { OrgPermission } from "@/lib/permissions/constants";

// GET /api/roles/[roleId] - Get role details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await params;
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to manage roles in this organization
    const hasPermission = await hasOrgPermission(
      session.user.id,
      organizationId,
      OrgPermission.MANAGE_ROLES
    );
    if (!hasPermission) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        organizationMembers: {
          where: { organizationId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        projectMembers: {
          where: {
            project: {
              organizationId,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    // Check if role belongs to this organization (for custom roles)
    if (!role.isSystem && role.organizationId !== organizationId) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      organizationId: role.organizationId,
      permissions: role.permissions.map((rp) => rp.permission),
      members: {
        organization: role.organizationMembers.map((om) => ({
          id: om.user.id,
          name: om.user.name,
          email: om.user.email,
          joinedAt: om.joinedAt,
        })),
        projects: role.projectMembers.map((pm) => ({
          id: pm.user.id,
          name: pm.user.name,
          email: pm.user.email,
          project: pm.project,
        })),
      },
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[roleId] - Update role
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await params;
    const body = await req.json();
    const { name, description, permissions } = updateRoleSchema.parse(body);

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to manage roles in this organization
    const hasPermission = await hasOrgPermission(
      session.user.id,
      organizationId,
      OrgPermission.MANAGE_ROLES
    );
    if (!hasPermission) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get current role data for audit log
    const currentRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!currentRole) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    // Check if role belongs to this organization (for custom roles)
    if (
      !currentRole.isSystem &&
      currentRole.organizationId !== organizationId
    ) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    // System roles cannot be modified
    if (currentRole.isSystem) {
      return NextResponse.json(
        { message: "System roles cannot be modified" },
        { status: 400 }
      );
    }

    // Check if role name is being changed and if it's already taken
    if (name && name !== currentRole.name) {
      const existingRole = await prisma.role.findFirst({
        where: {
          name: name,
          organizationId,
          id: {
            not: roleId,
          },
        },
      });

      if (existingRole) {
        return NextResponse.json(
          {
            message:
              "A role with this name already exists in this organization",
          },
          { status: 409 }
        );
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    // Update permissions if provided
    if (permissions) {
      // Remove all current permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: roleId },
      });

      // Add new permissions
      for (const permissionName of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: roleId,
              permissionId: permission.id,
            },
          });
        }
      }
    }

    // Get updated role with permissions
    const finalRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Log the changes
    const changes: Record<string, { from: any; to: any }> = {};
    if (name && name !== currentRole.name) {
      changes.name = { from: currentRole.name, to: name };
    }
    if (description !== undefined && description !== currentRole.description) {
      changes.description = { from: currentRole.description, to: description };
    }
    if (permissions) {
      const currentPermissions = currentRole.permissions.map(
        (rp) => rp.permission.name
      );
      changes.permissions = { from: currentPermissions, to: permissions };
    }

    if (Object.keys(changes).length > 0) {
      await logRoleUpdated({
        userId: session.user.id,
        organizationId,
        action: "ROLE_UPDATED",
        resourceType: "ROLE",
        resourceId: roleId,
        roleName: updatedRole.name,
        changes,
      });
    }

    return NextResponse.json({
      message: "Role updated successfully",
      role: {
        id: finalRole!.id,
        name: finalRole!.name,
        description: finalRole!.description,
        isSystem: finalRole!.isSystem,
        organizationId: finalRole!.organizationId,
        permissions: finalRole!.permissions.map((rp) => rp.permission),
        createdAt: finalRole!.createdAt,
        updatedAt: finalRole!.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "Validation error", errors: error.message },
        { status: 400 }
      );
    }
    console.error("Error updating role:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[roleId] - Delete custom role
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await params;
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to manage roles in this organization
    const hasPermission = await hasOrgPermission(
      session.user.id,
      organizationId,
      OrgPermission.MANAGE_ROLES
    );
    if (!hasPermission) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get role data for audit log
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            organizationMembers: true,
            projectMembers: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    // Check if role belongs to this organization (for custom roles)
    if (!role.isSystem && role.organizationId !== organizationId) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    // System roles cannot be deleted
    if (role.isSystem) {
      return NextResponse.json(
        { message: "System roles cannot be deleted" },
        { status: 400 }
      );
    }

    // Check if role has active members
    const memberCount =
      role._count.organizationMembers + role._count.projectMembers;
    if (memberCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete role. This role has ${memberCount} member${memberCount !== 1 ? "s" : ""} assigned. Please remove all members before deleting.`,
        },
        { status: 400 }
      );
    }

    // Delete the role
    await prisma.role.delete({
      where: { id: roleId },
    });

    // Log the action
    await logRoleDeleted({
      userId: session.user.id,
      organizationId,
      action: "ROLE_DELETED",
      resourceType: "ROLE",
      resourceId: roleId,
      roleName: role.name,
      memberCount: 0,
    });

    return NextResponse.json({
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
