import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasOrgPermission } from "@/lib/permissions/check";
import { OrgPermission } from "@/lib/permissions/constants";
import {
  getCurrentOrganization,
  getCurrentOrganizationId,
} from "@/lib/current-organization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Shield, Building, FolderOpen, CheckSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AddPermissionDialog } from "@/components/permissions/add-permission-dialog";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

export default async function PermissionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentOrg = await getCurrentOrganization();
  const currentOrgId = await getCurrentOrganizationId();

  if (!currentOrg || !currentOrgId) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Organization Not Found</CardTitle>
            <CardDescription>
              The organization for this subdomain could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if user has permission to view permissions
  const hasManageRolesPermission = await hasOrgPermission(
    session.user.id,
    currentOrgId,
    OrgPermission.MANAGE_ROLES
  );

  if (!hasManageRolesPermission) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view permissions in this
              organization.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get all permissions from database
  const allPermissions = await prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category]!.push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  // Category metadata
  const categoryMetadata = {
    ORGANIZATION: {
      icon: Building,
      color: "bg-blue-500",
      name: "Organization",
      description: "Permissions for managing organization-wide settings",
    },
    PROJECT: {
      icon: FolderOpen,
      color: "bg-green-500",
      name: "Project",
      description: "Permissions for managing projects",
    },
    TASK: {
      icon: CheckSquare,
      color: "bg-purple-500",
      name: "Task",
      description: "Permissions for managing tasks",
    },
  };

  return (
    <div className="px-2 sm:px-4 lg:px-6 space-y-4 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Permissions
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            View all available permissions in the system
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <AddPermissionDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              <CardTitle>Organization</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {permissionsByCategory.ORGANIZATION?.length || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Organization permissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-green-500" />
              <CardTitle>Project</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {permissionsByCategory.PROJECT?.length || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">Project permissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-purple-500" />
              <CardTitle>Task</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {permissionsByCategory.TASK?.length || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">Task permissions</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {Object.entries(categoryMetadata).map(([category, metadata]) => {
          const permissions = permissionsByCategory[category] || [];
          const Icon = metadata.icon;

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg ${metadata.color} text-white`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{metadata.name} Permissions</CardTitle>
                    <CardDescription>{metadata.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {permissions.length} permissions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Shield className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {permission.name}
                        </div>
                        {permission.description && (
                          <div className="text-xs text-gray-600 mt-1">
                            {permission.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
