import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

export default async function AdminPage() {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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

  // Get all organizations the user has access to
  const orgIds = userOrgs.map((org) => org.organizationId);

  // Get all members from these organizations
  const allMembers = await prisma.organizationMember.findMany({
    where: { organizationId: { in: orgIds } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      organization: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
    orderBy: [{ organization: { name: "asc" } }, { user: { name: "asc" } }],
  });

  // Get all projects from these organizations
  const allProjects = await prisma.project.findMany({
    where: { organizationId: { in: orgIds } },
    include: {
      organization: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          role: true,
          customPermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
    orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            View all users, organizations, and permissions
          </p>
        </div>

        {/* Organizations Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Organizations you have access to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userOrgs.map((userOrg) => (
                <Card key={userOrg.organizationId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {userOrg.organization.name}
                    </CardTitle>
                    <CardDescription>
                      {userOrg.organization.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Your Role:
                        </span>
                        <Badge variant="secondary">{userOrg.role.name}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Slug:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {userOrg.organization.slug}
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Members */}
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>
              All users across your organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">
                          {member.user.name || "No Name"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {member.user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Organization: {member.organization.name}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant="outline">{member.role.name}</Badge>
                        <div className="text-xs text-gray-500">
                          {member.role.permissions.length} permissions
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              All projects across your organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allProjects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>
                      {project.description} • {project.organization.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Project Members:
                        </span>
                        <Badge variant="secondary">
                          {project.members.length} members
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {project.members.map((projectMember) => (
                          <div
                            key={projectMember.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <span className="text-sm font-medium">
                                {projectMember.user.name || "No Name"}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({projectMember.user.email})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {projectMember.role.name}
                              </Badge>
                              {projectMember.customPermissions.length > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {projectMember.customPermissions.length}{" "}
                                  overrides
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions Summary</CardTitle>
            <CardDescription>
              Overview of all permissions in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">21</div>
                <div className="text-sm text-blue-600">Total Permissions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">6</div>
                <div className="text-sm text-green-600">System Roles</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {allMembers.length}
                </div>
                <div className="text-sm text-purple-600">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
