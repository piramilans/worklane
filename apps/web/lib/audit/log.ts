import { prisma } from "@/lib/prisma";

export interface AuditLogData {
  userId: string;
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log user creation
 */
export async function logUserCreated(
  data: AuditLogData & {
    userEmail: string;
    userName: string;
    roleName: string;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "USER_CREATED",
      resourceType: "USER",
      resourceId: data.resourceId,
      metadata: {
        userEmail: data.userEmail,
        userName: data.userName,
        roleName: data.roleName,
        ...data.metadata,
      },
    },
  });
}

/**
 * Log user update
 */
export async function logUserUpdated(
  data: AuditLogData & {
    changes: Record<string, { from: any; to: any }>;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "USER_UPDATED",
      resourceType: "USER",
      resourceId: data.resourceId,
      metadata: {
        changes: data.changes,
        ...data.metadata,
      },
    },
  });
}

/**
 * Log user role change
 */
export async function logRoleChanged(
  data: AuditLogData & {
    fromRole: string;
    toRole: string;
    userEmail: string;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "USER_ROLE_CHANGED",
      resourceType: "USER",
      resourceId: data.resourceId,
      metadata: {
        fromRole: data.fromRole,
        toRole: data.toRole,
        userEmail: data.userEmail,
        ...data.metadata,
      },
    },
  });
}

/**
 * Log role creation
 */
export async function logRoleCreated(
  data: AuditLogData & {
    roleName: string;
    permissions: string[];
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "ROLE_CREATED",
      resourceType: "ROLE",
      resourceId: data.resourceId,
      metadata: {
        roleName: data.roleName,
        permissions: data.permissions,
        ...data.metadata,
      },
    },
  });
}

/**
 * Log role update
 */
export async function logRoleUpdated(
  data: AuditLogData & {
    roleName: string;
    changes: Record<string, { from: any; to: any }>;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "ROLE_UPDATED",
      resourceType: "ROLE",
      resourceId: data.resourceId,
      metadata: {
        roleName: data.roleName,
        changes: data.changes,
        ...data.metadata,
      },
    },
  });
}

/**
 * Log role deletion
 */
export async function logRoleDeleted(
  data: AuditLogData & {
    roleName: string;
    memberCount: number;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "ROLE_DELETED",
      resourceType: "ROLE",
      resourceId: data.resourceId,
      metadata: {
        roleName: data.roleName,
        memberCount: data.memberCount,
        ...data.metadata,
      },
    },
  });
}

/**
 * Log permission override
 */
export async function logPermissionOverride(
  data: AuditLogData & {
    userEmail: string;
    projectName: string;
    permissionName: string;
    granted: boolean;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "PERMISSION_OVERRIDE",
      resourceType: "PROJECT_MEMBER",
      resourceId: data.resourceId,
      metadata: {
        userEmail: data.userEmail,
        projectName: data.projectName,
        permissionName: data.permissionName,
        granted: data.granted,
        ...data.metadata,
      },
    },
  });
}

/**
 * Log member addition to project
 */
export async function logProjectMemberAdded(
  data: AuditLogData & {
    userEmail: string;
    projectName: string;
    roleName: string;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "PROJECT_MEMBER_ADDED",
      resourceType: "PROJECT_MEMBER",
      resourceId: data.resourceId,
      metadata: {
        userEmail: data.userEmail,
        projectName: data.projectName,
        roleName: data.roleName,
        ...data.metadata,
      },
    },
  });
}

/**
 * Log member removal from project
 */
export async function logProjectMemberRemoved(
  data: AuditLogData & {
    userEmail: string;
    projectName: string;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "PROJECT_MEMBER_REMOVED",
      resourceType: "PROJECT_MEMBER",
      resourceId: data.resourceId,
      metadata: {
        userEmail: data.userEmail,
        projectName: data.projectName,
        ...data.metadata,
      },
    },
  });
}

/**
 * Log member removal from organization
 */
export async function logMemberRemoved(
  data: AuditLogData & {
    userEmail: string;
    roleName: string;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: "MEMBER_REMOVED",
      resourceType: "ORGANIZATION_MEMBER",
      resourceId: data.resourceId,
      metadata: {
        userEmail: data.userEmail,
        roleName: data.roleName,
        ...data.metadata,
      },
    },
  });
}

/**
 * Generic audit log function
 */
export async function logAuditEvent(data: AuditLogData) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: data.metadata,
    },
  });
}
