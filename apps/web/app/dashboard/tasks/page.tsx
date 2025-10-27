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
import { CheckSquare, Plus, User, Clock } from "lucide-react";
import Link from "next/link";

export default async function TasksPage() {
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

  // Get all tasks assigned to the current user
  const tasks = await prisma.task.findMany({
    where: {
      project: {
        organizationId: currentOrgId,
      },
      assignees: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      project: true,
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
    take: 20, // Limit to 20 for now
  });

  // Get status counts
  const statusCounts = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusColors: Record<string, string> = {
    TODO: "bg-gray-500",
    IN_PROGRESS: "bg-blue-500",
    REVIEW: "bg-yellow-500",
    DONE: "bg-green-500",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-blue-500",
    MEDIUM: "bg-yellow-500",
    HIGH: "bg-orange-500",
    URGENT: "bg-red-500",
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="px-4 lg:px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-lg text-gray-600">
            Track and manage your assigned tasks
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <div className="h-4 w-4 rounded-full bg-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.TODO || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusCounts.IN_PROGRESS || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Done</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.DONE || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>No Tasks Yet</CardTitle>
            <CardDescription>
              You don't have any tasks assigned to you.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={statusColors[task.status] || "bg-gray-500"}
                      >
                        {task.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          priorityColors[task.priority] || "bg-gray-500"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle>{task.title}</CardTitle>
                  <CardDescription>{task.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Project:</span>
                      <Badge variant="secondary">{task.project.name}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Assigned to:
                      </span>
                      {task.assignees.map((assignment) => (
                        <Badge key={assignment.id} variant="outline">
                          {assignment.user.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
