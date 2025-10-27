import { auth } from "@/auth";
import { hasOrgPermission } from "@/lib/permissions/check";
import { OrgPermission } from "@/lib/permissions/constants";
import { getCurrentOrganizationId } from "@/lib/current-organization";
import { AppSidebar } from "./app-sidebar";

export async function AppSidebarWrapper() {
  const session = await auth();

  if (!session?.user?.id) {
    return <AppSidebar visibleSettings={[]} />;
  }

  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    return <AppSidebar visibleSettings={[]} />;
  }

  try {
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
  } catch (error) {
    console.error("Error checking permissions:", error);
    return <AppSidebar visibleSettings={[]} />;
  }
}
