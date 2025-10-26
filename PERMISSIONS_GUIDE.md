# Worklane Permissions System Guide

## Overview

Worklane implements a flexible Role-Based Access Control (RBAC) system with customizable permissions that works at Organization, Project, and Task levels. The system allows the same role to have different permissions across different projects, enabling granular control over user access.

## Architecture

### Permission Levels

1. **Organization Level**: Global system access (manage users, billing, settings)
2. **Project Level**: Project-specific access (create/edit/delete projects, manage members)
3. **Task Level**: Task-specific access (create/edit/delete/assign tasks)

### Role Hierarchy

1. **Super Admin** - Full system access, manages everything
2. **Org Admin** - Organization management, can't access Super Admin settings
3. **Project Manager** - Manages specific projects, customizable per project
4. **Team Lead** - Leads teams within projects, customizable per project
5. **Member** - Regular team member, customizable per project
6. **Viewer** - Read-only access, customizable per project

### Key Features

- **Multi-tenant**: Organizations can have multiple projects
- **Role Customization**: Create custom roles with specific permissions
- **Per-Project Overrides**: Same user role can have different permissions in different projects
- **Audit Logging**: All permission changes are tracked
- **Flexible Permissions**: Granular control at organization, project, and task levels

## Database Schema

### Core Models

- **Organization**: Multi-tenant container
- **OrganizationMember**: User membership in organizations with roles
- **Role**: Predefined and custom roles
- **Permission**: Granular permissions
- **RolePermission**: Many-to-many relationship between roles and permissions
- **Project**: Projects within organizations
- **ProjectMember**: Project membership with role overrides
- **ProjectMemberPermission**: Custom permissions per project member
- **Task**: Tasks within projects
- **TaskAssignment**: Task assignments to users
- **AuditLog**: Tracks all permission changes

## Permissions

### Organization Permissions

- `MANAGE_ORGANIZATION` - Edit organization settings
- `MANAGE_USERS` - Manage organization users and their roles
- `MANAGE_BILLING` - Access and manage billing information
- `MANAGE_ROLES` - Create, edit, and delete custom roles
- `VIEW_AUDIT_LOG` - View organization audit logs
- `INVITE_MEMBERS` - Invite new members to the organization
- `REMOVE_MEMBERS` - Remove members from the organization

### Project Permissions

- `CREATE_PROJECT` - Create new projects
- `EDIT_PROJECT` - Edit project details and settings
- `DELETE_PROJECT` - Delete projects permanently
- `VIEW_PROJECT` - View project details
- `MANAGE_PROJECT_MEMBERS` - Add, remove, and manage project members
- `ARCHIVE_PROJECT` - Archive or unarchive projects

### Task Permissions

- `CREATE_TASK` - Create new tasks
- `EDIT_TASK` - Edit task details
- `DELETE_TASK` - Delete tasks
- `VIEW_TASK` - View task details
- `ASSIGN_TASK` - Assign tasks to team members
- `CHANGE_TASK_STATUS` - Change task status (TODO, IN_PROGRESS, etc.)
- `COMMENT_TASK` - Add comments to tasks
- `EDIT_TASK_PRIORITY` - Change task priority

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in `apps/web/` with:

```env
DATABASE_URL="your-postgresql-connection-string"
AUTH_SECRET="your-auth-secret-key-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Database Migration

```bash
cd apps/web
pnpm db:generate
pnpm db:push
```

### 3. Seed Permissions and Roles

```bash
pnpm db:seed-permissions
```

This will:

- Create all permissions
- Create system roles (Super Admin, Org Admin, etc.)
- Create a demo organization
- Assign existing users to the demo organization as Super Admin
- Create a demo project

## Usage Examples

### Backend: Check Permissions

```typescript
import {
  hasOrgPermission,
  hasProjectPermission,
} from "@/lib/permissions/check";
import { OrgPermission, ProjectPermission } from "@/lib/permissions/constants";

// Check organization permission
const canManageUsers = await hasOrgPermission(
  userId,
  orgId,
  OrgPermission.MANAGE_USERS
);

// Check project permission (includes custom overrides)
const canEditProject = await hasProjectPermission(
  userId,
  projectId,
  ProjectPermission.EDIT_PROJECT
);
```

### Backend: Protect API Routes

```typescript
import { requireOrgPermission } from "@/lib/permissions/middleware";
import { OrgPermission } from "@/lib/permissions/constants";

export async function DELETE(req: NextRequest) {
  return requireOrgPermission(OrgPermission.MANAGE_USERS)(
    req,
    async (req, userId) => {
      // Your protected logic here
      return NextResponse.json({ success: true });
    }
  );
}
```

### Frontend: Permission-Based Rendering

```tsx
import { Can } from "@/components/permissions/can";
import { OrgPermission } from "@/lib/permissions/constants";

function MyComponent() {
  return (
    <Can permission={OrgPermission.MANAGE_USERS} orgId={orgId}>
      <button>Manage Users</button>
    </Can>
  );
}
```

### Frontend: Check Permissions with Hooks

```tsx
import { useHasPermission, useUserRole } from "@/hooks/use-permissions";
import { ProjectPermission } from "@/lib/permissions/constants";

function ProjectSettings({ projectId }: { projectId: string }) {
  const canEdit = useHasPermission(ProjectPermission.EDIT_PROJECT, {
    projectId,
  });
  const role = useUserRole({ projectId });

  if (!canEdit) {
    return <div>You don't have permission to edit this project</div>;
  }

  return (
    <div>
      <h2>Project Settings</h2>
      <p>Your role: {role}</p>
      {/* Edit form */}
    </div>
  );
}
```

## API Endpoints

### Permission Check

- `GET /api/permissions/check?permission=MANAGE_USERS&orgId=xxx` - Check if user has permission
- `GET /api/permissions/role?orgId=xxx` - Get user's role in organization
- `GET /api/permissions?orgId=xxx&projectId=xxx` - Get all user permissions
- `GET /api/permissions/access?resourceType=project&resourceId=xxx&permission=EDIT_PROJECT` - Check resource access

### Organization Management

- `GET /api/organizations/my-organizations` - Get user's organizations
- `GET /api/organizations/[orgId]/my-projects` - Get user's projects in organization
- `GET /api/organizations/[orgId]/roles` - List all roles
- `POST /api/organizations/[orgId]/roles` - Create custom role
- `GET /api/organizations/[orgId]/roles/[roleId]` - Get role details
- `PUT /api/organizations/[orgId]/roles/[roleId]` - Update role
- `DELETE /api/organizations/[orgId]/roles/[roleId]` - Delete role
- `GET /api/organizations/[orgId]/members` - List organization members
- `POST /api/organizations/[orgId]/members` - Invite member
- `GET /api/organizations/[orgId]/members/[userId]` - Get member details
- `PUT /api/organizations/[orgId]/members/[userId]` - Update member role
- `DELETE /api/organizations/[orgId]/members/[userId]` - Remove member

### Project Management

- `GET /api/projects/[projectId]/members` - List project members
- `POST /api/projects/[projectId]/members` - Add member to project
- `GET /api/projects/[projectId]/members/[userId]` - Get project member details
- `PUT /api/projects/[projectId]/members/[userId]` - Update project member (including custom permissions)
- `DELETE /api/projects/[projectId]/members/[userId]` - Remove project member

## Custom Permissions Per Project

You can override a user's role permissions for specific projects:

```typescript
// Add member to project with custom permissions
await fetch(`/api/projects/${projectId}/members`, {
  method: "POST",
  body: JSON.stringify({
    userId: "user-id",
    roleId: "project-manager-role-id",
    customPermissions: [
      { permissionName: "DELETE_PROJECT", granted: false }, // Revoke
      { permissionName: "CREATE_TASK", granted: true }, // Grant
    ],
  }),
});

// Update member's custom permissions
await fetch(`/api/projects/${projectId}/members/${userId}`, {
  method: "PUT",
  body: JSON.stringify({
    customPermissions: [
      { permissionName: "DELETE_TASK", granted: true },
      { permissionName: "EDIT_PROJECT", granted: false },
    ],
  }),
});
```

## Creating Custom Roles

```typescript
// Create a custom role
await fetch(`/api/organizations/${orgId}/roles`, {
  method: "POST",
  body: JSON.stringify({
    name: "Custom Project Lead",
    description: "A custom role for project leads",
    permissions: [
      "VIEW_PROJECT",
      "EDIT_PROJECT",
      "CREATE_TASK",
      "EDIT_TASK",
      "ASSIGN_TASK",
    ],
  }),
});
```

## Permission Checking Flow

1. **Task Level**: Check if user is task creator (always has full permissions) → Check project permissions
2. **Project Level**: Check custom permissions (overrides) → Check role permissions → Check org permissions
3. **Organization Level**: Check role permissions

## Security Best Practices

1. **Always check permissions server-side** - Never rely on client-side checks alone
2. **Cache permissions with short TTL** - Balance performance and security
3. **Audit all permission changes** - Track who changed what and when
4. **Prevent privilege escalation** - Users can't grant permissions they don't have
5. **Validate permission inheritance** - Ensure permission checks follow the hierarchy
6. **Rate limit permission checks** - Prevent abuse

## Audit Logging

All permission-related actions are logged:

```typescript
await prisma.auditLog.create({
  data: {
    userId: session.user.id,
    organizationId: orgId,
    action: "ROLE_CREATED",
    resourceType: "ROLE",
    resourceId: roleId,
    metadata: { roleName: "Custom Role" },
  },
});
```

Audit log actions include:

- `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_DELETED`
- `MEMBER_INVITED`, `MEMBER_ROLE_UPDATED`, `MEMBER_REMOVED`
- `PROJECT_MEMBER_ADDED`, `PROJECT_MEMBER_UPDATED`, `PROJECT_MEMBER_REMOVED`

## Migration Strategy

When adding the permission system to an existing application:

1. Create new tables without breaking existing auth
2. Migrate existing users to a default organization
3. Assign default roles based on current state
4. Test permission system thoroughly
5. Deploy with feature flag
6. Gradually enable for all users

## Troubleshooting

### User can't access resource

1. Check if user is a member of the organization
2. Check if user has the required role
3. Check if there are custom permission overrides
4. Verify the permission is assigned to the role
5. Check audit logs for recent changes

### Permission check is slow

1. Add database indexes on frequently queried fields
2. Implement permission caching
3. Use Redis for distributed caching
4. Optimize database queries with proper includes

### Role can't be deleted

Roles can't be deleted if:

- They are system roles (`isSystem: true`)
- They are assigned to any organization members
- They are assigned to any project members

Reassign members to different roles first, then delete.

## Future Enhancements

- [ ] Permission templates for quick role creation
- [ ] Bulk permission updates
- [ ] Permission inheritance visualization
- [ ] Time-based permissions (temporary access)
- [ ] Permission request/approval workflow
- [ ] Advanced audit log filtering and export
- [ ] Permission analytics dashboard
