"use client";

import * as React from "react";
import {
  ChevronRight,
  Home,
  Settings,
  Users,
  FolderOpen,
  BarChart3,
  FileText,
  HelpCircle,
  Shield,
  Building,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar";

// This is sample data - will be replaced with dynamic data
const data = {
  user: {
    name: "Milan",
    email: "milan@aaws.ca",
    avatar: "/avatars/milan.jpg",
  },
  organization: {
    name: "AAWS Organization",
    logo: Home,
    plan: "Enterprise",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderOpen,
      items: [
        {
          title: "AAWS Demo Project",
          url: "/projects/aaws-demo",
        },
      ],
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: FileText,
    },
    {
      title: "Team",
      url: "/team",
      icon: Users,
    },
  ],
  projects: [
    {
      name: "AAWS Demo Project",
      url: "/projects/aaws-demo",
      icon: FolderOpen,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {/* Organization Header - No longer a switcher */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <data.organization.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {data.organization.name}
                </span>
                <span className="truncate text-xs">
                  {data.organization.plan}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.navMain} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavProjects projects={data.projects} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="/dashboard/settings/users">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Users className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Users</span>
                      <span className="truncate text-xs">Manage users</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="/dashboard/settings/roles">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Shield className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        Roles & Permissions
                      </span>
                      <span className="truncate text-xs">Manage roles</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="/dashboard/settings/organization">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Building className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        Organization
                      </span>
                      <span className="truncate text-xs">Org settings</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="#">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Settings className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Settings</span>
                      <span className="truncate text-xs">Account settings</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="#">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <HelpCircle className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        Help & Support
                      </span>
                      <span className="truncate text-xs">Documentation</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
