import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserPermissions } from "@/lib/permissions/check";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    const projectId = searchParams.get("projectId");

    const permissions = await getUserPermissions(session.user.id, {
      orgId: orgId || undefined,
      projectId: projectId || undefined,
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error getting permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
