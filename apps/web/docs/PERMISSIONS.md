# Permissions Reference

This document lists all available permissions in the Worklane system.

## Permission Categories

The permissions are organized into three main categories:

### 1. Organization Permissions

Manage organization-wide settings and configuration.

- **MANAGE_ORGANIZATION** - Edit organization settings and configuration
- **MANAGE_USERS** - Manage organization users and their roles
- **MANAGE_BILLING** - Access and manage billing information
- **MANAGE_ROLES** - Create, edit, and delete custom roles
- **VIEW_AUDIT_LOG** - View organization audit logs
- **INVITE_MEMBERS** - Invite new members to the organization
- **REMOVE_MEMBERS** - Remove members from the organization

### 2. Project Permissions

Manage projects and their settings.

- **CREATE_PROJECT** - Create new projects
- **EDIT_PROJECT** - Edit project details and settings
- **DELETE_PROJECT** - Delete projects permanently
- **VIEW_PROJECT** - View project details
- **MANAGE_PROJECT_MEMBERS** - Add, remove, and manage project members
- **ARCHIVE_PROJECT** - Archive or unarchive projects

### 3. Task Permissions

Manage tasks within projects.

- **CREATE_TASK** - Create new tasks
- **EDIT_TASK** - Edit task details
- **DELETE_TASK** - Delete tasks
- **VIEW_TASK** - View task details
- **ASSIGN_TASK** - Assign tasks to team members
- **CHANGE_TASK_STATUS** - Change task status (TODO, IN_PROGRESS, etc.)
- **COMMENT_TASK** - Add comments to tasks
- **EDIT_TASK_PRIORITY** - Change task priority

## Total Permissions

The system includes **20 permissions** across the three categories:

- **7 Organization permissions**
- **6 Project permissions**
- **8 Task permissions**

## Default System Roles

### Super Admin

- **Permissions**: All 20 permissions
- **Description**: Full system access with ability to manage everything including organization settings

### Org Admin

- **Permissions**: 19 permissions (all except MANAGE_ORGANIZATION)
- **Description**: Organization administrator with full access except super admin settings

### Project Manager

- **Permissions**: 13 permissions
- **Description**: Manages projects with customizable permissions per project

### Team Lead

- Permissions: 9 permissions
- Description: Leads teams within projects with task management capabilities

### Member

- Permissions: 6 permissions
- Description: Regular team member with basic task and project access

### Viewer

- Permissions: 3 permissions
- Description: Read-only access to projects and tasks

## Viewing Permissions

You can view all permissions at:

- **URL**: `/dashboard/settings/permissions`
- **Access**: Requires `MANAGE_ROLES` permission

## API Endpoint

Get all permissions programmatically:

- **GET** `/api/permissions`

Returns:

```json
{
  "permissions": [...],
  "byCategory": {
    "ORGANIZATION": [...],
    "PROJECT": [...],
    "TASK": [...]
  },
  "total": 20,
  "categories": ["ORGANIZATION", "PROJECT", "TASK"]
}
```
