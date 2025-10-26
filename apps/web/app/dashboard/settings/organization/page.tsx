import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasOrgPermission } from "@/lib/permissions/check";
import { OrgPermission } from "@/lib/permissions/constants";
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
import { Textarea } from "@workspace/ui/components/textarea";
import { Separator } from "@workspace/ui/components/separator";
import {
  Building,
  Users,
  FolderOpen,
  Shield,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default async function OrganizationPage() {
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

  // Check if user has permission to manage organization in any organization
  let hasManageOrgPermission = false;
  let accessibleOrgId = "";

  for (const userOrg of userOrgs) {
    const hasPermission = await hasOrgPermission(
      session.user.id,
      userOrg.organizationId,
      OrgPermission.MANAGE_ORGANIZATION
    );
    if (hasPermission) {
      hasManageOrgPermission = true;
      accessibleOrgId = userOrg.organizationId;
      break;
    }
  }

  if (!hasManageOrgPermission) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to manage organization settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get organization details and statistics
  const [organization, stats] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: accessibleOrgId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    Promise.all([
      prisma.organizationMember.count({
        where: { organizationId: accessibleOrgId },
      }),
      prisma.project.count({
        where: { organizationId: accessibleOrgId },
      }),
      prisma.role.count({
        where: {
          OR: [{ isSystem: true }, { organizationId: accessibleOrgId }],
        },
      }),
    ]),
  ]);

  if (!organization) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Organization Not Found</CardTitle>
            <CardDescription>
              The organization you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [memberCount, projectCount, roleCount] = stats;

  return (
    <div className="px-4 lg:px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Organization Settings
        </h1>
        <p className="text-lg text-gray-600">
          Manage your organization details and settings
        </p>
      </div>

      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Overview
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={organization.name}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="slug">Organization Slug</Label>
                <Input
                  id="slug"
                  value={organization.slug}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={organization.description || ""}
                  disabled
                  className="bg-gray-50"
                  rows={3}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Created</Label>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {new Date(organization.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <Label>Last Updated</Label>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {new Date(organization.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
            <p className="text-xs text-muted-foreground">
              Active organization members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleCount}</div>
            <p className="text-xs text-muted-foreground">
              System + custom roles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>All members of this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organization.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {(member.user.name || member.user.email)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.user.name || "No Name"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{member.role.name}</Badge>
                  <div className="text-xs text-gray-500">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h4 className="font-medium text-red-900">
                  Delete Organization
                </h4>
                <p className="text-sm text-red-700">
                  Permanently delete this organization and all its data. This
                  action cannot be undone.
                </p>
              </div>
              <Button variant="destructive" disabled>
                Delete Organization
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
