import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
import { Users, Plus, Mail, Shield } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";

export default async function TeamPage() {
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

  // Get all organization members
  const teamMembers = await prisma.organizationMember.findMany({
    where: { organizationId: currentOrgId },
    include: {
      user: true,
      role: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  // Get project member counts separately
  const projectMemberCounts = await Promise.all(
    teamMembers.map(async (member) => {
      const count = await prisma.projectMember.count({
        where: { userId: member.userId },
      });
      return { userId: member.userId, count };
    })
  );

  const memberCountMap = new Map(
    projectMemberCounts.map((item) => [item.userId, item.count])
  );

  // Add count to each member
  const teamMembersWithCount = teamMembers.map((member) => ({
    ...member,
    projectCount: memberCountMap.get(member.userId) || 0,
  }));

  // Count by role
  const roleCounts = teamMembers.reduce(
    (acc, member) => {
      acc[member.role.name] = (acc[member.role.name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="px-4 lg:px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Team</h1>
          <p className="text-lg text-gray-600">
            Manage your organization members
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
        {Object.entries(roleCounts)
          .slice(0, 3)
          .map(([role, count]) => (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{role}</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Team Members List */}
      {teamMembers.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>No Team Members</CardTitle>
            <CardDescription>
              Get started by inviting your first team member.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Team Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamMembersWithCount.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={member.user.image || ""}
                      alt={member.user.name || ""}
                    />
                    <AvatarFallback>
                      {getUserInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {member.user.name || "Unknown User"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.user.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role:</span>
                    <Badge variant="secondary">{member.role.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Projects:</span>
                    <Badge>{member.projectCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Joined:</span>
                    <span className="text-gray-900">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
