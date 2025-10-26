import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  hasOrgPermission,
  hasProjectPermission,
} from "@/lib/permissions/check";
import { Permission } from "@/lib/permissions/constants";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const permission = searchParams.get("permission") as Permission;
    const orgId = searchParams.get("orgId");
    const projectId = searchParams.get("projectId");

    if (!permission) {
      return NextResponse.json(
        { error: "Permission parameter required" },
        { status: 400 }
      );
    }

    let hasPermission = false;

    if (projectId) {
      hasPermission = await hasProjectPermission(
        session.user.id,
        projectId,
        permission
      );
    } else if (orgId) {
      hasPermission = await hasOrgPermission(
        session.user.id,
        orgId,
        permission
      );
    } else {
      return NextResponse.json(
        { error: "Either orgId or projectId is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error("Error checking permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
