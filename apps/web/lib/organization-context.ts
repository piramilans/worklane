import { prisma } from "./prisma";

export interface OrganizationContext {
  organizationId: string;
  subdomain: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    description: string | null;
    image: string | null;
  };
}

/**
 * Get organization context from subdomain
 */
export async function getOrganizationFromSubdomain(
  subdomain: string
): Promise<OrganizationContext | null> {
  try {
    const organization = await prisma.organization.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        description: true,
        image: true,
      },
    });

    if (!organization) {
      return null;
    }

    return {
      organizationId: organization.id,
      subdomain: organization.subdomain,
      organization,
    };
  } catch (error) {
    console.error("Error fetching organization from subdomain:", error);
    return null;
  }
}

/**
 * Extract subdomain from hostname
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(":")[0];

  // Split by dots
  const parts = host.split(".");

  // For localhost development, return null (will use default org)
  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  // For production subdomains like "aaws.worklane.com"
  if (parts.length >= 3) {
    return parts[0]; // Return the first part (subdomain)
  }

  return null;
}

/**
 * Get organization context from request headers
 */
export async function getOrganizationFromRequest(
  request: Request
): Promise<OrganizationContext | null> {
  const hostname = request.headers.get("host") || "";
  const subdomain = extractSubdomain(hostname);

  if (!subdomain) {
    // For localhost development, use a default organization
    // You can modify this to use a specific default org
    return await getDefaultOrganization();
  }

  return await getOrganizationFromSubdomain(subdomain);
}

/**
 * Get default organization for localhost development
 */
async function getDefaultOrganization(): Promise<OrganizationContext | null> {
  try {
    // Get the first organization as default for localhost
    const organization = await prisma.organization.findFirst({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        description: true,
        image: true,
      },
    });

    if (!organization) {
      return null;
    }

    return {
      organizationId: organization.id,
      subdomain: organization.subdomain,
      organization,
    };
  } catch (error) {
    console.error("Error fetching default organization:", error);
    return null;
  }
}
