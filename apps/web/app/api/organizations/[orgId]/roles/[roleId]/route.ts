import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasOrgPermission } from "@/lib/permissions/check";
import { OrgPermission } from "@/lib/permissions/constants";
import { z } from "zod";

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

// GET - Get role details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; roleId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, roleId } = await params;

    const canManageRoles = await hasOrgPermission(
      session.user.id,
      orgId,
      OrgPermission.MANAGE_ROLES
    );

    if (!canManageRoles) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
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
        _count: {
          select: {
            organizationMembers: true,
            projectMembers: true,
          },
        },
      },
    });

    if (!role || role.organizationId !== orgId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; roleId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, roleId } = await params;

    const canManageRoles = await hasOrgPermission(
      session.user.id,
      orgId,
      OrgPermission.MANAGE_ROLES
    );

    if (!canManageRoles) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.organizationId !== orgId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: "Cannot modify system roles" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, description, permissions } = updateRoleSchema.parse(body);

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
      // Clear existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Add new permissions
      for (const permissionName of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId,
              permissionId: permission.id,
            },
          });
        }
      }
    }

    // Fetch the complete updated role
    const completeRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        organizationId: orgId,
        action: "ROLE_UPDATED",
        resourceType: "ROLE",
        resourceId: roleId,
        metadata: { roleName: updatedRole.name },
      },
    });

    return NextResponse.json({ role: completeRole });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete role
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; roleId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, roleId } = await params;

    const canManageRoles = await hasOrgPermission(
      session.user.id,
      orgId,
      OrgPermission.MANAGE_ROLES
    );

    if (!canManageRoles) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

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

    if (!role || role.organizationId !== orgId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system roles" },
        { status: 400 }
      );
    }

    if (role._count.organizationMembers > 0 || role._count.projectMembers > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete role that is assigned to members. Please reassign members first.",
        },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        organizationId: orgId,
        action: "ROLE_DELETED",
        resourceType: "ROLE",
        resourceId: roleId,
        metadata: { roleName: role.name },
      },
    });

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
