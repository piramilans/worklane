import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizationId } from "@/lib/current-organization";
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
  FolderOpen,
  Calendar,
  Users,
  FileText,
  CheckSquare,
  ArrowLeft,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentOrgId = await getCurrentOrganizationId();

  if (!currentOrgId) {
    redirect("/dashboard");
  }

  // Get project details
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: currentOrgId,
    },
    include: {
      members: {
        include: {
          user: true,
          role: true,
        },
      },
      tasks: {
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
          creator: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      organization: true,
    },
  });

  if (!project) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>
              The project you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/projects">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-500",
    IN_PROGRESS: "bg-blue-500",
    PLANNING: "bg-yellow-500",
    COMPLETED: "bg-gray-500",
    ARCHIVED: "bg-gray-500",
  };

  const taskStatusCounts = project.tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="px-4 lg:px-6 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Project Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen className="h-8 w-8 text-blue-500" />
          <Badge className={statusColors[project.status] || "bg-gray-500"}>
            {project.status}
          </Badge>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {project.name}
        </h1>
        <p className="text-lg text-gray-600">{project.description}</p>
      </div>

      {/* Project Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taskStatusCounts.IN_PROGRESS || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taskStatusCounts.DONE || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Members */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>{project.members.length} members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{member.user.name}</div>
                    <div className="text-sm text-gray-500">
                      {member.user.email}
                    </div>
                  </div>
                  <Badge variant="outline">{member.role.name}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Tasks
                </CardTitle>
                <CardDescription>
                  {project.tasks.length} total tasks
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {project.tasks.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tasks yet</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {project.tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/dashboard/tasks/${task.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{task.title}</span>
                          <Badge
                            variant="outline"
                            className={
                              task.priority === "HIGH"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                            }
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Status: {task.status}</span>
                          <span>Assignees: {task.assignees.length}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
