// Permission Categories
export enum PermissionCategory {
  ORGANIZATION = "ORGANIZATION",
  PROJECT = "PROJECT",
  TASK = "TASK",
}

// Organization Permissions
export enum OrgPermission {
  MANAGE_ORGANIZATION = "MANAGE_ORGANIZATION",
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_BILLING = "MANAGE_BILLING",
  MANAGE_ROLES = "MANAGE_ROLES",
  VIEW_AUDIT_LOG = "VIEW_AUDIT_LOG",
  INVITE_MEMBERS = "INVITE_MEMBERS",
  REMOVE_MEMBERS = "REMOVE_MEMBERS",
}

// Project Permissions
export enum ProjectPermission {
  CREATE_PROJECT = "CREATE_PROJECT",
  EDIT_PROJECT = "EDIT_PROJECT",
  DELETE_PROJECT = "DELETE_PROJECT",
  VIEW_PROJECT = "VIEW_PROJECT",
  MANAGE_PROJECT_MEMBERS = "MANAGE_PROJECT_MEMBERS",
  ARCHIVE_PROJECT = "ARCHIVE_PROJECT",
}

// Task Permissions
export enum TaskPermission {
  CREATE_TASK = "CREATE_TASK",
  EDIT_TASK = "EDIT_TASK",
  DELETE_TASK = "DELETE_TASK",
  VIEW_TASK = "VIEW_TASK",
  ASSIGN_TASK = "ASSIGN_TASK",
  CHANGE_TASK_STATUS = "CHANGE_TASK_STATUS",
  COMMENT_TASK = "COMMENT_TASK",
  EDIT_TASK_PRIORITY = "EDIT_TASK_PRIORITY",
}

// All Permissions
export const ALL_PERMISSIONS = {
  ...OrgPermission,
  ...ProjectPermission,
  ...TaskPermission,
};

export type Permission = OrgPermission | ProjectPermission | TaskPermission;

// System Roles
export enum SystemRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ORG_ADMIN = "ORG_ADMIN",
  PROJECT_MANAGER = "PROJECT_MANAGER",
  TEAM_LEAD = "TEAM_LEAD",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

// Permission Definitions with metadata
export const PERMISSION_DEFINITIONS = [
  // Organization Permissions
  {
    name: OrgPermission.MANAGE_ORGANIZATION,
    description: "Edit organization settings and configuration",
    category: PermissionCategory.ORGANIZATION,
  },
  {
    name: OrgPermission.MANAGE_USERS,
    description: "Manage organization users and their roles",
    category: PermissionCategory.ORGANIZATION,
  },
  {
    name: OrgPermission.MANAGE_BILLING,
    description: "Access and manage billing information",
    category: PermissionCategory.ORGANIZATION,
  },
  {
    name: OrgPermission.MANAGE_ROLES,
    description: "Create, edit, and delete custom roles",
    category: PermissionCategory.ORGANIZATION,
  },
  {
    name: OrgPermission.VIEW_AUDIT_LOG,
    description: "View organization audit logs",
    category: PermissionCategory.ORGANIZATION,
  },
  {
    name: OrgPermission.INVITE_MEMBERS,
    description: "Invite new members to the organization",
    category: PermissionCategory.ORGANIZATION,
  },
  {
    name: OrgPermission.REMOVE_MEMBERS,
    description: "Remove members from the organization",
    category: PermissionCategory.ORGANIZATION,
  },

  // Project Permissions
  {
    name: ProjectPermission.CREATE_PROJECT,
    description: "Create new projects",
    category: PermissionCategory.PROJECT,
  },
  {
    name: ProjectPermission.EDIT_PROJECT,
    description: "Edit project details and settings",
    category: PermissionCategory.PROJECT,
  },
  {
    name: ProjectPermission.DELETE_PROJECT,
    description: "Delete projects permanently",
    category: PermissionCategory.PROJECT,
  },
  {
    name: ProjectPermission.VIEW_PROJECT,
    description: "View project details",
    category: PermissionCategory.PROJECT,
  },
  {
    name: ProjectPermission.MANAGE_PROJECT_MEMBERS,
    description: "Add, remove, and manage project members",
    category: PermissionCategory.PROJECT,
  },
  {
    name: ProjectPermission.ARCHIVE_PROJECT,
    description: "Archive or unarchive projects",
    category: PermissionCategory.PROJECT,
  },

  // Task Permissions
  {
    name: TaskPermission.CREATE_TASK,
    description: "Create new tasks",
    category: PermissionCategory.TASK,
  },
  {
    name: TaskPermission.EDIT_TASK,
    description: "Edit task details",
    category: PermissionCategory.TASK,
  },
  {
    name: TaskPermission.DELETE_TASK,
    description: "Delete tasks",
    category: PermissionCategory.TASK,
  },
  {
    name: TaskPermission.VIEW_TASK,
    description: "View task details",
    category: PermissionCategory.TASK,
  },
  {
    name: TaskPermission.ASSIGN_TASK,
    description: "Assign tasks to team members",
    category: PermissionCategory.TASK,
  },
  {
    name: TaskPermission.CHANGE_TASK_STATUS,
    description: "Change task status (TODO, IN_PROGRESS, etc.)",
    category: PermissionCategory.TASK,
  },
  {
    name: TaskPermission.COMMENT_TASK,
    description: "Add comments to tasks",
    category: PermissionCategory.TASK,
  },
  {
    name: TaskPermission.EDIT_TASK_PRIORITY,
    description: "Change task priority",
    category: PermissionCategory.TASK,
  },
];

// Default Role Permissions Configuration
export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SystemRole.SUPER_ADMIN]: Object.values(ALL_PERMISSIONS) as Permission[],

  [SystemRole.ORG_ADMIN]: [
    // Organization (all except MANAGE_ORGANIZATION)
    OrgPermission.MANAGE_USERS,
    OrgPermission.MANAGE_BILLING,
    OrgPermission.MANAGE_ROLES,
    OrgPermission.VIEW_AUDIT_LOG,
    OrgPermission.INVITE_MEMBERS,
    OrgPermission.REMOVE_MEMBERS,
    // All Project permissions
    ...Object.values(ProjectPermission),
    // All Task permissions
    ...Object.values(TaskPermission),
  ] as Permission[],

  [SystemRole.PROJECT_MANAGER]: [
    // Project permissions (customizable per project)
    ProjectPermission.CREATE_PROJECT,
    ProjectPermission.EDIT_PROJECT,
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.MANAGE_PROJECT_MEMBERS,
    ProjectPermission.ARCHIVE_PROJECT,
    // All Task permissions
    ...Object.values(TaskPermission),
  ] as Permission[],

  [SystemRole.TEAM_LEAD]: [
    // Limited Project permissions
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.EDIT_PROJECT,
    // Most Task permissions
    TaskPermission.CREATE_TASK,
    TaskPermission.EDIT_TASK,
    TaskPermission.VIEW_TASK,
    TaskPermission.ASSIGN_TASK,
    TaskPermission.CHANGE_TASK_STATUS,
    TaskPermission.COMMENT_TASK,
    TaskPermission.EDIT_TASK_PRIORITY,
  ] as Permission[],

  [SystemRole.MEMBER]: [
    // Basic Project permissions
    ProjectPermission.VIEW_PROJECT,
    // Basic Task permissions
    TaskPermission.CREATE_TASK,
    TaskPermission.EDIT_TASK,
    TaskPermission.VIEW_TASK,
    TaskPermission.CHANGE_TASK_STATUS,
    TaskPermission.COMMENT_TASK,
  ] as Permission[],

  [SystemRole.VIEWER]: [
    // View-only permissions
    ProjectPermission.VIEW_PROJECT,
    TaskPermission.VIEW_TASK,
    TaskPermission.COMMENT_TASK,
  ] as Permission[],
};

// Role Descriptions
export const ROLE_DESCRIPTIONS: Record<SystemRole, string> = {
  [SystemRole.SUPER_ADMIN]:
    "Full system access with ability to manage everything including organization settings",
  [SystemRole.ORG_ADMIN]:
    "Organization administrator with full access except super admin settings",
  [SystemRole.PROJECT_MANAGER]:
    "Manages projects with customizable permissions per project",
  [SystemRole.TEAM_LEAD]:
    "Leads teams within projects with task management capabilities",
  [SystemRole.MEMBER]: "Regular team member with basic task and project access",
  [SystemRole.VIEWER]: "Read-only access to projects and tasks",
};

// Helper function to get permissions by category
export function getPermissionsByCategory(
  category: PermissionCategory
): Permission[] {
  return PERMISSION_DEFINITIONS.filter((p) => p.category === category).map(
    (p) => p.name as Permission
  );
}

// Helper function to check if a permission is in a category
export function isPermissionInCategory(
  permission: Permission,
  category: PermissionCategory
): boolean {
  const def = PERMISSION_DEFINITIONS.find((p) => p.name === permission);
  return def?.category === category;
}
