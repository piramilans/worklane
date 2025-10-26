"use client";

import { useHasPermission } from "@/hooks/use-permissions";
import { Permission } from "@/lib/permissions/constants";
import { ReactNode } from "react";

interface CanProps {
  permission: Permission;
  orgId?: string;
  projectId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component wrapper for permission-based rendering
 * Only renders children if the user has the specified permission
 */
export function Can({
  permission,
  orgId,
  projectId,
  children,
  fallback = null,
}: CanProps) {
  const hasPermission = useHasPermission(permission, { orgId, projectId });

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
