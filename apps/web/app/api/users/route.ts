import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/users/validation";
import { generateTemporaryPassword, hashPassword } from "@/lib/users/password";
import { logUserCreated } from "@/lib/audit/log";
import { requireOrgPermission } from "@/lib/permissions/middleware";

// GET /api/users - List all users in organization
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const roleId = searchParams.get("roleId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

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

    // Build where clause
    const where: any = {
      organizationMembers: {
        some: {
          organizationId,
        },
      },
    };

    if (roleId) {
      where.organizationMembers = {
        some: {
          organizationId,
          roleId,
        },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.organizationMembers[0]?.role,
        joinedAt: user.organizationMembers[0]?.joinedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, roleId, organizationId } =
      createUserSchema.parse(body);

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Check if user is already a member of this organization
      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { message: "User is already a member of this organization" },
          { status: 409 }
        );
      }

      // Add existing user to organization
      const member = await prisma.organizationMember.create({
        data: {
          userId: existingUser.id,
          organizationId,
          roleId,
        },
        include: {
          user: true,
          role: true,
        },
      });

      // Log the action
      await logUserCreated({
        userId: session.user.id,
        organizationId,
        action: "USER_ADDED_TO_ORG",
        resourceType: "ORGANIZATION_MEMBER",
        resourceId: member.id,
        userEmail: existingUser.email,
        userName: existingUser.name || "Unknown",
        roleName: member.role.name,
      });

      return NextResponse.json({
        message: "User added to organization successfully",
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: member.role,
        },
      });
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Add user to organization
    const member = await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId,
        roleId,
      },
      include: {
        role: true,
      },
    });

    // Log the action
    await logUserCreated({
      userId: session.user.id,
      organizationId,
      action: "USER_CREATED",
      resourceType: "USER",
      resourceId: user.id,
      userEmail: user.email,
      userName: user.name || "Unknown",
      roleName: member.role.name,
      metadata: {
        temporaryPassword, // Include in metadata for admin to see
      },
    });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: member.role,
      },
      temporaryPassword, // Return temporary password to admin
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "Validation error", errors: error.message },
        { status: 400 }
      );
    }
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
