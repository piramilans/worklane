"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Key, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ResetPasswordDialogProps {
  userId: string;
  userName: string;
  organizationId: string;
}

export function ResetPasswordDialog({
  userId,
  userName,
  organizationId,
}: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/users/${userId}/password?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      toast.success("Password reset successfully", {
        description: `New temporary password: ${data.temporaryPassword}`,
        duration: 15000, // Show for 15 seconds so admin can copy password
      });

      setOpen(false);
    } catch (error) {
      toast.error("Failed to reset password", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset the password for <strong>{userName}</strong>. A new temporary
            password will be generated.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Key className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Password Reset Warning
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This will generate a new temporary password for the user.
                    The user will need to use this password to log in and should
                    change it immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleReset} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
