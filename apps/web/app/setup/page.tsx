import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Building, AlertTriangle } from "lucide-react";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Organization Not Found</CardTitle>
          <CardDescription className="text-lg">
            The organization for this subdomain could not be found.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-gray-600">This could happen if:</p>
            <ul className="text-left text-sm text-gray-600 space-y-2">
              <li>• The subdomain doesn't exist yet</li>
              <li>• The organization hasn't been set up</li>
              <li>• You're accessing the wrong subdomain</li>
            </ul>

            <div className="pt-4">
              <Button asChild>
                <a href="mailto:support@worklane.com">
                  <Building className="mr-2 h-4 w-4" />
                  Contact Support
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
