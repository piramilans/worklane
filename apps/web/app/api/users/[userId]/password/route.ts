import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateTemporaryPassword, hashPassword } from "@/lib/users/password";
import { logAuditEvent } from "@/lib/audit/log";
import { requireOrgPermission } from "@/lib/permissions/middleware";

// POST /api/users/[userId]/password - Reset user password
export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
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

    // Check if user has permission to manage users in this organization
    const hasPermission = await requireOrgPermission(
      "MANAGE_USERS",
      organizationId,
      session.user.id
    );
    if (!hasPermission) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        organizationMembers: {
          where: { organizationId },
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

    // Generate new temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Update user password
    await prisma.user.update({
      where: { id: params.userId },
      data: { password: hashedPassword },
    });

    // Log the action
    await logAuditEvent({
      userId: session.user.id,
      organizationId,
      action: "PASSWORD_RESET",
      resourceType: "USER",
      resourceId: params.userId,
      metadata: {
        userEmail: user.email,
        userName: user.name || "Unknown",
        temporaryPassword, // Include in metadata for admin to see
      },
    });

    return NextResponse.json({
      message: "Password reset successfully",
      temporaryPassword, // Return temporary password to admin
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
