import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasOrgPermission } from "@/lib/permissions/check";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Plus, Edit, Trash2, Shield, Users, Lock } from "lucide-react";
import { CreateRoleDialog } from "@/components/roles/create-role-dialog";
import { EditRoleDialog } from "@/components/roles/edit-role-dialog";
import { DeleteRoleDialog } from "@/components/roles/delete-role-dialog";
import { PermissionMatrix } from "@/components/roles/permission-matrix";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  organizationId: string | null;
  permissions: {
    id: string;
    name: string;
    description: string | null;
    category: string;
  }[];
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

export default async function RolesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's organizations
  const userOrgs = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    include: {
      organization: true,
      role: true,
    },
  });

  if (userOrgs.length === 0) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>No Organizations</CardTitle>
            <CardDescription>
              You are not a member of any organizations yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if user has permission to manage roles in any organization
  let hasManageRolesPermission = false;
  let accessibleOrgId = "";

  for (const userOrg of userOrgs) {
    const hasPermission = await hasOrgPermission(
      session.user.id,
      userOrg.organizationId,
      "MANAGE_ROLES"
    );
    if (hasPermission) {
      hasManageRolesPermission = true;
      accessibleOrgId = userOrg.organizationId;
      break;
    }
  }

  if (!hasManageRolesPermission) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to manage roles in any organization.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get all roles (system + organization-specific) and permissions
  const [systemRoles, orgRoles, allPermissions] = await Promise.all([
    prisma.role.findMany({
      where: {
        isSystem: true,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            organizationMembers: true,
            projectMembers: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.role.findMany({
      where: {
        organizationId: accessibleOrgId,
        isSystem: false,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            organizationMembers: true,
            projectMembers: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.permission.findMany({
      orderBy: { category: "asc" },
    }),
  ]);

  const allRoles: Role[] = [...systemRoles, ...orgRoles].map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    organizationId: role.organizationId,
    permissions: role.permissions.map((rp) => rp.permission),
    memberCount: role._count.organizationMembers + role._count.projectMembers,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  }));

  const permissions: Permission[] = allPermissions.map((perm) => ({
    id: perm.id,
    name: perm.name,
    description: perm.description,
    category: perm.category,
  }));

  // Group permissions by category
  const permissionsByCategory = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <div className="px-4 lg:px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Roles & Permissions
        </h1>
        <p className="text-lg text-gray-600">
          Manage roles and their permissions
        </p>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          </TabsList>
          <CreateRoleDialog
            organizationId={accessibleOrgId}
            permissions={permissions}
          />
        </div>

        <TabsContent value="roles" className="space-y-6">
          {/* System Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-gray-500" />
                <CardTitle>System Roles</CardTitle>
              </div>
              <CardDescription>
                Predefined roles that cannot be modified or deleted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {systemRoles.map((role) => (
                  <Card key={role.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" />
                          System
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {role.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Permissions:</span>
                          <span className="font-medium">
                            {role.permissions.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Members:</span>
                          <span className="font-medium">
                            {role._count.organizationMembers +
                              role._count.projectMembers}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <CardTitle>Custom Roles</CardTitle>
              </div>
              <CardDescription>
                Organization-specific roles that can be modified
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orgRoles.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Custom Roles
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first custom role to get started.
                  </p>
                  <CreateRoleDialog
                    organizationId={accessibleOrgId}
                    permissions={permissions}
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {orgRoles.map((role) => (
                    <Card key={role.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <Badge variant="outline">Custom</Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {role.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Permissions:</span>
                            <span className="font-medium">
                              {role.permissions.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Members:</span>
                            <span className="font-medium">
                              {role._count.organizationMembers +
                                role._count.projectMembers}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <EditRoleDialog
                              role={{
                                id: role.id,
                                name: role.name,
                                description: role.description,
                                isSystem: role.isSystem,
                                organizationId: role.organizationId,
                                permissions: role.permissions.map(
                                  (rp) => rp.permission
                                ),
                                memberCount:
                                  role._count.organizationMembers +
                                  role._count.projectMembers,
                                createdAt: role.createdAt,
                                updatedAt: role.updatedAt,
                              }}
                              organizationId={accessibleOrgId}
                              permissions={permissions}
                            />
                            <DeleteRoleDialog
                              role={{
                                id: role.id,
                                name: role.name,
                                description: role.description,
                                isSystem: role.isSystem,
                                organizationId: role.organizationId,
                                permissions: role.permissions.map(
                                  (rp) => rp.permission
                                ),
                                memberCount:
                                  role._count.organizationMembers +
                                  role._count.projectMembers,
                                createdAt: role.createdAt,
                                updatedAt: role.updatedAt,
                              }}
                              organizationId={accessibleOrgId}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <PermissionMatrix
            roles={allRoles}
            permissions={permissionsByCategory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
