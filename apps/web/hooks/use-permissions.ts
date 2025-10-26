"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Permission } from "@/lib/permissions/constants";

interface PermissionContext {
  orgId?: string;
  projectId?: string;
}

/**
 * Hook to check if the current user has a specific permission
 */
export function useHasPermission(
  permission: Permission,
  context?: PermissionContext
): boolean {
  const { data: session } = useSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      if (!session?.user?.id) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append("permission", permission);
        if (context?.orgId) params.append("orgId", context.orgId);
        if (context?.projectId) params.append("projectId", context.projectId);

        const response = await fetch(`/api/permissions/check?${params}`);
        const data = await response.json();

        setHasPermission(data.hasPermission || false);
      } catch (error) {
        console.error("Error checking permission:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [session, permission, context?.orgId, context?.projectId]);

  return loading ? false : hasPermission;
}

/**
 * Hook to get the current user's role
 */
export function useUserRole(context?: PermissionContext): string | null {
  const { data: session } = useSession();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      if (!session?.user?.id) {
        setRole(null);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (context?.orgId) params.append("orgId", context.orgId);
        if (context?.projectId) params.append("projectId", context.projectId);

        const response = await fetch(`/api/permissions/role?${params}`);
        const data = await response.json();

        setRole(data.role || null);
      } catch (error) {
        console.error("Error fetching role:", error);
        setRole(null);
      }
    }

    fetchRole();
  }, [session, context?.orgId, context?.projectId]);

  return role;
}

/**
 * Hook to check if the current user can access a specific resource
 */
export function useCanAccess(
  resourceType: "organization" | "project" | "task",
  resourceId: string,
  permission: Permission
): boolean {
  const { data: session } = useSession();
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      if (!session?.user?.id) {
        setCanAccess(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/permissions/access?resourceType=${resourceType}&resourceId=${resourceId}&permission=${permission}`
        );
        const data = await response.json();

        setCanAccess(data.canAccess || false);
      } catch (error) {
        console.error("Error checking access:", error);
        setCanAccess(false);
      }
    }

    checkAccess();
  }, [session, resourceType, resourceId, permission]);

  return canAccess;
}

/**
 * Hook to get all permissions for the current user in a specific context
 */
export function usePermissions(context?: PermissionContext): Permission[] {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    async function fetchPermissions() {
      if (!session?.user?.id) {
        setPermissions([]);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (context?.orgId) params.append("orgId", context.orgId);
        if (context?.projectId) params.append("projectId", context.projectId);

        const response = await fetch(`/api/permissions?${params}`);
        const data = await response.json();

        setPermissions(data.permissions || []);
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setPermissions([]);
      }
    }

    fetchPermissions();
  }, [session, context?.orgId, context?.projectId]);

  return permissions;
}

/**
 * Hook to get user's organizations
 */
export function useUserOrganizations() {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganizations() {
      if (!session?.user?.id) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/organizations/my-organizations");
        const data = await response.json();

        setOrganizations(data.organizations || []);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, [session]);

  return { organizations, loading };
}

/**
 * Hook to get user's projects in an organization
 */
export function useUserProjects(orgId?: string) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!session?.user?.id || !orgId) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/organizations/${orgId}/my-projects`);
        const data = await response.json();

        setProjects(data.projects || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [session, orgId]);

  return { projects, loading };
}
