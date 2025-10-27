import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Plus, Search, Edit, Trash2, Key, MoreHorizontal } from "lucide-react";
import { AddUserDialog } from "@/components/users/add-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  joinedAt: Date;
}

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get current organization from subdomain
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

  // Check if user is a member of this organization
  const userOrg = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: currentOrgId,
      },
    },
    include: {
      role: true,
    },
  });

  if (!userOrg) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You are not a member of this organization.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if user has permission to manage users in this organization
  const hasManageUsersPermission = await hasOrgPermission(
    session.user.id,
    currentOrgId,
    OrgPermission.MANAGE_USERS
  );

  if (!hasManageUsersPermission) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to manage users in this organization.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get users for the accessible organization
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search || "";
  const roleFilter = resolvedSearchParams.role || "";
  const page = parseInt(resolvedSearchParams.page || "1");
  const limit = 10;

  // Build where clause for current organization
  const where: any = {
    organizationMembers: {
      some: {
        organizationId: currentOrgId,
      },
    },
  };

  if (roleFilter && roleFilter !== "all") {
    where.organizationMembers = {
      some: {
        organizationId: currentOrgId,
        roleId: roleFilter,
      },
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Get users with pagination
  const [users, total, roles] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        organizationMembers: {
          where: { organizationId: currentOrgId },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
    prisma.role.findMany({
      where: {
        OR: [{ isSystem: true }, { organizationId: currentOrgId }],
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const formattedUsers: User[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.organizationMembers[0]?.role || {
      id: "",
      name: "No Role",
      description: null,
    },
    joinedAt: user.organizationMembers[0]?.joinedAt || user.createdAt,
  }));

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="px-2 sm:px-4 lg:px-6 space-y-4 sm:space-y-8">
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          Manage users, roles, and permissions in {currentOrg.name}
        </p>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {total} user{total !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="w-full sm:w-auto">
              <AddUserDialog organizationId={currentOrgId} roles={roles} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="flex-1 w-full sm:w-auto">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  defaultValue={search}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="role">Filter by Role</Label>
              <Select defaultValue={roleFilter || "all"}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {formattedUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {user.name || "No Name"}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {user.role.name}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(user.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <EditUserDialog
                        user={user}
                        organizationId={currentOrgId}
                        roles={roles}
                      />
                      <ResetPasswordDialog
                        userId={user.id}
                        userName={user.name || user.email}
                        organizationId={currentOrgId}
                      />
                      <DeleteUserDialog
                        userId={user.id}
                        userName={user.name || user.email}
                        organizationId={currentOrgId}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || "User"}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {(user.name || user.email)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.name || "No Name"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role.name}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditUserDialog
                          user={user}
                          organizationId={currentOrgId}
                          roles={roles}
                        />
                        <ResetPasswordDialog
                          userId={user.id}
                          userName={user.name || user.email}
                          organizationId={currentOrgId}
                        />
                        <DeleteUserDialog
                          userId={user.id}
                          userName={user.name || user.email}
                          organizationId={currentOrgId}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} users
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
