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
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  organizationId: string | null;
  permissions: Permission[];
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DeleteRoleDialogProps {
  role: Role;
  organizationId: string;
}

export function DeleteRoleDialog({
  role,
  organizationId,
}: DeleteRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasMembers = role.memberCount > 0;

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/roles/${role.id}?organizationId=${organizationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // If role has members, show the server message
        if (data.message?.includes("member")) {
          toast.error("Cannot delete role", {
            description: data.message,
          });
          setOpen(false);
          return;
        }
        throw new Error(data.message || "Failed to delete role");
      }

      toast.success("Role deleted successfully", {
        description: `${role.name} has been removed`,
      });

      setOpen(false);

      // Refresh the page to show the updated role list
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete role", {
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
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogDescription>
            {hasMembers
              ? "Cannot delete role with assigned members"
              : `Delete the role ${role.name}. This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div
            className={`border rounded-lg p-4 ${
              hasMembers
                ? "bg-red-50 border-red-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <Trash2
                  className={`h-5 w-5 ${hasMembers ? "text-red-400" : "text-yellow-400"}`}
                />
              </div>
              <div className="ml-3">
                <h3
                  className={`text-sm font-medium ${
                    hasMembers ? "text-red-800" : "text-yellow-800"
                  }`}
                >
                  {hasMembers ? "Cannot Delete Role" : "Delete Role Warning"}
                </h3>
                <div
                  className={`mt-2 text-sm ${
                    hasMembers ? "text-red-700" : "text-yellow-700"
                  }`}
                >
                  {hasMembers ? (
                    <p>
                      This role has {role.memberCount} member
                      {role.memberCount !== 1 ? "s" : ""} assigned.
                      <br />
                      Please reassign or remove all members before deleting this
                      role.
                    </p>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>This role has no members assigned</li>
                      <li>All permissions will be removed</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  )}
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
            {hasMembers ? "Close" : "Cancel"}
          </Button>
          {!hasMembers && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Role
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
