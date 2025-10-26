import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  hasOrgPermission,
  hasProjectPermission,
  hasTaskPermission,
} from "./check";
import { Permission } from "./constants";

/**
 * Higher-order function to protect API routes with organization-level permissions
 */
export function requireOrgPermission(permission: Permission) {
  return async (
    req: NextRequest,
    handler: (req: NextRequest, userId: string) => Promise<NextResponse>
  ) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract orgId from URL params
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const orgIdIndex = pathSegments.indexOf("organizations") + 1;
    const orgId = pathSegments[orgIdIndex];

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    const hasPermission = await hasOrgPermission(
      session.user.id,
      orgId,
      permission
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, session.user.id);
  };
}

/**
 * Higher-order function to protect API routes with project-level permissions
 */
export function requireProjectPermission(permission: Permission) {
  return async (
    req: NextRequest,
    handler: (req: NextRequest, userId: string) => Promise<NextResponse>
  ) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract projectId from URL params
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const projectIdIndex = pathSegments.indexOf("projects") + 1;
    const projectId = pathSegments[projectIdIndex];

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400 }
      );
    }

    const hasPermission = await hasProjectPermission(
      session.user.id,
      projectId,
      permission
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, session.user.id);
  };
}

/**
 * Higher-order function to protect API routes with task-level permissions
 */
export function requireTaskPermission(permission: Permission) {
  return async (
    req: NextRequest,
    handler: (req: NextRequest, userId: string) => Promise<NextResponse>
  ) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract taskId from URL params
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const taskIdIndex = pathSegments.indexOf("tasks") + 1;
    const taskId = pathSegments[taskIdIndex];

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const hasPermission = await hasTaskPermission(
      session.user.id,
      taskId,
      permission
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, session.user.id);
  };
}

/**
 * Check if user has any of the provided permissions
 */
export function requireAnyPermission(
  permissions: Permission[],
  resourceType: "organization" | "project" | "task"
) {
  return async (
    req: NextRequest,
    handler: (req: NextRequest, userId: string) => Promise<NextResponse>
  ) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");

    let resourceId: string | undefined;

    switch (resourceType) {
      case "organization":
        resourceId = pathSegments[pathSegments.indexOf("organizations") + 1];
        break;
      case "project":
        resourceId = pathSegments[pathSegments.indexOf("projects") + 1];
        break;
      case "task":
        resourceId = pathSegments[pathSegments.indexOf("tasks") + 1];
        break;
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: `${resourceType} ID required` },
        { status: 400 }
      );
    }

    // Check if user has any of the required permissions
    let hasAnyPermission = false;

    for (const permission of permissions) {
      let checkResult = false;

      switch (resourceType) {
        case "organization":
          checkResult = await hasOrgPermission(
            session.user.id,
            resourceId,
            permission
          );
          break;
        case "project":
          checkResult = await hasProjectPermission(
            session.user.id,
            resourceId,
            permission
          );
          break;
        case "task":
          checkResult = await hasTaskPermission(
            session.user.id,
            resourceId,
            permission
          );
          break;
      }

      if (checkResult) {
        hasAnyPermission = true;
        break;
      }
    }

    if (!hasAnyPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, session.user.id);
  };
}

/**
 * Simple authentication check without permission requirements
 */
export async function requireAuth(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handler(req, session.user.id);
}
