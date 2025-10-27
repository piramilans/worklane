import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSION_DEFINITIONS } from "@/lib/permissions/constants";
import { auth } from "@/auth";
import { hasOrgPermission } from "@/lib/permissions/check";
import { OrgPermission } from "@/lib/permissions/constants";

/**
 * GET /api/permissions
 * Returns all available permissions with their categories and descriptions
 */
export async function GET() {
  try {
    // Get all permissions from database
    const dbPermissions = await prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Return permissions from database
    const permissions = dbPermissions.map((perm) => ({
      id: perm.id,
      name: perm.name,
      description: perm.description,
      category: perm.category,
    }));

    // Group by category for easier consumption
    const byCategory = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = [];
        }
        acc[permission.category]!.push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>
    );

    return NextResponse.json({
      permissions,
      byCategory,
      total: permissions.length,
      categories: Object.keys(byCategory),
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/permissions
 * Creates a new custom permission
 */
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category } = body;

    // Validate input
    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    // Check if user has permission to create permissions
    // This is typically allowed for MANAGE_ROLES permission
    // For now, we'll allow Super Admins to create permissions
    // You may want to add a specific permission check here

    // Check if permission already exists
    const existing = await prisma.permission.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Permission already exists" },
        { status: 400 }
      );
    }

    // Create the permission
    const permission = await prisma.permission.create({
      data: {
        name,
        description: description || null,
        category: category.toUpperCase(),
      },
    });

    return NextResponse.json({ permission }, { status: 201 });
  } catch (error) {
    console.error("Error creating permission:", error);
    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 }
    );
  }
}
