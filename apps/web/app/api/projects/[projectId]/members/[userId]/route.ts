import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasProjectPermission } from "@/lib/permissions/check";
import { ProjectPermission } from "@/lib/permissions/constants";
import { z } from "zod";

const updateMemberSchema = z.object({
  roleId: z.string().optional(),
  customPermissions: z
    .array(
      z.object({
        permissionName: z.string(),
        granted: z.boolean(),
      })
    )
    .optional(),
});

// GET - Get project member details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, userId } = await params;

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

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
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
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error fetching project member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update project member
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, userId } = await params;

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
    const { roleId, customPermissions } = updateMemberSchema.parse(body);

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Update role if provided
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role || role.organizationId !== member.project.organizationId) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      await prisma.projectMember.update({
        where: { id: member.id },
        data: { roleId },
      });
    }

    // Update custom permissions if provided
    if (customPermissions) {
      // Clear existing custom permissions
      await prisma.projectMemberPermission.deleteMany({
        where: { projectMemberId: member.id },
      });

      // Add new custom permissions
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

    // Fetch updated member
    const updatedMember = await prisma.projectMember.findUnique({
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
        organizationId: member.project.organizationId,
        action: "PROJECT_MEMBER_UPDATED",
        resourceType: "PROJECT",
        resourceId: projectId,
        metadata: { updatedUserId: userId },
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating project member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove project member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, userId } = await params;

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

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        organizationId: member.project.organizationId,
        action: "PROJECT_MEMBER_REMOVED",
        resourceType: "PROJECT",
        resourceId: projectId,
        metadata: { removedUserId: userId, email: member.user.email },
      },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
