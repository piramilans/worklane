import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserOrgRole, getUserProjectRole } from "@/lib/permissions/check";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    const projectId = searchParams.get("projectId");

    let role: string | null = null;

    if (projectId) {
      role = await getUserProjectRole(session.user.id, projectId);
    } else if (orgId) {
      role = await getUserOrgRole(session.user.id, orgId);
    } else {
      return NextResponse.json(
        { error: "Either orgId or projectId is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error getting user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
