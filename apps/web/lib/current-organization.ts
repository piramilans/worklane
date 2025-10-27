import { headers } from "next/headers";
import { getOrganizationFromSubdomain } from "./organization-context";

export interface CurrentOrganization {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  description: string | null;
  image: string | null;
}

/**
 * Get the current organization context from middleware headers
 */
export async function getCurrentOrganization(): Promise<CurrentOrganization | null> {
  try {
    const headersList = await headers();
    const subdomain = headersList.get("x-organization-subdomain");

    if (!subdomain) {
      return null;
    }

    // Get organization from subdomain
    const orgContext = await getOrganizationFromSubdomain(subdomain);

    if (!orgContext) {
      return null;
    }

    return orgContext.organization;
  } catch (error) {
    console.error("Error getting current organization:", error);
    return null;
  }
}

/**
 * Get the current organization ID from middleware headers
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  try {
    const headersList = await headers();
    const subdomain = headersList.get("x-organization-subdomain");

    if (!subdomain) {
      return null;
    }

    // Get organization from subdomain
    const orgContext = await getOrganizationFromSubdomain(subdomain);

    if (!orgContext) {
      return null;
    }

    return orgContext.organizationId;
  } catch (error) {
    console.error("Error getting current organization ID:", error);
    return null;
  }
}

/**
 * Get the current organization subdomain from middleware headers
 */
export async function getCurrentSubdomain(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get("x-organization-subdomain");
  } catch (error) {
    console.error("Error getting current subdomain:", error);
    return null;
  }
}
