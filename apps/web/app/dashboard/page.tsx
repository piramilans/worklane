import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Worklane</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin Dashboard
                </Button>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Project Management Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Your projects and tasks will appear here
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Create and manage projects</p>
                <p>• Assign tasks to team members</p>
                <p>• Track progress and deadlines</p>
                <p>• Collaborate with your team</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
