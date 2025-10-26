import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRoleSchema } from "@/lib/users/validation";
import { logRoleCreated } from "@/lib/audit/log";
import { hasOrgPermission } from "@/lib/permissions/check";
import { OrgPermission } from "@/lib/permissions/constants";

// GET /api/roles - List all roles in organization
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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

    // Get all roles (system + organization-specific)
    const [systemRoles, orgRoles] = await Promise.all([
      prisma.role.findMany({
        where: {
          isSystem: true,
        },
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
        orderBy: { name: "asc" },
      }),
      prisma.role.findMany({
        where: {
          organizationId,
          isSystem: false,
        },
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
        orderBy: { name: "asc" },
      }),
    ]);

    const allRoles = [...systemRoles, ...orgRoles];

    return NextResponse.json({
      roles: allRoles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        organizationId: role.organizationId,
        permissions: role.permissions.map((rp) => rp.permission),
        memberCount:
          role._count.organizationMembers + role._count.projectMembers,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create custom role
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, organizationId, permissions } =
      createRoleSchema.parse(body);

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

    // Check if role name already exists in this organization
    const existingRole = await prisma.role.findFirst({
        where: {
          name: name,
          organizationId,
        },
    });

    if (existingRole) {
      return NextResponse.json(
        {
          message: "A role with this name already exists in this organization",
        },
        { status: 409 }
      );
    }

    // Create the role
    const role = await prisma.role.create({
      data: {
        name,
        description,
        organizationId,
        isSystem: false,
      },
    });

    // Add permissions to the role
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

    // Get the created role with permissions
    const createdRole = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Log the action
    await logRoleCreated({
      userId: session.user.id,
      organizationId,
      action: "ROLE_CREATED",
      resourceType: "ROLE",
      resourceId: role.id,
      roleName: role.name,
      permissions,
    });

    return NextResponse.json({
      message: "Role created successfully",
      role: {
        id: createdRole!.id,
        name: createdRole!.name,
        description: createdRole!.description,
        isSystem: createdRole!.isSystem,
        organizationId: createdRole!.organizationId,
        permissions: createdRole!.permissions.map((rp) => rp.permission),
        createdAt: createdRole!.createdAt,
        updatedAt: createdRole!.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "Validation error", errors: error.message },
        { status: 400 }
      );
    }
    console.error("Error creating role:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
