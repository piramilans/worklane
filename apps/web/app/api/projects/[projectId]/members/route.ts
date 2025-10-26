import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasProjectPermission } from "@/lib/permissions/check";
import { ProjectPermission } from "@/lib/permissions/constants";
import { z } from "zod";

const addMemberSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
  customPermissions: z
    .array(
      z.object({
        permissionName: z.string(),
        granted: z.boolean(),
      })
    )
    .optional(),
});

// GET - List project members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const canViewProject = await hasProjectPermission(
      session.user.id,
      projectId,
      ProjectPermission.VIEW_PROJECT
    );

    if (!canViewProject) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
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
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add member to project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const canManageMembers = await hasProjectPermission(
      session.user.id,
      projectId,
      ProjectPermission.MANAGE_PROJECT_MEMBERS
    );

    if (!canManageMembers) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, roleId, customPermissions } = addMemberSchema.parse(body);

    // Get project to verify organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user is a member of the organization
    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: project.organizationId,
        },
      },
    });

    if (!orgMember) {
      return NextResponse.json(
        { error: "User is not a member of the organization" },
        { status: 400 }
      );
    }

    // Check if user is already a project member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 409 }
      );
    }

    // Verify role belongs to the organization
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.organizationId !== project.organizationId) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Create project member
    const member = await prisma.projectMember.create({
      data: {
        userId,
        projectId,
        roleId,
      },
    });

    // Add custom permissions if provided
    if (customPermissions && customPermissions.length > 0) {
      for (const customPerm of customPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: customPerm.permissionName },
        });

        if (permission) {
          await prisma.projectMemberPermission.create({
            data: {
              projectMemberId: member.id,
              permissionId: permission.id,
              granted: customPerm.granted,
            },
          });
        }
      }
    }

    // Fetch complete member data
    const completeMember = await prisma.projectMember.findUnique({
      where: { id: member.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        role: true,
        customPermissions: {
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
        organizationId: project.organizationId,
        action: "PROJECT_MEMBER_ADDED",
        resourceType: "PROJECT",
        resourceId: projectId,
        metadata: { addedUserId: userId, roleName: role.name },
      },
    });

    return NextResponse.json({ member: completeMember }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error adding project member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
