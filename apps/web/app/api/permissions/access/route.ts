import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessResource } from "@/lib/permissions/check";
import { Permission } from "@/lib/permissions/constants";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get("resourceType") as
      | "organization"
      | "project"
      | "task";
    const resourceId = searchParams.get("resourceId");
    const permission = searchParams.get("permission") as Permission;

    if (!resourceType || !resourceId || !permission) {
      return NextResponse.json(
        { error: "resourceType, resourceId, and permission are required" },
        { status: 400 }
      );
    }

    const canAccess = await canAccessResource(
      session.user.id,
      resourceType,
      resourceId,
      permission
    );

    return NextResponse.json({ canAccess });
  } catch (error) {
    console.error("Error checking access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
