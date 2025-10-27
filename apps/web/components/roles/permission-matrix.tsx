"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Shield, Check, X, Minus } from "lucide-react";

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

interface PermissionMatrixProps {
  roles: Role[];
  permissions: Record<string, Permission[]>;
}

export function PermissionMatrix({
  roles,
  permissions,
}: PermissionMatrixProps) {
  const allPermissions = Object.values(permissions).flat();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permission Matrix
        </CardTitle>
        <CardDescription>
          Visual overview of all permissions across roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Permission</TableHead>
                {roles.map((role) => (
                  <TableHead
                    key={role.id}
                    className="text-center min-w-[120px]"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{role.name}</span>
                      <Badge
                        variant={role.isSystem ? "secondary" : "outline"}
                        className="text-xs mt-1"
                      >
                        {role.isSystem ? "System" : "Custom"}
                      </Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(permissions).map(
                ([category, categoryPermissions]) => (
                  <React.Fragment key={category}>
                    <TableRow className="bg-gray-50">
                      <TableCell
                        colSpan={roles.length + 1}
                        className="font-semibold text-gray-700"
                      >
                        {category.toUpperCase()} PERMISSIONS
                      </TableCell>
                    </TableRow>
                    {categoryPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {permission.name.replace(/_/g, " ")}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {roles.map((role) => {
                          const hasPermission = role.permissions.some(
                            (p) => p.id === permission.id
                          );
                          return (
                            <TableCell
                              key={`${role.id}-${permission.id}`}
                              className="text-center"
                            >
                              {hasPermission ? (
                                <div className="flex items-center justify-center">
                                  <Check className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <X className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                )
              )}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm text-gray-900 mb-2">Legend</h4>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Permission granted</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Permission denied</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                System
              </Badge>
              <span className="text-gray-600">System role (read-only)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Custom
              </Badge>
              <span className="text-gray-600">Custom role (editable)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
