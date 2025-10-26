import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/users/validation";
import { generateTemporaryPassword, hashPassword } from "@/lib/users/password";
import { logUserUpdated, logMemberRemoved } from "@/lib/audit/log";
import { hasOrgPermission } from "@/lib/permissions/check";
import { OrgPermission } from "@/lib/permissions/constants";

// GET /api/users/[userId] - Get user details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to manage users in this organization
    const hasPermission = await hasOrgPermission(
      session.user.id,
      organizationId,
      OrgPermission.MANAGE_USERS
    );
    if (!hasPermission) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMembers: {
          where: { organizationId },
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
        },
        projectMembers: {
          where: {
            project: {
              organizationId,
            },
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            role: true,
            customPermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const orgMember = user.organizationMembers[0];
    if (!orgMember) {
      return NextResponse.json(
        { message: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: orgMember.role,
      joinedAt: orgMember.joinedAt,
      projects: user.projectMembers.map((pm) => ({
        id: pm.project.id,
        name: pm.project.name,
        role: pm.role,
        customPermissions: pm.customPermissions,
      })),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId] - Update user
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await req.json();
    const { name, email, roleId } = updateUserSchema.parse(body);

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to manage users in this organization
    const hasPermission = await hasOrgPermission(
      session.user.id,
      organizationId,
      OrgPermission.MANAGE_USERS
    );
    if (!hasPermission) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMembers: {
          where: { organizationId },
          include: { role: true },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const currentMember = currentUser.organizationMembers[0];
    if (!currentMember) {
      return NextResponse.json(
        { message: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Email is already taken" },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    // Update role if provided
    let updatedMember = currentMember;
    if (roleId && roleId !== currentMember.roleId) {
      updatedMember = await prisma.organizationMember.update({
        where: { id: currentMember.id },
        data: { roleId },
        include: { role: true },
      });
    }

    // Log the changes
    const changes: Record<string, { from: any; to: any }> = {};
    if (name && name !== currentUser.name) {
      changes.name = { from: currentUser.name, to: name };
    }
    if (email && email !== currentUser.email) {
      changes.email = { from: currentUser.email, to: email };
    }
    if (roleId && roleId !== currentMember.roleId) {
      changes.role = {
        from: currentMember.role.name,
        to: updatedMember.role.name,
      };
    }

    if (Object.keys(changes).length > 0) {
      await logUserUpdated({
        userId: session.user.id,
        organizationId,
        action: "USER_UPDATED",
        resourceType: "USER",
        resourceId: userId,
        changes,
      });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedMember.role,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "Validation error", errors: error.message },
        { status: 400 }
      );
    }
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId] - Remove user from organization
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to manage users in this organization
    const hasPermission = await hasOrgPermission(
      session.user.id,
      organizationId,
      OrgPermission.MANAGE_USERS
    );
    if (!hasPermission) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Prevent user from removing themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { message: "You cannot remove yourself from the organization" },
        { status: 400 }
      );
    }

    // Get user data for audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMembers: {
          where: { organizationId },
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const member = user.organizationMembers[0];
    if (!member) {
      return NextResponse.json(
        { message: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    // Remove user from organization
    await prisma.organizationMember.delete({
      where: { id: member.id },
    });

    // Remove user from all projects in this organization
    await prisma.projectMember.deleteMany({
      where: {
        userId: userId,
        project: {
          organizationId,
        },
      },
    });

    // Log the action
    await logMemberRemoved({
      userId: session.user.id,
      organizationId,
      action: "MEMBER_REMOVED",
      resourceType: "ORGANIZATION_MEMBER",
      resourceId: member.id,
      userEmail: user.email,
      roleName: member.role.name,
    });

    return NextResponse.json({
      message: "User removed from organization successfully",
    });
  } catch (error) {
    console.error("Error removing user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
