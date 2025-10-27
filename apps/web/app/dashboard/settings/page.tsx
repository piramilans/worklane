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
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Users,
  Shield,
  Building,
  Settings,
  ArrowRight,
  Key,
} from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
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

  // Check permissions for different settings sections
  const [
    hasManageUsersPermission,
    hasManageRolesPermission,
    hasManageOrgPermission,
  ] = await Promise.all([
    hasOrgPermission(session.user.id, currentOrgId, OrgPermission.MANAGE_USERS),
    hasOrgPermission(session.user.id, currentOrgId, OrgPermission.MANAGE_ROLES),
    hasOrgPermission(
      session.user.id,
      currentOrgId,
      OrgPermission.MANAGE_ORGANIZATION
    ),
  ]);

  // Get organization statistics
  const [memberCount, roleCount, permissionCount] = await Promise.all([
    prisma.organizationMember.count({
      where: { organizationId: currentOrgId },
    }),
    prisma.role.count({
      where: { organizationId: currentOrgId },
    }),
    prisma.permission.count(),
  ]);

  const settingsSections = [
    {
      title: "Users",
      description: "Manage users, roles, and permissions",
      icon: Users,
      href: "/dashboard/settings/users",
      permission: hasManageUsersPermission,
      stats: `${memberCount} members`,
      color: "bg-blue-500",
    },
    {
      title: "Roles & Permissions",
      description: "Configure roles and their permissions",
      icon: Shield,
      href: "/dashboard/settings/roles",
      permission: hasManageRolesPermission,
      stats: `${roleCount} roles`,
      color: "bg-green-500",
    },
    {
      title: "Permissions",
      description: "View all available permissions",
      icon: Key,
      href: "/dashboard/settings/permissions",
      permission: hasManageRolesPermission, // Same permission as roles
      stats: `${permissionCount} permissions`,
      color: "bg-orange-500",
    },
    {
      title: "Organization",
      description: "Manage organization settings and details",
      icon: Building,
      href: "/dashboard/settings/organization",
      permission: hasManageOrgPermission,
      stats: currentOrg.name,
      color: "bg-purple-500",
    },
  ];

  const accessibleSections = settingsSections.filter(
    (section) => section.permission
  );

  return (
    <div className="px-2 sm:px-4 lg:px-6 space-y-4 sm:space-y-8">
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          Manage your organization settings and configuration
        </p>
      </div>

      {accessibleSections.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access any settings sections.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accessibleSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card
                key={section.href}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-3 rounded-lg ${section.color} text-white`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary">{section.stats}</Badge>
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={section.href}>
                    <Button className="w-full" variant="outline">
                      Manage {section.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Organization Overview
          </CardTitle>
          <CardDescription>
            Quick overview of your organization's settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {memberCount}
              </div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {roleCount}
              </div>
              <div className="text-sm text-gray-600">Custom Roles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {accessibleSections.length}
              </div>
              <div className="text-sm text-gray-600">Accessible Sections</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
