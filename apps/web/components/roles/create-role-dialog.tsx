"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Plus, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface CreateRoleDialogProps {
  organizationId: string;
  permissions: Permission[];
}

export function CreateRoleDialog({
  organizationId,
  permissions,
}: CreateRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  // Group permissions by category
  const permissionsByCategory = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category]!.push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create role");
      }

      toast.success("Role created successfully");

      // Reset form
      setFormData({
        name: "",
        description: "",
        permissions: [],
      });
      setOpen(false);

      // Refresh the page to show the new role
      window.location.reload();
    } catch (error) {
      toast.error("Failed to create role", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter((id) => id !== permissionId),
    }));
  };

  const handleSelectAll = (category: string, checked: boolean) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const categoryPermissionIds = categoryPermissions.map((p) => p.id);

    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...categoryPermissionIds])]
        : prev.permissions.filter((id) => !categoryPermissionIds.includes(id)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription>
            Create a new role with specific permissions for your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                placeholder="e.g., Content Manager"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this role can do..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={loading}
                rows={3}
              />
            </div>
            <div className="grid gap-4">
              <Label>Permissions</Label>
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(
                  ([category, categoryPermissions]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm text-gray-900 capitalize">
                          {category.toLowerCase()} Permissions
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`select-all-${category}`}
                            checked={categoryPermissions.every((p) =>
                              formData.permissions.includes(p.id)
                            )}
                            onCheckedChange={(checked) =>
                              handleSelectAll(category, checked as boolean)
                            }
                            disabled={loading}
                          />
                          <Label
                            htmlFor={`select-all-${category}`}
                            className="text-xs text-gray-600"
                          >
                            Select All
                          </Label>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        {categoryPermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={permission.id}
                              checked={formData.permissions.includes(
                                permission.id
                              )}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  permission.id,
                                  checked as boolean
                                )
                              }
                              disabled={loading}
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={permission.id}
                                className="text-sm font-medium"
                              >
                                {permission.name.replace(/_/g, " ")}
                              </Label>
                              {permission.description && (
                                <p className="text-xs text-gray-500">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
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
            <Button
              type="submit"
              disabled={loading || formData.permissions.length === 0}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Shield className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
