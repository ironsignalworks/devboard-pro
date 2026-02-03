import { Home, Code2, FileText, FolderKanban, Tag, PlusCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Snippets", url: "/snippets", icon: Code2 },
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Tags", url: "/tags", icon: Tag },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className={`border-b border-sidebar-border h-14 flex items-center ${isCollapsed ? "px-0 justify-center" : "px-4"}`}>
        <div className={`flex h-full w-full items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-transparent shrink-0">
            <img
              src="/logo_app.png"
              alt="DevBoard Pro"
              className="h-8 w-8 object-contain"
            />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">DevBoard Pro</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 sm:px-0">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <Button 
              variant="ghost" 
              size={isCollapsed ? "icon" : "sm"}
              className="w-full justify-start gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              {!isCollapsed && <span>New Snippet</span>}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
