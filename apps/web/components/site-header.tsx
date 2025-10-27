"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { SidebarInset, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { UserProfile } from "./user-profile";
import type { Session } from "next-auth";

interface SiteHeaderProps {
  session: Session | null;
}

export function SiteHeader({ session }: SiteHeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Always start with Worklane
    breadcrumbs.push({
      label: "Worklane",
      href: "/dashboard",
      isLast: segments.length === 0,
    });

    // Add dashboard segment only if we're not already on dashboard root
    if (segments.length > 0 && segments[0] === "dashboard") {
      if (segments.length > 1) {
        breadcrumbs.push({
          label: "Dashboard",
          href: "/dashboard",
          isLast: false,
        });
      }

      // Add settings segment
      if (segments.length > 1 && segments[1] === "settings") {
        breadcrumbs.push({
          label: "Settings",
          href: "/dashboard/settings",
          isLast: segments.length === 2,
        });

        // Add specific settings page
        if (segments.length > 2) {
          const page = segments[2];
          if (page) {
            const pageLabels: Record<string, string> = {
              users: "Users",
              roles: "Roles & Permissions",
              organization: "Organization",
            };

            breadcrumbs.push({
              label:
                pageLabels[page] ||
                page.charAt(0).toUpperCase() + page.slice(1),
              href: `/dashboard/settings/${page}`,
              isLast: true,
            });
          }
        }
      }
    }

    // Ensure unique keys by adding index to href if there are duplicates
    return breadcrumbs.map((breadcrumb, index) => ({
      ...breadcrumb,
      key: `${breadcrumb.href}-${index}`,
    }));
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb className="hidden lg:block">
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.key} className="flex items-center">
                {index > 0 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
                <BreadcrumbItem
                  className={index === 0 ? "hidden md:block" : ""}
                >
                  {breadcrumb.isLast ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href}>
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto flex items-center gap-2 px-4">
        {/* Search - Hidden on mobile, visible on tablet+ */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full appearance-none bg-background pl-8 shadow-none md:w-64 lg:w-80"
          />
        </div>

        {/* Mobile search button */}
        <Button variant="ghost" size="sm" className="sm:hidden">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        {/* User Profile Component */}
        <UserProfile session={session} />
      </div>
    </header>
  );
}
