import { auth } from "@/auth";
import { hasOrgPermission } from "@/lib/permissions/check";
import { OrgPermission } from "@/lib/permissions/constants";
import { getCurrentOrganizationId } from "@/lib/current-organization";
import { AppSidebar } from "./app-sidebar";

export async function AppSidebarWrapper() {
  const session = await auth();
  const organizationId = await getCurrentOrganizationId();

  if (!session?.user?.id || !organizationId) {
    return null;
  }

  // Check permissions for each section
  const hasManageUsers = await hasOrgPermission(
    session.user.id,
    organizationId,
    OrgPermission.MANAGE_USERS
  );

  const hasManageRoles = await hasOrgPermission(
    session.user.id,
    organizationId,
    OrgPermission.MANAGE_ROLES
  );

  const hasManageOrganization = await hasOrgPermission(
    session.user.id,
    organizationId,
    OrgPermission.MANAGE_ORGANIZATION
  );

  return (
    <AppSidebar
      visibleSettings={[
        ...(hasManageUsers ? ["users"] : []),
        ...(hasManageRoles ? ["roles", "permissions"] : []),
        ...(hasManageOrganization ? ["organization"] : []),
      ]}
    />
  );
}
