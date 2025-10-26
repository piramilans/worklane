import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">Worklane</h1>
            <p className="text-xl text-gray-600">
              Open-Source Project Management Tool
            </p>
            <p className="text-gray-500 max-w-xl mx-auto">
              Streamline your projects, collaborate with your team, and achieve
              your goals with our intuitive project management platform.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="secondary" className="px-8">
                Admin Dashboard
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Project Management
              </h3>
              <p className="text-sm text-gray-600">
                Create, organize, and track projects with ease
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Team Collaboration
              </h3>
              <p className="text-sm text-gray-600">
                Work together seamlessly with your team members
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Self-Hosted</h3>
              <p className="text-sm text-gray-600">
                Deploy on your own infrastructure for full control
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
