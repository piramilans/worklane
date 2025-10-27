import { z } from "zod";

// User validation schemas
export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
  organizationId: z.string().min(1, "Organization is required"),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  roleId: z.string().min(1, "Role is required").optional(),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// Role validation schemas
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  organizationId: z.string().min(1, "Organization is required"),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be less than 50 characters")
    .optional(),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required")
    .optional(),
});

// Project member validation schemas
export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role is required"),
  customPermissions: z
    .array(
      z.object({
        permissionId: z.string(),
        granted: z.boolean(),
      })
    )
    .optional(),
});

export const updateProjectMemberSchema = z.object({
  roleId: z.string().min(1, "Role is required").optional(),
  customPermissions: z
    .array(
      z.object({
        permissionId: z.string(),
        granted: z.boolean(),
      })
    )
    .optional(),
});

// Organization member validation schemas
export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
});

export const updateMemberRoleSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
});

// Permission validation
export const validatePermission = (permission: string): boolean => {
  const validPermissions = [
    // Organization permissions
    "MANAGE_ORGANIZATION",
    "MANAGE_USERS",
    "MANAGE_BILLING",
    "MANAGE_ROLES",
    "VIEW_AUDIT_LOG",
    "INVITE_MEMBERS",
    "REMOVE_MEMBERS",
    // Project permissions
    "CREATE_PROJECT",
    "EDIT_PROJECT",
    "DELETE_PROJECT",
    "VIEW_PROJECT",
    "MANAGE_PROJECT_MEMBERS",
    "ARCHIVE_PROJECT",
    // Task permissions
    "CREATE_TASK",
    "EDIT_TASK",
    "DELETE_TASK",
    "VIEW_TASK",
    "ASSIGN_TASK",
    "CHANGE_TASK_STATUS",
    "COMMENT_TASK",
    "EDIT_TASK_PRIORITY",
  ];

  return validPermissions.includes(permission);
};

// Email validation helper
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Role name validation helper
export const isValidRoleName = (name: string): boolean => {
  // Check for system role names
  const systemRoles = [
    "SUPER_ADMIN",
    "ORG_ADMIN",
    "PROJECT_MANAGER",
    "TEAM_LEAD",
    "MEMBER",
    "VIEWER",
  ];

  // System roles are reserved
  if (systemRoles.includes(name.toUpperCase())) {
    return false;
  }

  // Check for valid characters (alphanumeric, spaces, hyphens, underscores)
  const roleNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
  return roleNameRegex.test(name) && name.length >= 2 && name.length <= 50;
};
