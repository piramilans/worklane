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
import { CheckSquare, ArrowLeft, Calendar, User, FileText } from "lucide-react";
import Link from "next/link";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentOrgId = await getCurrentOrganizationId();

  if (!currentOrgId) {
    redirect("/dashboard");
  }

  // Get task details
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        organizationId: currentOrgId,
      },
    },
    include: {
      project: true,
      creator: true,
      assignees: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!task) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Task Not Found</CardTitle>
            <CardDescription>
              The task you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/tasks">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="px-4 lg:px-6 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Task Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare className="h-8 w-8 text-blue-500" />
          <Badge className={statusColors[task.status] || "bg-gray-500"}>
            {task.status}
          </Badge>
          <Badge
            variant="outline"
            className={priorityColors[task.priority] || "bg-gray-500"}
          >
            {task.priority}
          </Badge>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{task.title}</h1>
        <p className="text-lg text-gray-600">{task.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Created</div>
                <div className="font-medium">{formatDate(task.createdAt)}</div>
              </div>
            </div>

            {task.dueDate && (
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Due Date</div>
                  <div className="font-medium">{formatDate(task.dueDate)}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Project</div>
                <Link href={`/dashboard/projects/${task.project.id}`}>
                  <div className="font-medium text-blue-600 hover:underline">
                    {task.project.name}
                  </div>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Created by</div>
                <div className="font-medium">{task.creator.name}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignees and Reviewers */}
        <div className="space-y-4">
          {/* Assignees */}
          <Card>
            <CardHeader>
              <CardTitle>Assignees</CardTitle>
              <CardDescription>
                {task.assignees.length}{" "}
                {task.assignees.length === 1 ? "person" : "people"} assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.assignees.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {assignment.user.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {assignment.user.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {assignment.user.email}
                      </div>
                    </div>
                  </div>
                ))}
                {task.assignees.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No assignees yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button className="w-full" variant="outline">
                Add Assignee
              </Button>
              <Button className="w-full">Edit Task</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
